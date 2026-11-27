"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { AlertTriangle, CheckCircle2, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export default function EVVExceptionsPage() {
  const { state, getClientById, getCaregiverById, resolveEvvException } = useAgencyStore();
  const exceptions = state.visits.filter((v) => v.evvCompliance === "Exception");

  const handleAttestAndClear = (visitId: string, evvId: string) => {
    resolveEvvException({
      visitId,
      reasonCode: "RC-04",
      notes: "Field Supervisor on-site attestation verified caregiver presence.",
      attestationRef: `FLD-SUP-${visitId.slice(-4)}`,
    });
    toast.success(`Cleared EVV exception ${evvId} & released billing hold.`);
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">EVV Exceptions &amp; Alerts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time field monitoring for late clock-ins, missed shifts, or GPS out-of-bounds.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 w-fit">
          {exceptions.length} Active Exception(s)
        </span>
      </div>

      <div className="space-y-4">
        {exceptions.length === 0 ? (
          <Card className="p-8 text-center border-emerald-200 bg-emerald-50/40">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800">All Field EVV Exceptions Cleared</p>
            <p className="text-xs text-slate-500 mt-1">Zero visits currently holding billing claims.</p>
          </Card>
        ) : (
          exceptions.map((visit) => {
            const client = getClientById(visit.clientId);
            const caregiver = getCaregiverById(visit.caregiverId);
            const isLocation = visit.exceptionCategory === "Location Mismatch";

            return (
              <Card
                key={visit.id}
                className={`p-4 shadow-sm ${
                  isLocation ? "border-amber-200 bg-amber-50/30" : "border-rose-200 bg-rose-50/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex gap-3">
                    <div
                      className={`mt-1 p-2 rounded-xl shrink-0 ${
                        isLocation ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {isLocation ? <MapPin className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {visit.exceptionCategory} ({visit.evvId})
                      </h3>
                      <div className="text-sm text-slate-700 mt-1">
                        <strong>Caregiver:</strong> {caregiver?.name ?? "Unassigned"} <br />
                        <strong>Client:</strong> {client?.name ?? visit.clientId}
                      </div>
                      <div
                        className={`text-xs font-semibold mt-2 flex items-center gap-1 ${
                          isLocation ? "text-amber-700" : "text-rose-700"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" /> {visit.exceptionDetail}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAttestAndClear(visit.id, visit.evvId)}
                    className="bg-brand-teal hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer shrink-0"
                  >
                    Attest &amp; Clear Exception
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
