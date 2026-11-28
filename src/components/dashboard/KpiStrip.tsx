"use client";

import React from "react";
import { Users, UserCircle2, CalendarCheck, ShieldAlert, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function KpiStrip() {
  const { state } = useAgencyStore();

  const todayVisits = state.visits.filter((v) => v.visitDateLabel === "Today");
  const completedToday = todayVisits.filter((v) => v.status === "Completed").length;
  const evvTotal = state.visits.filter(
    (v) => v.status === "Completed" || v.status === "In Progress"
  );
  const evvExceptions = state.visits.filter((v) => v.evvCompliance === "Exception").length;
  const evvCompliancePct =
    evvTotal.length > 0
      ? (((evvTotal.length - evvExceptions) / evvTotal.length) * 100).toFixed(1)
      : "100.0";
  const unfilledShifts = state.visits.filter(
    (v) => v.status === "Unfilled" || v.status === "Call-Off"
  ).length;
  const openIncidents = state.incidents.filter((i) => i.status !== "Closed").length;
  const restrictedIncidents = state.incidents.filter(
    (i) => i.isRestricted && i.status !== "Closed"
  ).length;
  const totalClaims = state.claims.reduce((sum, c) => sum + c.amount, 0);
  const compliantStaff = state.caregivers.filter((c) => c.complianceValid).length;

  const kpiData = [
    {
      label: "Active Clients",
      value: String(state.clients.length),
      trend: `${state.referrals.length} in Intake pipeline`,
      icon: Users,
      color: "text-brand-teal",
      bg: "bg-brand-teal/20",
      trendColor: "text-brand-teal",
    },
    {
      label: "Active Caregivers",
      value: String(state.caregivers.length),
      trend: `${compliantStaff} compliance cleared`,
      icon: UserCircle2,
      color: "text-accent-purple",
      bg: "bg-accent-purple/20",
      trendColor: "text-accent-purple",
    },
    {
      label: "Today's Visits",
      value: String(todayVisits.length),
      trend: `${completedToday} completed · ${Math.max(0, todayVisits.length - completedToday)} active`,
      icon: CalendarCheck,
      color: "text-accent-blue",
      bg: "bg-accent-blue/20",
      trendColor: "text-text-secondary",
    },
    {
      label: "EVV Compliance",
      value: `${evvCompliancePct}%`,
      trend: `${evvExceptions} exception(s) flagged`,
      icon: CheckCircle2,
      color: "text-accent-green",
      bg: "bg-accent-green/20",
      trendColor: evvExceptions > 0 ? "text-accent-orange" : "text-emerald-600",
    },
    {
      label: "Unfilled Shifts",
      value: String(unfilledShifts),
      trend: unfilledShifts > 0 ? "Dispatch queue active" : "100% staffed",
      icon: Clock,
      color: "text-accent-orange",
      bg: "bg-accent-orange/20",
      trendColor: unfilledShifts > 0 ? "text-accent-red" : "text-emerald-600",
    },
    {
      label: "Open Incidents",
      value: String(openIncidents),
      trend: `${restrictedIncidents} restricted QA review`,
      icon: ShieldAlert,
      color: "text-accent-amber",
      bg: "bg-accent-amber/20",
      trendColor: "text-text-secondary",
    },
    {
      label: "Claims Pipeline",
      value: `$${totalClaims.toLocaleString()}`,
      trend: `${state.claims.length} tracked claims`,
      icon: DollarSign,
      color: "text-brand-teal",
      bg: "bg-brand-teal/20",
      trendColor: "text-brand-teal",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {kpiData.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="bg-white backdrop-blur-xl rounded-2xl px-4 py-3 border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:border-brand-teal/60 transition-all duration-300 relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-[12px] font-medium text-text-secondary leading-tight pr-2">{kpi.label}</span>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", kpi.bg, kpi.color)}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-auto">
              <div className="text-xl font-bold text-slate-800 tracking-tight mb-1">{kpi.value}</div>
              <div className={cn("text-[11px] font-medium", kpi.trendColor)}>{kpi.trend}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
