"use client";

import React from "react";
import { CheckCircle2, History } from "lucide-react";
import { AuditEvent } from "../../types";

export function AuditHistorySection({
  auditHistory,
}: {
  auditHistory: AuditEvent[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <History className="w-4 h-4 text-brand-primary" />
          Immutable EVV & Compliance Audit Trail
        </h3>
        <span className="text-[11px] font-mono text-slate-400">
          UTC Timestamps
        </span>
      </div>

      <div className="relative pl-5 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
        {auditHistory.map((ev) => (
          <div key={ev.id} className="relative">
            <span className="absolute -left-5 top-2 w-3.5 h-3.5 rounded-full bg-white border-2 border-brand-primary shadow-xs" />
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono">
                  {ev.actionType}
                </span>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {ev.timestamp.replace("T", " ").slice(0, 19)} UTC
                </span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed">
                {ev.summary}
              </p>
              {(ev.reasonCode || ev.resolutionCode || ev.previousValue) && (
                <div className="text-[11px] text-slate-600 bg-white rounded-lg p-2.5 border border-slate-200/70 space-y-0.5">
                  {ev.reasonCode && (
                    <div>
                      Reason Code: <strong>{ev.reasonCode}</strong>
                    </div>
                  )}
                  {ev.resolutionCode && (
                    <div>
                      Resolution Code: <strong>{ev.resolutionCode}</strong>
                    </div>
                  )}
                  {ev.previousValue && (
                    <div>
                      Change: {ev.previousValue} → <strong>{ev.newValue}</strong>
                    </div>
                  )}
                </div>
              )}
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {ev.actorName} ({ev.actorRole})
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
