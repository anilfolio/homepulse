"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Plus, MapPin, User, Repeat, Eye, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { INITIAL_AGENCY_VISITS } from "@/lib/store/agencySeedData";

export default function DispatchVisitsPage() {
  const { state, getClientById, getCaregiverById, autoAssignBestCaregiver } = useAgencyStore();

  const visits = useMemo(() => state.visits, [state.visits]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Unfilled":
      case "Call-Off":
        return "bg-red-100 text-red-700";
      case "Completed":
        return "bg-emerald-100 text-emerald-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Scheduled":
        return "bg-teal-100 text-teal-900";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Repeat className="w-5 h-5 text-brand-teal" />
            Dispatch &amp; Visits
          </h1>
          <p className="text-xs text-slate-500">
            Live visit execution roster connected to Caregiver EVV, Smart Dispatch, and Pre-Billing Scrub.
          </p>
        </div>
        <Link
          href="/scheduler/dispatch/visits/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-brand-teal hover:bg-teal-600 text-white font-semibold text-sm shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Manual Visit</span>
        </Link>
      </div>

      <Card noPadding className="bg-white rounded-xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Time &amp; EVV ID</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Caregiver</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {visits.map((visit) => {
                const client = getClientById(visit.clientId);
                const caregiver = getCaregiverById(visit.caregiverId);
                const isStaticEvv = INITIAL_AGENCY_VISITS.some((v) => v.evvId === visit.evvId);

                return (
                  <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {visit.scheduledStart} – {visit.scheduledEnd}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{visit.evvId}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                          {(client?.name ?? "C").charAt(0)}
                        </div>
                        <span>{client?.name ?? "Assigned Client"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {caregiver ? (
                        <span className="font-medium text-slate-800">{caregiver.name}</span>
                      ) : (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <User className="w-3 h-3" /> Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "px-2.5 py-1 rounded-full text-[11px] font-bold",
                          getStatusColor(visit.status)
                        )}
                      >
                        {visit.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {visit.region}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!caregiver && (
                          <button
                            type="button"
                            onClick={() => {
                              const ok = autoAssignBestCaregiver(visit.id);
                              if (ok) {
                                toast.success(`Auto-assigned top matched caregiver to ${client?.name}.`);
                              } else {
                                toast.error("No compliant caregiver available.");
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#141D3C] text-[#57EAB6] px-2.5 py-1.5 rounded-lg cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" /> Auto-Assign
                          </button>
                        )}
                        <Link
                          href={isStaticEvv ? `/evv-monitoring/${visit.evvId}` : `/evv-monitoring`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 px-2.5 py-1.5 rounded-lg"
                        >
                          <Eye className="w-3 h-3" /> EVV Audit
                        </Link>
                      </div>
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
