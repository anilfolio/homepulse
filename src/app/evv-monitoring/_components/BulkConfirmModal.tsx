"use client";

import React, { useState } from "react";
import { ShieldCheck, FileCheck2, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { EVVVisit } from "../types";
import { REASON_CODES } from "../mockData";

interface BulkConfirmModalProps {
  isOpen: boolean;
  selectedVisits: EVVVisit[];
  onClose: () => void;
  onConfirm: (payload: {
    visitIds: string[];
    reasonCode: string;
    attestationRef: string;
    notes: string;
    useScheduledTimes: boolean;
  }) => void;
}

export function BulkConfirmModal({
  isOpen,
  selectedVisits,
  onClose,
  onConfirm,
}: BulkConfirmModalProps) {
  const [reasonCode, setReasonCode] = useState("RC-03");
  const [attestationRef, setAttestationRef] = useState("TS-BATCH-2026-11");
  const [notes, setNotes] = useState("");
  const [useScheduledTimes, setUseScheduledTimes] = useState(true);
  const [attested, setAttested] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attested || !reasonCode || !notes.trim()) return;
    onConfirm({
      visitIds: selectedVisits.map((v) => v.id),
      reasonCode,
      attestationRef: attestationRef.trim() || "TS-BATCH-REF",
      notes: notes.trim(),
      useScheduledTimes,
    });
    setNotes("");
    setAttested(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bulk Visit Confirmation (${selectedVisits.length} Visits)`}
      description="Manual timesheet confirmation and exception resolution with mandatory documentation attestation."
      maxWidth="xl"
      icon={
        <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            Original EVV capture events (including missing punches) will be preserved in the immutable audit log. Bulk confirmation marks compliance as{" "}
            <strong>Resolved after review</strong>; aggregator acceptance and billing clearance remain independent.
          </div>
        </div>

        <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
          {selectedVisits.map((v) => (
            <div
              key={v.id}
              className="px-3 py-2 flex items-center justify-between text-xs bg-slate-50/40"
            >
              <div>
                <span className="font-mono font-bold text-slate-900 mr-2">{v.id}</span>
                <span className="font-medium text-slate-700">
                  {v.caregiver.name} → {v.client.name}
                </span>
              </div>
              <span className="text-slate-500">
                {v.scheduledTime.start} – {v.scheduledTime.end}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              State Reason Code *
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              required
            >
              {REASON_CODES.map((rc) => (
                <option key={rc.code} value={rc.code}>
                  {rc.code} — {rc.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Timesheet / Documentation Ref ID *
            </label>
            <input
              type="text"
              value={attestationRef}
              onChange={(e) => setAttestationRef(e.target.value)}
              placeholder="e.g. TS-2026-1125"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              required
            />
          </div>
        </div>

        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer">
          <input
            type="checkbox"
            checked={useScheduledTimes}
            onChange={(e) => setUseScheduledTimes(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
          />
          <span className="text-xs text-slate-700">
            <strong>Confirm missing clock-in/out using verified scheduled hours</strong> for visits lacking raw EVV punches (original null/open punches remain preserved).
          </span>
        </label>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Supporting Review Notes *
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Describe verification evidence (signed paper timesheets, client callback, supervisor confirmation)..."
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
            required
          />
        </div>

        <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 cursor-pointer">
          <input
            type="checkbox"
            checked={attested}
            onChange={(e) => setAttested(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
            required
          />
          <div className="text-xs text-emerald-950">
            <div className="font-bold flex items-center gap-1.5 mb-0.5">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
              Documentation Attestation (Required for Manual Confirmation)
            </div>
            I attest that signed caregiver/patient documentation supporting these manually confirmed visits has been verified and archived for payer and state audit readiness.
          </div>
        </label>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!attested || !notes.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C88FF] to-[#5371F3] hover:from-[#5A77FF] hover:to-[#4362E6] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md shadow-[#6C88FF]/25 cursor-pointer transition-all"
          >
            Confirm & Save Audit Trail
          </button>
        </div>
      </form>
    </Modal>
  );
}
