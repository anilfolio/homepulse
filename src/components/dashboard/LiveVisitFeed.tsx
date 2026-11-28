"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function LiveVisitFeed() {
  const { state, getClientById, getCaregiverById } = useAgencyStore();

  const liveFeed = state.visits.slice(0, 6).map((v) => {
    const client = getClientById(v.clientId);
    const cg = getCaregiverById(v.caregiverId);
    const name = cg?.name ?? "Unassigned Shift";
    const initials = name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
    const roleTag = cg?.credentials[0] ?? "OPEN";
    const variant: "success" | "info" | "warning" | "error" =
      v.status === "Completed"
        ? "success"
        : v.status === "In Progress"
          ? "info"
          : v.status === "Unfilled" || v.status === "Call-Off"
            ? "error"
            : "warning";

    return {
      id: v.id,
      time: v.scheduledStart,
      initials,
      name,
      role: roleTag,
      address: `${client?.name ?? v.clientId} • ${client?.address ?? v.region}`,
      status: v.status,
      variant,
    };
  });

  return (
    <Card className="flex flex-col h-full bg-white backdrop-blur-xl rounded-2xl p-4 border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:border-brand-teal/60 transition-all duration-300 relative overflow-hidden">
      <CardHeader
        title="Live visit feed"
        action={
          <Link href="/evv-monitoring">
            <span className="text-brand-teal text-sm font-medium hover:underline cursor-pointer">
              View all →
            </span>
          </Link>
        }
      />

      <div className="flex-1 space-y-3 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {liveFeed.map((item) => (
          <Link
            key={item.id}
            href={`/scheduler/dispatch/visits/${item.id}`}
            className="flex gap-3 items-center bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-2xl p-3 transition-all hover:-translate-y-0.5 group shrink-0"
          >
            <div className="w-14 text-[11px] font-bold text-slate-400 shrink-0 text-right leading-tight">
              {item.time.replace(" ", "\n")}
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0 shadow-inner border border-white/50 bg-brand-teal/10 text-brand-teal")}>
              {item.initials}
            </div>
            <div className="flex-1 min-w-0 flex flex-wrap justify-between items-center gap-2">
              <div className="min-w-0 flex-1 min-w-[140px]">
                <div className="font-bold text-slate-800 text-[13px] truncate flex items-center gap-1.5 mb-0.5 tracking-tight">
                  {item.name}
                  <span className="text-[9px] font-bold text-accent-orange px-1.5 py-0.5 bg-accent-orange/10 rounded-md border border-accent-orange/20 uppercase tracking-wider shrink-0">
                    {item.role}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-text-secondary truncate">
                  {item.address}
                </div>
              </div>
              <Badge variant={item.variant}>{item.status}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
