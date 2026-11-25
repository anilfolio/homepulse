"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS: Record<string, string> = {
  "Location Mismatch": "#F59E0B",
  "Missed In": "#EF4444",
  "Missed Out": "#F97316",
  "Missed Call": "#DC2626",
  "Time Variance": "#EAB308",
  "Verification Missing": "#8B5CF6",
};

interface ComplianceDonutProps {
  data: { name: string; value: number }[];
  overallCompliance: number;
  onSegmentClick: (name: string) => void;
}

export function ComplianceDonut({
  data,
  overallCompliance,
  onSegmentClick,
}: ComplianceDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>();

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  const totalExceptions = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 shadow-[0_8px_32px_rgba(20,29,60,0.04)] hover:shadow-[0_12px_36px_rgba(20,29,60,0.07)] hover:border-brand-primary/30 transition-all duration-300 h-full flex flex-col min-h-0"
    >
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 tracking-tight">
            <PieChartIcon className="w-4 h-4 text-brand-primary" />
            Exception Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click a segment to filter Exceptions
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 tabular-nums shrink-0">
          {totalExceptions} Total
        </span>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-12 items-center gap-3 pt-3">
        <div className="sm:col-span-6 relative w-full h-[185px] flex items-center justify-center">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
              {overallCompliance}%
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Compliant
            </span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={74}
                paddingAngle={3}
                cornerRadius={4}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                onClick={(entry) => onSegmentClick(String(entry.name))}
                className="cursor-pointer focus:outline-none"
                animationBegin={40}
                animationDuration={500}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={COLORS[entry.name] || "#CBD5E1"}
                    opacity={
                      activeIndex === undefined || activeIndex === index
                        ? 1
                        : 0.45
                    }
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    className="transition-opacity duration-200 outline-none"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E2E6F3",
                  backgroundColor: "rgba(255,255,255,0.96)",
                  boxShadow: "0 10px 30px rgba(20,29,60,0.12)",
                }}
                itemStyle={{
                  color: "#141D3C",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
                formatter={(value, name) => [`${value} Visit(s)`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="sm:col-span-6 max-h-[205px] overflow-y-auto thin-scrollbar pr-1.5 space-y-1.5">
          {data.map((item, idx) => (
            <button
              type="button"
              key={item.name}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(undefined)}
              onClick={() => onSegmentClick(item.name)}
              className="w-full flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-slate-200/70 transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-xs"
                  style={{ backgroundColor: COLORS[item.name] || "#CBD5E1" }}
                />
                <span className="text-slate-700 font-semibold truncate">
                  {item.name}
                </span>
              </div>
              <span className="font-bold text-slate-900 ml-2 shrink-0 tabular-nums bg-slate-100/80 px-2 py-0.5 rounded-md text-[11px]">
                {item.value}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
