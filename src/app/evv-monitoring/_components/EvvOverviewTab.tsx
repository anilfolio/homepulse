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
  ArrowUpRight,
  Sparkles,
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
import { motion } from "framer-motion";
import { EVVVisit, ExceptionCategory } from "../types";
import { EvvRoleCapabilities } from "../evvPermissions";
import { mockTopOffenders, mockWeeklyComplianceTrend } from "../mockData";
import { ComplianceDonut } from "./ComplianceDonut";
import { OffenderRow } from "./OffenderRow";
import { BillingRiskCard } from "./BillingRiskCard";

interface EvvOverviewTabProps {
  visits: EVVVisit[];
  capabilities: EvvRoleCapabilities;
  onNavigateTab: (
    tab: "overview" | "visits" | "exceptions" | "aggregator",
    exceptionFilter?: ExceptionCategory
  ) => void;
  onReviewVisit: (visit: EVVVisit) => void;
}

export function EvvOverviewTab({
  visits,
  capabilities,
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
      urgentVisits: exceptions.slice(0, 4),
    };
  }, [visits]);

  const secondaryKpis = [
    {
      label: "Active Exceptions",
      value: stats.exceptionsCount,
      badge: "Needs Review",
      subtext: "Isolated by workflow type",
      badgeStyle: "text-red-700 bg-red-50 border-red-200",
      iconBg: "bg-red-50 text-red-600 border-red-100",
      icon: AlertTriangle,
      onClick: () =>
        onNavigateTab(capabilities.canViewExceptions ? "exceptions" : "visits"),
    },
    ...(capabilities.canViewAggregatorTab
      ? [
          {
            label: "Aggregator Accepted",
            value: `${stats.aggregatorAccepted}/${stats.total}`,
            badge: `${stats.billingCleared} Billed/Cleared`,
            subtext: "Sandata · HHAeXchange · Netsmart",
            badgeStyle: "text-blue-700 bg-blue-50 border-blue-200",
            iconBg: "bg-blue-50 text-brand-primary border-blue-100",
            icon: Send,
            onClick: () => onNavigateTab("aggregator"),
          },
        ]
      : [
          {
            label: "Verified Visits",
            value: `${stats.verified + stats.resolved}/${stats.total}`,
            badge: `${stats.verified} Auto-Verified`,
            subtext: "GPS · IVR · Fixed capture",
            badgeStyle: "text-emerald-700 bg-emerald-50 border-emerald-200",
            iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
            icon: ShieldCheck,
            onClick: () => onNavigateTab("visits"),
          },
        ]),
    ...(capabilities.canViewFinancials
      ? [
          {
            label: "Payroll Approved",
            value: `${stats.payrollApproved}/${stats.total}`,
            badge: `${stats.billingHoldCount} Billing Holds`,
            subtext: "Independent payroll gate",
            badgeStyle: "text-amber-800 bg-amber-50 border-amber-200",
            iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
            icon: Wallet,
            onClick: () =>
              onNavigateTab(
                capabilities.canViewAggregatorTab ? "aggregator" : "visits"
              ),
          },
        ]
      : [
          {
            label: "Resolved After Review",
            value: stats.resolved,
            badge: "Attested",
            subtext: "Supervisory review complete",
            badgeStyle: "text-indigo-700 bg-indigo-50 border-indigo-200",
            iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
            icon: CheckCircle2,
            onClick: () => onNavigateTab("visits"),
          },
        ]),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* 4-Column KPI Strip with Dark Executive Hero Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hero Dark Navy Card */}
        <div
          onClick={() => onNavigateTab("visits")}
          className="bg-gradient-to-br from-[#141D3C] via-[#1A254B] to-[#0E152E] text-white rounded-2xl border border-[#2A3B75]/70 p-4 sm:p-5 shadow-[0_12px_36px_rgba(20,29,60,0.22)] hover:-translate-y-0.5 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-[#57EAB6]/15 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#57EAB6] animate-pulse" />
              EVV Compliance
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/10 text-[#57EAB6] border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2 relative z-10">
            <span className="text-3xl font-black tracking-tight tabular-nums text-white">
              {stats.compliantRate}%
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#57EAB6]/15 text-[#57EAB6] border border-[#57EAB6]/30 tabular-nums">
              {stats.verified} Ver · {stats.resolved} Res
            </span>
          </div>
          <div className="text-[11px] text-slate-300/80 mt-2 flex items-center justify-between relative z-10">
            <span>{stats.total} active visits monitored</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#57EAB6] opacity-75 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* 3 Glassmorphic Operational KPI Cards */}
        {secondaryKpis.map((m) => (
          <div
            key={m.label}
            onClick={m.onClick}
            className="bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_6px_32px_rgba(20,29,60,0.04)] hover:shadow-[0_12px_36px_rgba(108,136,255,0.09)] hover:border-brand-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {m.label}
              </span>
              <div
                className={`w-8 h-8 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform ${m.iconBg}`}
              >
                <m.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {m.value}
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${m.badgeStyle}`}
              >
                {m.badge}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-2 truncate">
              {m.subtext}
            </div>
          </div>
        ))}
      </div>

      {/* 70/30 Command Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 7-Day Trend Chart */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 shadow-[0_8px_32px_rgba(20,29,60,0.04)] hover:border-brand-primary/30 transition-all flex flex-col justify-between min-h-[300px]">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 tracking-tight">
                    <TrendingUp className="w-4 h-4 text-brand-primary" />
                    7-Day Compliance & Exception Trend
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Compliant vs flagged visits (%)
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3" />
                  91.7% Avg
                </span>
              </div>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockWeeklyComplianceTrend} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E6F3" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "#5E6D8A", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#5E6D8A" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(108, 136, 255, 0.06)" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E2E6F3",
                        boxShadow: "0 10px 30px rgba(20,29,60,0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="verified"
                      name="Compliant %"
                      stackId="a"
                      fill="#57EAB6"
                      radius={[0, 0, 6, 6]}
                    />
                    <Bar
                      dataKey="exceptions"
                      name="Exceptions %"
                      stackId="a"
                      fill="#F59E0B"
                      radius={[6, 6, 0, 0]}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Processing Readiness Pipeline (Financial/Admin roles) */}
            {capabilities.canViewFinancials && (
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 shadow-[0_8px_32px_rgba(20,29,60,0.04)] space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Financial & Processing Readiness
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Independent gates across EVV, Aggregator, Billing & Payroll
                    </p>
                  </div>
                  {capabilities.canViewAggregatorTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab("aggregator")}
                      className="text-xs font-bold text-brand-primary hover:underline cursor-pointer shrink-0"
                    >
                      Open Pipeline →
                    </button>
                  )}
                </div>

                <div className="space-y-3.5 pt-1">
                  {[
                    {
                      label: "EVV Verified or Resolved",
                      count: stats.verified + stats.resolved,
                      total: stats.total,
                      icon: ShieldCheck,
                      color: "bg-gradient-to-r from-emerald-400 to-emerald-500",
                      dot: "bg-emerald-500",
                    },
                    {
                      label: "Aggregator Accepted",
                      count: stats.aggregatorAccepted,
                      total: stats.total,
                      icon: Send,
                      color: "bg-gradient-to-r from-[#6C88FF] to-[#5371F3]",
                      dot: "bg-brand-primary",
                    },
                    {
                      label: "Billing Cleared / Billed",
                      count: stats.billingCleared,
                      total: stats.total,
                      icon: DollarSign,
                      color: "bg-gradient-to-r from-indigo-500 to-violet-500",
                      dot: "bg-indigo-500",
                    },
                    {
                      label: "Payroll Approved / Processed",
                      count: stats.payrollApproved,
                      total: stats.total,
                      icon: Wallet,
                      color: "bg-gradient-to-r from-[#141D3C] to-[#2A3B75]",
                      dot: "bg-brand-navy",
                    },
                  ].map((stage) => {
                    const pct =
                      stage.total > 0
                        ? Math.round((stage.count / stage.total) * 100)
                        : 0;
                    return (
                      <div
                        key={stage.label}
                        className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${stage.dot}`}
                            />
                            {stage.label}
                          </span>
                          <span className="font-bold text-slate-900 tabular-nums">
                            {stage.count}/{stage.total}{" "}
                            <span className="text-slate-400 font-semibold">
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200/70 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${stage.color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Caregivers Needing Coaching */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 shadow-[0_8px_32px_rgba(20,29,60,0.04)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Caregivers Needing Coaching
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Repeat EVV punch exceptions this period
                    </p>
                  </div>
                </div>
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
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          {capabilities.canViewFinancials && (
            <BillingRiskCard
              totalRisk={stats.billingHoldAmount}
              needsReview={stats.exceptionAmount}
              likelyDenied={stats.rejectedAmount}
              onResolveClick={() =>
                onNavigateTab(
                  capabilities.canViewExceptions ? "exceptions" : "visits"
                )
              }
            />
          )}

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 shadow-[0_8px_32px_rgba(20,29,60,0.04)] space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Priority Exception Queue
                </h3>
                <p className="text-[11px] text-slate-500">
                  Direct jump to guided resolution
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("exceptions")}
                className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
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
                  className="w-full text-left p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-brand-primary/50 hover:shadow-sm transition-all cursor-pointer relative overflow-hidden group"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      v.exceptionSeverity === "critical" ? "bg-red-500" : "bg-amber-500"
                    }`}
                  />
                  <div className="flex items-center justify-between gap-2 pl-1.5">
                    <span className="font-mono text-xs font-extrabold text-slate-900">
                      {v.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                      {v.exceptionCategory}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-1.5 pl-1.5">
                    {v.caregiver.name} → {v.client.name}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1 pl-1.5">
                    <span className="text-[11px] text-slate-500 truncate">
                      {v.exceptionDetail}
                    </span>
                    <span className="text-[11px] font-bold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      Review →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
