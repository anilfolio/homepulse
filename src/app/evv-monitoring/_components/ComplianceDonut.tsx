"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 shadow-[0_6px_32px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all duration-200 h-full flex flex-col justify-between"
    >
      <div>
        <h3 className="text-sm font-bold text-slate-900">Exception Breakdown</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Click any category to filter the Exceptions queue.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 items-center gap-4 min-h-[210px] mt-2">
        <div className="relative w-full h-[195px] flex items-center justify-center">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {overallCompliance}%
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Compliant
            </span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={74}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                onClick={(entry) => onSegmentClick(String(entry.name))}
                className="cursor-pointer focus:outline-none"
                animationBegin={50}
                animationDuration={500}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={COLORS[entry.name] || "#CBD5E1"}
                    opacity={activeIndex === undefined || activeIndex === index ? 1 : 0.6}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    className="transition-opacity duration-200 outline-none"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
                itemStyle={{ color: "#0F172A", fontWeight: 600, fontSize: "12px" }}
                formatter={(value, name) => [`${value} Visits`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 pr-1">
          {data.map((item) => (
            <button
              type="button"
              key={item.name}
              onClick={() => onSegmentClick(item.name)}
              className="w-full flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[item.name] || "#CBD5E1" }}
                />
                <span className="text-slate-700 font-medium truncate">{item.name}</span>
              </div>
              <span className="font-bold text-slate-900 ml-2 shrink-0">{item.value}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
