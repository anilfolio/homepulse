"use client";

import React, { useMemo, useState } from "react";
import { AlertCircle, Clock, Save, FileText, CheckCircle2, ChevronRight, CornerDownRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { mockStateConfigs } from "@/lib/mock-data/evv";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function VisitCorrectionQueue() {
  const searchParams = useSearchParams();
  const initialVisitId = searchParams.get("visitId");
  const { state, getClientById, getCaregiverById, resolveEvvException } = useAgencyStore();

  const exceptionVisits = useMemo(
    () => state.visits.filter((v) => v.evvCompliance === "Exception"),
    [state.visits]
  );

  const [selectedVisitId, setSelectedVisitId] = useState<string>(() => initialVisitId ?? "");
  const [reasonCode, setReasonCode] = useState("RC-02");
  const [resolutionNotes, setResolutionNotes] = useState(
    "Verified client care location with secondary GPS / IVR check and supervisor attestation."
  );

  const selectedVisit =
    exceptionVisits.find((v) => v.id === selectedVisitId) ||
    exceptionVisits[0];

  if (!selectedVisit) {
    return (
      <Card className="p-12 text-center flex flex-col items-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">All Caught Up!</h2>
        <p className="text-slate-500 mt-2">
          There are zero rejected or exception EVV submissions pending aggregator resubmission.
        </p>
      </Card>
    );
  }

  const client = getClientById(selectedVisit.clientId);
  const caregiver = getCaregiverById(selectedVisit.caregiverId);
  const stateConfig = mockStateConfigs[0];

  const handleSaveAndResubmit = () => {
    resolveEvvException({
      visitId: selectedVisit.id,
      reasonCode,
      notes: resolutionNotes,
      attestationRef: `EVV-MAINT-${selectedVisit.evvId}`,
    });
    toast.success(`EVV exception ${selectedVisit.evvId} resolved & resubmitted to aggregator!`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card noPadding className="lg:col-span-1 flex flex-col max-h-[700px]">
        <div className="px-5 py-4 border-b border-slate-100/50 bg-white/50 backdrop-blur-sm">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Action Required ({exceptionVisits.length})
          </h2>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {exceptionVisits.map((v) => {
            const c = getClientById(v.clientId);
            const cg = getCaregiverById(v.caregiverId);
            const isSelected = selectedVisit.id === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVisitId(v.id)}
                className={`w-full text-left p-3 rounded-xl transition-all border flex items-start gap-3 ${
                  isSelected
                    ? "bg-rose-50 border-rose-200 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-semibold text-sm truncate ${isSelected ? "text-rose-700" : "text-slate-900"}`}>
                      {c?.name ?? v.clientId}
                    </span>
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">{v.visitDateLabel}</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate mb-1">Caregiver: {cg?.name ?? "Unassigned"}</div>
                  <div className={`text-xs truncate font-medium ${isSelected ? "text-rose-600" : "text-rose-500"}`}>
                    {v.exceptionCategory}: {v.exceptionDetail}
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 mt-1 transition-transform ${isSelected ? "text-rose-400 translate-x-1" : "text-slate-300"}`} />
              </button>
            );
          })}
        </div>
      </Card>

      <Card noPadding className="lg:col-span-2 flex flex-col h-full min-h-[500px]">
        <div className="px-6 py-5 border-b border-slate-100/50 flex justify-between items-start bg-white/50 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">Exception</span>
              <span className="text-sm font-medium text-slate-500">{selectedVisit.evvId} ({selectedVisit.region})</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Visit {selectedVisit.id}</h2>
          </div>
          <button
            type="button"
            onClick={handleSaveAndResubmit}
            className="flex items-center gap-2 bg-brand-teal text-white font-medium px-4 py-2 rounded-xl hover:bg-brand-teal/90 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          >
            <CornerDownRight className="w-3.5 h-3.5" />
            Resolve &amp; Resubmit
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-rose-900 mb-1 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Exception Telemetry
            </h3>
            <p className="text-sm text-rose-700">
              {selectedVisit.exceptionDetail} • GPS variance: {selectedVisit.gpsDistanceMeters}m (Threshold {selectedVisit.geofenceThresholdMeters}m)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                <FileText className="w-4 h-4 text-slate-400" /> Visit Information
              </h3>
              <div>
                <div className="text-xs font-medium text-slate-500">Client</div>
                <div className="text-sm font-medium text-slate-900">{client?.name ?? selectedVisit.clientId}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Caregiver</div>
                <div className="text-sm font-medium text-slate-900">{caregiver?.name ?? "Unassigned"}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Service</div>
                <div className="text-sm font-medium text-slate-900">{client?.serviceName ?? "Personal Care"}</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Clock className="w-4 h-4 text-slate-400" /> Clock Timestamps
              </h3>
              <div>
                <div className="text-xs font-medium text-slate-500">Date of Service</div>
                <div className="text-sm font-medium text-slate-900">{selectedVisit.visitDate}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-medium text-slate-500">Clock In</div>
                  <div className="text-sm font-semibold text-slate-900">{selectedVisit.clockInTime || selectedVisit.scheduledStart}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Clock Out</div>
                  <div className="text-sm font-semibold text-slate-900">{selectedVisit.clockOutTime || selectedVisit.scheduledEnd}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-brand-teal/20 bg-brand-teal/5 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-brand-teal flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> State Mandated Exception Resolution
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason Code <span className="text-rose-500">*</span>
              </label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
              >
                {stateConfig?.reasonCodes.map((rc) => (
                  <option key={rc.code} value={rc.code}>
                    {rc.code} - {rc.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Resolution Notes <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100/50">
            <button
              type="button"
              onClick={handleSaveAndResubmit}
              className="flex items-center gap-2 bg-brand-teal text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-brand-teal/90 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
            >
              <Save className="w-4 h-4" />
              Save &amp; Resubmit to Aggregator
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
