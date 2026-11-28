"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { XCircle, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export default function DenialsPage() {
  const { state, moveClaimStatus, generateAiAppealDraft, logAuditEvent } = useAgencyStore();
  const [appealDrafts, setAppealDrafts] = useState<Record<string, string>>({});

  const deniedClaims = useMemo(
    () => state.claims.filter((c) => c.status === "Denied"),
    [state.claims]
  );

  const handleResubmit = (claimId: string, patientName: string) => {
    moveClaimStatus(claimId, "Submitted");
    logAuditEvent({
      action: "UPDATE",
      resourceType: "Claim",
      resourceId: claimId,
      summary: `Corrected coding/modifier & resubmitted claim for ${patientName}.`,
      status: "Success",
    });
    toast.success(`Claim ${claimId} corrected and resubmitted to clearinghouse`);
  };

  const handleGenerateAppeal = (claimId: string) => {
    const draft = generateAiAppealDraft(claimId);
    setAppealDrafts((prev) => ({ ...prev, [claimId]: draft }));
    toast.success(`AI appeal letter drafted for ${claimId}`);
  };

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Claims Denials Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live denied claims from Revenue Cycle pipeline with 1-click AI appeal drafting &amp; clearinghouse resubmission.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 w-fit">
          {deniedClaims.length} Denied Claim(s)
        </span>
      </div>

      {deniedClaims.length === 0 ? (
        <Card className="p-10 text-center border-emerald-200 bg-emerald-50/40">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900">Zero Denied Claims Open</h3>
          <p className="text-sm text-slate-500 mt-1">All denied claims have been appealed, corrected, or resubmitted.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {deniedClaims.map((claim) => {
            const draft = appealDrafts[claim.id] || claim.appealDraft;
            return (
              <Card key={claim.id} className="p-5 shadow-sm border-slate-200 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex gap-4">
                    <div className="mt-1 bg-rose-100 p-2.5 rounded-xl text-rose-600 h-fit shrink-0">
                      <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-lg">Claim #{claim.id}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {claim.serviceCode} • ${claim.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-700 mt-1.5 space-y-0.5">
                        <p>
                          <strong>Client:</strong> {claim.patientName} • <strong>Payer:</strong> {claim.payer}
                        </p>
                        <p>
                          <strong>Date of Service:</strong> {claim.date} • <strong>Auth #:</strong> {claim.authNumber}
                        </p>
                      </div>
                      <div className="mt-3 bg-rose-50 text-rose-800 p-3 rounded-lg border border-rose-100 text-sm font-medium">
                        <strong>Denial Reason:</strong>{" "}
                        {claim.denialReason || "Missing EVV attestation / payer modifier alignment needed."}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleGenerateAppeal(claim.id)}
                      className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Draft AI Appeal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResubmit(claim.id, claim.patientName)}
                      className="bg-brand-teal text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-teal-600 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Correct &amp; Resubmit
                    </button>
                  </div>
                </div>

                {draft && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    <div className="font-bold text-indigo-700 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> AI-Generated Appeal Letter
                    </div>
                    {draft}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
