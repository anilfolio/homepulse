"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  FileCheck2,
  FileSignature,
  History,
  Info,
  Mic,
  PhoneCall,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  UserCheck,
  Wallet,
} from "lucide-react";
import clsx from "clsx";
import {
  EVVVisit,
  ServiceLocation,
  ServiceLocationPhone,
} from "../../types";
import { EVVNavTab, EvvActor, useEvvVisits } from "../../EvvVisitsContext";
import { EvvRoleCapabilities } from "../../evvPermissions";
import {
  appendVisitAudit,
  applyLocationCorrection,
  getCaregiverPhone,
  getVisitAuthorization,
  getVisitTasksSummary,
  maskPhoneNumber,
  nextId,
} from "../../evvRules";
import { getProcessingBadgeStyle } from "../../_components/evvStatusStyles";
import { ExceptionResolutionSection } from "./ExceptionResolutionSection";
import { ProcessingControlsSection } from "./ProcessingControlsSection";
import { AuditHistorySection } from "./AuditHistorySection";

type DetailTab = "details" | "resolve" | "processing" | "audit";

const backLabelByTab: Record<EVVNavTab, string> = {
  overview: "Back to EVV Overview",
  visits: "Back to All Visits",
  exceptions: "Back to Exceptions",
  aggregator: "Back to Visit Readiness & Holds",
};

export function VisitDetailsClient({ visitId }: { visitId: string }) {
  const {
    visits,
    actor,
    capabilities,
    activeTab,
    updateVisit,
    reopenException,
    showToast,
  } = useEvvVisits();
  const visit = visits.find((v) => v.id === visitId) ?? null;

  if (!visit) {
    return (
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
        <p className="text-base font-bold text-slate-900">
          Visit record not found ({visitId})
        </p>
        <p className="text-xs text-slate-500">
          Return to the EVV & Visits workspace to choose an active visit.
        </p>
        <Link
          href="/evv-monitoring"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-navy text-white text-xs font-semibold hover:bg-brand-navy/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to EVV & Visits
        </Link>
      </div>
    );
  }

  return (
    <VisitDetailsContent
      key={visit.id}
      visit={visit}
      actor={actor}
      capabilities={capabilities}
      backLabel={backLabelByTab[activeTab]}
      onUpdateVisit={updateVisit}
      onReopenException={reopenException}
      onNotifyCaregiver={() =>
        showToast(
          `Punch verification reminder sent to ${visit.caregiver.name}.`
        )
      }
    />
  );
}

function VisitDetailsContent({
  visit,
  actor,
  capabilities,
  backLabel,
  onUpdateVisit,
  onReopenException,
  onNotifyCaregiver,
}: {
  visit: EVVVisit;
  actor: EvvActor;
  capabilities: EvvRoleCapabilities;
  backLabel: string;
  onUpdateVisit: (updated: EVVVisit, toastMessage?: string) => void;
  onReopenException: (visitId: string, reason?: string) => void;
  onNotifyCaregiver: () => void;
}) {
  const [sectionTab, setSectionTab] = useState<DetailTab>("details");
  const [revealedPhoneIds, setRevealedPhoneIds] = useState<string[]>([]);
  const [caregiverPhoneRevealed, setCaregiverPhoneRevealed] = useState(false);

  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [editAddress, setEditAddress] = useState(
    visit.serviceLocation.addressLine1
  );
  const [editCityStateZip, setEditCityStateZip] = useState(
    visit.serviceLocation.cityStateZip
  );
  const [editLocationType, setEditLocationType] = useState<
    ServiceLocation["locationType"]
  >(visit.serviceLocation.locationType);

  const [showAddPhone, setShowAddPhone] = useState(false);
  const [newPhoneLabel, setNewPhoneLabel] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newPhoneType, setNewPhoneType] =
    useState<ServiceLocationPhone["type"]>("Landline");

  const authorization = useMemo(() => getVisitAuthorization(visit), [visit]);
  const tasksSummary = useMemo(() => getVisitTasksSummary(visit), [visit]);
  const caregiverPhone = useMemo(() => getCaregiverPhone(visit), [visit]);

  const effectiveTab: DetailTab = useMemo(() => {
    if (sectionTab === "processing" && !capabilities.canViewAggregatorTab) {
      return "details";
    }
    if (sectionTab === "resolve" && !capabilities.canViewExceptions) {
      return "details";
    }
    return sectionTab;
  }, [sectionTab, capabilities]);

  const handleRevealPhone = (phone: ServiceLocationPhone) => {
    if (!capabilities.canRevealPhones) return;
    const isRevealed = revealedPhoneIds.includes(phone.id);
    if (isRevealed) {
      setRevealedPhoneIds((prev) => prev.filter((id) => id !== phone.id));
      return;
    }
    setRevealedPhoneIds((prev) => [...prev, phone.id]);
    const updated = appendVisitAudit(visit, {
      actorName: actor.name,
      actorRole: actor.role,
      actionType: "PHI_UNMASKED",
      summary: `Unmasked associated patient phone (${phone.label}) for visit ${visit.id}.`,
    });
    onUpdateVisit(updated);
  };

  const handleRevealCaregiverPhone = () => {
    if (!capabilities.canRevealPhones) return;
    if (caregiverPhoneRevealed) {
      setCaregiverPhoneRevealed(false);
      return;
    }
    setCaregiverPhoneRevealed(true);
    const updated = appendVisitAudit(visit, {
      actorName: actor.name,
      actorRole: actor.role,
      actionType: "PHI_UNMASKED",
      summary: `Unmasked caregiver contact phone (${visit.caregiver.id}) for visit ${visit.id}.`,
    });
    onUpdateVisit(updated);
  };

  const handleAssociatePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !capabilities.canResolveExceptions ||
      !newPhoneLabel.trim() ||
      !newPhoneNumber.trim()
    )
      return;
    const createdPhone: ServiceLocationPhone = {
      id: nextId("ph"),
      label: newPhoneLabel.trim(),
      number: newPhoneNumber.trim(),
      type: newPhoneType,
      isVerifiedForIVR: true,
    };
    const updated = appendVisitAudit(
      {
        ...visit,
        serviceLocation: {
          ...visit.serviceLocation,
          associatedPhones: [
            ...visit.serviceLocation.associatedPhones,
            createdPhone,
          ],
        },
      },
      {
        actorName: actor.name,
        actorRole: actor.role,
        actionType: "PHONE_ASSOCIATED",
        summary: `Associated verified ${newPhoneType} number (${maskPhoneNumber(createdPhone.number)}) to service location.`,
      }
    );
    onUpdateVisit(
      updated,
      "Patient phone number associated with service location."
    );
    setNewPhoneLabel("");
    setNewPhoneNumber("");
    setShowAddPhone(false);
  };

  const handleSaveLocationCorrection = () => {
    if (
      !capabilities.canResolveExceptions ||
      !editAddress.trim() ||
      !editCityStateZip.trim()
    )
      return;
    const updated = applyLocationCorrection(
      visit,
      editAddress,
      editCityStateZip,
      editLocationType,
      actor
    );
    onUpdateVisit(updated, "Service location updated and original GPS preserved.");
    setShowLocationEditor(false);
  };

  const detailTabs = useMemo(() => {
    const items: {
      id: DetailTab;
      label: string;
      subtitle: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: number;
      visible: boolean;
    }[] = [
      {
        id: "details",
        label: "Details & Verification",
        subtitle: "Times, location & evidence",
        icon: ShieldCheck,
        visible: true,
      },
      {
        id: "resolve",
        label: "Exception Resolution",
        subtitle: capabilities.canResolveExceptions
          ? "5-step guided workflow"
          : "Exception inspection",
        icon: AlertTriangle,
        badge: visit.evvCompliance === "Exception" ? 1 : undefined,
        visible: capabilities.canViewExceptions,
      },
      {
        id: "processing",
        label: "Aggregator & Billing",
        subtitle: "Submission, billing & payroll",
        icon: Send,
        visible: capabilities.canViewAggregatorTab,
      },
      {
        id: "audit",
        label: "Audit History",
        subtitle: "Immutable UTC log",
        icon: History,
        badge: visit.auditHistory.length,
        visible: true,
      },
    ];
    return items.filter((t) => t.visible);
  }, [capabilities, visit.evvCompliance, visit.auditHistory.length]);

  return (
    <div className="flex-1 min-h-screen space-y-5">
      {/* Top Back Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/evv-monitoring"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:text-brand-navy hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-bold">
            Role: {capabilities.roleLabel}
          </span>
          <span className="hidden sm:inline">
            <Link
              href="/evv-monitoring"
              className="hover:text-brand-primary transition-colors"
            >
              EVV & Visits
            </Link>{" "}
            / <span className="font-mono font-bold text-slate-800">{visit.id}</span>
          </span>
        </div>
      </div>

      {/* Executive Navy Deep Space Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#141D3C] via-[#1A254B] to-[#0E152E] text-white shadow-[0_14px_38px_rgba(20,29,60,0.2)] border border-[#2A3B75]/70 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-[#6C88FF]/15 blur-2xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-extrabold text-white bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 backdrop-blur-md">
                {visit.id}
              </span>
              <span
                className={clsx(
                  "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                  visit.evvCompliance === "Verified"
                    ? "bg-[#57EAB6]/15 text-[#57EAB6] border-[#57EAB6]/30"
                    : visit.evvCompliance === "Exception"
                      ? "bg-red-500/20 text-red-200 border-red-400/30"
                      : "bg-[#6C88FF]/20 text-indigo-100 border-[#6C88FF]/40"
                )}
              >
                {visit.evvCompliance === "Resolved"
                  ? "Resolved after review"
                  : visit.evvCompliance}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/10">
                Visit: {visit.visitStatus}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/10">
                Method: {visit.evvMethod}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white mt-3 tracking-tight">
              {visit.client.name}{" "}
              <span className="text-xs font-mono font-normal text-slate-300">
                ({visit.client.id})
              </span>{" "}
              · {visit.service.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Caregiver:{" "}
              <strong className="text-white">{visit.caregiver.name}</strong> (
              {visit.caregiver.id} · {visit.caregiver.role}) ·{" "}
              {visit.visitDateLabel} ({visit.visitDate}) ·{" "}
              {visit.scheduledTime.start} – {visit.scheduledTime.end}
            </p>
          </div>

          {visit.evvCompliance === "Exception" &&
            capabilities.canResolveExceptions &&
            effectiveTab !== "resolve" && (
              <button
                type="button"
                onClick={() => setSectionTab("resolve")}
                className="self-start px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C88FF] to-[#5371F3] hover:from-[#5A77FF] hover:to-[#4362E6] text-white text-xs font-bold shadow-md shadow-[#6C88FF]/25 cursor-pointer whitespace-nowrap transition-all"
              >
                Resolve Exception →
              </button>
            )}
        </div>

        {visit.evvCompliance === "Resolved" && (
          <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-indigo-100 flex items-center gap-2 relative z-10">
            <Info className="w-4 h-4 text-[#57EAB6] shrink-0" />
            <span>
              <strong>Resolved after review.</strong> Resolution does not
              automatically imply aggregator acceptance or billing clearance.
            </span>
          </div>
        )}
      </div>

      {/* Independent Segmented Tab Card Row */}
      <div
        className={clsx(
          "grid gap-2 bg-white/85 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200/80 shadow-[0_6px_28px_rgba(20,29,60,0.04)]",
          detailTabs.length === 4
            ? "grid-cols-2 lg:grid-cols-4"
            : detailTabs.length === 3
              ? "grid-cols-1 sm:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2"
        )}
      >
        {detailTabs.map((tab) => {
          const isActive = effectiveTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSectionTab(tab.id)}
              className={clsx(
                "relative flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer",
                isActive
                  ? "text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="evv-detail-nav"
                  className="absolute inset-0 bg-gradient-to-r from-[#141D3C] to-[#1E2B58] rounded-xl shadow-[0_8px_20px_rgba(20,29,60,0.2)]"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.16, duration: 0.42 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                <div
                  className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    isActive
                      ? "bg-white/10 text-[#57EAB6]"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div
                    className={clsx(
                      "text-xs sm:text-sm font-bold truncate",
                      isActive ? "text-white" : "text-slate-800"
                    )}
                  >
                    {tab.label}
                  </div>
                  <div
                    className={clsx(
                      "text-[10px] hidden sm:block truncate",
                      isActive ? "text-slate-300" : "text-slate-400"
                    )}
                  >
                    {tab.subtitle}
                  </div>
                </div>
              </div>
              {tab.badge !== undefined && (
                <span
                  className={clsx(
                    "relative z-10 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 tabular-nums",
                    tab.id === "resolve"
                      ? isActive
                        ? "bg-red-500 text-white"
                        : "bg-red-100 text-red-700"
                      : isActive
                        ? "bg-[#57EAB6]/20 text-[#57EAB6] border border-[#57EAB6]/30"
                        : "bg-slate-100 text-slate-600"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: FULL DETAILS & VERIFICATION (70/30 Command Split) */}
      {effectiveTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Primary Details Column (70%) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Exception & Resolution Summary Card */}
            <div
              className={clsx(
                "rounded-2xl border p-4 sm:p-5 shadow-xs space-y-3",
                visit.evvCompliance === "Exception"
                  ? "bg-red-50/60 border-red-200"
                  : "bg-white border-slate-200/80"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  {visit.evvCompliance === "Exception" ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  Compliance & Exception Context
                </h2>
                <span
                  className={clsx(
                    "text-[11px] font-bold px-2.5 py-0.5 rounded-full border",
                    visit.evvCompliance === "Exception"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : visit.evvCompliance === "Resolved"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  )}
                >
                  {visit.exceptionCategory === "None"
                    ? "No Exception Flagged"
                    : visit.exceptionCategory}
                </span>
              </div>

              <p className="text-sm text-slate-800 leading-relaxed">
                {visit.exceptionDetail}
              </p>

              {visit.resolution && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900">
                    Resolution Record
                  </div>
                  <div className="text-slate-700">
                    <span className="text-slate-500">Reason:</span>{" "}
                    <strong>{visit.resolution.reasonCode}</strong>{" "}
                    {visit.resolution.reasonLabel
                      ? `— ${visit.resolution.reasonLabel}`
                      : ""}
                  </div>
                  <div className="text-slate-700">
                    <span className="text-slate-500">Action:</span>{" "}
                    <strong>{visit.resolution.resolutionCode}</strong>{" "}
                    {visit.resolution.resolutionLabel
                      ? `— ${visit.resolution.resolutionLabel}`
                      : ""}
                  </div>
                  {visit.resolution.notes && (
                    <div className="text-slate-700">
                      <span className="text-slate-500">Notes:</span>{" "}
                      {visit.resolution.notes}
                    </div>
                  )}
                  {visit.resolution.attestationRef && (
                    <div className="text-emerald-700 font-semibold">
                      Attestation Ref: {visit.resolution.attestationRef}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {visit.evvCompliance === "Exception" &&
                  capabilities.canResolveExceptions && (
                    <button
                      type="button"
                      onClick={() => setSectionTab("resolve")}
                      className="px-3.5 py-2 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-brand-navy/90 cursor-pointer transition-colors"
                    >
                      Open 5-Step Exception Resolution →
                    </button>
                  )}

                {visit.evvCompliance === "Resolved" &&
                  capabilities.canReopenExceptions && (
                    <button
                      type="button"
                      onClick={() =>
                        onReopenException(
                          visit.id,
                          visit.processing.aggregator === "Rejected"
                            ? `Reopened after aggregator rejection: ${visit.processing.aggregatorRejectReason ?? "review required"}`
                            : "Reopened for supervisory exception review."
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reopen Exception
                    </button>
                  )}
              </div>
            </div>

            {/* Original EVV Event vs Current Visit Times */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-primary" />
                  Original EVV Event vs Current Visit Times
                </h2>
                <div className="flex items-center gap-2">
                  {visit.timeDeltaMinutes > 0 && (
                    <span
                      className={clsx(
                        "text-[11px] font-bold px-2.5 py-0.5 rounded-full border",
                        visit.timeDeltaMinutes <=
                          visit.ruleProfile.timeToleranceMinutes
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      )}
                    >
                      {visit.timeDeltaMinutes <=
                      visit.ruleProfile.timeToleranceMinutes
                        ? `±${visit.timeDeltaMinutes}m within rule`
                        : `+${visit.timeDeltaMinutes}m variance`}
                    </span>
                  )}
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Method: {visit.evvMethod}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Original Raw EVV Capture (Preserved)
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1 tabular-nums">
                    In: {visit.originalEvv.clockIn ?? "None"} · Out:{" "}
                    {visit.originalEvv.clockOut ?? "None"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {visit.originalEvv.gpsDistanceFt !== undefined
                      ? `${visit.originalEvv.gpsDistanceFt} ft from service anchor`
                      : `Captured via ${visit.originalEvv.method}`}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-brand-primary/25 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                    Current / Confirmed Record
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1 tabular-nums">
                    In: {visit.actualTime.start ?? "Missing"} · Out:{" "}
                    {visit.actualTime.end ?? "Missing"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Scheduled: {visit.scheduledTime.start} –{" "}
                    {visit.scheduledTime.end} (Rule tol: ±
                    {visit.ruleProfile.timeToleranceMinutes}m)
                  </div>
                </div>
              </div>
            </div>

            {/* Caregiver Follow-up & Care Task Delivery */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-brand-primary" />
                  Care Delivery & Caregiver Follow-Up
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 tabular-nums">
                  {tasksSummary.completed}/{tasksSummary.total} Care Tasks
                  Documented
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs">
                <div>
                  <div className="font-bold text-slate-900">
                    {visit.caregiver.name} ({visit.caregiver.id} ·{" "}
                    {visit.caregiver.role})
                  </div>
                  <div className="text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {caregiverPhoneRevealed
                        ? caregiverPhone
                        : maskPhoneNumber(caregiverPhone)}
                    </span>
                    {capabilities.canRevealPhones && (
                      <button
                        type="button"
                        onClick={handleRevealCaregiverPhone}
                        className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 cursor-pointer"
                        title={
                          caregiverPhoneRevealed
                            ? "Hide number"
                            : "Reveal caregiver number (logged)"
                        }
                      >
                        {caregiverPhoneRevealed ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {!capabilities.isReadOnly && (
                  <button
                    type="button"
                    onClick={onNotifyCaregiver}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Send Punch Reminder
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {tasksSummary.items.map((item, idx) => {
                  const done = idx < tasksSummary.completed;
                  return (
                    <span
                      key={item}
                      className={clsx(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border",
                        done
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      )}
                    >
                      {done && <CheckCircle2 className="w-3 h-3" />}
                      {item}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Service Location & Associated Patient Phones */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-brand-primary" />
                  Service Location & Associated Patient Phones
                </h2>
                {capabilities.canResolveExceptions && (
                  <button
                    type="button"
                    onClick={() => setShowLocationEditor((p) => !p)}
                    className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
                  >
                    {showLocationEditor ? "Close Editor" : "Correct Location"}
                  </button>
                )}
              </div>

              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {visit.serviceLocation.addressLine1}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {visit.serviceLocation.cityStateZip} ·{" "}
                    <span className="font-semibold text-slate-700">
                      {visit.serviceLocation.locationType}
                    </span>
                  </div>
                </div>
                {visit.gpsDistanceFt !== undefined && (
                  <span
                    className={clsx(
                      "px-2.5 py-1 rounded-full text-xs font-bold border self-start sm:self-center tabular-nums",
                      visit.gpsDistanceFt <= visit.ruleProfile.geofenceRadiusFt
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    )}
                  >
                    {visit.gpsDistanceFt} ft (limit{" "}
                    {visit.ruleProfile.geofenceRadiusFt} ft)
                  </span>
                )}
              </div>

              {capabilities.canResolveExceptions && showLocationEditor && (
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                  <div className="text-xs font-bold text-indigo-950">
                    Service Location Correction (preserves original GPS event)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Street address"
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      value={editCityStateZip}
                      onChange={(e) => setEditCityStateZip(e.target.value)}
                      placeholder="City, State ZIP"
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <select
                      value={editLocationType}
                      onChange={(e) =>
                        setEditLocationType(
                          e.target.value as ServiceLocation["locationType"]
                        )
                      }
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="Patient Home">Patient Home</option>
                      <option value="Family Residence">Family Residence</option>
                      <option value="Community">Community</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleSaveLocationCorrection}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 cursor-pointer"
                    >
                      Save Location Update
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    Associated Service-Location Phone Numbers (IVR Eligible)
                  </span>
                  {capabilities.canResolveExceptions && (
                    <button
                      type="button"
                      onClick={() => setShowAddPhone((p) => !p)}
                      className="text-xs font-bold text-brand-primary flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Associate Phone
                    </button>
                  )}
                </div>

                {visit.serviceLocation.associatedPhones.map((ph) => {
                  const revealed =
                    capabilities.canRevealPhones &&
                    revealedPhoneIds.includes(ph.id);
                  return (
                    <div
                      key={ph.id}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">
                          {ph.label}
                        </span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                          {ph.type}
                        </span>
                        {ph.isVerifiedForIVR ? (
                          <span className="ml-1.5 text-[10px] font-bold text-emerald-700">
                            · IVR Verified
                          </span>
                        ) : (
                          <span className="ml-1.5 text-[10px] font-bold text-amber-700">
                            · Unlinked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-800 tabular-nums">
                          {revealed ? ph.number : maskPhoneNumber(ph.number)}
                        </span>
                        {capabilities.canRevealPhones && (
                          <button
                            type="button"
                            onClick={() => handleRevealPhone(ph)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 cursor-pointer"
                            title={
                              revealed
                                ? "Hide number"
                                : "Reveal number (logged to audit)"
                            }
                          >
                            {revealed ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {capabilities.canResolveExceptions && showAddPhone && (
                  <form
                    onSubmit={handleAssociatePhone}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Label (e.g. Home Landline)"
                        value={newPhoneLabel}
                        onChange={(e) => setNewPhoneLabel(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="(614) 555-0199"
                        value={newPhoneNumber}
                        onChange={(e) => setNewPhoneNumber(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        required
                      />
                      <select
                        value={newPhoneType}
                        onChange={(e) =>
                          setNewPhoneType(
                            e.target.value as ServiceLocationPhone["type"]
                          )
                        }
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Landline">Landline</option>
                        <option value="Mobile">Mobile</option>
                        <option value="Authorized Family">
                          Authorized Family
                        </option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddPhone(false)}
                        className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-brand-primary text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Save & Link to Location
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Verification Evidence & Payer Rule Profile */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-primary" />
                  Verification Evidence & Payer Rule Profile
                </h2>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {visit.ruleProfile.state} · {visit.ruleProfile.payer}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileSignature className="w-3.5 h-3.5 text-brand-primary" />
                      Patient Signature
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      Rule: {visit.ruleProfile.signatureRequirement}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    Status: {visit.verification.signatureStatus}
                  </div>
                  {visit.verification.signatureCapturedAt && (
                    <div className="text-[11px] text-slate-500">
                      Captured at {visit.verification.signatureCapturedAt}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-purple-600" />
                      Patient Voice / IVR
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      Rule: {visit.ruleProfile.voiceRequirement}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    Status: {visit.verification.voiceStatus}
                    {visit.verification.voiceMatchScore
                      ? ` (${visit.verification.voiceMatchScore}% match)`
                      : ""}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {visit.verification.voiceDurationSec
                      ? `Recording length: ${visit.verification.voiceDurationSec}s`
                      : "Use Exception Resolution tab for Alternate IVR capture"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Context Rail (30%) */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            {/* Visit Identifiers & Service Summary */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-brand-primary" />
                Visit & Service Metadata
              </h3>
              <dl className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <dt className="text-slate-500">Caregiver</dt>
                  <dd className="font-semibold text-slate-900 text-right">
                    {visit.caregiver.name}{" "}
                    <span className="font-mono text-slate-500">
                      ({visit.caregiver.id} · {visit.caregiver.role})
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <dt className="text-slate-500">Client</dt>
                  <dd className="font-semibold text-slate-900 text-right">
                    {visit.client.name}{" "}
                    <span className="font-mono text-slate-500">
                      ({visit.client.id})
                    </span>
                  </dd>
                </div>
                {capabilities.canViewMedicaidId && (
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <dt className="text-slate-500">Medicaid ID</dt>
                    <dd className="font-mono font-semibold text-slate-800">
                      {visit.client.medicaidIdMasked}
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <dt className="text-slate-500">Service</dt>
                  <dd className="font-semibold text-slate-900 text-right">
                    {visit.service.name}{" "}
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                      {visit.service.code}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Payer / Aggregator</dt>
                  <dd className="font-semibold text-slate-900 text-right">
                    {visit.ruleProfile.state} · {visit.ruleProfile.aggregator}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Payer Authorization & Units Card */}
            {(capabilities.canViewFinancials ||
              capabilities.canResolveExceptions) && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-brand-primary" />
                    Payer Authorization
                  </h3>
                  <span
                    className={clsx(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                      authorization.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : authorization.status === "Expiring Soon"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                    )}
                  >
                    {authorization.status}
                  </span>
                </div>
                <div className="text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">
                      {authorization.authNumber}
                    </span>
                    <span className="text-slate-500 tabular-nums">
                      Exp: {authorization.expiresAt}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={clsx(
                        "h-full rounded-full",
                        authorization.status === "Active"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      )}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (authorization.remainingUnits /
                              authorization.totalUnits) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-600 font-semibold tabular-nums">
                    {authorization.remainingUnits} / {authorization.totalUnits}{" "}
                    {authorization.unitLabel} remaining
                  </div>
                </div>
              </div>
            )}

            {/* Financial & Aggregator Readiness Card */}
            {capabilities.canViewFinancials && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-brand-primary" />
                    Processing Readiness
                  </h3>
                  {capabilities.canViewAggregatorTab && (
                    <button
                      type="button"
                      onClick={() => setSectionTab("processing")}
                      className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
                    >
                      Manage →
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 text-xs">
                  {[
                    {
                      label: "Aggregator",
                      icon: Send,
                      value: visit.processing.aggregator,
                      sub: visit.processing.aggregatorRef
                        ? `Ref: ${visit.processing.aggregatorRef}`
                        : visit.ruleProfile.aggregator,
                    },
                    {
                      label: "Billing",
                      icon: DollarSign,
                      value: visit.processing.billing,
                      sub: `$${visit.estimatedBillingAmount.toFixed(2)} est.`,
                    },
                    {
                      label: "Payroll",
                      icon: Wallet,
                      value: visit.processing.payroll,
                      sub: "Caregiver payout gate",
                    },
                  ].map((row) => {
                    const style = getProcessingBadgeStyle(row.value);
                    return (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <row.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-800">
                              {row.label}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {row.sub}
                            </div>
                          </div>
                        </div>
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border shrink-0",
                            style.pill
                          )}
                        >
                          <span
                            className={clsx(
                              "w-1.5 h-1.5 rounded-full",
                              style.dot
                            )}
                          />
                          {row.value}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {visit.processing.aggregatorRejectReason && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                    <strong>Aggregator Rejection:</strong>{" "}
                    {visit.processing.aggregatorRejectReason}
                  </div>
                )}
              </div>
            )}

            {/* Audit Trail Preview Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-brand-primary" />
                  Recent Audit Events
                </h3>
                <button
                  type="button"
                  onClick={() => setSectionTab("audit")}
                  className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
                >
                  View All ({visit.auditHistory.length}) →
                </button>
              </div>
              <div className="space-y-2">
                {visit.auditHistory.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-slate-700">
                        {ev.actionType}
                      </span>
                      <span className="font-mono text-slate-400">
                        {ev.timestamp.slice(0, 10)}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-2">{ev.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXCEPTION RESOLUTION */}
      {effectiveTab === "resolve" && capabilities.canViewExceptions && (
        <ExceptionResolutionSection
          visit={visit}
          actor={actor}
          capabilities={capabilities}
          onUpdateVisit={onUpdateVisit}
          onReopenException={onReopenException}
          onResolutionSaved={() =>
            setSectionTab(
              capabilities.canViewAggregatorTab ? "processing" : "details"
            )
          }
        />
      )}

      {/* TAB 3: AGGREGATOR & BILLING */}
      {effectiveTab === "processing" && capabilities.canViewAggregatorTab && (
        <ProcessingControlsSection
          visit={visit}
          actor={actor}
          capabilities={capabilities}
          onUpdateVisit={onUpdateVisit}
        />
      )}

      {/* TAB 4: AUDIT HISTORY */}
      {effectiveTab === "audit" && (
        <AuditHistorySection
          auditHistory={visit.auditHistory}
          deviceOrPhoneRef={visit.originalEvv.deviceOrPhoneRef}
        />
      )}
    </div>
  );
}
