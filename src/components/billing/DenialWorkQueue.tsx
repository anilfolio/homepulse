"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Clock,
  ChevronRight,
  X,
  FileText,
  Activity,
  ShieldCheck,
  FileSignature,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function DenialWorkQueue() {
  const {
    state,
    moveClaimStatus,
    generateAiAppealDraft,
    logAuditEvent,
  } = useAgencyStore();

  const [investigatingId, setInvestigatingId] = useState<string | null>(null);
  const [appealDraftText, setAppealDraftText] = useState<string>("");

  const deniedClaims = useMemo(
    () => state.claims.filter((c) => c.status === "Denied"),
    [state.claims]
  );

  const activeClaim = deniedClaims.find((c) => c.id === investigatingId);
  const linkedVisit = activeClaim?.visitId
    ? state.visits.find((v) => v.id === activeClaim.visitId)
    : undefined;

  const handleAction = (claimId: string, action: "resubmit" | "appeal" | "writeoff") => {
    if (action === "resubmit") {
      moveClaimStatus(claimId, "Submitted");
      toast.success(`Claim ${claimId} corrected and resubmitted.`);
    } else if (action === "appeal") {
      const draft = generateAiAppealDraft(claimId);
      setAppealDraftText(draft);
      moveClaimStatus(claimId, "Pending");
      toast.success(`Appeal packet filed for ${claimId} & moved to Pending Adjudication.`);
    } else {
      logAuditEvent({
        action: "UPDATE",
        resourceType: "Claim",
        resourceId: claimId,
        summary: `Flagged denied claim ${claimId} for contractual write-off review.`,
        status: "Flagged",
      });
      moveClaimStatus(claimId, "Pending");
      toast.info(`Write-off review logged for ${claimId}.`);
    }
    setInvestigatingId(null);
  };

  const handleDraftAiAppeal = () => {
    if (!activeClaim) return;
    const draft = generateAiAppealDraft(activeClaim.id);
    setAppealDraftText(draft);
    toast.success("AI appeal letter drafted using linked EVV telemetry");
  };

  return (
    <div className="bg-white backdrop-blur-xl rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] relative overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          Denial Work Queue
        </h2>
        <p className="text-xs text-slate-500">
          {deniedClaims.length} live denied claim(s) synced from Revenue Cycle &amp; Clearinghouse.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-3 px-4 text-xs text-slate-500 uppercase tracking-wider">Client &amp; Service</th>
              <th className="py-3 px-4 text-xs text-slate-500 uppercase tracking-wider">Payer</th>
              <th className="py-3 px-4 text-xs text-slate-500 uppercase tracking-wider">Denial Reason</th>
              <th className="py-3 px-4 text-xs text-slate-500 uppercase tracking-wider text-right">Amount</th>
              <th className="py-3 px-4 text-xs text-slate-500 uppercase tracking-wider">Aging</th>
              <th className="py-3 px-4 text-xs text-slate-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <AnimatePresence initial={false}>
              {deniedClaims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                    No denied claims currently in queue.
                  </td>
                </tr>
              ) : (
                deniedClaims.map((claim) => (
                  <motion.tr
                    key={claim.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-slate-900 whitespace-nowrap">{claim.patientName}</div>
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        {claim.date} • {claim.id} • {claim.serviceCode}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">{claim.payer}</td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-slate-800 whitespace-nowrap">
                        {claim.denialStatus || "Needs Action"}
                      </div>
                      <div className="text-xs text-slate-500 max-w-[220px] truncate" title={claim.denialReason}>
                        {claim.denialReason || "Authorization or EVV modifier check required"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700 text-right whitespace-nowrap">
                      ${claim.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div
                        className={clsx(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap",
                          "bg-rose-100 text-rose-700"
                        )}
                      >
                        <Clock className="w-3 h-3" />
                        {claim.age}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setAppealDraftText(claim.appealDraft ?? "");
                          setInvestigatingId(claim.id);
                        }}
                        className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 hover:text-brand-teal hover:border-brand-teal px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                      >
                        Investigate
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Investigation Slide-over Panel */}
      <AnimatePresence>
        {activeClaim && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInvestigatingId(null)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]"
            />
            <motion.div
              key="panel"
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl border-l border-slate-200 z-[101] flex flex-col"
            >
              <div className="p-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">Denied</span>
                    <span className="text-slate-500 text-xs">{activeClaim.id}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{activeClaim.patientName}</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {activeClaim.payer} • DOS: {activeClaim.date} • ${activeClaim.amount.toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInvestigatingId(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                  <h4 className="text-rose-800 font-semibold text-sm flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4" />
                    Denial Detail ({activeClaim.denialStatus || "Rejected"})
                  </h4>
                  <p className="text-rose-700 text-xs">
                    {activeClaim.denialReason || "Requires payer scrubber correction or supporting EVV proof."}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wider">Cross-Reference Telemetry</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl p-3 flex gap-3 bg-white">
                      <FileText className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase">Original Claim</div>
                        <div className="text-sm text-slate-900 mt-1">Code: {activeClaim.serviceCode}</div>
                        <div className="text-xs text-slate-500">Scrub: {activeClaim.scrubStatus}</div>
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-3 flex gap-3 bg-white">
                      <Activity className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase">EVV Record</div>
                        <div className="text-sm text-slate-900 mt-1">
                          {linkedVisit
                            ? `${linkedVisit.clockInTime || linkedVisit.scheduledStart} - ${linkedVisit.clockOutTime || linkedVisit.scheduledEnd}`
                            : "Linked Visit Archive"}
                        </div>
                        <div className="text-xs text-emerald-600 font-medium mt-1">
                          {linkedVisit ? `${linkedVisit.evvMethod} (${linkedVisit.gpsDistanceMeters}m)` : "Verified"}
                        </div>
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-3 flex gap-3 bg-white">
                      <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase">Authorization</div>
                        <div className="text-sm text-slate-900 mt-1">{activeClaim.authNumber}</div>
                        <div className="text-xs text-slate-500">Linked to active plan</div>
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-3 flex gap-3 bg-white">
                      <FileSignature className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase">Visit Sign-Off</div>
                        <div className="text-sm text-slate-900 mt-1">
                          {linkedVisit?.signatureCaptured ? "Client Signed" : "Signature Verified / Reason Code"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 uppercase">AI Appeal Draft</span>
                    <button
                      type="button"
                      onClick={handleDraftAiAppeal}
                      className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 hover:bg-indigo-100"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Generate with AI
                    </button>
                  </div>
                  {(appealDraftText || activeClaim.appealDraft) && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap">
                      {appealDraftText || activeClaim.appealDraft}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleAction(activeClaim.id, "resubmit")}
                  className="flex-1 text-xs lg:text-sm bg-brand-teal hover:bg-brand-teal/90 text-white px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer"
                >
                  Correct &amp; Resubmit
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(activeClaim.id, "appeal")}
                  className="flex-1 text-xs lg:text-sm bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer"
                >
                  File Appeal
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(activeClaim.id, "writeoff")}
                  className="flex-1 md:w-auto text-xs lg:text-sm bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer"
                >
                  Write Off
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
