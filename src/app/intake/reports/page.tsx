"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, TrendingUp, Users } from "lucide-react";
import { ReportsHeader } from "@/components/reports/ReportsHeader";
import { ReportCard } from "@/components/reports/ReportCard";
import { ReportView } from "@/components/reports/ReportView";
import { allPrebuiltReports, ReportDefinition } from "@/lib/reports-mock-data";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export default function IntakeReportsPage() {
  const { state } = useAgencyStore();
  const [activeReport, setActiveReport] = useState<ReportDefinition | null>(null);

  const liveMetrics = useMemo(() => {
    const total = state.referrals.length;
    const admitted = state.referrals.filter(
      (r) => r.stage === "Admitted" || r.stage === "Converted"
    ).length;
    const urgentPending = state.referrals.filter(
      (r) => r.urgency === "High" && r.stage !== "Admitted"
    ).length;
    const conversionRate = total > 0 ? Math.round((admitted / total) * 100) : 0;

    return {
      total,
      admitted,
      urgentPending,
      conversionRate,
      activeClients: state.clients.length,
    };
  }, [state.referrals, state.clients]);

  const categoryReports = allPrebuiltReports.filter((r) => r.category === "Intake");

  return (
    <>
      <div className="max-w-full mx-auto w-full space-y-5">
        <ReportsHeader />

        {/* Live Intake Funnel Telemetry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Pipeline Volume</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {liveMetrics.total}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Partner &amp; direct inquiries tracked
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Intake Conversion</span>
              <TrendingUp className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {liveMetrics.conversionRate}%
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              {liveMetrics.admitted} referral(s) admitted
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Active Client Census</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {liveMetrics.activeClients}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Synced with Clinical &amp; Billing
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Urgent SLA Queue</span>
              <Clock className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {liveMetrics.urgentPending}
            </div>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              24–48h hospital discharges pending
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {categoryReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onView={(r) => setActiveReport(r)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeReport && (
          <ReportView report={activeReport} onClose={() => setActiveReport(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
