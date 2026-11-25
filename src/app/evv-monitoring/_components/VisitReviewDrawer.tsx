"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  PhoneCall,
  Mic,
  FileSignature,
  History,
  Eye,
  EyeOff,
  Plus,
  Building2,
  FileCheck2,
  Send,
  DollarSign,
  Wallet,
  Info,
  Volume2,
} from "lucide-react";
import clsx from "clsx";
import {
  AggregatorStatus,
  AuditEvent,
  BillingStatus,
  EVVVisit,
  PayrollStatus,
  ServiceLocation,
  ServiceLocationPhone,
} from "../types";
import { REASON_CODES, RESOLUTION_CODES } from "../mockData";
import {
  computeMaxTimeVarianceMinutes,
  createAuditEvent,
  deriveVisitStatus,
  getRecommendedWorkflowTitle,
  maskPhoneNumber,
  nextId,
} from "../evvRules";

interface VisitReviewDrawerProps {
  visit: EVVVisit | null;
  onClose: () => void;
  onUpdateVisit: (updated: EVVVisit, toastMessage?: string) => void;
}

type DrawerTab = "details" | "resolve" | "processing" | "audit";

export function VisitReviewDrawer({
  visit,
  onClose,
  onUpdateVisit,
}: VisitReviewDrawerProps) {
  return (
    <AnimatePresence>
      {visit && (
        <VisitReviewDrawerContent
          key={visit.id}
          visit={visit}
          onClose={onClose}
          onUpdateVisit={onUpdateVisit}
        />
      )}
    </AnimatePresence>
  );
}

function VisitReviewDrawerContent({
  visit,
  onClose,
  onUpdateVisit,
}: {
  visit: EVVVisit;
  onClose: () => void;
  onUpdateVisit: (updated: EVVVisit, toastMessage?: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<DrawerTab>(
    visit.evvCompliance === "Exception" ? "resolve" : "details"
  );
  const [revealedPhoneIds, setRevealedPhoneIds] = useState<string[]>([]);

  // Step 1-5 resolution state
  const [acknowledged, setAcknowledged] = useState(Boolean(visit.resolution?.acknowledged));
  const [reasonCode, setReasonCode] = useState(visit.resolution?.reasonCode ?? "");
  const [resolutionCode, setResolutionCode] = useState(
    visit.resolution?.resolutionCode ?? ""
  );
  const [notes, setNotes] = useState(visit.resolution?.notes ?? "");
  const [attestationChecked, setAttestationChecked] = useState(
    Boolean(visit.resolution?.attestationConfirmed)
  );
  const [attestationRef, setAttestationRef] = useState(
    visit.resolution?.attestationRef ?? "TS-DOC-2026-01"
  );

  // Time recovery inputs (for Missed In / Missed Out / Missed Call)
  const [correctedIn, setCorrectedIn] = useState(
    visit.actualTime.start ?? visit.scheduledTime.start
  );
  const [correctedOut, setCorrectedOut] = useState(
    visit.actualTime.end ?? visit.scheduledTime.end
  );

  // Service Location Correction state
  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [editAddress, setEditAddress] = useState(visit.serviceLocation.addressLine1);
  const [editCityStateZip, setEditCityStateZip] = useState(
    visit.serviceLocation.cityStateZip
  );
  const [editLocationType, setEditLocationType] =
    useState<ServiceLocation["locationType"]>(visit.serviceLocation.locationType);

  // Associate Patient Phone state
  const [showAddPhone, setShowAddPhone] = useState(false);
  const [newPhoneLabel, setNewPhoneLabel] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newPhoneType, setNewPhoneType] =
    useState<ServiceLocationPhone["type"]>("Landline");

  // Alternate IVR / Voice Verification state
  const [ivrSelectedPhoneId, setIvrSelectedPhoneId] = useState(
    visit.serviceLocation.associatedPhones[0]?.id ?? ""
  );
  const [voicePlaying, setVoicePlaying] = useState(false);

  const isManualOrMissingPunch =
    visit.exceptionCategory === "Missed In" ||
    visit.exceptionCategory === "Missed Out" ||
    visit.exceptionCategory === "Missed Call" ||
    visit.evvMethod === "Manual";

  const appendAudit = (
    current: EVVVisit,
    event: Omit<AuditEvent, "id" | "timestamp">
  ): EVVVisit => ({
    ...current,
    auditHistory: [createAuditEvent(event), ...current.auditHistory],
  });

  const handleRevealPhone = (phone: ServiceLocationPhone) => {
    const isRevealed = revealedPhoneIds.includes(phone.id);
    if (isRevealed) {
      setRevealedPhoneIds((prev) => prev.filter((id) => id !== phone.id));
      return;
    }
    setRevealedPhoneIds((prev) => [...prev, phone.id]);
    const updated = appendAudit(visit, {
      actorName: "Admin Coordinator",
      actorRole: "ADMIN",
      actionType: "PHI_UNMASKED",
      summary: `Unmasked associated patient phone (${phone.label}) for visit ${visit.id}.`,
    });
    onUpdateVisit(updated);
  };

  const handleAssociatePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoneLabel.trim() || !newPhoneNumber.trim()) return;
    const createdPhone: ServiceLocationPhone = {
      id: nextId("ph"),
      label: newPhoneLabel.trim(),
      number: newPhoneNumber.trim(),
      type: newPhoneType,
      isVerifiedForIVR: true,
    };
    let updated: EVVVisit = {
      ...visit,
      serviceLocation: {
        ...visit.serviceLocation,
        associatedPhones: [...visit.serviceLocation.associatedPhones, createdPhone],
      },
    };
    updated = appendAudit(updated, {
      actorName: "Admin Coordinator",
      actorRole: "ADMIN",
      actionType: "PHONE_ASSOCIATED",
      summary: `Associated verified ${newPhoneType} number (${maskPhoneNumber(createdPhone.number)}) to service location.`,
    });
    onUpdateVisit(updated, "Patient phone number associated with service location.");
    setNewPhoneLabel("");
    setNewPhoneNumber("");
    setShowAddPhone(false);
  };

  const handleSaveLocationCorrection = () => {
    if (!editAddress.trim() || !editCityStateZip.trim()) return;
    const prevAddr = `${visit.serviceLocation.addressLine1}, ${visit.serviceLocation.cityStateZip}`;
    const newAddr = `${editAddress.trim()}, ${editCityStateZip.trim()}`;
    let updated: EVVVisit = {
      ...visit,
      gpsDistanceFt: 18,
      serviceLocation: {
        ...visit.serviceLocation,
        addressLine1: editAddress.trim(),
        cityStateZip: editCityStateZip.trim(),
        locationType: editLocationType,
      },
    };
    updated = appendAudit(updated, {
      actorName: "Admin Coordinator",
      actorRole: "ADMIN",
      actionType: "LOCATION_UPDATED",
      summary: `Updated service location (${editLocationType}). Original GPS distance (${visit.originalEvv.gpsDistanceFt ?? 0} ft) preserved.`,
      previousValue: prevAddr,
      newValue: newAddr,
    });
    onUpdateVisit(updated, "Service location updated and original GPS preserved.");
    setShowLocationEditor(false);
  };

  const handleTriggerIVRVoiceVerify = () => {
    const matchedPhone = visit.serviceLocation.associatedPhones.find(
      (p) => p.id === ivrSelectedPhoneId
    );
    let updated: EVVVisit = {
      ...visit,
      verification: {
        ...visit.verification,
        voiceStatus: "Captured",
        voiceDurationSec: 12,
        voiceMatchScore: 95,
        ivrCallerIdMatched: Boolean(matchedPhone?.isVerifiedForIVR),
      },
    };
    updated = appendAudit(updated, {
      actorName: "Admin Coordinator",
      actorRole: "ADMIN",
      actionType: "VOICE_VERIFIED",
      summary: `Alternate IVR & patient voice verification completed (95% match) via ${matchedPhone ? matchedPhone.label : "patient phone"}.`,
    });
    onUpdateVisit(updated, "Alternate IVR & patient voice verification recorded.");
  };

  const handleAcknowledge = () => {
    if (acknowledged) return;
    setAcknowledged(true);
    const updated = appendAudit(visit, {
      actorName: "Admin Coordinator",
      actorRole: "ADMIN",
      actionType: "EXCEPTION_ACKNOWLEDGED",
      summary: `Acknowledged ${visit.exceptionCategory} exception for ${visit.id}.`,
    });
    onUpdateVisit(updated, "Exception acknowledged.");
  };

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged || !reasonCode || !resolutionCode || !notes.trim()) return;
    if (isManualOrMissingPunch && !attestationChecked) return;

    const reasonObj = REASON_CODES.find((r) => r.code === reasonCode);
    const resObj = RESOLUTION_CODES.find((r) => r.code === resolutionCode);

    const nextStart =
      visit.exceptionCategory === "Missed In" || visit.exceptionCategory === "Missed Call"
        ? correctedIn || visit.scheduledTime.start
        : visit.actualTime.start;
    const nextEnd =
      visit.exceptionCategory === "Missed Out" || visit.exceptionCategory === "Missed Call"
        ? correctedOut || visit.scheduledTime.end
        : visit.actualTime.end;

    const nextVisitStatus = deriveVisitStatus(
      nextStart,
      nextEnd,
      visit.scheduledWindowPassed
    );
    const nextDelta = computeMaxTimeVarianceMinutes(
      visit.scheduledTime.start,
      visit.scheduledTime.end,
      nextStart,
      nextEnd
    );

    const nowIso = new Date().toISOString();
    let updated: EVVVisit = {
      ...visit,
      actualTime: { start: nextStart, end: nextEnd },
      visitStatus: nextVisitStatus,
      timeDeltaMinutes: nextDelta,
      evvCompliance: "Resolved",
      exceptionSeverity: "info",
      exceptionDetail: `Resolved after review (${resObj?.code ?? resolutionCode})`,
      resolution: {
        acknowledged: true,
        acknowledgedAt: visit.resolution?.acknowledgedAt ?? nowIso,
        acknowledgedBy: "Admin Coordinator",
        reasonCode,
        reasonLabel: reasonObj?.label,
        resolutionCode,
        resolutionLabel: resObj?.label,
        notes: notes.trim(),
        attestationConfirmed: isManualOrMissingPunch ? attestationChecked : undefined,
        attestationRef: isManualOrMissingPunch ? attestationRef.trim() : undefined,
        resolvedAt: nowIso,
        resolvedBy: "Admin Coordinator",
      },
    };

    updated = appendAudit(updated, {
      actorName: "Admin Coordinator",
      actorRole: "ADMIN",
      actionType: "RESOLUTION_SAVED",
      summary: `Saved exception resolution (${resObj?.label ?? resolutionCode}). Status set to Resolved after review; aggregator & billing remain independent.`,
      reasonCode,
      resolutionCode,
      previousValue: `In: ${visit.originalEvv.clockIn ?? "null"} / Out: ${visit.originalEvv.clockOut ?? "null"}`,
      newValue: `In: ${nextStart ?? "null"} / Out: ${nextEnd ?? "null"}`,
    });

    onUpdateVisit(
      updated,
      "Resolution saved & audit history updated. Aggregator & billing clearance remain independent."
    );
    setActiveTab("processing");
  };

  const updateProcessingStatus = (
    field: "aggregator" | "billing" | "payroll",
    value: AggregatorStatus | BillingStatus | PayrollStatus,
    summary: string
  ) => {
    let updated: EVVVisit = {
      ...visit,
      processing: {
        ...visit.processing,
        [field]: value,
        ...(field === "aggregator" && value === "Submitted"
          ? { aggregatorRef: nextId("BATCH") }
          : {}),
      },
    };
    updated = appendAudit(updated, {
      actorName: "Admin Coordinator",
      actorRole: "ADMIN",
      actionType:
        field === "aggregator"
          ? "AGGREGATOR_SUBMITTED"
          : field === "billing"
            ? "BILLING_UPDATED"
            : "PAYROLL_UPDATED",
      summary,
      previousValue: visit.processing[field],
      newValue: value,
    });
    onUpdateVisit(updated, summary);
  };

  const prioritizedReasons = REASON_CODES.filter((r) =>
    r.applicableTo.includes(visit.exceptionCategory)
  );
  const otherReasons = REASON_CODES.filter(
    (r) => !r.applicableTo.includes(visit.exceptionCategory)
  );

  const prioritizedResolutions = RESOLUTION_CODES.filter((r) =>
    r.applicableTo.includes(visit.exceptionCategory)
  );
  const otherResolutions = RESOLUTION_CODES.filter(
    (r) => !r.applicableTo.includes(visit.exceptionCategory)
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-extrabold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {visit.id}
                </span>
                <span
                  className={clsx(
                    "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                    visit.evvCompliance === "Verified"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : visit.evvCompliance === "Exception"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                  )}
                >
                  {visit.evvCompliance === "Resolved"
                    ? "Resolved after review"
                    : visit.evvCompliance}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Visit: {visit.visitStatus}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-2">
                {visit.client.name} ({visit.client.id}) · {visit.service.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Caregiver: <strong className="text-slate-700">{visit.caregiver.name}</strong> ({visit.caregiver.id}) · {visit.visitDateLabel} ({visit.scheduledTime.start} – {visit.scheduledTime.end})
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close review drawer"
              className="p-2 rounded-full hover:bg-slate-200/70 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {visit.evvCompliance === "Resolved" && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Resolved after review.</strong> Resolution does not automatically imply aggregator acceptance or billing clearance.
              </span>
            </div>
          )}

          {/* Sub-navigation Tabs */}
          <div className="flex items-center gap-1 mt-4 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
            {(
              [
                { id: "details", label: "Details & Verification" },
                { id: "resolve", label: "Exception Resolution" },
                { id: "processing", label: "Aggregator & Billing" },
                { id: "audit", label: `Audit History (${visit.auditHistory.length})` },
              ] as { id: DrawerTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  activeTab === tab.id
                    ? "bg-brand-navy text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
          {/* TAB 1: DETAILS & VERIFICATION */}
          {activeTab === "details" && (
            <>
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brand-primary" />
                    Original EVV Event vs Current Visit Times
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Method: {visit.evvMethod}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <div className="text-[11px] font-bold uppercase text-slate-400">
                      Original Raw EVV Capture (Preserved)
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      In: {visit.originalEvv.clockIn ?? "None"} · Out:{" "}
                      {visit.originalEvv.clockOut ?? "None"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {visit.originalEvv.deviceOrPhoneRef ?? "No raw device event"}
                      {visit.originalEvv.gpsDistanceFt !== undefined &&
                        ` · ${visit.originalEvv.gpsDistanceFt} ft from anchor`}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <div className="text-[11px] font-bold uppercase text-slate-400">
                      Current / Confirmed Record
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      In: {visit.actualTime.start ?? "Missing"} · Out:{" "}
                      {visit.actualTime.end ?? "Missing"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Scheduled: {visit.scheduledTime.start} – {visit.scheduledTime.end} (±
                      {visit.ruleProfile.timeToleranceMinutes}m rule)
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Location & Associated Patient Phones */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-brand-primary" />
                    Service Location & Associated Patient Phones
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowLocationEditor((p) => !p)}
                    className="text-xs font-semibold text-brand-primary hover:underline cursor-pointer"
                  >
                    {showLocationEditor ? "Close Editor" : "Correct Location"}
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {visit.serviceLocation.addressLine1}
                    </div>
                    <div className="text-xs text-slate-500">
                      {visit.serviceLocation.cityStateZip} ·{" "}
                      <span className="font-semibold text-slate-700">
                        {visit.serviceLocation.locationType}
                      </span>
                    </div>
                  </div>
                  {visit.gpsDistanceFt !== undefined && (
                    <span
                      className={clsx(
                        "px-2.5 py-1 rounded-full text-xs font-bold border self-start sm:self-center",
                        visit.gpsDistanceFt <= visit.ruleProfile.geofenceRadiusFt
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      )}
                    >
                      {visit.gpsDistanceFt} ft (limit {visit.ruleProfile.geofenceRadiusFt} ft)
                    </span>
                  )}
                </div>

                {showLocationEditor && (
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
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={editCityStateZip}
                        onChange={(e) => setEditCityStateZip(e.target.value)}
                        placeholder="City, State ZIP"
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
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
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      >
                        <option value="Patient Home">Patient Home</option>
                        <option value="Family Residence">Family Residence</option>
                        <option value="Community">Community</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleSaveLocationCorrection}
                        className="px-3.5 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 cursor-pointer"
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
                    <button
                      type="button"
                      onClick={() => setShowAddPhone((p) => !p)}
                      className="text-xs font-semibold text-brand-primary flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Associate Phone
                    </button>
                  </div>

                  {visit.serviceLocation.associatedPhones.map((ph) => {
                    const revealed = revealedPhoneIds.includes(ph.id);
                    return (
                      <div
                        key={ph.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{ph.label}</span>
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {ph.type}
                          </span>
                          {ph.isVerifiedForIVR ? (
                            <span className="ml-1.5 text-[10px] font-semibold text-emerald-700">
                              · IVR Verified
                            </span>
                          ) : (
                            <span className="ml-1.5 text-[10px] font-semibold text-amber-700">
                              · Unlinked
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-700">
                            {revealed ? ph.number : maskPhoneNumber(ph.number)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRevealPhone(ph)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                            title={revealed ? "Hide number" : "Reveal number (logged to audit)"}
                          >
                            {revealed ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {showAddPhone && (
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
                          <option value="Authorized Family">Authorized Family</option>
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

              {/* Patient Verification & Configurable Rule Profile */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-brand-primary" />
                    Verification Evidence & Payer Rule Profile
                  </h3>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {visit.ruleProfile.state} · {visit.ruleProfile.payer}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileSignature className="w-3.5 h-3.5 text-slate-500" />
                        Patient Signature
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Rule: {visit.ruleProfile.signatureRequirement}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900">
                      Status: {visit.verification.signatureStatus}
                    </div>
                    {visit.verification.signatureCapturedAt && (
                      <div className="text-[11px] text-slate-500">
                        Captured at {visit.verification.signatureCapturedAt}
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-slate-500" />
                        Patient Voice / IVR
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Rule: {visit.ruleProfile.voiceRequirement}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900">
                      Status: {visit.verification.voiceStatus}
                      {visit.verification.voiceMatchScore
                        ? ` (${visit.verification.voiceMatchScore}% voice match)`
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
            </>
          )}

          {/* TAB 2: EXCEPTION RESOLUTION */}
          {activeTab === "resolve" && (
            <form onSubmit={handleSaveResolution} className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    {getRecommendedWorkflowTitle(visit.exceptionCategory)}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-amber-800 border border-amber-200">
                    {visit.exceptionCategory === "None"
                      ? "No Exception"
                      : visit.exceptionCategory}
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {visit.exceptionDetail}. Follow the 5-step resolution workflow below to document reason/resolution codes and update the immutable audit history.
                </p>
              </div>

              {visit.exceptionCategory === "Location Mismatch" && (
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-brand-primary" />
                      Location Variance Details ({visit.gpsDistanceFt} ft from registered address)
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLocationEditor((p) => !p)}
                      className="text-xs font-semibold text-brand-primary hover:underline cursor-pointer"
                    >
                      {showLocationEditor ? "Cancel Edit" : "Correct Service Location"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="text-slate-400 font-semibold">Registered Address</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {visit.serviceLocation.addressLine1}
                      </div>
                      <div className="text-slate-500">
                        {visit.serviceLocation.cityStateZip}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="text-slate-400 font-semibold">Capture Evidence</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {visit.evvMethod} · {visit.gpsDistanceFt} ft variance
                      </div>
                      <div className="text-slate-500">
                        Signature: {visit.verification.signatureStatus}
                      </div>
                    </div>
                  </div>

                  {showLocationEditor && (
                    <div className="p-3 rounded-xl bg-white border border-indigo-200 space-y-2.5">
                      <div className="text-xs font-bold text-slate-800">
                        Update Client Service Address / Geofence Anchor
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          value={editCityStateZip}
                          onChange={(e) => setEditCityStateZip(e.target.value)}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <select
                          value={editLocationType}
                          onChange={(e) =>
                            setEditLocationType(
                              e.target.value as ServiceLocation["locationType"]
                            )
                          }
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Patient Home">Patient Home</option>
                          <option value="Family Residence">Family Residence</option>
                          <option value="Community">Community</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleSaveLocationCorrection}
                          className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold cursor-pointer"
                        >
                          Apply Location Correction
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(visit.exceptionCategory === "Missed In" ||
                visit.exceptionCategory === "Missed Out" ||
                visit.exceptionCategory === "Missed Call") && (
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brand-primary" />
                    {visit.exceptionCategory === "Missed In"
                      ? "Missed Clock-In Recovery (Preserves original missing clock-in)"
                      : visit.exceptionCategory === "Missed Out"
                        ? "Missed Clock-Out Recovery (Preserves original open punch)"
                        : "Missed Call Manual Timesheet Confirmation"}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(visit.exceptionCategory === "Missed In" ||
                      visit.exceptionCategory === "Missed Call") && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Verified Clock-In Time *
                        </label>
                        <input
                          type="text"
                          value={correctedIn}
                          onChange={(e) => setCorrectedIn(e.target.value)}
                          placeholder="e.g. 08:30 AM"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                          required
                        />
                      </div>
                    )}
                    {(visit.exceptionCategory === "Missed Out" ||
                      visit.exceptionCategory === "Missed Call") && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Verified Clock-Out Time *
                        </label>
                        <input
                          type="text"
                          value={correctedOut}
                          onChange={(e) => setCorrectedOut(e.target.value)}
                          placeholder="e.g. 12:30 PM"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(visit.exceptionCategory === "Missed Call" ||
                visit.exceptionCategory === "Verification Missing" ||
                visit.evvMethod === "IVR") && (
                <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <PhoneCall className="w-4 h-4 text-purple-600" />
                      Alternate IVR & Patient Voice Verification
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-purple-700 border border-purple-200">
                      Voice: {visit.verification.voiceStatus}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <select
                      value={ivrSelectedPhoneId}
                      onChange={(e) => setIvrSelectedPhoneId(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      {visit.serviceLocation.associatedPhones.map((ph) => (
                        <option key={ph.id} value={ph.id}>
                          {ph.label} — {maskPhoneNumber(ph.number)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleTriggerIVRVoiceVerify}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      Capture IVR Voice Verification
                    </button>
                  </div>

                  {visit.verification.voiceStatus === "Captured" && (
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-purple-200 text-xs">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-purple-600" />
                        <span>
                          Patient voice attestation verified ({visit.verification.voiceDurationSec ?? 12}s ·{" "}
                          {visit.verification.voiceMatchScore ?? 95}% match)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVoicePlaying((p) => !p)}
                        className="text-purple-700 font-bold hover:underline cursor-pointer"
                      >
                        {voicePlaying ? "Playing..." : "Play Clip"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 5-STEP RESOLUTION WORKFLOW */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  5-Step Resolution Workflow
                </h3>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      1. Acknowledge Exception
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Confirm review ownership before selecting codes.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAcknowledge}
                    className={clsx(
                      "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                      acknowledged
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    )}
                  >
                    {acknowledged ? "✓ Acknowledged" : "Acknowledge"}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    2. Select Reason Code *
                  </label>
                  <select
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  >
                    <option value="">Select state/payer reason code...</option>
                    {prioritizedReasons.length > 0 && (
                      <optgroup label="Recommended for this issue">
                        {prioritizedReasons.map((rc) => (
                          <option key={rc.code} value={rc.code}>
                            {rc.code} — {rc.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Other State Reason Codes">
                      {otherReasons.map((rc) => (
                        <option key={rc.code} value={rc.code}>
                          {rc.code} — {rc.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    3. Select Resolution Code *
                  </label>
                  <select
                    value={resolutionCode}
                    onChange={(e) => setResolutionCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  >
                    <option value="">Select resolution code...</option>
                    {prioritizedResolutions.length > 0 && (
                      <optgroup label="Recommended Resolutions">
                        {prioritizedResolutions.map((rc) => (
                          <option key={rc.code} value={rc.code}>
                            {rc.code} — {rc.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Other Resolution Actions">
                      {otherResolutions.map((rc) => (
                        <option key={rc.code} value={rc.code}>
                          {rc.code} — {rc.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      4. Add Supporting Notes *
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      required
                      placeholder="Document clinical/operational justification (e.g. Verified caregiver arrived at client apartment rear entrance; patient signature captured)..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
                    />
                  </div>

                  {isManualOrMissingPunch && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <FileCheck2 className="w-4 h-4 text-emerald-700" />
                          Documentation Attestation Required
                        </span>
                        <input
                          type="text"
                          value={attestationRef}
                          onChange={(e) => setAttestationRef(e.target.value)}
                          placeholder="Timesheet Ref ID"
                          className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-[11px] font-mono w-36"
                        />
                      </div>
                      <label className="flex items-start gap-2 text-xs text-emerald-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={attestationChecked}
                          onChange={(e) => setAttestationChecked(e.target.checked)}
                          required
                          className="mt-0.5 w-4 h-4 rounded border-emerald-400 text-emerald-600"
                        />
                        <span>
                          I attest that signed timesheet or client confirmation documentation has been verified for this manually confirmed visit.
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500">
                    5. Saves <strong>Resolved after review</strong> & appends immutable audit record.
                  </span>
                  <button
                    type="submit"
                    disabled={
                      !acknowledged ||
                      !reasonCode ||
                      !resolutionCode ||
                      !notes.trim() ||
                      (isManualOrMissingPunch && !attestationChecked)
                    }
                    className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
                  >
                    Save Resolution & Update Audit
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: PROCESSING & READINESS */}
          {activeTab === "processing" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <strong>Independent Processing Controls:</strong> EVV compliance resolution, state aggregator acceptance, billing clearance, and caregiver payroll approval operate independently so holds never leak into claims or block justified payroll unintentionally.
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-brand-primary" />
                    <span className="text-sm font-bold text-slate-900">
                      Aggregator Submission ({visit.ruleProfile.aggregator})
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                    {visit.processing.aggregator}
                  </span>
                </div>
                {visit.processing.aggregatorRejectReason && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                    <strong>Rejection Reason:</strong> {visit.processing.aggregatorRejectReason}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={visit.evvCompliance === "Exception"}
                    onClick={() =>
                      updateProcessingStatus(
                        "aggregator",
                        "Submitted",
                        `Submitted ${visit.id} to ${visit.ruleProfile.aggregator}.`
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Submit to Aggregator
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateProcessingStatus(
                        "aggregator",
                        "Accepted",
                        `Marked ${visit.id} as Accepted by ${visit.ruleProfile.aggregator}.`
                      )
                    }
                    className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold cursor-pointer"
                  >
                    Simulate Acceptance
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-brand-primary" />
                    <span className="text-sm font-bold text-slate-900">
                      Billing Clearance (${visit.estimatedBillingAmount.toFixed(2)})
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                    {visit.processing.billing}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      visit.evvCompliance === "Exception" ||
                      visit.visitStatus !== "Completed"
                    }
                    onClick={() =>
                      updateProcessingStatus(
                        "billing",
                        "Cleared",
                        `Cleared ${visit.id} for 837 claim generation.`
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Clear for Billing
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateProcessingStatus(
                        "billing",
                        "Hold",
                        `Placed billing hold on ${visit.id}.`
                      )
                    }
                    className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold cursor-pointer"
                  >
                    Place Billing Hold
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-brand-primary" />
                    <span className="text-sm font-bold text-slate-900">
                      Payroll Approval
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                    {visit.processing.payroll}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={visit.visitStatus !== "Completed"}
                    onClick={() =>
                      updateProcessingStatus(
                        "payroll",
                        "Approved",
                        `Approved caregiver payroll for ${visit.id}.`
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-brand-navy text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Approve Payroll
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateProcessingStatus(
                        "payroll",
                        "Hold",
                        `Placed payroll hold on ${visit.id}.`
                      )
                    }
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Hold Payroll
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT HISTORY */}
          {activeTab === "audit" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-brand-primary" />
                  Immutable EVV & Compliance Audit Trail
                </h3>
                <span className="text-[11px] text-slate-400">UTC Timestamps</span>
              </div>

              <div className="space-y-2.5">
                {visit.auditHistory.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                        {ev.actionType}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {ev.timestamp.replace("T", " ").slice(0, 19)} UTC
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed">{ev.summary}</p>
                    {(ev.reasonCode || ev.resolutionCode || ev.previousValue) && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 rounded-lg p-2 space-y-0.5">
                        {ev.reasonCode && <div>Reason Code: {ev.reasonCode}</div>}
                        {ev.resolutionCode && (
                          <div>Resolution Code: {ev.resolutionCode}</div>
                        )}
                        {ev.previousValue && (
                          <div>
                            Change: {ev.previousValue} → <strong>{ev.newValue}</strong>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {ev.actorName} ({ev.actorRole})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
