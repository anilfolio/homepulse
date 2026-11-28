"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  Plus,
  Repeat,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Search,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { CreatePatternModal } from "@/components/scheduling/CreatePatternModal";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

interface RecurringPattern {
  id: string;
  clientId: string;
  caregiverId: string | null;
  patientName: string;
  rule: string;
  duration: string;
  status: "Active" | "Paused" | "Expired";
  primaryCaregiver: string;
  autoBroadcast: boolean;
  upcomingGeneratedCount: number;
  fatigueRisk?: boolean;
}

export default function RecurringPatternsPage() {
  const { state, createShift, autoAssignBestCaregiver } = useAgencyStore();
  const [pausedIds, setPausedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingPattern, setEditingPattern] = useState<RecurringPattern | null>(null);

  const patterns = useMemo<RecurringPattern[]>(() => {
    const cgMap = new Map(state.caregivers.map((c) => [c.id, c]));
    return state.clients.map((client, idx) => {
      const firstVisit = state.visits.find((v) => v.clientId === client.id);
      const cg = firstVisit?.caregiverId ? cgMap.get(firstVisit.caregiverId) : undefined;
      const id = `rp-${client.id}`;
      return {
        id,
        clientId: client.id,
        caregiverId: cg?.id ?? null,
        patientName: client.name,
        rule: `${idx % 2 === 0 ? "Mon / Wed / Fri" : "Tue / Thu"} • ${
          firstVisit?.scheduledStart ?? "09:00 AM"
        } - ${firstVisit?.scheduledEnd ?? "01:00 PM"}`,
        duration: `Auth expires in ${client.authExpiresInDays}d`,
        status: pausedIds.has(id) ? "Paused" : "Active",
        primaryCaregiver: cg?.name ?? "Auto-Match Pool",
        autoBroadcast: true,
        upcomingGeneratedCount: state.visits.filter((v) => v.clientId === client.id).length * 2,
        fatigueRisk: cg ? cg.weeklyHoursScheduled >= cg.maxWeeklyHours * 0.9 : false,
      };
    });
  }, [state.clients, state.visits, state.caregivers, pausedIds]);

  const togglePause = (id: string) => {
    setPausedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerateSlot = (pattern: RecurringPattern) => {
    const created = createShift({
      clientId: pattern.clientId,
      caregiverId: pattern.caregiverId,
      scheduledStart: "09:00 AM",
      scheduledEnd: "01:00 PM",
      scheduledHours: 4,
      requiredSkills: ["CNA", "Personal Care"],
      region: "Springfield North",
    });
    if (created && !pattern.caregiverId) {
      autoAssignBestCaregiver(created.id);
    }
    toast.success(`Generated live shift slot for ${pattern.patientName}.`);
  };

  const filteredPatterns = patterns.filter(
    (p) =>
      p.patientName.toLowerCase().includes(search.toLowerCase()) ||
      p.primaryCaregiver.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Repeat className="w-5 h-5 text-brand-teal" />
            Recurring Patterns
          </h1>
          <p className="text-xs text-slate-500">
            Live client care frequency rules connected to Smart Dispatch &amp; Authorization buffers.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patterns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-full border border-slate-200 text-sm w-full sm:w-64 bg-white"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-brand-teal hover:bg-teal-600 text-white font-bold text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Pattern</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-white px-4 py-3 border border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Auto-Scheduler Engine</div>
              <div className="text-xs text-slate-500">
                {patterns.filter((p) => p.status === "Active").length} active client patterns
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white px-4 py-3 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Auto-Broadcaster</div>
              <div className="text-xs text-slate-500">
                Active on {patterns.filter((p) => p.autoBroadcast).length} patterns
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white px-4 py-3 border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Fatigue Warnings</div>
              <div className="text-xs text-slate-500">
                {patterns.filter((p) => p.fatigueRisk).length} pattern(s) flagged
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card noPadding className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Schedule Rule &amp; Auth</th>
                <th className="px-4 py-3">Caregiver</th>
                <th className="px-4 py-3">Projected Slots</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPatterns.map((pattern) => (
                <tr
                  key={pattern.id}
                  className={clsx(
                    "hover:bg-slate-50/80 transition-colors",
                    pattern.fatigueRisk && "bg-amber-50/30"
                  )}
                >
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-slate-900 text-sm">{pattern.patientName}</div>
                    <span
                      className={clsx(
                        "inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
                        pattern.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {pattern.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100 w-max">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-700 font-medium">{pattern.rule}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{pattern.duration}</div>
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-slate-800 text-sm">
                    {pattern.primaryCaregiver}
                  </td>
                  <td className="px-4 py-3 align-top font-bold text-brand-teal text-base">
                    {pattern.upcomingGeneratedCount} slots
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateSlot(pattern)}
                        className="text-xs font-semibold text-white bg-[#141D3C] hover:bg-[#1E2B58] px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        + Generate Shift
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePause(pattern.id)}
                        className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        {pattern.status === "Active" ? "Pause" : "Resume"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <CreatePatternModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPattern(null);
        }}
        pattern={editingPattern}
      />
    </div>
  );
}
