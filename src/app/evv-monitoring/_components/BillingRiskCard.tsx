"use client";

import React from "react";
import { AlertTriangle, ShieldAlert, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface BillingRiskCardProps {
  totalRisk: number;
  likelyDenied: number;
  needsReview: number;
  onResolveClick?: () => void;
}

export function BillingRiskCard({
  totalRisk,
  likelyDenied,
  needsReview,
  onResolveClick,
}: BillingRiskCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 border border-red-200/70 shadow-[0_8px_32px_rgba(239,68,68,0.06)] hover:shadow-[0_14px_38px_rgba(239,68,68,0.10)] transition-all duration-300 relative overflow-hidden h-full flex flex-col min-h-0"
    >
      {/* Top hairline accent */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-400" />
      <ShieldAlert className="absolute -right-6 -bottom-6 w-32 h-32 text-red-100/50 pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col justify-between min-h-0 gap-3">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-red-100/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Billing Hold Exposure
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 shrink-0">
            Pre-Claim Gate
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar pr-1 space-y-3">
          <div>
            <div className="text-3xl font-black text-red-600 tracking-tight tabular-nums">
              $
              {totalRisk.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-slate-500 text-xs font-medium mt-1">
              Held pending EVV resolution or aggregator acceptance
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-50/90 p-3 rounded-xl border border-slate-200/70">
              <span className="text-xs font-semibold text-slate-600">
                Open Exceptions
              </span>
              <span className="font-bold text-slate-900 text-sm tabular-nums">
                $
                {needsReview.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center bg-red-50/50 p-3 rounded-xl border border-red-100">
              <span className="text-xs font-semibold text-red-800">
                Aggregator Rejections
              </span>
              <span className="font-bold text-red-600 text-sm tabular-nums">
                $
                {likelyDenied.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onResolveClick}
          className="w-full shrink-0 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md shadow-red-600/20 active:scale-[0.98] cursor-pointer"
        >
          <span>Review & Resolve Holds</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
