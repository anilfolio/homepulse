"use client";

import React from "react";
import { TopOffender } from "../types";
import clsx from "clsx";

interface OffenderRowProps {
  offender: TopOffender;
  onSelectCaregiver?: (caregiverName: string) => void;
}

export function OffenderRow({ offender, onSelectCaregiver }: OffenderRowProps) {
  const initials = offender.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onSelectCaregiver?.(offender.name)}
      className="w-full text-left flex items-center justify-between p-3 rounded-xl transition-all bg-slate-50/75 border border-slate-200/70 hover:bg-white hover:border-brand-primary/40 hover:shadow-xs cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/90 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 group-hover:from-brand-primary/15 group-hover:to-brand-primary/5 group-hover:text-brand-primary transition-colors">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm leading-snug truncate">
              {offender.name}
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
              {offender.caregiverCode}
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
            Primary issue: <span className="text-slate-700">{offender.mostCommonType}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div className="font-extrabold text-slate-900 text-sm tabular-nums">
            {offender.exceptionCount}
          </div>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            EXCEPTIONS
          </div>
        </div>

        <div
          className={clsx(
            "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border",
            offender.trend === "worsening"
              ? "bg-red-50 text-red-600 border-red-200"
              : offender.trend === "improving"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-slate-50 text-slate-500 border-slate-200"
          )}
          title={`Trend: ${offender.trend}`}
        >
          {offender.trend === "worsening" && "↗"}
          {offender.trend === "improving" && "↘"}
          {offender.trend === "stable" && "—"}
        </div>
      </div>
    </button>
  );
}
