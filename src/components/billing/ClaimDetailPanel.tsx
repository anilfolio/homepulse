"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Calendar,
  DollarSign,
  Activity,
  Paperclip,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { AgencyClaim } from "@/types/agency";

interface ClaimDetailPanelProps {
  claim: AgencyClaim;
  onClose: () => void;
}

export function ClaimDetailPanel({ claim, onClose }: ClaimDetailPanelProps) {
  const { state, generateAiAppealDraft, moveClaimStatus } = useAgencyStore();
  const liveClaim = state.claims.find((c) => c.id === claim.id) ?? claim;
  const [appealText, setAppealText] = useState(liveClaim.appealDraft ?? "");

  const patientName = liveClaim.patientName;
  const initials = patientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2);
  const amount = "$" + liveClaim.amount.toLocaleString("en-US") + ".00";

  const handleGenerateAppeal = () => {
    const draft = generateAiAppealDraft(liveClaim.id);
    setAppealText(draft);
    toast.success("AI Appeal letter generated with EVV audit trail evidence.");
  };

  const handleSubmitClaim = () => {
    if (liveClaim.scrubStatus === "Blocked") {
      toast.error("Cannot submit while EVV scrub hold is active.");
      return;
    }
    moveClaimStatus(liveClaim.id, "Submitted");
    toast.success(`Claim ${liveClaim.id} submitted to clearinghouse.`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          className="relative w-full max-w-md bg-white h-full shadow-2xl shadow-slate-300/50 flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Claim Details</h2>
              <p className="text-xs text-slate-500 mt-0.5">{liveClaim.id}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <div className="text-xs font-medium text-slate-400 mb-2">
                Patient Information
              </div>
              <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-bold text-sm uppercase">
                  {initials}
                </div>
                <div>
                  <div className="font-medium text-slate-900 text-base">{patientName}</div>
                  <div className="text-xs text-slate-500">
                    Payer: {liveClaim.payer} • Auth: {liveClaim.authNumber}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-400 mb-2">Claim Summary</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                    <DollarSign className="w-3.5 h-3.5" /> Amount
                  </div>
                  <div className="font-semibold text-slate-900 text-base">{amount}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                    <Activity className="w-3.5 h-3.5" /> Status
                  </div>
                  <div className="font-semibold text-slate-900 text-base">
                    {liveClaim.status}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-1 col-span-2">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                    <Calendar className="w-3.5 h-3.5" /> Pre-Billing Scrub Check
                  </div>
                  <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                    {liveClaim.scrubStatus === "Passed" ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> EVV &amp; Authorization Verified
                      </span>
                    ) : (
                      <span className="text-rose-700">
                        Blocked: {liveClaim.scrubIssues[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-400 mb-2">
                Codes &amp; Authorization
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Service Code (CPT)</span>
                  <span className="text-xs font-medium text-slate-900">
                    {liveClaim.serviceCode}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Authorization Ref</span>
                  <span className="text-xs font-medium text-brand-teal">
                    {liveClaim.authNumber}
                  </span>
                </div>
              </div>
            </div>

            {(liveClaim.status === "Denied" || appealText || liveClaim.appealDraft) && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    AI Denial Appeal Draft
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateAppeal}
                    className="inline-flex items-center gap-1 text-xs font-bold bg-[#141D3C] text-white px-2.5 py-1 rounded-lg hover:bg-[#1E2B58] cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#57EAB6]" />
                    Generate Draft
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={appealText || liveClaim.appealDraft || ""}
                  onChange={(e) => setAppealText(e.target.value)}
                  placeholder="Click Generate Draft to assemble EVV evidence and appeal letter..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            )}

            <div>
              <div className="text-xs font-medium text-slate-400 mb-2">
                Attached EVV Packet
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="w-8 h-8 rounded-lg bg-brand-teal/20 text-brand-teal flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    EVV_Audit_Attestation_{liveClaim.id}.pdf
                  </div>
                  <div className="text-xs text-slate-500">Auto-attached from EVV Store</div>
                </div>
                <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            {liveClaim.status === "Denied" ? (
              <button
                type="button"
                onClick={handleGenerateAppeal}
                className="flex-1 bg-[#141D3C] text-white font-medium py-2.5 rounded-xl hover:bg-[#1E2B58] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-[#57EAB6]" />
                AI Appeal Draft
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmitClaim}
              className="flex-1 bg-brand-teal text-white font-medium py-2.5 rounded-xl hover:bg-brand-teal/90 transition-colors shadow-brand-teal/20 cursor-pointer"
            >
              {liveClaim.status === "Denied" ? "Resubmit Claim" : "Submit Claim"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
