"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { History, Mail, MessageCircle, Clock, CheckCircle2 } from "lucide-react";
import { Card, cn } from "@/components/ui/Card";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function FollowUpQueue() {
  const router = useRouter();
  const { state, updateReferral, logAuditEvent } = useAgencyStore();
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const followUpLeads = useMemo(() => {
    return state.referrals
      .filter(
        (r) =>
          r.stage !== "Admitted" &&
          r.stage !== "Converted" &&
          r.partnerStatus !== "Not a Fit" &&
          r.partnerStatus !== "Referred Elsewhere" &&
          !completedIds.has(r.id)
      )
      .sort((a, b) => b.daysInStage - a.daysInStage)
      .slice(0, 5);
  }, [state.referrals, completedIds]);

  const handleFollowUp = (referralId: string, channel: "email" | "text") => {
    const target = state.referrals.find((r) => r.id === referralId);
    if (!target) return;

    const nextIndex = target.communications.length + 1;
    setCompletedIds((prev) => new Set(prev).add(referralId));
    updateReferral({
      ...target,
      daysInStage: 0,
      communications: [
        {
          id: `comm-${target.id}-${nextIndex}`,
          timestamp: new Date().toISOString(),
          author: "Intake Coordinator",
          type: channel,
          content: `Sent ${channel.toUpperCase()} follow-up to ${target.clientName} / ${target.referringParty}.`,
        },
        ...target.communications,
      ],
    });
    logAuditEvent({
      action: "MESSAGE_SENT",
      resourceType: "Communication",
      resourceId: referralId,
      summary: `Intake sent ${channel.toUpperCase()} follow-up for referral ${referralId}.`,
    });
    toast.success(`Follow-up ${channel.toUpperCase()} logged for ${target.clientName}.`);
  };

  return (
    <Card className="flex flex-col h-full bg-white shadow-[0_6px_32px_rgba(0,0,0,0.06)] border border-slate-200">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Follow-Up Queue</h3>
            <p className="text-[11px] text-slate-500">Live referrals awaiting coordinator touch</p>
          </div>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          {followUpLeads.length} Due
        </div>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {followUpLeads.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-40 text-slate-400"
            >
              <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-400 opacity-50" />
              <p className="text-sm font-medium">All active referrals followed up today.</p>
            </motion.div>
          ) : (
            followUpLeads.map((lead) => {
              const isVeryStale = lead.daysInStage >= 2 || lead.urgency === "High";
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  key={lead.id}
                  className={cn(
                    "mb-3 p-3.5 rounded-xl border transition-colors relative overflow-hidden cursor-pointer",
                    isVeryStale
                      ? "bg-amber-50/40 border-amber-200 hover:border-amber-300"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  )}
                  onClick={() => router.push("/intake/referrals")}
                >
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "font-bold text-sm truncate",
                            isVeryStale ? "text-amber-800" : "text-slate-900"
                          )}
                        >
                          {lead.clientName}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {lead.stage}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 line-clamp-1 mb-2">
                        {lead.intakeNotes || lead.serviceRequested || "Awaiting coordinator action"}
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          isVeryStale
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        <Clock className="w-3 h-3" />
                        {lead.daysInStage}d in stage • {lead.referringParty}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleFollowUp(lead.id, "email")}
                        className="flex items-center justify-center p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg cursor-pointer"
                        title="Log Email Follow-Up"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFollowUp(lead.id, "text")}
                        className="flex items-center justify-center p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg cursor-pointer"
                        title="Log SMS Follow-Up"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
