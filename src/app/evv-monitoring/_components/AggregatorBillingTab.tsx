"use client";

import React, { useMemo, useState } from "react";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Wallet,
  SlidersHorizontal,
  Server,
} from "lucide-react";
import clsx from "clsx";
import { EVVVisit, RuleProfile } from "../types";
import { createAuditEvent } from "../evvRules";
import { RULE_PROFILES } from "../mockData";
import { SubmissionDashboard } from "./Submissions/SubmissionDashboard";
import { AggregatorConfig } from "@/components/billing/evv/AggregatorConfig";

interface AggregatorBillingTabProps {
  visits: EVVVisit[];
  onReviewVisit: (visit: EVVVisit) => void;
  onUpdateVisit: (updated: EVVVisit, toastMessage?: string) => void;
}

export function AggregatorBillingTab({
  visits,
  onReviewVisit,
  onUpdateVisit,
}: AggregatorBillingTabProps) {
  const [subView, setSubView] = useState<"readiness" | "batches" | "rules">("readiness");
  const [filterMode, setFilterMode] = useState<
    "all" | "rejected" | "billing-hold" | "payroll-pending"
  >("all");
  const [ruleProfiles, setRuleProfiles] = useState<RuleProfile[]>(RULE_PROFILES);

  const metrics = useMemo(() => {
    const accepted = visits.filter((v) => v.processing.aggregator === "Accepted").length;
    const rejected = visits.filter((v) => v.processing.aggregator === "Rejected").length;
    const billingHold = visits.filter((v) => v.processing.billing === "Hold").length;
    const payrollReady = visits.filter(
      (v) => v.visitStatus === "Completed" && v.processing.payroll !== "Approved" && v.processing.payroll !== "Processed"
    ).length;
    return { accepted, rejected, billingHold, payrollReady };
  }, [visits]);

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (filterMode === "rejected") return v.processing.aggregator === "Rejected";
      if (filterMode === "billing-hold") return v.processing.billing === "Hold";
      if (filterMode === "payroll-pending")
        return v.processing.payroll === "Pending Review" || v.processing.payroll === "Hold";
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
      prev.map((r) => (r.id === id ? { ...r, timeToleranceMinutes: nextMinutes } : r))
    );
  };

  return (
    <div className="space-y-5">
      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/90 rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Aggregator Accepted</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{metrics.accepted}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/90 rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Aggregator Rejections</p>
            <p className="text-2xl font-extrabold text-red-600 mt-1">{metrics.rejected}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/90 rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Billing Holds</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{metrics.billingHold}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/90 rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Payroll Awaiting Approval</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.payrollReady}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub-view Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSubView("readiness")}
          className={clsx(
            "px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5",
            subView === "readiness"
              ? "bg-brand-navy text-white border-brand-navy"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          )}
        >
          <Send className="w-3.5 h-3.5" />
          Visit Readiness & Holds
        </button>
        <button
          type="button"
          onClick={() => setSubView("batches")}
          className={clsx(
            "px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5",
            subView === "batches"
              ? "bg-brand-navy text-white border-brand-navy"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          )}
        >
          <Server className="w-3.5 h-3.5" />
          Batch Submissions
        </button>
        <button
          type="button"
          onClick={() => setSubView("rules")}
          className={clsx(
            "px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5",
            subView === "rules"
              ? "bg-brand-navy text-white border-brand-navy"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Payer Tolerance & State Connectors
        </button>
      </div>

      {/* Sub-view 1: Visit Readiness Matrix */}
      {subView === "readiness" && (
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_6px_32px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Independent Financial & Aggregator Readiness Queue
              </h3>
              <p className="text-xs text-slate-500">
                Manage Aggregator submission/rejection, Billing clearance, and Payroll approval independently.
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
                    "px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer",
                    filterMode === f.id
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[980px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Visit / Status</th>
                  <th className="py-3 px-4">Caregiver & Client</th>
                  <th className="py-3 px-4">EVV Compliance</th>
                  <th className="py-3 px-4">Aggregator</th>
                  <th className="py-3 px-4">Billing Clearance</th>
                  <th className="py-3 px-4">Payroll Approval</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{v.id}</div>
                      <div className="text-[11px] text-slate-500">
                        {v.visitStatus} · ${v.estimatedBillingAmount.toFixed(0)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{v.caregiver.name}</div>
                      <div className="text-slate-500">
                        {v.client.name} · {v.ruleProfile.state} ({v.ruleProfile.aggregator})
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded-full font-bold border",
                          v.evvCompliance === "Verified"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : v.evvCompliance === "Exception"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        )}
                      >
                        {v.evvCompliance}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {v.processing.aggregator}
                      </div>
                      {v.processing.aggregatorRejectReason && (
                        <div className="text-[11px] text-red-600 max-w-[200px] truncate">
                          {v.processing.aggregatorRejectReason}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded font-semibold border",
                          v.processing.billing === "Cleared" || v.processing.billing === "Billed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : v.processing.billing === "Hold"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {v.processing.billing}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded font-semibold border",
                          v.processing.payroll === "Approved" || v.processing.payroll === "Processed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : v.processing.payroll === "Hold"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {v.processing.payroll}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
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
                              className="px-2.5 py-1 rounded-lg bg-brand-primary/10 text-brand-primary font-semibold hover:bg-brand-primary/20 cursor-pointer"
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
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 cursor-pointer"
                            >
                              Clear Bill
                            </button>
                          )}
                        <button
                          type="button"
                          onClick={() => onReviewVisit(v)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 cursor-pointer"
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-view 2: Existing Batch Submissions Dashboard */}
      {subView === "batches" && <SubmissionDashboard />}

      {/* Sub-view 3: Configurable Payer/State Tolerance & Evidence Rules + Aggregator Config */}
      {subView === "rules" && (
        <div className="space-y-5">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 shadow-[0_6px_32px_rgba(0,0,0,0.04)] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Configurable Agency, Payer & State EVV Tolerance Rules
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Small clock-in/out variances (1–2 min) within configured tolerance do not create exceptions. Evidence requirements adapt by jurisdiction and payer.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">State / Payer</th>
                    <th className="py-2.5 px-3">Aggregator</th>
                    <th className="py-2.5 px-3">Time Tolerance</th>
                    <th className="py-2.5 px-3">Geofence Radius</th>
                    <th className="py-2.5 px-3">GPS</th>
                    <th className="py-2.5 px-3">Signature</th>
                    <th className="py-2.5 px-3">Voice (IVR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ruleProfiles.map((rp) => (
                    <tr key={rp.id}>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{rp.state}</div>
                        <div className="text-slate-500">{rp.payer}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{rp.aggregator}</td>
                      <td className="py-3 px-3">
                        <select
                          aria-label={`Time tolerance for ${rp.payer}`}
                          value={rp.timeToleranceMinutes}
                          onChange={(e) =>
                            handleToleranceChange(rp.id, Number(e.target.value))
                          }
                          className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-semibold"
                        >
                          <option value={3}>±3 min</option>
                          <option value={5}>±5 min</option>
                          <option value={7}>±7 min</option>
                          <option value={15}>±15 min</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {rp.geofenceRadiusFt} ft
                      </td>
                      <td className="py-3 px-3">{rp.gpsRequirement}</td>
                      <td className="py-3 px-3">{rp.signatureRequirement}</td>
                      <td className="py-3 px-3">{rp.voiceRequirement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <AggregatorConfig />
        </div>
      )}
    </div>
  );
}
