"use client";

import React from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { clsx } from "clsx";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { AgencyClaim } from "@/types/agency";

const payerColors = {
  Medicare: { bg: "bg-brand-teal/10", text: "text-brand-teal", dot: "bg-brand-teal" },
  Medicaid: { bg: "bg-blue-500/10", text: "text-blue-600", dot: "bg-blue-500" },
  "Private Pay": { bg: "bg-purple-500/10", text: "text-purple-600", dot: "bg-purple-500" },
  Commercial: { bg: "bg-orange-500/10", text: "text-orange-600", dot: "bg-orange-500" },
};

export function DeniedClaims({
  onClaimClick,
}: {
  onClaimClick?: (claim: AgencyClaim) => void;
}) {
  const { state, generateAiAppealDraft, moveClaimStatus } = useAgencyStore();
  const deniedClaims = state.claims.filter((c) => c.status === "Denied");

  return (
    <Card className="bg-white backdrop-blur-xl rounded-2xl p-4 border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:border-brand-teal/60 transition-all duration-300 relative overflow-hidden flex flex-col h-full">
      <CardHeader
        title="Denied Claims"
        action={
          <span className="text-slate-500 text-xs">
            Use AI Appeal Draft or manual resubmit.
          </span>
        }
      />

      <div className="overflow-x-auto flex-1 mt-2 border border-slate-200 rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 font-medium">Patient</th>
              <th className="px-3 py-2.5 font-medium">Payer</th>
              <th className="px-3 py-2.5 font-medium">Claim</th>
              <th className="px-3 py-2.5 font-medium">Reason</th>
              <th className="px-3 py-2.5 font-medium text-right">Amount</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {deniedClaims.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">
                  Zero denied claims awaiting action.
                </td>
              </tr>
            ) : (
              deniedClaims.map((claim) => {
                const pStyle = payerColors[claim.payer];
                return (
                  <tr
                    key={claim.id}
                    className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => onClaimClick?.(claim)}
                  >
                    <td className="px-3 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {claim.patientName}
                    </td>
                    <td className="px-3 py-3">
                      <div
                        className={clsx(
                          "inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-medium items-center gap-1",
                          pStyle.bg,
                          pStyle.text
                        )}
                      >
                        <div className={clsx("w-1 h-1 rounded-full", pStyle.dot)} />
                        {claim.payer}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {claim.id}
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap border border-red-200 bg-red-50 text-red-700">
                        {claim.denialReason || "Authorization / Documentation"}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-800 text-right">
                      ${claim.amount.toLocaleString("en-US")}
                    </td>
                    <td className="px-3 py-3 text-slate-600 text-xs whitespace-nowrap">
                      {claim.denialStatus || "Needs Action"}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="text-[10px] font-bold text-white bg-[#141D3C] px-2.5 py-1 rounded hover:bg-[#1E2B58] transition-colors inline-flex items-center gap-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateAiAppealDraft(claim.id);
                            onClaimClick?.(claim);
                            toast.success(`AI Appeal Draft ready for ${claim.id}`);
                          }}
                        >
                          <Sparkles className="w-3 h-3 text-[#57EAB6]" />
                          AI Appeal
                        </button>
                        <button
                          type="button"
                          className="text-[10px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 hover:text-brand-teal transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveClaimStatus(claim.id, "Submitted");
                            toast.success(`Resubmitted ${claim.id} to clearinghouse.`);
                          }}
                        >
                          Resubmit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
