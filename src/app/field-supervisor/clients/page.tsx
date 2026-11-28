"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, UserCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export default function FieldClientsPage() {
  const router = useRouter();
  const { state, getCaregiverById } = useAgencyStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return state.clients.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.cityStateZip.toLowerCase().includes(q) ||
        c.payer.toLowerCase().includes(q)
    );
  }, [state.clients, searchQuery]);

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Field Client Roster</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live clients synced with active caregiver schedules, fall risk monitoring, and 360 care charts.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients or payer..."
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal w-full sm:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const latestVisit = state.visits.find(
            (v) => v.clientId === client.id && v.caregiverId !== null
          );
          const primaryCg = latestVisit ? getCaregiverById(latestVisit.caregiverId) : undefined;

          return (
            <Card
              key={client.id}
              className="p-4 shadow-sm border-slate-200 hover:shadow-md hover:border-brand-teal/40 transition-all cursor-pointer flex flex-col justify-between gap-3"
              onClick={() => router.push(`/patients/${client.id}`)}
            >
              <div className="flex items-start gap-4">
                <UserCircle className="w-10 h-10 text-brand-teal shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-base truncate">{client.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        client.fallRiskLevel === "High"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {client.fallRiskLevel} Risk
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" /> {client.address}, {client.cityStateZip}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                      Caregiver: {primaryCg?.name ?? "Awaiting Assignment"}
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                      {client.payer} • {client.authorizedUnitsRemaining}u left
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-teal">
                <span>Open 360 Client Chart</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
