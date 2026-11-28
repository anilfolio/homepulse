"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Filter, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function PipelineSnapshot() {
  const router = useRouter();
  const { state } = useAgencyStore();

  const funnelStages = useMemo(() => {
    const refs = state.referrals;
    return [
      {
        name: "Referral Received",
        count: refs.filter((r) => r.stage === "Referral Received").length,
        color: "bg-blue-500",
      },
      {
        name: "Insurance Verification",
        count: refs.filter((r) => r.stage === "Insurance Verification").length,
        color: "bg-indigo-500",
      },
      {
        name: "Clinical Review",
        count: refs.filter((r) => r.stage === "Clinical Review").length,
        color: "bg-purple-500",
      },
      {
        name: "Assessment Scheduled",
        count: refs.filter((r) => r.stage === "Initial Assessment Scheduled").length,
        color: "bg-fuchsia-500",
      },
      {
        name: "Admitted / Active",
        count: refs.filter((r) => r.stage === "Admitted" || r.stage === "Converted").length,
        color: "bg-brand-teal",
      },
      {
        name: "Non-Admit / Out",
        count: refs.filter(
          (r) => r.partnerStatus === "Not a Fit" || r.partnerStatus === "Referred Elsewhere"
        ).length,
        color: "bg-slate-400",
      },
    ];
  }, [state.referrals]);

  const maxCount = Math.max(1, ...funnelStages.map((s) => s.count));

  return (
    <Card className="flex flex-col h-full bg-white shadow-[0_6px_32px_rgba(0,0,0,0.06)] border border-slate-200">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Live Pipeline Snapshot</h3>
            <p className="text-[11px] text-slate-500">
              {state.referrals.length} total referrals across stages
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-center gap-3">
        {funnelStages.map((stage, idx) => {
          const widthPercent = stage.count === 0 ? 8 : Math.max(18, (stage.count / maxCount) * 100);
          return (
            <div
              key={idx}
              onClick={() => router.push("/intake/pipeline")}
              className="group relative flex items-center gap-3 cursor-pointer"
            >
              <div className="w-36 shrink-0 text-[11px] font-semibold text-slate-600 truncate text-right">
                {stage.name}
              </div>
              <div className="flex-1 flex items-center h-6 bg-slate-100 rounded-r-md relative">
                <div
                  className={cn(
                    "h-full rounded-r-md transition-all duration-500 ease-out",
                    stage.color
                  )}
                  style={{ width: `${widthPercent}%` }}
                />
                <span className="absolute left-2 text-[10px] font-bold text-white drop-shadow-sm">
                  {stage.count}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
