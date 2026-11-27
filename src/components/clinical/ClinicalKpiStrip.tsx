"use client";

import React from "react";
import { FileText, ShieldAlert, AlertTriangle, UserPlus, FileCheck, Pill } from "lucide-react";
import { cn } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

interface KpiData {
  label: string;
  value: string;
  trend: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  trendColor: string;
}

export function ClinicalKpiStrip() {
  const { state } = useAgencyStore();

  const plansDue = state.carePlanReviews.filter((c) => c.status !== "completed").length;
  const openIncidents = state.incidents.filter((i) => i.status !== "Closed");
  const restrictedOpen = openIncidents.filter((i) => i.isRestricted).length;
  const supVisits = state.supervisoryVisits.filter((v) => v.status !== "completed");
  const overdueSup = supVisits.filter((v) => v.status === "overdue").length;
  const pendingAssessments = state.referrals.filter(
    (r) => r.stage === "Initial Assessment Scheduled" || r.stage === "Clinical Review"
  ).length;
  const medFlags = openIncidents.filter((i) => i.type === "Medication Error").length;

  const kpiData: KpiData[] = [
    { label: "Plans Due For Review", value: String(plansDue), trend: "Next 14 days", icon: FileText, color: "text-amber-600", bg: "bg-amber-100", trendColor: "text-slate-500" },
    { label: "Clinical Incidents", value: String(openIncidents.length), trend: "Awaiting Sign-off", icon: ShieldAlert, color: "text-blue-600", bg: "bg-blue-100", trendColor: "text-slate-500" },
    { label: "Restricted Incidents", value: String(restrictedOpen), trend: "HIPAA / Abuse - URGENT", icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-100", trendColor: "text-rose-600" },
    { label: "Supervisory Visits", value: String(supVisits.length), trend: `${overdueSup} Overdue`, icon: UserPlus, color: "text-amber-600", bg: "bg-amber-100", trendColor: "text-amber-600" },
    { label: "Pending Assessments", value: String(pendingAssessments), trend: "From Intake Queue", icon: FileCheck, color: "text-brand-teal", bg: "bg-brand-teal/20", trendColor: "text-slate-500" },
    { label: "Medication Flags", value: String(medFlags), trend: "From QA Audit", icon: Pill, color: "text-rose-600", bg: "bg-rose-100", trendColor: "text-rose-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
      {kpiData.map((kpi, idx) => {
        const Icon = kpi.icon;
        const isRestricted = kpi.label === "Restricted Incidents";
        return (
          <div key={idx} className={cn(
            "bg-white backdrop-blur-xl rounded-2xl px-4 py-3 border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:border-brand-teal/60 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[110px]",
            isRestricted ? "border-rose-300 bg-rose-50/50" : "border-slate-200"
          )}>
            {isRestricted && restrictedOpen > 0 && (
              <div className="absolute top-0 right-0 p-1">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              </div>
            )}
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-600 leading-tight pr-2">{kpi.label}</span>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", kpi.bg, kpi.color)}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-auto">
              <div className="text-2xl font-medium text-slate-900 tracking-tight leading-none mb-1">
                {kpi.value}
              </div>
              <div className={cn("text-[10px] sm:text-[11px]", kpi.trendColor)}>
                {kpi.trend}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
