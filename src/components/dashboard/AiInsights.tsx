"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { Sparkles, Users, TrendingUp, AlertCircle, FileText } from "lucide-react";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function AiInsights() {
  const router = useRouter();
  const { state, autoFillAllUnfilled } = useAgencyStore();

  const unfilledCount = state.visits.filter(
    (v) => v.status === "Unfilled" || v.status === "Call-Off"
  ).length;
  const evvHoldCount = state.visits.filter((v) => v.evvCompliance === "Exception").length;
  const expiringAuthClients = state.clients.filter(
    (c) => c.authExpiresInDays <= 7 || c.authorizedUnitsRemaining <= 12
  );
  const deniedClaims = state.claims.filter((c) => c.status === "Denied");
  const draftReady = state.claims.filter(
    (c) => c.status === "Draft" && c.scrubStatus === "Passed"
  );

  return (
    <Card className="flex flex-col h-full bg-white backdrop-blur-xl rounded-2xl p-4 border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:border-brand-teal/60 transition-all duration-300 relative overflow-hidden">
      <CardHeader
        title="All Insights"
        action={
          <button
            type="button"
            onClick={() => autoFillAllUnfilled()}
            className="flex items-center gap-2 bg-[#e6f6f4] text-brand-teal px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-brand-teal/20 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            Auto-Optimize
          </button>
        }
      />

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {/* Staffing */}
        <div
          onClick={() => router.push("/scheduler")}
          className="flex gap-4 p-4 bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-2xl transition-all hover:-translate-y-0.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0 border border-brand-teal/20 shadow-inner group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-slate-800 mb-1 leading-tight">
              Staffing &amp; Dispatch
            </div>
            <div className="text-[11.5px] font-medium text-text-secondary leading-snug">
              {unfilledCount > 0
                ? `${unfilledCount} open/call-off shift(s) awaiting coverage. Smart Dispatch candidates scored and ready.`
                : "All scheduled shifts are currently assigned and covered."}
            </div>
          </div>
        </div>

        {/* Compliance / EVV */}
        <div
          onClick={() => router.push("/evv-monitoring")}
          className="flex gap-4 p-4 bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-2xl transition-all hover:-translate-y-0.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center shrink-0 border border-accent-blue/20 shadow-inner group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-slate-800 mb-1 leading-tight">
              EVV &amp; Compliance
            </div>
            <div className="text-[11.5px] font-medium text-text-secondary leading-snug">
              {evvHoldCount > 0
                ? `${evvHoldCount} EVV exception(s) currently placing billing on hold. Click to review or auto-resolve.`
                : "100% of completed visits are EVV-verified with zero holds."}
            </div>
          </div>
        </div>

        {/* Authorization Risk */}
        <div
          onClick={() => router.push("/billing/authorizations")}
          className="flex gap-4 p-4 bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-2xl transition-all hover:-translate-y-0.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-orange/10 text-accent-orange flex items-center justify-center shrink-0 border border-accent-orange/20 shadow-inner group-hover:scale-110 transition-transform">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-slate-800 mb-1 leading-tight">
              Authorization Risk
            </div>
            <div className="text-[11.5px] font-medium text-text-secondary leading-snug">
              {expiringAuthClients.length > 0
                ? `${expiringAuthClients[0].name} authorization (${expiringAuthClients[0].authNumber}) expires in ${expiringAuthClients[0].authExpiresInDays} days (${expiringAuthClients[0].authorizedUnitsRemaining} hrs left).`
                : "All active patient payer authorizations have healthy unit balances."}
            </div>
          </div>
        </div>

        {/* Financial */}
        <div
          onClick={() => router.push("/billing/workspace")}
          className="flex gap-4 p-4 bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-2xl transition-all hover:-translate-y-0.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-amber/10 text-accent-amber flex items-center justify-center shrink-0 border border-accent-amber/20 shadow-inner group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-slate-800 mb-1 leading-tight">
              Financial &amp; Claims
            </div>
            <div className="text-[11.5px] font-medium text-text-secondary leading-snug">
              {draftReady.length} clean Draft claim(s) ready for 837 batch • {deniedClaims.length} denied claim(s) eligible for AI Appeal drafting.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
