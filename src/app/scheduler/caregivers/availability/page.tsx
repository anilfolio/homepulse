"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Search,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  ArrowUpDown,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export default function CaregiverAvailabilityPage() {
  const { state } = useAgencyStore();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "status" | "hours" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: "name" | "status" | "hours") => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const filteredCaregivers = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = state.caregivers.filter(
      (cg) =>
        !q ||
        cg.name.toLowerCase().includes(q) ||
        cg.roleTitle.toLowerCase().includes(q) ||
        cg.skills.some((s) => s.toLowerCase().includes(q))
    );

    if (!sortBy) return list;

    return [...list].sort((a, b) => {
      if (sortBy === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortBy === "status") {
        const aVal = a.complianceValid ? 1 : 0;
        const bVal = b.complianceValid ? 1 : 0;
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === "asc"
        ? a.weeklyHoursScheduled - b.weeklyHoursScheduled
        : b.weeklyHoursScheduled - a.weeklyHoursScheduled;
    });
  }, [state.caregivers, search, sortBy, sortDirection]);

  const activeCount = state.caregivers.filter((c) => c.complianceValid).length;
  const holdCount = state.caregivers.length - activeCount;
  const fatigueCount = state.caregivers.filter(
    (c) => c.weeklyHoursScheduled >= c.maxWeeklyHours * 0.9
  ).length;

  return (
    <div className="w-full animate-in fade-in duration-500 relative space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Caregiver Availability &amp; Overtime Matrix
          </h1>
          <p className="text-xs text-slate-500">
            Real-time weekly hour saturation, compliance standing, and fatigue protection.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search caregivers or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-full border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/20 w-full sm:w-64 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-800">Dispatch Eligible</div>
              <div className="text-xl font-semibold text-emerald-600">{activeCount}</div>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-800">Compliance Hold</div>
              <div className="text-xl font-semibold text-slate-600">{holdCount}</div>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-800">Active Shifts</div>
              <div className="text-xl font-semibold text-indigo-600">
                {state.visits.filter((v) => v.caregiverId && v.status !== "Completed").length}
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-800">Overtime / Fatigue Risk</div>
              <div className="text-xl font-semibold text-amber-600">{fatigueCount}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card noPadding className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-slate-800"
                    onClick={() => handleSort("name")}
                  >
                    Caregiver <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-slate-800"
                    onClick={() => handleSort("status")}
                  >
                    Compliance Standing <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Standard Availability</th>
                <th className="px-4 py-3">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-slate-800"
                    onClick={() => handleSort("hours")}
                  >
                    Weekly Hours <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCaregivers.map((cg) => {
                const percent = Math.min(
                  100,
                  Math.round((cg.weeklyHoursScheduled / Math.max(1, cg.maxWeeklyHours)) * 100)
                );

                return (
                  <tr key={cg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center font-bold text-xs">
                          {cg.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{cg.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {cg.roleTitle} • Cert exp: {cg.certExpiresInDays}d
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 w-max",
                          cg.complianceValid
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        <div
                          className={clsx(
                            "w-1.5 h-1.5 rounded-full",
                            cg.complianceValid ? "bg-emerald-500" : "bg-amber-500"
                          )}
                        />
                        {cg.complianceValid ? "Dispatch Eligible" : "Compliance Hold"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {["M", "T", "W", "Th", "F"].map((day) => (
                          <span
                            key={day}
                            className="w-6 h-6 rounded-md bg-brand-teal/10 text-brand-teal flex items-center justify-center text-[10px] font-bold border border-brand-teal/20"
                          >
                            {day}
                          </span>
                        ))}
                        {["S", "Su"].map((day) => (
                          <span
                            key={day}
                            className="w-6 h-6 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold border border-slate-200"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[100px]">
                          <div
                            className={clsx(
                              "h-1.5 rounded-full",
                              percent >= 90 ? "bg-amber-500" : "bg-brand-teal"
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                          {cg.weeklyHoursScheduled} / {cg.maxWeeklyHours}h
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href="/scheduler"
                        className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5" /> Dispatch Board
                      </Link>
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
