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
      className="w-full text-left flex items-center justify-between p-3 rounded-xl transition-all bg-slate-50/70 border border-slate-100 hover:bg-slate-100/80 hover:border-slate-200 cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-slate-200/80 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-300/40">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm leading-snug truncate">
              {offender.name}
            </span>
            <span className="text-[10px] font-mono text-slate-400 shrink-0">
              {offender.caregiverCode}
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium truncate">
            Primary issue: {offender.mostCommonType}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div className="font-extrabold text-slate-900 text-sm">{offender.exceptionCount}</div>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            EXCEPTIONS
          </div>
        </div>

        <div
          className={clsx(
            "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border",
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
