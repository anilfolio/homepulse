"use client";

import React, { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { AgencyClaim, AgencyClaimStatus } from "@/types/agency";

const COLUMNS: { id: AgencyClaimStatus; color: string; bg: string }[] = [
  { id: "Draft", color: "bg-slate-400", bg: "bg-slate-50" },
  { id: "Submitted", color: "bg-blue-500", bg: "bg-blue-50/50" },
  { id: "Pending", color: "bg-amber-500", bg: "bg-amber-50/50" },
  { id: "Paid", color: "bg-brand-teal", bg: "bg-brand-teal/5" },
  { id: "Denied", color: "bg-red-500", bg: "bg-red-50/50" },
];

const payerColors = {
  Medicare: { bg: "bg-brand-teal/10", text: "text-brand-teal", dot: "bg-brand-teal" },
  Medicaid: { bg: "bg-blue-500/10", text: "text-blue-600", dot: "bg-blue-500" },
  "Private Pay": { bg: "bg-purple-500/10", text: "text-purple-600", dot: "bg-purple-500" },
  Commercial: { bg: "bg-orange-500/10", text: "text-orange-600", dot: "bg-orange-500" },
};

export function ClaimsPipeline({
  onClaimClick,
}: {
  onClaimClick?: (claim: AgencyClaim) => void;
}) {
  const { state, moveClaimStatus } = useAgencyStore();
  const [draggedClaimId, setDraggedClaimId] = useState<string | null>(null);

  const claims = state.claims;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedClaimId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: AgencyClaimStatus) => {
    e.preventDefault();
    const id = draggedClaimId || e.dataTransfer.getData("text/plain");
    if (id) {
      const target = claims.find((c) => c.id === id);
      if (target && status === "Submitted" && target.scrubStatus === "Blocked") {
        toast.error(`Claim ${target.id} is blocked by EVV Scrub Gate. Resolve exception first.`);
        setDraggedClaimId(null);
        return;
      }
      moveClaimStatus(id, status);
      toast.success(`Moved claim ${id} to ${status}`);
    }
    setDraggedClaimId(null);
  };

  return (
    <Card className="bg-white backdrop-blur-xl rounded-2xl p-4 border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:border-brand-teal/60 transition-all duration-300 relative overflow-hidden">
      <CardHeader
        title="Claims Pipeline"
        action={
          <span className="text-slate-500 text-xs">
            Drag cards between columns, or open a claim for AI Appeal &amp; details.
          </span>
        }
      />

      <div className="flex gap-4 overflow-x-auto pb-4 mt-2 min-h-[360px]">
        {COLUMNS.map((column) => {
          const colClaims = claims.filter((c) => c.status === column.id);
          const totalValue = colClaims.reduce((sum, c) => sum + c.amount, 0);

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className={clsx(
                "min-w-[235px] flex-1 rounded-2xl p-3 border border-slate-200/80 flex flex-col gap-3",
                column.bg
              )}
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={clsx("w-2.5 h-2.5 rounded-full", column.color)} />
                  <span className="font-bold text-sm text-slate-900">{column.id}</span>
                  <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {colClaims.length}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-700">
                  ${totalValue.toLocaleString("en-US")}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {colClaims.map((claim) => {
                  const pStyle = payerColors[claim.payer];
                  return (
                    <motion.div
                      key={claim.id}
                      layout
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e as unknown as React.DragEvent, claim.id)
                      }
                      onClick={() => onClaimClick?.(claim)}
                      className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs hover:shadow-md hover:border-brand-teal/50 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-500">
                          {claim.id}
                        </span>
                        <span
                          className={clsx(
                            "px-1.5 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1",
                            pStyle.bg,
                            pStyle.text
                          )}
                        >
                          <span className={clsx("w-1.5 h-1.5 rounded-full", pStyle.dot)} />
                          {claim.payer}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-slate-900 truncate">
                        {claim.patientName}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-sm font-extrabold text-slate-900">
                          ${claim.amount.toLocaleString("en-US")}
                        </span>
                        {claim.scrubStatus === "Blocked" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            EVV Hold
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {claim.age || claim.date}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
