"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/lib/auth/RBACContext";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { mapAgencyStatusToEvvStatus } from "@/types/agency";
import { Role } from "@/types/rbac";
import { initialVisits, REASON_CODES, RULE_PROFILES } from "./mockData";
import { EVVVisit, ExceptionCategory } from "./types";
import {
  EvvRoleCapabilities,
  getEvvRoleCapabilities,
} from "./evvPermissions";
import {
  computeMaxTimeVarianceMinutes,
  createAuditEvent,
  deriveVisitStatus,
  nextId,
} from "./evvRules";

export type EVVNavTab = "overview" | "visits" | "exceptions" | "aggregator";
export type AggregatorSubView = "readiness" | "batches" | "rules";

export interface EvvActor {
  name: string;
  role: Role;
}

export interface BulkConfirmPayload {
  visitIds: string[];
  reasonCode: string;
  attestationRef: string;
  notes: string;
  useScheduledTimes: boolean;
}

interface EvvVisitsContextValue {
  visits: EVVVisit[];
  actor: EvvActor;
  capabilities: EvvRoleCapabilities;
  activeTab: EVVNavTab;
  setActiveTab: (tab: EVVNavTab) => void;
  exceptionFilterPreset: ExceptionCategory | "All";
  setExceptionFilterPreset: (preset: ExceptionCategory | "All") => void;
  aggregatorSubView: AggregatorSubView;
  setAggregatorSubView: (view: AggregatorSubView) => void;
  navigateTab: (tab: EVVNavTab, exceptionFilter?: ExceptionCategory) => void;
  toastMessage: string | null;
  showToast: (message: string) => void;
  updateVisit: (updated: EVVVisit, toast?: string) => void;
  reopenException: (visitId: string, reason?: string) => void;
  bulkConfirmVisits: (payload: BulkConfirmPayload) => void;
  bulkSubmitAggregator: (visitIds: string[]) => void;
}

const EvvVisitsContext = createContext<EvvVisitsContextValue | null>(null);

export function EvvVisitsProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const {
    state: agencyState,
    getClientById,
    getCaregiverById,
    resolveEvvException,
  } = useAgencyStore();

  const actor: EvvActor = useMemo(
    () => ({
      name: currentUser?.name ?? "Agency Admin",
      role: currentUser?.role ?? "ADMIN",
    }),
    [currentUser]
  );

  const capabilities = useMemo(
    () => getEvvRoleCapabilities(actor.role),
    [actor.role]
  );

  const [localOverrides, setLocalOverrides] = useState<Record<string, EVVVisit>>({});
  const [activeTab, setActiveTab] = useState<EVVNavTab>("visits");
  const [exceptionFilterPreset, setExceptionFilterPreset] = useState<
    ExceptionCategory | "All"
  >("All");
  const [aggregatorSubView, setAggregatorSubView] =
    useState<AggregatorSubView>("readiness");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Project unified AgencyStore visits into EVVVisit shape and blend with baseline history
  const visits: EVVVisit[] = useMemo(() => {
    const agencyEvvVisits: EVVVisit[] = agencyState.visits.map((v) => {
      const existing = initialVisits.find((iv) => iv.id === v.evvId);
      const client = getClientById(v.clientId);
      const caregiver = getCaregiverById(v.caregiverId);
      const override = localOverrides[v.evvId];

      const projected: EVVVisit = {
        id: v.evvId,
        visitDate: v.visitDate,
        visitDateLabel: v.visitDateLabel,
        caregiver: {
          id: caregiver?.id ?? "UNASSIGNED",
          name: caregiver?.name ?? "Unassigned Shift",
          role: caregiver?.roleTitle ?? "Caregiver",
        },
        client: {
          id: client?.id ?? v.clientId,
          name: client?.name ?? "Client",
          medicaidIdMasked: client?.medicaidIdMasked ?? "•••••0000",
        },
        service: {
          code: client?.serviceCode ?? "T1019",
          name: client?.serviceName ?? "Personal Care",
        },
        scheduledWindowPassed: v.visitDateLabel !== "Today" || v.status === "Completed",
        scheduledTime: {
          start: v.scheduledStart,
          end: v.scheduledEnd,
        },
        actualTime: {
          start: v.clockInTime,
          end: v.clockOutTime,
        },
        originalEvv: {
          clockIn: v.clockInTime,
          clockOut: v.clockOutTime,
          method: v.evvMethod,
          gpsDistanceFt: Math.round(v.gpsDistanceMeters * 3.28084),
        },
        visitStatus: mapAgencyStatusToEvvStatus(v.status),
        evvMethod: v.evvMethod,
        evvCompliance: v.evvCompliance,
        exceptionCategory: v.exceptionCategory,
        exceptionSeverity:
          v.evvCompliance === "Exception"
            ? v.exceptionCategory === "Missed Call" || v.exceptionCategory === "Missed In"
              ? "critical"
              : "warning"
            : "none",
        exceptionDetail: v.exceptionDetail,
        timeDeltaMinutes: v.timeVarianceMinutes,
        gpsDistanceFt: Math.round(v.gpsDistanceMeters * 3.28084),
        serviceLocation: existing?.serviceLocation ?? {
          addressLine1: client?.address ?? "412 Maplewood Drive",
          cityStateZip: client?.cityStateZip ?? "Springfield, IL 62704",
          lat: client?.coords.lat ?? 39.7817,
          lng: client?.coords.lng ?? -89.6501,
          locationType: "Patient Home",
          associatedPhones: [
            {
              id: `ph-${v.clientId}`,
              label: "Primary Residence",
              number: client?.phone ?? "(217) 555-0194",
              type: "Landline",
              isVerifiedForIVR: true,
            },
          ],
        },
        verification: existing?.verification ?? {
          signatureStatus: v.signatureCaptured ? "Captured" : "Pending",
          voiceStatus: v.visitNotes ? "Captured" : "Not Required",
        },
        processing: {
          aggregator: existing?.processing.aggregator ?? "Pending",
          billing: v.billingStatus,
          payroll: v.billingStatus === "Hold" ? "Hold" : "Approved",
        },
        estimatedBillingAmount: Math.round(
          v.scheduledHours * (client?.hourlyBillRate ?? 38)
        ),
        authorization: {
          authNumber: client?.authNumber ?? "AUTH-88291A",
          status:
            (client?.authorizedUnitsRemaining ?? 20) <= 10
              ? "Expiring Soon"
              : "Active",
          remainingUnits: client?.authorizedUnitsRemaining ?? 24,
          totalUnits: client?.authorizedUnitsTotal ?? 80,
          unitLabel: "hrs",
          expiresAt: `In ${client?.authExpiresInDays ?? 14} days`,
        },
        tasksSummary: {
          completed: v.tasks.filter((t) => t.completed).length,
          total: v.tasks.length,
          items: v.tasks.map((t) => t.title),
        },
        ruleProfile: existing?.ruleProfile ?? RULE_PROFILES[0],
        auditHistory:
          v.auditHistory.length > 0
            ? v.auditHistory
            : existing?.auditHistory ?? [],
      };

      return override ? { ...projected, ...override } : projected;
    });

    const agencyEvvIds = new Set(agencyEvvVisits.map((v) => v.id));
    const staticExtras = initialVisits
      .filter((iv) => !agencyEvvIds.has(iv.id))
      .map((iv) => localOverrides[iv.id] ?? iv);

    return [...agencyEvvVisits, ...staticExtras];
  }, [agencyState.visits, getCaregiverById, getClientById, localOverrides]);

  const updateVisit = useCallback(
    (updated: EVVVisit, toastMsg?: string) => {
      setLocalOverrides((prev) => ({ ...prev, [updated.id]: updated }));
      if (updated.evvCompliance === "Resolved") {
        resolveEvvException({
          visitId: updated.id,
          reasonCode: updated.resolution?.reasonCode ?? "RC-04",
          reasonLabel: updated.resolution?.reasonLabel,
          notes:
            updated.resolution?.notes ??
            "Resolved via EVV Monitoring workspace.",
          attestationRef:
            updated.resolution?.attestationRef ?? `EVV-${Date.now().toString().slice(-4)}`,
        });
      }
      if (toastMsg) showToast(toastMsg);
    },
    [resolveEvvException, showToast]
  );

  const reopenException = useCallback(
    (visitId: string, reason?: string) => {
      const target = visits.find((v) => v.id === visitId);
      if (!target) return;
      const summary =
        reason?.trim() ||
        "Reopened for supervisory exception review after post-resolution check.";
      const reopened: EVVVisit = {
        ...target,
        evvCompliance: "Exception",
        exceptionSeverity: "warning",
        exceptionCategory:
          target.exceptionCategory === "None"
            ? "Time Variance"
            : target.exceptionCategory,
        exceptionDetail: summary,
        processing: {
          ...target.processing,
          billing: "Hold",
        },
        auditHistory: [
          createAuditEvent({
            actorName: actor.name,
            actorRole: actor.role,
            actionType: "EXCEPTION_REOPENED",
            summary,
            previousValue: target.evvCompliance,
            newValue: "Exception",
          }),
          ...target.auditHistory,
        ],
      };
      setLocalOverrides((prev) => ({ ...prev, [visitId]: reopened }));
      showToast(`Reopened ${visitId} for exception review; billing placed on hold.`);
    },
    [actor.name, actor.role, showToast, visits]
  );

  const navigateTab = useCallback(
    (tab: EVVNavTab, exceptionFilter?: ExceptionCategory) => {
      if (tab === "aggregator" && !capabilities.canViewAggregatorTab) return;
      if (tab === "exceptions" && !capabilities.canViewExceptions) return;
      if (exceptionFilter) {
        setExceptionFilterPreset(exceptionFilter);
      } else if (tab !== "exceptions") {
        setExceptionFilterPreset("All");
      }
      setActiveTab(tab);
    },
    [capabilities.canViewAggregatorTab, capabilities.canViewExceptions]
  );

  const effectiveActiveTab: EVVNavTab = useMemo(() => {
    if (activeTab === "aggregator" && !capabilities.canViewAggregatorTab) {
      return "visits";
    }
    if (activeTab === "exceptions" && !capabilities.canViewExceptions) {
      return "visits";
    }
    return activeTab;
  }, [activeTab, capabilities]);

  const bulkConfirmVisits = useCallback(
    (payload: BulkConfirmPayload) => {
      if (!capabilities.canBulkConfirm) {
        showToast("Your role does not permit bulk exception confirmation.");
        return;
      }
      const reasonObj = REASON_CODES.find((r) => r.code === payload.reasonCode);
      const nowIso = new Date().toISOString();

      payload.visitIds.forEach((visitId) => {
        const v = visits.find((item) => item.id === visitId);
        if (!v) return;

        const nextStart =
          payload.useScheduledTimes && !v.actualTime.start
            ? v.scheduledTime.start
            : v.actualTime.start;
        const nextEnd =
          payload.useScheduledTimes && !v.actualTime.end
            ? v.scheduledTime.end
            : v.actualTime.end;

        const nextVisitStatus = deriveVisitStatus(
          nextStart,
          nextEnd,
          v.scheduledWindowPassed
        );
        const nextDelta = computeMaxTimeVarianceMinutes(
          v.scheduledTime.start,
          v.scheduledTime.end,
          nextStart,
          nextEnd
        );

        const resolvedVisit: EVVVisit = {
          ...v,
          actualTime: { start: nextStart, end: nextEnd },
          visitStatus: nextVisitStatus,
          timeDeltaMinutes: nextDelta,
          evvCompliance: "Resolved",
          exceptionSeverity: "info",
          exceptionDetail: `Resolved after bulk review (${payload.reasonCode})`,
          processing: {
            ...v.processing,
            billing: "Cleared",
            payroll: "Approved",
          },
          resolution: {
            acknowledged: true,
            acknowledgedAt: nowIso,
            acknowledgedBy: actor.name,
            reasonCode: payload.reasonCode,
            reasonLabel: reasonObj?.label,
            resolutionCode: "RES-CALL-TS",
            resolutionLabel: "Manual timesheet confirmation with attestation",
            notes: payload.notes,
            attestationConfirmed: true,
            attestationRef: payload.attestationRef,
            resolvedAt: nowIso,
            resolvedBy: actor.name,
          },
          auditHistory: [
            createAuditEvent({
              actorName: actor.name,
              actorRole: actor.role,
              actionType: "MANUAL_CONFIRMATION",
              summary: `Bulk visit confirmation with documentation attestation (${payload.attestationRef}).`,
              reasonCode: payload.reasonCode,
              resolutionCode: "RES-CALL-TS",
              previousValue: `In: ${v.originalEvv.clockIn ?? "null"} / Out: ${v.originalEvv.clockOut ?? "null"}`,
              newValue: `In: ${nextStart ?? "null"} / Out: ${nextEnd ?? "null"}`,
            }),
            ...v.auditHistory,
          ],
        };

        setLocalOverrides((prev) => ({ ...prev, [v.id]: resolvedVisit }));
        resolveEvvException({
          visitId: v.id,
          reasonCode: payload.reasonCode,
          reasonLabel: reasonObj?.label,
          notes: payload.notes,
          attestationRef: payload.attestationRef,
        });
      });

      showToast(
        `Confirmed ${payload.visitIds.length} visit(s) & released billing holds.`
      );
    },
    [actor.name, actor.role, capabilities.canBulkConfirm, resolveEvvException, showToast, visits]
  );

  const bulkSubmitAggregator = useCallback(
    (visitIds: string[]) => {
      if (!capabilities.canBulkSubmitAggregator) {
        showToast("Your role does not permit aggregator submissions.");
        return;
      }
      let submittedCount = 0;
      let skippedExceptions = 0;

      const updates: Record<string, EVVVisit> = {};
      visitIds.forEach((id) => {
        const v = visits.find((item) => item.id === id);
        if (!v) return;
        if (v.evvCompliance === "Exception") {
          skippedExceptions += 1;
          return;
        }
        submittedCount += 1;
        updates[v.id] = {
          ...v,
          processing: {
            ...v.processing,
            aggregator: "Submitted",
            aggregatorRef: nextId("BATCH"),
          },
          auditHistory: [
            createAuditEvent({
              actorName: actor.name,
              actorRole: actor.role,
              actionType: "AGGREGATOR_SUBMITTED",
              summary: `Bulk submitted to ${v.ruleProfile.aggregator}.`,
              previousValue: v.processing.aggregator,
              newValue: "Submitted",
            }),
            ...v.auditHistory,
          ],
        };
      });

      setLocalOverrides((prev) => ({ ...prev, ...updates }));

      if (skippedExceptions > 0) {
        showToast(
          `Submitted ${submittedCount} eligible visit(s); ${skippedExceptions} unresolved exception(s) held.`
        );
      } else {
        showToast(`Submitted ${submittedCount} visit(s) to state aggregator.`);
      }
    },
    [actor.name, actor.role, capabilities.canBulkSubmitAggregator, showToast, visits]
  );

  return (
    <EvvVisitsContext.Provider
      value={{
        visits,
        actor,
        capabilities,
        activeTab: effectiveActiveTab,
        setActiveTab,
        exceptionFilterPreset,
        setExceptionFilterPreset,
        aggregatorSubView,
        setAggregatorSubView,
        navigateTab,
        toastMessage,
        showToast,
        updateVisit,
        reopenException,
        bulkConfirmVisits,
        bulkSubmitAggregator,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-gradient-to-r from-[#141D3C] to-[#1E2B58] text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[#2A3B75] z-[100] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#57EAB6]" />
          {toastMessage}
        </div>
      )}
    </EvvVisitsContext.Provider>
  );
}

export function useEvvVisits(): EvvVisitsContextValue {
  const ctx = useContext(EvvVisitsContext);
  if (!ctx) {
    throw new Error("useEvvVisits must be used within an EvvVisitsProvider");
  }
  return ctx;
}
