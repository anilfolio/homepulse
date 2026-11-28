"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LayoutGrid, List, Star, Phone } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Card, cn } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export default function SchedulerCaregiversPage() {
  const router = useRouter();
  const { state } = useAgencyStore();
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const caregiversList = useMemo(() => {
    return state.caregivers
      .map((cg) => {
        const assignedCount = state.visits.filter(
          (v) => v.caregiverId === cg.id && v.status !== "Completed"
        ).length;
        const status = cg.complianceValid ? "Active" : "Hold";
        return {
          ...cg,
          assignedCount,
          status,
        };
      })
      .filter((cg) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          cg.name.toLowerCase().includes(q) ||
          cg.roleTitle.toLowerCase().includes(q) ||
          cg.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesSearch) return false;
        if (statusFilter === "All") return true;
        return cg.status === statusFilter;
      });
  }, [state.caregivers, state.visits, searchQuery, statusFilter]);

  return (
    <div className="w-full mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Caregiver Dispatch Roster</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              Live HR &amp; Shift Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {caregiversList.length} caregivers synchronized with HR onboarding &amp; Smart Dispatch.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search caregivers by name, role, or skills (Hoyer, Dementia)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Hold">Compliance Hold</option>
          </select>
        </div>

        <div className="flex items-center bg-white p-1 rounded-full border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-full transition-all cursor-pointer",
              viewMode === "grid"
                ? "bg-brand-teal/20 text-brand-teal"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "p-2 rounded-full transition-all cursor-pointer",
              viewMode === "table"
                ? "bg-brand-teal/20 text-brand-teal"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
          >
            {caregiversList.map((cg) => (
              <Card
                key={cg.id}
                onClick={() => router.push("/scheduler/caregivers/availability")}
                className="h-full bg-white rounded-2xl p-4 border border-slate-200 hover:border-brand-teal/60 transition-all flex flex-col cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={cg.avatarUrl}
                      alt={cg.name}
                      fallback={cg.name.substring(0, 2).toUpperCase()}
                      size="md"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900">{cg.name}</h3>
                      <p className="text-xs text-slate-500">{cg.roleTitle}</p>
                    </div>
                  </div>
                  <Badge variant={cg.complianceValid ? "success" : "warning"}>{cg.status}</Badge>
                </div>

                <div className="space-y-2.5 my-3 flex-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Rating</span>
                    <div className="flex items-center gap-1 font-semibold text-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {cg.rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Weekly Hours</span>
                    <span className="font-semibold text-slate-800">
                      {cg.weeklyHoursScheduled} / {cg.maxWeeklyHours}h ({cg.assignedCount} active)
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                    {cg.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-brand-teal font-medium">
                    <Phone className="w-3 h-3" /> {cg.distanceMiles.toFixed(1)} mi radius
                  </span>
                  <span className="font-semibold text-slate-700">${cg.hourlyRate}/hr</span>
                </div>
              </Card>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Caregiver</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Skills &amp; Credentials</th>
                    <th className="px-4 py-3">Weekly Hours</th>
                    <th className="px-4 py-3 text-right">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {caregiversList.map((cg) => (
                    <tr key={cg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={cg.avatarUrl}
                            alt={cg.name}
                            fallback={cg.name.substring(0, 2).toUpperCase()}
                            size="sm"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{cg.name}</div>
                            <div className="text-[11px] text-slate-500">{cg.roleTitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={cg.complianceValid ? "success" : "warning"}>
                          {cg.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {cg.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {cg.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {cg.weeklyHoursScheduled} / {cg.maxWeeklyHours}h ({cg.assignedCount} shift)
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href="/scheduler/caregivers/availability"
                          className="text-brand-teal font-semibold hover:underline"
                        >
                          View Matrix &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
