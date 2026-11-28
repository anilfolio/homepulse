"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function VisitsChart() {
  const { state } = useAgencyStore();
  const totalScheduled = state.visits.length;
  const completedCount = state.visits.filter((v) => v.status === "Completed").length;
  const inProgressCount = state.visits.filter((v) => v.status === "In Progress").length;
  const completionPct =
    totalScheduled > 0 ? Math.round(((completedCount + inProgressCount) / totalScheduled) * 100) : 100;

  const data = [
    { day: "Mon", Scheduled: Math.max(4, Math.round(totalScheduled * 0.7)), Completed: Math.max(3, Math.round(totalScheduled * 0.65)) },
    { day: "Tue", Scheduled: Math.max(5, Math.round(totalScheduled * 0.8)), Completed: Math.max(4, Math.round(totalScheduled * 0.75)) },
    { day: "Today", Scheduled: totalScheduled, Completed: completedCount + inProgressCount },
    { day: "Thu", Scheduled: Math.max(4, totalScheduled - 1), Completed: completedCount },
    { day: "Fri", Scheduled: Math.max(4, totalScheduled), Completed: Math.max(2, completedCount) },
    { day: "Sat", Scheduled: Math.max(2, Math.round(totalScheduled * 0.5)), Completed: Math.max(1, Math.round(completedCount * 0.5)) },
    { day: "Sun", Scheduled: Math.max(2, Math.round(totalScheduled * 0.4)), Completed: Math.max(1, Math.round(completedCount * 0.4)) },
  ];

  return (
    <Card className="h-full flex flex-col bg-white backdrop-blur-xl rounded-2xl p-4 border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:border-brand-teal/60 transition-all duration-300 relative overflow-hidden">
      <CardHeader
        title="Visits & EVV Execution"
        action={<Badge variant="success">{completionPct}% Active / Done</Badge>}
      />
      <div className="flex-1 min-h-[250px] w-full mt-4 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9EC" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7684" }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7684" }} />
            <Tooltip
              cursor={{ fill: "#F4F6F8" }}
              contentStyle={{ borderRadius: "12px", border: "1px solid #E5E9EC", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", color: "#6B7684", paddingTop: "20px" }} />
            <Bar dataKey="Scheduled" fill="#E2E6F3" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Completed" fill="#6C88FF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
