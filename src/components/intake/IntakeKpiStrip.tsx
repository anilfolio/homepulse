"use client";

import React from "react";
import { 
  PhoneIncoming, 
  Hourglass, 
  CalendarCheck, 
  PercentSquare, 
  TrendingUp, 
  Clock 
} from "lucide-react";
import { cn } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function IntakeKpiStrip() {
  const { state } = useAgencyStore();

  const referrals = state.referrals;
  const awaitingContact = referrals.filter(
    (r) => r.stage === "Referral Received" || r.stage === "Contact Attempted"
  ).length;
  const scheduledAssessments = referrals.filter(
    (r) => r.stage === "Initial Assessment Scheduled"
  ).length + state.supervisoryVisits.filter((v) => v.visitType === "initial_30").length;
  const admitted = referrals.filter(
    (r) => r.stage === "Admitted" || r.stage === "Converted"
  ).length;
  const conversionPct =
    referrals.length > 0 ? Math.round((admitted / referrals.length) * 100) : 76;

  const kpiData = [
    { 
      label: "New Inquiries & Referrals", 
      value: String(referrals.length), 
      trend: `${referrals.filter((r) => r.urgency === "High").length} urgent discharges`, 
      icon: PhoneIncoming, 
      color: "text-brand-teal", 
      bg: "bg-brand-teal/20", 
      trendColor: "text-brand-teal" 
    },
    { 
      label: "Awaiting First Contact", 
      value: String(awaitingContact), 
      trend: awaitingContact > 0 ? "SLA active (<30m)" : "Queue clear", 
      icon: Hourglass, 
      color: "text-accent-red", 
      bg: "bg-accent-red/20", 
      trendColor: "text-accent-red" 
    },
    { 
      label: "Assessments Scheduled", 
      value: String(scheduledAssessments), 
      trend: "Synced with Clinical RN", 
      icon: CalendarCheck, 
      color: "text-accent-blue", 
      bg: "bg-accent-blue/20", 
      trendColor: "text-text-secondary" 
    },
    { 
      label: "Inq → Assessment Rate (30d)", 
      value: "76%", 
      trend: "Target: 70-80%", 
      icon: PercentSquare, 
      color: "text-accent-amber", 
      bg: "bg-accent-amber/20", 
      trendColor: "text-brand-teal" 
    },
    { 
      label: "Admission Conversion", 
      value: `${conversionPct}%`, 
      trend: `${admitted} active admissions`, 
      icon: TrendingUp, 
      color: "text-brand-teal", 
      bg: "bg-brand-teal/20", 
      trendColor: "text-brand-teal" 
    },
    { 
      label: "Avg. Time to First Visit", 
      value: "3.2 Days", 
      trend: "Priv: 1.5d | Med: 8d", 
      icon: Clock, 
      color: "text-accent-purple", 
      bg: "bg-accent-purple/20", 
      trendColor: "text-text-secondary" 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpiData.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div key={idx} className="bg-white backdrop-blur-xl rounded-2xl px-4 py-4 border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:border-brand-teal/60 transition-all duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-text-secondary leading-tight pr-2">{kpi.label}</span>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0", kpi.bg, kpi.color)}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-auto">
              <div className="text-2xl font-bold text-slate-800 tracking-tight mb-1">
                <span>{kpi.value}</span>
              </div>
              <div className={cn("text-[11px] font-medium", kpi.trendColor)}>
                {kpi.trend}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
