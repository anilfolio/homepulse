"use client";

import React, { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { FileText, Send, CheckCircle2, Clock, AlertCircle, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function AutoInvoicing() {
  const { state, processDraftInvoices, markInvoicePaid } = useAgencyStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const invoices = state.invoices;
  const draftCount = invoices.filter((inv) => inv.status === "Draft").length;

  const handleProcess = () => {
    if (draftCount === 0) {
      toast.info("All draft invoices have already been dispatched.");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      const processed = processDraftInvoices();
      setIsProcessing(false);
      toast.success(`Dispatched ${processed} private-pay draft invoice(s).`);
    }, 500);
  };

  return (
    <Card className="bg-white backdrop-blur-xl rounded-2xl p-4 border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] h-full">
      <CardHeader
        title="Auto-Invoicing Pipeline"
        action={
          <button
            type="button"
            onClick={handleProcess}
            disabled={isProcessing || draftCount === 0}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {isProcessing ? "Processing..." : `Process Drafts (${draftCount})`}
          </button>
        }
      />

      <div className="mt-4 space-y-3">
        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-sm text-indigo-900">
            Completed EVV visits for Private-Pay clients automatically convert into{" "}
            <strong>{draftCount} Draft invoice(s)</strong> ready for 5:00 PM dispatch.
          </div>
        </div>

        <AnimatePresence>
          {invoices.map((inv) => (
            <motion.div
              key={inv.id}
              layout
              className={clsx(
                "p-3 rounded-xl border flex flex-col gap-3",
                inv.status === "Draft"
                  ? "bg-white border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)]"
                  : "bg-slate-50 border-slate-200"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "p-2 rounded-lg",
                      inv.status === "Paid"
                        ? "bg-green-100 text-green-600"
                        : inv.status === "Sent"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{inv.clientName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {inv.id} • {inv.visitCount} visit(s) ({inv.totalHours}h)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">
                    ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div
                    className={clsx(
                      "flex items-center justify-end gap-1 text-[10px] font-bold mt-1",
                      inv.status === "Draft"
                        ? "text-amber-600"
                        : inv.status === "Paid"
                        ? "text-green-600"
                        : "text-blue-600"
                    )}
                  >
                    {inv.status === "Draft" ? (
                      <Clock className="w-3 h-3" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    {inv.status}
                  </div>
                </div>
              </div>

              {inv.status !== "Paid" && (
                <div className="bg-slate-50 p-2 rounded-lg text-xs flex justify-between items-center border border-slate-100">
                  <span className="text-slate-500">
                    Schedule:{" "}
                    <span className="font-semibold text-slate-700">{inv.scheduledDateLabel}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      markInvoicePaid(inv.id);
                      toast.success(`Invoice ${inv.id} recorded as Paid.`);
                    }}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    <DollarSign className="w-3 h-3" /> Mark Paid
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
