"use client";

import React from "react";
import { Send, DollarSign, Wallet, Info, Lock } from "lucide-react";
import {
  AggregatorStatus,
  BillingStatus,
  EVVVisit,
  PayrollStatus,
} from "../../types";
import { EvvActor } from "../../EvvVisitsContext";
import { EvvRoleCapabilities } from "../../evvPermissions";
import { createAuditEvent, nextId } from "../../evvRules";

interface ProcessingControlsSectionProps {
  visit: EVVVisit;
  actor: EvvActor;
  capabilities: EvvRoleCapabilities;
  onUpdateVisit: (updated: EVVVisit, toastMessage?: string) => void;
}

export function ProcessingControlsSection({
  visit,
  actor,
  capabilities,
  onUpdateVisit,
}: ProcessingControlsSectionProps) {
  const updateProcessingStatus = (
    field: "aggregator" | "billing" | "payroll",
    value: AggregatorStatus | BillingStatus | PayrollStatus,
    summary: string
  ) => {
    const updated: EVVVisit = {
      ...visit,
      processing: {
        ...visit.processing,
        [field]: value,
        ...(field === "aggregator" && value === "Submitted"
          ? { aggregatorRef: nextId("BATCH") }
          : {}),
      },
      auditHistory: [
        createAuditEvent({
          actorName: actor.name,
          actorRole: actor.role,
          actionType:
            field === "aggregator"
              ? "AGGREGATOR_SUBMITTED"
              : field === "billing"
                ? "BILLING_UPDATED"
                : "PAYROLL_UPDATED",
          summary,
          previousValue: visit.processing[field],
          newValue: value,
        }),
        ...visit.auditHistory,
      ],
    };
    onUpdateVisit(updated, summary);
  };

  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2.5 shadow-xs">
        <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
        <div>
          <strong>Independent Processing Controls:</strong> EVV compliance
          resolution, state aggregator acceptance, billing clearance, and
          caregiver payroll approval operate independently so holds never leak
          into claims or block justified payroll unintentionally.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Aggregator ({visit.ruleProfile.aggregator})
                  </div>
                  {visit.processing.aggregatorRef && (
                    <div className="text-[11px] font-mono text-slate-400">
                      Ref: {visit.processing.aggregatorRef}
                    </div>
                  )}
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 shrink-0">
                {visit.processing.aggregator}
              </span>
            </div>
            {visit.processing.aggregatorRejectReason && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                <strong>Rejection Reason:</strong>{" "}
                {visit.processing.aggregatorRejectReason}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {capabilities.canSubmitAggregator ? (
              <button
                type="button"
                disabled={visit.evvCompliance === "Exception"}
                onClick={() =>
                  updateProcessingStatus(
                    "aggregator",
                    "Submitted",
                    `Submitted ${visit.id} to ${visit.ruleProfile.aggregator}.`
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#6C88FF] to-[#5371F3] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-xs"
              >
                Submit to Aggregator
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <Lock className="w-3 h-3" /> Read-only for {capabilities.roleLabel}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Billing Clearance
                </div>
                <div className="text-[11px] font-semibold text-slate-500 tabular-nums">
                  Est. Claim: ${visit.estimatedBillingAmount.toFixed(2)}
                </div>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 shrink-0">
              {visit.processing.billing}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {capabilities.canManageBilling ? (
              <>
                <button
                  type="button"
                  disabled={
                    visit.evvCompliance === "Exception" ||
                    visit.visitStatus !== "Completed"
                  }
                  onClick={() =>
                    updateProcessingStatus(
                      "billing",
                      "Cleared",
                      `Cleared ${visit.id} for 837 claim generation.`
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  Clear for Billing
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateProcessingStatus(
                      "billing",
                      "Hold",
                      `Placed billing hold on ${visit.id}.`
                    )
                  }
                  className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold cursor-pointer"
                >
                  Place Billing Hold
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <Lock className="w-3 h-3" /> Read-only for {capabilities.roleLabel}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-brand-navy flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Payroll Approval
                </div>
                <div className="text-[11px] text-slate-500">
                  Caregiver compensation gate
                </div>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 shrink-0">
              {visit.processing.payroll}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {capabilities.canManagePayroll ? (
              <>
                <button
                  type="button"
                  disabled={visit.visitStatus !== "Completed"}
                  onClick={() =>
                    updateProcessingStatus(
                      "payroll",
                      "Approved",
                      `Approved caregiver payroll for ${visit.id}.`
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-brand-navy hover:bg-brand-navy/90 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  Approve Payroll
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateProcessingStatus(
                      "payroll",
                      "Hold",
                      `Placed payroll hold on ${visit.id}.`
                    )
                  }
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Hold Payroll
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <Lock className="w-3 h-3" /> Restricted to Agency Admin / Payroll
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
