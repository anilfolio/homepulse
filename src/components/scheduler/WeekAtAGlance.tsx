"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

interface DayCoverage {
  day: string;
  date: string;
  totalShifts: number;
  coveredShifts: number;
  percentage: number;
  isToday?: boolean;
}

export function WeekAtAGlance() {
  const { state } = useAgencyStore();

  const weekCoverage = useMemo<DayCoverage[]>(() => {
    const todayTotal = Math.max(1, state.visits.length);
    const todayCovered = state.visits.filter(
      (v) => v.status !== "Unfilled" && v.status !== "Call-Off"
    ).length;
    const todayPct = Math.round((todayCovered / todayTotal) * 100);

    return [
      { day: "Mon", date: "Day 1", totalShifts: 12, coveredShifts: 12, percentage: 100 },
      { day: "Tue", date: "Day 2", totalShifts: 14, coveredShifts: 13, percentage: 93 },
      { day: "Wed", date: "Day 3", totalShifts: 15, coveredShifts: 14, percentage: 93 },
      {
        day: "Today",
        date: "Live",
        totalShifts: todayTotal,
        coveredShifts: todayCovered,
        percentage: todayPct,
        isToday: true,
      },
      { day: "Fri", date: "Day 5", totalShifts: 14, coveredShifts: 12, percentage: 86 },
      { day: "Sat", date: "Day 6", totalShifts: 10, coveredShifts: 9, percentage: 90 },
      { day: "Sun", date: "Day 7", totalShifts: 9, coveredShifts: 9, percentage: 100 },
    ];
  }, [state.visits]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex flex-wrap items-center gap-2">
              <span>This Week at a Glance</span>
              <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 shrink-0">
                Live Shift Coverage
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Today&apos;s coverage updates automatically with Smart Dispatch &amp; call-offs
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-teal" /> &ge;90% Optimal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> 80–89% Watch
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> &lt;80% Risk
          </span>
        </div>
      </div>

      <div className="flex md:grid md:grid-cols-7 gap-2 sm:gap-3 overflow-x-auto pb-2 pt-1">
        {weekCoverage.map((item, idx) => {
          const isLow = item.percentage < 80;
          const isModerate = item.percentage >= 80 && item.percentage < 90;

          return (
            <motion.div
              key={item.day}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.04 }}
              className={clsx(
                "rounded-xl p-3 border transition-all text-center flex flex-col justify-between relative shrink-0 w-[115px] md:w-auto",
                item.isToday
                  ? "border-brand-teal ring-2 ring-brand-teal/20 bg-teal-50/30 shadow-sm"
                  : "border-slate-200/80 bg-slate-50"
              )}
            >
              <div>
                <div className="text-xs font-bold text-slate-700">{item.day}</div>
                <div className="text-[10px] text-slate-500 font-medium">{item.date}</div>
              </div>

              <div className="my-2">
                <div className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  {item.percentage}%
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {item.coveredShifts}/{item.totalShifts} shifts
                </div>
              </div>

              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all",
                    isLow ? "bg-rose-500" : isModerate ? "bg-amber-500" : "bg-brand-teal"
                  )}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              {isLow && (
                <div className="mt-1.5 text-[10px] font-bold text-rose-600 flex items-center justify-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> Need shifts
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
