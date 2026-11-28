"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Search, MapPin, ShieldAlert, ArrowUpDown } from "lucide-react";
import { PatientDetailsDrawer } from "@/components/scheduler/PatientDetailsDrawer";
import { SchedulerPatient } from "@/types/scheduler";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export default function PatientsListPage() {
  const { state } = useAgencyStore();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Admitted">("All");
  const [sortColumn, setSortColumn] = useState<"name" | "hours" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedPatient, setSelectedPatient] = useState<SchedulerPatient | null>(null);

  const livePatients = useMemo<SchedulerPatient[]>(() => {
    const cgMap = new Map(state.caregivers.map((c) => [c.id, c]));
    return state.clients.map((client) => {
      const clientVisits = state.visits.filter((v) => v.clientId === client.id);
      const scheduledHours = clientVisits.reduce((sum, v) => sum + v.scheduledHours, 0);
      const assignedCgNames = Array.from(
        new Set(
          clientVisits
            .map((v) => (v.caregiverId ? cgMap.get(v.caregiverId)?.name : undefined))
            .filter(Boolean) as string[]
        )
      );

      return {
        id: client.id,
        name: client.name,
        address: `${client.address}, ${client.cityStateZip}`,
        accessInstructions: `Auth ${client.authNumber} • Contact ${client.phone}`,
        requiredSkills: [client.serviceName, client.serviceCode],
        authorizedHours: Math.round(client.authorizedUnitsTotal / 4),
        scheduledHours,
        primaryCaregiver:
          assignedCgNames.length > 1
            ? "Multiple"
            : assignedCgNames[0] ?? null,
        riskFlags:
          client.fallRiskLevel === "High"
            ? ["High Fall Risk"]
            : client.fallRiskLevel === "Medium"
            ? ["Moderate Fall Risk"]
            : [],
        status: "Admitted",
      };
    });
  }, [state.clients, state.visits, state.caregivers]);

  const handleSort = (column: "name" | "hours") => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const processedPatients = useMemo(() => {
    const filtered = livePatients.filter(
      (p) =>
        (filterType === "All" || p.status === filterType) &&
        (p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.address.toLowerCase().includes(search.toLowerCase()))
    );

    if (!sortColumn) return filtered;

    return [...filtered].sort((a, b) => {
      if (sortColumn === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      const ratioA = a.authorizedHours > 0 ? a.scheduledHours / a.authorizedHours : 0;
      const ratioB = b.authorizedHours > 0 ? b.scheduledHours / b.authorizedHours : 0;
      return sortDirection === "asc" ? ratioA - ratioB : ratioB - ratioA;
    });
  }, [livePatients, filterType, search, sortColumn, sortDirection]);

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Patient Census (Scheduler View)
          </h1>
          <p className="text-xs text-slate-500">
            Live scheduling logistics from Agency Store ({livePatients.length} admitted clients).
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 w-full sm:w-64 bg-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 border-b border-slate-200">
        {(["All", "Admitted"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilterType(tab)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              filterType === tab
                ? "border-brand-teal text-brand-teal"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "All" ? "All Patients" : "Admitted Census"}
          </button>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-900">Privacy &amp; PoLP Scope Active</h4>
          <p className="text-xs text-amber-800 mt-1">
            Displays scheduling logistics (location, required service skills, and authorized hours) while masking full clinical MAR narratives.
          </p>
        </div>
      </div>

      <Card noPadding className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-slate-800 select-none"
                    onClick={() => handleSort("name")}
                  >
                    Patient <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Logistics &amp; Access</th>
                <th className="px-4 py-3">Care Requirements</th>
                <th className="px-4 py-3">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-slate-800 select-none"
                    onClick={() => handleSort("hours")}
                  >
                    Hours Sched / Auth <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Primary Caregiver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {processedPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-slate-900 text-sm">{patient.name}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-700">
                      {patient.status}
                    </span>
                    {patient.riskFlags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {patient.riskFlags.map((flag) => (
                          <span
                            key={flag}
                            className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-semibold border border-red-100"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top max-w-[280px]">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-600">{patient.address}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {patient.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-slate-800">
                    {patient.scheduledHours}h / {patient.authorizedHours}h
                  </td>
                  <td className="px-4 py-3 align-top font-medium text-slate-800">
                    {patient.primaryCaregiver || (
                      <span className="text-amber-600 font-semibold">Needs Assignment</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <PatientDetailsDrawer
        isOpen={Boolean(selectedPatient)}
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
}
