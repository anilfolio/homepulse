"use client";

import React from "react";
import { Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

const VISIT_TYPE_LABELS: Record<string, string> = {
  initial_30: "30-Day Initial",
  periodic_60: "60-Day Periodic",
  annual_unannounced: "Annual Unannounced",
  post_incident: "Post-Incident Audit",
};

export default function SupervisoryVisitsPage() {
  const { state, completeSupervisoryVisit } = useAgencyStore();

  const handleComplete = (id: string, assignedRn: string, clientName: string) => {
    completeSupervisoryVisit(id);
    toast.success(`Supervisory visit completed by ${assignedRn} for ${clientName}`);
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supervisory Visits Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live state-mandated 60/90-day RN supervisory visits synced with QA Compliance & Survey Readiness.
          </p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Assigned RN / Supervisor</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Cycle / Requirement</th>
                <th className="px-4 py-3">Due Date &amp; Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {state.supervisoryVisits.map((visit) => {
                const isCompleted = visit.status === "completed";
                const isOverdue = visit.status === "overdue";
                return (
                  <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{visit.assignedRn}</td>
                    <td className="px-4 py-3 text-slate-700">{visit.clientName}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {VISIT_TYPE_LABELS[visit.visitType] ?? visit.visitType}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{visit.dueDate}</div>
                      <div className="text-xs text-slate-400">{visit.location}</div>
                    </td>
                    <td className="px-4 py-3">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold uppercase">
                          <AlertCircle className="w-3.5 h-3.5" /> Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold uppercase">
                          <Calendar className="w-3.5 h-3.5" /> Scheduled / Due
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isCompleted ? (
                        <span className="text-xs text-emerald-600 font-semibold">Signed Off</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleComplete(visit.id, visit.assignedRn, visit.clientName)
                          }
                          className="px-3 py-1.5 rounded-lg bg-brand-teal text-white text-xs font-semibold hover:bg-teal-600 transition-colors"
                        >
                          Complete & Sign
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
