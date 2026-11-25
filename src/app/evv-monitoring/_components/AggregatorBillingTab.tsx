"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Wallet,
  SlidersHorizontal,
  Server,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { EVVVisit, RuleProfile } from "../types";
import { createAuditEvent } from "../evvRules";
import { RULE_PROFILES } from "../mockData";
import { useEvvVisits } from "../EvvVisitsContext";
import { SubmissionDashboard } from "./Submissions/SubmissionDashboard";
import { AggregatorConfig } from "@/components/billing/evv/AggregatorConfig";
import {
  complianceStyles,
  getProcessingBadgeStyle,
  visitStatusStyles,
} from "./evvStatusStyles";

interface AggregatorBillingTabProps {
  visits: EVVVisit[];
  onUpdateVisit: (updated: EVVVisit, toastMessage?: string) => void;
}

export function AggregatorBillingTab({
  visits,
  onUpdateVisit,
}: AggregatorBillingTabProps) {
  const router = useRouter();
  const { aggregatorSubView, setAggregatorSubView } = useEvvVisits();
  const [filterMode, setFilterMode] = useState<
    "all" | "rejected" | "billing-hold" | "payroll-pending"
  >("all");
  const [ruleProfiles, setRuleProfiles] = useState<RuleProfile[]>(RULE_PROFILES);

  const metrics = useMemo(() => {
    const accepted = visits.filter(
      (v) => v.processing.aggregator === "Accepted"
    ).length;
    const rejected = visits.filter(
      (v) => v.processing.aggregator === "Rejected"
    ).length;
    const billingHold = visits.filter(
      (v) => v.processing.billing === "Hold"
    ).length;
    const payrollReady = visits.filter(
      (v) =>
        v.visitStatus === "Completed" &&
        v.processing.payroll !== "Approved" &&
        v.processing.payroll !== "Processed"
    ).length;
    return { accepted, rejected, billingHold, payrollReady };
  }, [visits]);

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (filterMode === "rejected")
        return v.processing.aggregator === "Rejected";
      if (filterMode === "billing-hold") return v.processing.billing === "Hold";
      if (filterMode === "payroll-pending")
        return (
          v.processing.payroll === "Pending Review" ||
          v.processing.payroll === "Hold"
        );
      return true;
    });
  }, [visits, filterMode]);

  const handleQuickAction = (
    visit: EVVVisit,
    field: "aggregator" | "billing" | "payroll",
    nextVal: string,
    summary: string
  ) => {
    const updated: EVVVisit = {
      ...visit,
      processing: {
        ...visit.processing,
        [field]: nextVal,
      },
      auditHistory: [
        createAuditEvent({
          actorName: "Admin Coordinator",
          actorRole: "ADMIN",
          actionType:
            field === "aggregator"
              ? "AGGREGATOR_SUBMITTED"
              : field === "billing"
                ? "BILLING_UPDATED"
                : "PAYROLL_UPDATED",
          summary,
          previousValue: visit.processing[field],
          newValue: nextVal,
        }),
        ...visit.auditHistory,
      ],
    };
    onUpdateVisit(updated, summary);
  };

  const handleToleranceChange = (id: string, nextMinutes: number) => {
    setRuleProfiles((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, timeToleranceMinutes: nextMinutes } : r
      )
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Aggregator Accepted",
            value: metrics.accepted,
            sub: "State portal confirmed",
            icon: CheckCircle2,
            valueClass: "text-emerald-600",
            iconWrap: "bg-emerald-50 text-emerald-600 border-emerald-100",
          },
          {
            label: "Aggregator Rejections",
            value: metrics.rejected,
            sub: "Requires correction & resend",
            icon: AlertTriangle,
            valueClass: "text-red-600",
            iconWrap: "bg-red-50 text-red-600 border-red-100",
          },
          {
            label: "Billing Holds",
            value: metrics.billingHold,
            sub: "Blocked from 837 claims",
            icon: DollarSign,
            valueClass: "text-amber-600",
            iconWrap: "bg-amber-50 text-amber-600 border-amber-100",
          },
          {
            label: "Payroll Pending",
            value: metrics.payrollReady,
            sub: "Completed visits awaiting approval",
            icon: Wallet,
            valueClass: "text-slate-900",
            iconWrap: "bg-blue-50 text-brand-primary border-blue-100",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_6px_32px_rgba(20,29,60,0.04)] hover:border-brand-primary/35 transition-all flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {card.label}
              </p>
              <p
                className={`text-2xl sm:text-3xl font-extrabold mt-1 tabular-nums ${card.valueClass}`}
              >
                {card.value}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                {card.sub}
              </p>
            </div>
            <div
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${card.iconWrap}`}
            >
              <card.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Sub-view Pill Switcher */}
      <div className="inline-flex flex-wrap items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          type="button"
          onClick={() => setAggregatorSubView("readiness")}
          className={clsx(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            aggregatorSubView === "readiness"
              ? "bg-gradient-to-r from-[#141D3C] to-[#1E2B58] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <Send className="w-3.5 h-3.5" />
          Visit Readiness & Holds
        </button>
        <button
          type="button"
          onClick={() => setAggregatorSubView("batches")}
          className={clsx(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            aggregatorSubView === "batches"
              ? "bg-gradient-to-r from-[#141D3C] to-[#1E2B58] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <Server className="w-3.5 h-3.5" />
          Batch Submissions
        </button>
        <button
          type="button"
          onClick={() => setAggregatorSubView("rules")}
          className={clsx(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            aggregatorSubView === "rules"
              ? "bg-gradient-to-r from-[#141D3C] to-[#1E2B58] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Payer Tolerance & State Connectors
        </button>
      </div>

      {/* Sub-view 1: Simplified Visit Readiness Matrix */}
      {aggregatorSubView === "readiness" && (
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_10px_40px_rgba(20,29,60,0.05)] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-b from-slate-50/90 to-white">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Visit Readiness & Holds
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Summary readiness across Aggregator, Billing, and Payroll. Open
                any row for rejection reasons and financial controls.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "all", label: "All Visits" },
                  { id: "rejected", label: "Aggregator Rejected" },
                  { id: "billing-hold", label: "Billing Holds" },
                  { id: "payroll-pending", label: "Payroll Pending" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterMode(f.id)}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all",
                    filterMode === f.id
                      ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[760px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/95 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Visit</th>
                  <th className="py-3.5 px-4">Caregiver / Client</th>
                  <th className="py-3.5 px-4">Compliance</th>
                  <th className="py-3.5 px-4">Aggregator</th>
                  <th className="py-3.5 px-4">Billing</th>
                  <th className="py-3.5 px-4">Payroll</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisits.map((v) => {
                  const detailHref = `/evv-monitoring/${v.id}`;
                  const aggStyle = getProcessingBadgeStyle(
                    v.processing.aggregator
                  );
                  const billStyle = getProcessingBadgeStyle(
                    v.processing.billing
                  );
                  const payStyle = getProcessingBadgeStyle(
                    v.processing.payroll
                  );

                  return (
                    <tr
                      key={v.id}
                      onClick={() => router.push(detailHref)}
                      className="hover:bg-[#F8FAFF] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-mono font-bold text-slate-900 tabular-nums">
                          {v.id}
                        </div>
                        <span
                          className={clsx(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border mt-1",
                            visitStatusStyles[v.visitStatus]
                          )}
                        >
                          {v.visitStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-semibold text-slate-900">
                          {v.caregiver.name}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {v.client.name}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold border whitespace-nowrap",
                            complianceStyles[v.evvCompliance].pill
                          )}
                        >
                          <span
                            className={clsx(
                              "w-1.5 h-1.5 rounded-full",
                              complianceStyles[v.evvCompliance].dot
                            )}
                          />
                          {v.evvCompliance}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border whitespace-nowrap",
                            aggStyle.pill
                          )}
                        >
                          <span
                            className={clsx(
                              "w-1.5 h-1.5 rounded-full",
                              aggStyle.dot
                            )}
                          />
                          {v.processing.aggregator}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border whitespace-nowrap",
                            billStyle.pill
                          )}
                        >
                          <span
                            className={clsx(
                              "w-1.5 h-1.5 rounded-full",
                              billStyle.dot
                            )}
                          />
                          {v.processing.billing}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border whitespace-nowrap",
                            payStyle.pill
                          )}
                        >
                          <span
                            className={clsx(
                              "w-1.5 h-1.5 rounded-full",
                              payStyle.dot
                            )}
                          />
                          {v.processing.payroll}
                        </span>
                      </td>

                      <td
                        onClick={(e) => e.stopPropagation()}
                        className="py-3.5 px-4 align-middle text-right"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {v.evvCompliance !== "Exception" &&
                            v.processing.aggregator !== "Accepted" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickAction(
                                    v,
                                    "aggregator",
                                    "Submitted",
                                    `Submitted ${v.id} to ${v.ruleProfile.aggregator}.`
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-xl bg-brand-primary/10 text-brand-primary font-bold hover:bg-brand-primary/20 cursor-pointer transition-colors whitespace-nowrap"
                              >
                                Submit
                              </button>
                            )}
                          {v.evvCompliance !== "Exception" &&
                            v.visitStatus === "Completed" &&
                            v.processing.billing === "Hold" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickAction(
                                    v,
                                    "billing",
                                    "Cleared",
                                    `Cleared ${v.id} for billing.`
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold hover:bg-emerald-100 cursor-pointer transition-colors whitespace-nowrap"
                              >
                                Clear Bill
                              </button>
                            )}
                          <Link
                            href={detailHref}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200/80 border border-slate-200/70 transition-colors whitespace-nowrap"
                          >
                            <span>Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-view 2: Batch Submissions Dashboard */}
      {aggregatorSubView === "batches" && <SubmissionDashboard />}

      {/* Sub-view 3: Configurable Payer/State Tolerance & Evidence Rules */}
      {aggregatorSubView === "rules" && (
        <div className="space-y-5">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 shadow-[0_10px_40px_rgba(20,29,60,0.05)] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Configurable Agency, Payer & State EVV Tolerance Rules
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Small clock-in/out variances (1–2 min) within configured
                tolerance do not create exceptions. Evidence requirements adapt
                by jurisdiction and payer.
              </p>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[760px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/95 border-b border-slate-200 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3.5">State / Payer</th>
                    <th className="py-3 px-3.5">Aggregator</th>
                    <th className="py-3 px-3.5">Time Tolerance</th>
                    <th className="py-3 px-3.5">Geofence Radius</th>
                    <th className="py-3 px-3.5">GPS</th>
                    <th className="py-3 px-3.5">Signature</th>
                    <th className="py-3 px-3.5">Voice (IVR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ruleProfiles.map((rp) => (
                    <tr key={rp.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">
                          {rp.state}
                        </div>
                        <div className="text-slate-500">{rp.payer}</div>
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-700">
                        {rp.aggregator}
                      </td>
                      <td className="py-3 px-3.5">
                        <select
                          aria-label={`Time tolerance for ${rp.payer}`}
                          value={rp.timeToleranceMinutes}
                          onChange={(e) =>
                            handleToleranceChange(
                              rp.id,
                              Number(e.target.value)
                            )
                          }
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                        >
                          <option value={3}>±3 min</option>
                          <option value={5}>±5 min</option>
                          <option value={7}>±7 min</option>
                          <option value={15}>±15 min</option>
                        </select>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-700 tabular-nums">
                        {rp.geofenceRadiusFt} ft
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                          {rp.gpsRequirement}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                          {rp.signatureRequirement}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                          {rp.voiceRequirement}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <AggregatorConfig />
        </div>
      )}
    </motion.div>
  );
}
