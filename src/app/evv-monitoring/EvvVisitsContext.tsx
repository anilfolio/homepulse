"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { initialVisits, REASON_CODES } from "./mockData";
import { EVVVisit, ExceptionCategory } from "./types";
import {
  computeMaxTimeVarianceMinutes,
  createAuditEvent,
  deriveVisitStatus,
  nextId,
} from "./evvRules";

export type EVVNavTab = "overview" | "visits" | "exceptions" | "aggregator";
export type AggregatorSubView = "readiness" | "batches" | "rules";

export interface BulkConfirmPayload {
  visitIds: string[];
  reasonCode: string;
  attestationRef: string;
  notes: string;
  useScheduledTimes: boolean;
}

interface EvvVisitsContextValue {
  visits: EVVVisit[];
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
  bulkConfirmVisits: (payload: BulkConfirmPayload) => void;
  bulkSubmitAggregator: (visitIds: string[]) => void;
}

const EvvVisitsContext = createContext<EvvVisitsContextValue | null>(null);

/**
 * Provides shared EVV visit state, tab navigation memory, and resolution actions
 * across `/evv-monitoring` and `/evv-monitoring/[id]`.
 */
export function EvvVisitsProvider({ children }: { children: React.ReactNode }) {
  const [visits, setVisits] = useState<EVVVisit[]>(initialVisits);
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

  const updateVisit = useCallback(
    (updated: EVVVisit, toast?: string) => {
      setVisits((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      if (toast) showToast(toast);
    },
    [showToast]
  );

  const navigateTab = useCallback(
    (tab: EVVNavTab, exceptionFilter?: ExceptionCategory) => {
      if (exceptionFilter) {
        setExceptionFilterPreset(exceptionFilter);
      } else if (tab !== "exceptions") {
        setExceptionFilterPreset("All");
      }
      setActiveTab(tab);
    },
    []
  );

  const bulkConfirmVisits = useCallback(
    (payload: BulkConfirmPayload) => {
      const reasonObj = REASON_CODES.find((r) => r.code === payload.reasonCode);
      const nowIso = new Date().toISOString();

      setVisits((prev) =>
        prev.map((v) => {
          if (!payload.visitIds.includes(v.id)) return v;

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

          return {
            ...v,
            actualTime: { start: nextStart, end: nextEnd },
            visitStatus: nextVisitStatus,
            timeDeltaMinutes: nextDelta,
            evvCompliance: "Resolved",
            exceptionSeverity: "info",
            exceptionDetail: `Resolved after bulk review (${payload.reasonCode})`,
            resolution: {
              acknowledged: true,
              acknowledgedAt: nowIso,
              acknowledgedBy: "Admin Coordinator",
              reasonCode: payload.reasonCode,
              reasonLabel: reasonObj?.label,
              resolutionCode: "RES-CALL-TS",
              resolutionLabel: "Manual timesheet confirmation with attestation",
              notes: payload.notes,
              attestationConfirmed: true,
              attestationRef: payload.attestationRef,
              resolvedAt: nowIso,
              resolvedBy: "Admin Coordinator",
            },
            auditHistory: [
              createAuditEvent({
                actorName: "Admin Coordinator",
                actorRole: "ADMIN",
                actionType: "MANUAL_CONFIRMATION",
                summary: `Bulk visit confirmation with documentation attestation (${payload.attestationRef}). Original EVV events preserved.`,
                reasonCode: payload.reasonCode,
                resolutionCode: "RES-CALL-TS",
                previousValue: `In: ${v.originalEvv.clockIn ?? "null"} / Out: ${v.originalEvv.clockOut ?? "null"}`,
                newValue: `In: ${nextStart ?? "null"} / Out: ${nextEnd ?? "null"}`,
              }),
              ...v.auditHistory,
            ],
          };
        })
      );

      showToast(
        `Confirmed ${payload.visitIds.length} visit(s) with documentation attestation.`
      );
    },
    [showToast]
  );

  const bulkSubmitAggregator = useCallback(
    (visitIds: string[]) => {
      let submittedCount = 0;
      let skippedExceptions = 0;

      setVisits((prev) =>
        prev.map((v) => {
          if (!visitIds.includes(v.id)) return v;
          if (v.evvCompliance === "Exception") {
            skippedExceptions += 1;
            return v;
          }
          submittedCount += 1;
          return {
            ...v,
            processing: {
              ...v.processing,
              aggregator: "Submitted",
              aggregatorRef: nextId("BATCH"),
            },
            auditHistory: [
              createAuditEvent({
                actorName: "Admin Coordinator",
                actorRole: "ADMIN",
                actionType: "AGGREGATOR_SUBMITTED",
                summary: `Bulk submitted to ${v.ruleProfile.aggregator}.`,
                previousValue: v.processing.aggregator,
                newValue: "Submitted",
              }),
              ...v.auditHistory,
            ],
          };
        })
      );

      if (skippedExceptions > 0) {
        showToast(
          `Submitted ${submittedCount} eligible visit(s); ${skippedExceptions} unresolved exception(s) held.`
        );
      } else {
        showToast(`Submitted ${submittedCount} visit(s) to state aggregator.`);
      }
    },
    [showToast]
  );

  return (
    <EvvVisitsContext.Provider
      value={{
        visits,
        activeTab,
        setActiveTab,
        exceptionFilterPreset,
        setExceptionFilterPreset,
        aggregatorSubView,
        setAggregatorSubView,
        navigateTab,
        toastMessage,
        showToast,
        updateVisit,
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

/**
 * Returns the shared EVV monitoring context. Must be used under `EvvVisitsProvider`.
 */
export function useEvvVisits(): EvvVisitsContextValue {
  const ctx = useContext(EvvVisitsContext);
  if (!ctx) {
    throw new Error("useEvvVisits must be used within an EvvVisitsProvider");
  }
  return ctx;
}
