"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export default function ClinicalVisitNotesPage() {
  const { state, getClientById, getCaregiverById, logAuditEvent } = useAgencyStore();
  const [acknowledgedIds, setAcknowledgedIds] = useState<Record<string, boolean>>({});

  const noteVisits = useMemo(
    () =>
      state.visits.filter(
        (v) =>
          Boolean(v.visitNotes) ||
          v.status === "Completed" ||
          v.status === "Incomplete"
      ),
    [state.visits]
  );

  const handleAcknowledge = (visitId: string, clientName: string) => {
    setAcknowledgedIds((prev) => ({ ...prev, [visitId]: true }));
    logAuditEvent({
      action: "UPDATE",
      resourceType: "Visit",
      resourceId: visitId,
      summary: `RN reviewed and co-signed caregiver point-of-care visit note for ${clientName}.`,
      status: "Success",
    });
    toast.success(`Visit note for ${clientName} acknowledged & logged`);
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visit Notes Review</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and co-sign live point-of-care observations submitted by caregivers after EVV clock-out.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {noteVisits.map((visit) => {
          const client = getClientById(visit.clientId);
          const caregiver = getCaregiverById(visit.caregiverId);
          const isAcked = Boolean(acknowledgedIds[visit.id]);

          return (
            <Card key={visit.id} className="p-4 shadow-sm border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">{client?.name ?? visit.clientId}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {visit.status}
                    </span>
                    {visit.evvCompliance === "Exception" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertTriangle className="w-3 h-3" /> {visit.exceptionCategory}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>Submitted by: {caregiver?.name ?? "Unassigned Caregiver"}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {visit.visitDateLabel} ({visit.scheduledStart} - {visit.scheduledEnd})
                    </span>
                  </p>
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 italic border border-slate-100">
                    &ldquo;{visit.visitNotes || "Routine care plan tasks completed; awaiting detailed narrative note."}&rdquo;
                  </div>
                </div>

                {isAcked ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap">
                    <CheckCircle className="w-3.5 h-3.5" /> Co-Signed
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAcknowledge(visit.id, client?.name ?? visit.clientId)}
                    className="bg-brand-teal text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-teal-600 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Acknowledge
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
