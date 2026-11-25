"use client";

import React, { useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Send,
  ShieldCheck,
  DollarSign,
  Wallet,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { EVVVisit, ExceptionCategory } from "../types";
import { mockTopOffenders, mockWeeklyComplianceTrend } from "../mockData";
import { ComplianceDonut } from "./ComplianceDonut";
import { OffenderRow } from "./OffenderRow";
import { BillingRiskCard } from "./BillingRiskCard";

interface EvvOverviewTabProps {
  visits: EVVVisit[];
  onNavigateTab: (
    tab: "overview" | "visits" | "exceptions" | "aggregator",
    exceptionFilter?: ExceptionCategory
  ) => void;
  onReviewVisit: (visit: EVVVisit) => void;
}

export function EvvOverviewTab({
  visits,
  onNavigateTab,
  onReviewVisit,
}: EvvOverviewTabProps) {
  const stats = useMemo(() => {
    const total = visits.length;
    const verified = visits.filter((v) => v.evvCompliance === "Verified").length;
    const resolved = visits.filter((v) => v.evvCompliance === "Resolved").length;
    const exceptions = visits.filter((v) => v.evvCompliance === "Exception");
    const compliantRate = total > 0 ? Math.round(((verified + resolved) / total) * 100) : 100;

    const billingHoldVisits = visits.filter((v) => v.processing.billing === "Hold");
    const billingHoldAmount = billingHoldVisits.reduce(
      (sum, v) => sum + v.estimatedBillingAmount,
      0
    );
    const exceptionAmount = exceptions.reduce(
      (sum, v) => sum + v.estimatedBillingAmount,
      0
    );
    const rejectedAmount = visits
      .filter((v) => v.processing.aggregator === "Rejected")
      .reduce((sum, v) => sum + v.estimatedBillingAmount, 0);

    const aggregatorAccepted = visits.filter(
      (v) => v.processing.aggregator === "Accepted"
    ).length;
    const billingCleared = visits.filter(
      (v) => v.processing.billing === "Cleared" || v.processing.billing === "Billed"
    ).length;
    const payrollApproved = visits.filter(
      (v) => v.processing.payroll === "Approved" || v.processing.payroll === "Processed"
    ).length;

    const breakdownMap: Record<string, number> = {};
    exceptions.forEach((v) => {
      if (v.exceptionCategory !== "None") {
        breakdownMap[v.exceptionCategory] = (breakdownMap[v.exceptionCategory] || 0) + 1;
      }
    });
    const donutData = Object.entries(breakdownMap).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      total,
      verified,
      resolved,
      exceptionsCount: exceptions.length,
      compliantRate,
      billingHoldCount: billingHoldVisits.length,
      billingHoldAmount,
      exceptionAmount,
      rejectedAmount,
      aggregatorAccepted,
      billingCleared,
      payrollApproved,
      donutData,
      urgentVisits: exceptions.slice(0, 3),
    };
  }, [visits]);

  const kpis = [
    {
      label: "Daily EVV Compliance",
      value: `${stats.compliantRate}%`,
      badge: `${stats.verified} Verified · ${stats.resolved} Resolved`,
      badgeStyle: "text-emerald-700 bg-emerald-50 border-emerald-200",
      icon: CheckCircle2,
    },
    {
      label: "Active Exceptions",
      value: stats.exceptionsCount,
      badge: "Needs Resolution",
      badgeStyle: "text-red-700 bg-red-50 border-red-200",
      icon: AlertTriangle,
    },
    {
      label: "Aggregator Accepted",
      value: `${stats.aggregatorAccepted} / ${stats.total}`,
      badge: `${stats.billingCleared} Billing Cleared`,
      badgeStyle: "text-blue-700 bg-blue-50 border-blue-200",
      icon: Send,
    },
    {
      label: "Payroll Approved",
      value: `${stats.payrollApproved} / ${stats.total}`,
      badge: `$${stats.billingHoldAmount.toFixed(0)} Billing Hold`,
      badgeStyle: "text-amber-800 bg-amber-50 border-amber-200",
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-5">
      {/* 4-Column KPI Metric Strip (STYLEGUIDE Pattern B) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((m) => (
          <div
            key={m.label}
            className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-4 shadow-[0_6px_32px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:border-brand-primary/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {m.label}
              </span>
              <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <m.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {m.value}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${m.badgeStyle}`}
              >
                {m.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 70/30 Command Split: Left Charts & Readiness, Right Urgent Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-5">
          {/* Exception Trends + Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 shadow-[0_6px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[290px]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-brand-primary" />
                    7-Day Compliance & Exception Trend
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified/Resolved vs flagged visits (%)
                  </p>
                </div>
              </div>
              <div className="h-[205px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockWeeklyComplianceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="verified"
                      name="Compliant %"
                      stackId="a"
                      fill="#57EAB6"
                      radius={[0, 0, 4, 4]}
                    />
                    <Bar
                      dataKey="exceptions"
                      name="Exceptions %"
                      stackId="a"
                      fill="#F59E0B"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <ComplianceDonut
              data={
                stats.donutData.length > 0
                  ? stats.donutData
                  : [{ name: "Location Mismatch", value: 0 }]
              }
              overallCompliance={stats.compliantRate}
              onSegmentClick={(segment) =>
                onNavigateTab("exceptions", segment as ExceptionCategory)
              }
            />
          </div>

          {/* Processing Readiness Pipeline + Top Offenders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 shadow-[0_6px_32px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Financial & Processing Readiness
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Independent gates across EVV, Aggregator, Billing & Payroll
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab("aggregator")}
                  className="text-xs font-semibold text-brand-primary hover:underline cursor-pointer"
                >
                  Open Pipeline →
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: "EVV Verified or Resolved",
                    count: stats.verified + stats.resolved,
                    total: stats.total,
                    icon: ShieldCheck,
                    color: "bg-emerald-500",
                  },
                  {
                    label: "Aggregator Accepted",
                    count: stats.aggregatorAccepted,
                    total: stats.total,
                    icon: Send,
                    color: "bg-brand-primary",
                  },
                  {
                    label: "Billing Cleared / Billed",
                    count: stats.billingCleared,
                    total: stats.total,
                    icon: DollarSign,
                    color: "bg-indigo-500",
                  },
                  {
                    label: "Payroll Approved / Processed",
                    count: stats.payrollApproved,
                    total: stats.total,
                    icon: Wallet,
                    color: "bg-brand-navy",
                  },
                ].map((stage) => {
                  const pct =
                    stage.total > 0 ? Math.round((stage.count / stage.total) * 100) : 0;
                  return (
                    <div key={stage.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <stage.icon className="w-3.5 h-3.5 text-slate-400" />
                          {stage.label}
                        </span>
                        <span className="font-bold text-slate-900">
                          {stage.count}/{stage.total} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stage.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 shadow-[0_6px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-0.5">
                  Caregivers Needing Coaching
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Repeat EVV punch exceptions this period
                </p>
                <div className="space-y-2.5">
                  {mockTopOffenders.map((offender) => (
                    <OffenderRow
                      key={offender.id}
                      offender={offender}
                      onSelectCaregiver={() => onNavigateTab("exceptions")}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Context Rail (30% / 4 Columns) */}
        <div className="lg:col-span-4 space-y-5">
          <BillingRiskCard
            totalRisk={stats.billingHoldAmount}
            needsReview={stats.exceptionAmount}
            likelyDenied={stats.rejectedAmount}
            onResolveClick={() => onNavigateTab("exceptions")}
          />

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 shadow-[0_6px_32px_rgba(0,0,0,0.04)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Priority Exception Queue</h3>
              <button
                type="button"
                onClick={() => onNavigateTab("exceptions")}
                className="text-xs font-semibold text-brand-primary hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>
            <div className="space-y-2.5">
              {stats.urgentVisits.map((v) => (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => onReviewVisit(v)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-brand-primary/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {v.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                      {v.exceptionCategory}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-1">
                    {v.caregiver.name} → {v.client.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {v.exceptionDetail}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
