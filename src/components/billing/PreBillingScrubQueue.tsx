"use client";

import React from "react";
import { CheckCircle2, ArrowRight, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import Link from "next/link";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function PreBillingScrubQueue() {
  const { state, moveClaimStatus, releaseClearedClaimsBatch } = useAgencyStore();

  const draftClaims = state.claims.filter((c) => c.status === "Draft");
  const cleanClaims = draftClaims.filter((c) => c.scrubStatus === "Passed");
  const blockedClaims = draftClaims.filter((c) => c.scrubStatus === "Blocked");

  const handleSubmitSingle = (claimId: string) => {
    moveClaimStatus(claimId, "Submitted");
    toast.success(`Claim ${claimId} submitted to 837 clearinghouse.`);
  };

  const handleSubmitAllClean = () => {
    const count = releaseClearedClaimsBatch();
    if (count > 0) {
      toast.success(`Successfully submitted ${count} scrubbed claim(s).`);
    }
  };

  if (draftClaims.length === 0) {
    return (
      <div className="bg-white backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mb-3">
          <CheckCircle2 className="w-7 h-7 text-brand-teal" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Pre-Billing Queue Cleared</h3>
        <p className="text-sm text-slate-500 mt-1">
          All completed EVV visits have been scrubbed and submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white backdrop-blur-xl rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] relative overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Pre-Billing Scrub Queue</h2>
          <p className="text-xs text-slate-500 mt-1">
            {cleanClaims.length} clean & ready • {blockedClaims.length} blocked on EVV/Auth
          </p>
        </div>
        {cleanClaims.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            className="bg-brand-teal hover:bg-brand-teal/90 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all cursor-pointer"
            onClick={handleSubmitAllClean}
          >
            Submit All Clean ({cleanClaims.length})
          </motion.button>
        )}
      </div>

      <div className="divide-y divide-slate-200">
        <AnimatePresence initial={false}>
          {draftClaims.map((claim) => {
            const isClean = claim.scrubStatus === "Passed";
            const firstIssue = claim.scrubIssues[0] ?? "EVV or authorization review needed";
            const fixRoute = firstIssue.toLowerCase().includes("auth")
              ? "/billing/authorizations"
              : "/evv-monitoring";

            return (
              <motion.div
                key={claim.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={clsx(
                  "px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4",
                  !isClean && "bg-rose-50/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={clsx(
                      "p-2 rounded-xl shrink-0 mt-0.5",
                      isClean ? "bg-teal-100 text-brand-teal" : "bg-rose-100 text-rose-600"
                    )}
                  >
                    {isClean ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {claim.patientName}
                      </span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-slate-600 text-xs">
                        {claim.id} ({claim.payer})
                      </span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="font-semibold text-sm text-slate-800">
                        ${claim.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1">
                      {isClean ? (
                        <span className="text-xs font-semibold text-brand-teal bg-teal-50 px-2.5 py-0.5 rounded-full">
                          Clean & Scrubbed ({claim.serviceCode})
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          Blocked: {firstIssue}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center shrink-0">
                  {isClean ? (
                    <button
                      type="button"
                      onClick={() => handleSubmitSingle(claim.id)}
                      className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Submit 837 Claim
                    </button>
                  ) : (
                    <Link
                      href={fixRoute}
                      className="w-full md:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-700 hover:text-rose-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Resolve Blocker
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
