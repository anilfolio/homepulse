"use client";

import React, { useState } from "react";
import {
  MapPin,
  Clock,
  AlertTriangle,
  PhoneCall,
  Mic,
  FileCheck2,
  Volume2,
  Check,
} from "lucide-react";
import clsx from "clsx";
import { EVVVisit, ServiceLocation } from "../../types";
import { REASON_CODES, RESOLUTION_CODES } from "../../mockData";
import {
  appendVisitAudit,
  applyLocationCorrection,
  computeMaxTimeVarianceMinutes,
  deriveVisitStatus,
  getRecommendedWorkflowTitle,
  maskPhoneNumber,
} from "../../evvRules";

interface ExceptionResolutionSectionProps {
  visit: EVVVisit;
  onUpdateVisit: (updated: EVVVisit, toastMessage?: string) => void;
  onResolutionSaved: () => void;
}

export function ExceptionResolutionSection({
  visit,
  onUpdateVisit,
  onResolutionSaved,
}: ExceptionResolutionSectionProps) {
  const [acknowledged, setAcknowledged] = useState(
    Boolean(visit.resolution?.acknowledged)
  );
  const [reasonCode, setReasonCode] = useState(
    visit.resolution?.reasonCode ?? ""
  );
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

  const [correctedIn, setCorrectedIn] = useState(
    visit.actualTime.start ?? visit.scheduledTime.start
  );
  const [correctedOut, setCorrectedOut] = useState(
    visit.actualTime.end ?? visit.scheduledTime.end
  );

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

  const [ivrSelectedPhoneId, setIvrSelectedPhoneId] = useState(
    visit.serviceLocation.associatedPhones[0]?.id ?? ""
  );
  const [voicePlaying, setVoicePlaying] = useState(false);

  const isManualOrMissingPunch =
    visit.exceptionCategory === "Missed In" ||
    visit.exceptionCategory === "Missed Out" ||
    visit.exceptionCategory === "Missed Call" ||
    visit.evvMethod === "Manual";

  const handleSaveLocationCorrection = () => {
    if (!editAddress.trim() || !editCityStateZip.trim()) return;
    const updated = applyLocationCorrection(
      visit,
      editAddress,
      editCityStateZip,
      editLocationType
    );
    onUpdateVisit(updated, "Service location updated and original GPS preserved.");
    setShowLocationEditor(false);
  };

  const handleTriggerIVRVoiceVerify = () => {
    const matchedPhone = visit.serviceLocation.associatedPhones.find(
      (p) => p.id === ivrSelectedPhoneId
    );
    const updated = appendVisitAudit(
      {
        ...visit,
        verification: {
          ...visit.verification,
          voiceStatus: "Captured",
          voiceDurationSec: 12,
          voiceMatchScore: 95,
          ivrCallerIdMatched: Boolean(matchedPhone?.isVerifiedForIVR),
        },
      },
      {
        actorName: "Admin Coordinator",
        actorRole: "ADMIN",
        actionType: "VOICE_VERIFIED",
        summary: `Alternate IVR & patient voice verification completed (95% match) via ${matchedPhone ? matchedPhone.label : "patient phone"}.`,
      }
    );
    onUpdateVisit(updated, "Alternate IVR & patient voice verification recorded.");
  };

  const handleAcknowledge = () => {
    if (acknowledged) return;
    setAcknowledged(true);
    const updated = appendVisitAudit(visit, {
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
      visit.exceptionCategory === "Missed In" ||
      visit.exceptionCategory === "Missed Call"
        ? correctedIn || visit.scheduledTime.start
        : visit.actualTime.start;
    const nextEnd =
      visit.exceptionCategory === "Missed Out" ||
      visit.exceptionCategory === "Missed Call"
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
    const updated = appendVisitAudit(
      {
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
          attestationConfirmed: isManualOrMissingPunch
            ? attestationChecked
            : undefined,
          attestationRef: isManualOrMissingPunch
            ? attestationRef.trim()
            : undefined,
          resolvedAt: nowIso,
          resolvedBy: "Admin Coordinator",
        },
      },
      {
        actorName: "Admin Coordinator",
        actorRole: "ADMIN",
        actionType: "RESOLUTION_SAVED",
        summary: `Saved exception resolution (${resObj?.label ?? resolutionCode}). Status set to Resolved after review; aggregator & billing remain independent.`,
        reasonCode,
        resolutionCode,
        previousValue: `In: ${visit.originalEvv.clockIn ?? "null"} / Out: ${visit.originalEvv.clockOut ?? "null"}`,
        newValue: `In: ${nextStart ?? "null"} / Out: ${nextEnd ?? "null"}`,
      }
    );

    onUpdateVisit(
      updated,
      "Resolution saved & audit history updated. Aggregator & billing clearance remain independent."
    );
    onResolutionSaved();
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

  const step4Ready =
    Boolean(notes.trim()) && (!isManualOrMissingPunch || attestationChecked);
  const canSubmitResolution =
    acknowledged && Boolean(reasonCode) && Boolean(resolutionCode) && step4Ready;

  return (
    <form onSubmit={handleSaveResolution} className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 space-y-1.5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            {getRecommendedWorkflowTitle(visit.exceptionCategory)}
          </span>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-amber-800 border border-amber-200">
            {visit.exceptionCategory === "None"
              ? "No Exception"
              : visit.exceptionCategory}
          </span>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          {visit.exceptionDetail}. Complete the 5-step workflow below to record
          reason/resolution codes and append to the immutable audit trail.
        </p>
      </div>

      {visit.exceptionCategory === "Location Mismatch" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-primary" />
              Location Variance ({visit.gpsDistanceFt} ft from registered
              address)
            </div>
            <button
              type="button"
              onClick={() => setShowLocationEditor((p) => !p)}
              className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
            >
              {showLocationEditor ? "Cancel Edit" : "Correct Service Location"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
              <div className="text-[10px] font-bold uppercase text-slate-400">
                Registered Address
              </div>
              <div className="font-bold text-slate-800 mt-1">
                {visit.serviceLocation.addressLine1}
              </div>
              <div className="text-slate-500">
                {visit.serviceLocation.cityStateZip}
              </div>
            </div>
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
              <div className="text-[10px] font-bold uppercase text-slate-400">
                Capture Evidence
              </div>
              <div className="font-bold text-slate-800 mt-1">
                {visit.evvMethod} · {visit.gpsDistanceFt} ft variance
              </div>
              <div className="text-slate-500">
                Patient signature: {visit.verification.signatureStatus}
              </div>
            </div>
          </div>

          {showLocationEditor && (
            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2.5">
              <div className="text-xs font-bold text-indigo-950">
                Update Client Service Address / Geofence Anchor
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  value={editCityStateZip}
                  onChange={(e) => setEditCityStateZip(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
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
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
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
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
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
        <div className="bg-white rounded-2xl border border-purple-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-purple-600" />
              Alternate IVR & Patient Voice Verification
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Voice: {visit.verification.voiceStatus}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <select
              value={ivrSelectedPhoneId}
              onChange={(e) => setIvrSelectedPhoneId(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
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
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Mic className="w-3.5 h-3.5" />
              Capture IVR Voice Verification
            </button>
          </div>

          {visit.verification.voiceStatus === "Captured" && (
            <div className="flex items-center justify-between bg-purple-50/50 px-3 py-2 rounded-xl border border-purple-200 text-xs">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-600" />
                <span>
                  Patient voice attestation verified (
                  {visit.verification.voiceDurationSec ?? 12}s ·{" "}
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

      {/* Visual 5-Step Resolution Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          5-Step Guided Resolution Workflow
        </h3>

        {/* Step 1 */}
        <div className="flex gap-3.5">
          <div
            className={clsx(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border",
              acknowledged
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-brand-navy text-white border-brand-navy"
            )}
          >
            {acknowledged ? <Check className="w-3.5 h-3.5" /> : "1"}
          </div>
          <div className="flex-1 flex items-center justify-between p-3 rounded-xl bg-slate-50/90 border border-slate-200/80">
            <div>
              <div className="text-xs font-bold text-slate-900">
                Acknowledge Exception
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
                  : "bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
              )}
            >
              {acknowledged ? "✓ Acknowledged" : "Acknowledge"}
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-3.5">
          <div
            className={clsx(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border",
              reasonCode
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-slate-100 text-slate-600 border-slate-300"
            )}
          >
            {reasonCode ? <Check className="w-3.5 h-3.5" /> : "2"}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Select Reason Code *
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
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
        </div>

        {/* Step 3 */}
        <div className="flex gap-3.5">
          <div
            className={clsx(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border",
              resolutionCode
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-slate-100 text-slate-600 border-slate-300"
            )}
          >
            {resolutionCode ? <Check className="w-3.5 h-3.5" /> : "3"}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Select Resolution Code *
            </label>
            <select
              value={resolutionCode}
              onChange={(e) => setResolutionCode(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
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
        </div>

        {/* Step 4 */}
        <div className="flex gap-3.5">
          <div
            className={clsx(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border",
              step4Ready
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-slate-100 text-slate-600 border-slate-300"
            )}
          >
            {step4Ready ? <Check className="w-3.5 h-3.5" /> : "4"}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Add Supporting Notes *
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                required
                placeholder="Document clinical/operational justification (e.g. Verified caregiver arrived at client apartment rear entrance; patient signature captured)..."
                className="w-full px-3 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/25 resize-none"
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
                    I attest that signed timesheet or client confirmation
                    documentation has been verified for this manually confirmed
                    visit.
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Step 5 */}
        <div className="flex gap-3.5 pt-2 border-t border-slate-100 items-center">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-slate-100 text-slate-600 border border-slate-300">
            5
          </div>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              Saves <strong>Resolved after review</strong> & appends immutable
              audit log.
            </span>
            <button
              type="submit"
              disabled={!canSubmitResolution}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C88FF] to-[#5371F3] hover:from-[#5A77FF] hover:to-[#4362E6] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-[#6C88FF]/25 transition-all cursor-pointer whitespace-nowrap"
            >
              Save Resolution & Update Audit
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
