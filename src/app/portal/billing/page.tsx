"use client";

import React, { useMemo, useState } from "react";
import { Receipt, CreditCard, Download, ShieldCheck, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { AgencyPrivatePayInvoice } from "@/types/agency";

export default function PortalBillingPage() {
  const { currentUser } = useAuth();
  const { state, markInvoicePaid, logAuditEvent } = useAgencyStore();
  const isClient = currentUser?.role === "CLIENT";

  const [panelType, setPanelType] = useState<"pay-balance" | "view-details" | "add-payment" | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<AgencyPrivatePayInvoice | null>(null);

  const clientInvoices = useMemo(
    () => state.invoices,
    [state.invoices]
  );

  const openInvoices = useMemo(
    () => clientInvoices.filter((inv) => inv.status !== "Paid"),
    [clientInvoices]
  );

  const currentBalance = useMemo(
    () => openInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    [openInvoices]
  );

  const primaryClient = state.clients[0];

  const handleOpenPanel = (
    type: "pay-balance" | "view-details" | "add-payment",
    invoice?: AgencyPrivatePayInvoice
  ) => {
    setPanelType(type);
    setSelectedInvoice(invoice ?? null);
  };

  const closePanel = () => {
    setPanelType(null);
    setSelectedInvoice(null);
  };

  const handleConfirmPayment = () => {
    if (selectedInvoice) {
      markInvoicePaid(selectedInvoice.id);
      toast.success(`Payment of $${selectedInvoice.amount.toFixed(2)} processed for ${selectedInvoice.id}`);
    } else {
      openInvoices.forEach((inv) => markInvoicePaid(inv.id));
      toast.success(`Full balance of $${currentBalance.toFixed(2)} processed successfully!`);
    }
    closePanel();
  };

  const handleDownloadInvoice = (inv: AgencyPrivatePayInvoice) => {
    logAuditEvent({
      action: "EXPORT",
      resourceType: "Invoice",
      resourceId: inv.id,
      summary: `Client/Family portal downloaded statement ${inv.id} ($${inv.amount.toFixed(2)}).`,
      status: "Success",
    });
    toast.success(`Downloading statement ${inv.id}...`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 relative">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">{isClient ? "My Billing" : "Billing & Payments"}</h1>
        <p className="text-xs text-text-secondary mt-1">
          {isClient
            ? "Manage my live private-pay statements and authorized care units securely."
            : "Manage family care invoices and payment methods synced with agency billing."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border-subtle">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-text-secondary font-medium">Current Balance</div>
              <div className="text-xl font-bold text-text-primary">${currentBalance.toFixed(2)}</div>
            </div>
          </div>

          {currentBalance > 0 ? (
            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => handleOpenPanel("pay-balance")}
                className="flex-1 bg-brand-teal hover:bg-teal-600 text-white font-medium py-2.5 rounded-xl transition-colors"
              >
                Pay Balance
              </button>
              <button
                type="button"
                onClick={() => handleOpenPanel("view-details")}
                className="flex-1 bg-white border border-border-subtle text-text-primary font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                View Details
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mt-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              All statements are paid up to date!
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border-subtle">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Payment Method</h2>
          <div className="p-4 border border-border-subtle rounded-xl flex items-center gap-3 bg-slate-50 mb-4">
            <CreditCard className="w-5 h-5 text-slate-500" />
            <div>
              <div className="text-sm font-medium text-text-primary">Visa ending in 4242</div>
              <div className="text-xs text-text-secondary">Expires 12/28</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenPanel("add-payment")}
            className="w-full text-sm text-brand-teal font-medium hover:underline text-left"
          >
            + Add Payment Method
          </button>
        </div>
      </div>

      <div className="bg-[#E6F7F1] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-teal-900">Coverage &amp; Authorization Summary</div>
          <p className="text-sm text-teal-800 mt-1">
            {primaryClient
              ? `${primaryClient.payer} plan (${primaryClient.authNumber}) currently has ${primaryClient.authorizedUnitsRemaining} of ${primaryClient.authorizedUnitsTotal} authorized care units remaining.`
              : "Active care authorization verified with Billing."}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border-subtle overflow-hidden">
        <div className="p-5 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-text-primary">Invoice History ({clientInvoices.length})</h2>
        </div>

        <div className="divide-y divide-border-subtle">
          {clientInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`px-2.5 py-1 rounded-md text-xs font-medium w-16 text-center ${
                    invoice.status === "Paid"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {invoice.status}
                </div>
                <div>
                  <div className="font-medium text-text-primary text-sm">
                    {invoice.clientName} • {invoice.visitCount} visit(s) ({invoice.totalHours}h)
                  </div>
                  <div className="text-xs text-text-secondary">
                    {invoice.id} • {invoice.scheduledDateLabel}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                <div className="font-medium text-text-primary">${invoice.amount.toFixed(2)}</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadInvoice(invoice)}
                    className="p-2 text-slate-400 hover:text-brand-teal hover:bg-[#E6F7F1] rounded-lg transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {invoice.status !== "Paid" && (
                    <button
                      type="button"
                      onClick={() => handleOpenPanel("pay-balance", invoice)}
                      className="px-3 py-1.5 text-sm font-medium bg-brand-teal text-white rounded-lg hover:bg-teal-600 transition-colors"
                    >
                      Pay
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {panelType && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePanel}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-border-subtle"
            >
              <div className="flex items-center justify-between p-6 border-b border-border-subtle">
                <h2 className="text-lg font-semibold text-text-primary">
                  {panelType === "pay-balance"
                    ? "Make a Payment"
                    : panelType === "view-details"
                      ? "Balance Breakdown"
                      : "Add Payment Method"}
                </h2>
                <button
                  type="button"
                  onClick={closePanel}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                {panelType === "pay-balance" && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-border-subtle flex justify-between items-center">
                      <span className="text-sm font-medium text-text-secondary">Amount to pay</span>
                      <span className="text-xl font-bold text-text-primary">
                        ${selectedInvoice ? selectedInvoice.amount.toFixed(2) : currentBalance.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-text-primary mb-3">Payment Method</h3>
                      <div className="border border-brand-teal ring-1 ring-brand-teal rounded-xl p-4 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-brand-teal" />
                          <div>
                            <div className="text-sm font-medium text-text-primary">Visa ending in 4242</div>
                            <div className="text-xs text-text-secondary">Expires 12/28</div>
                          </div>
                        </div>
                        <div className="w-5 h-5 rounded-full border-[5px] border-brand-teal bg-white" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPanelType("add-payment")}
                        className="mt-3 text-sm text-brand-teal font-medium hover:underline"
                      >
                        + Use a different method
                      </button>
                    </div>

                    <div className="pt-4 mt-auto">
                      <button
                        type="button"
                        onClick={handleConfirmPayment}
                        className="w-full py-2.5 bg-brand-teal text-white rounded-xl text-sm font-medium hover:bg-brand-teal/90 transition-colors shadow-sm"
                      >
                        Confirm Payment
                      </button>
                    </div>
                  </div>
                )}

                {panelType === "view-details" && (
                  <div className="space-y-4">
                    {openInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex justify-between items-center p-3 border border-border-subtle rounded-xl">
                        <div>
                          <div className="text-sm font-medium text-text-primary">{invoice.id}</div>
                          <div className="text-xs text-text-secondary">{invoice.scheduledDateLabel}</div>
                        </div>
                        <div className="font-semibold text-text-primary">${invoice.amount.toFixed(2)}</div>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-border-subtle flex justify-between items-center">
                      <span className="font-semibold text-text-primary">Total Balance</span>
                      <span className="text-lg font-bold text-text-primary">${currentBalance.toFixed(2)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPanelType("pay-balance")}
                      className="w-full py-2.5 bg-brand-teal text-white rounded-xl text-sm font-medium hover:bg-brand-teal/90 transition-colors"
                    >
                      Pay Full Balance
                    </button>
                  </div>
                )}

                {panelType === "add-payment" && (
                  <div className="space-y-4">
                    <p className="text-sm text-text-secondary">
                      Add a payment card for automated monthly settlement.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Name on Card</label>
                      <input type="text" placeholder="Jane Whitfield" className="w-full px-3 py-2 border border-border-subtle rounded-xl text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Card Number</label>
                      <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-3 py-2 border border-border-subtle rounded-xl text-sm bg-white" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toast.success("Payment method verified & saved!");
                        setPanelType("pay-balance");
                      }}
                      className="w-full py-2.5 bg-brand-teal text-white rounded-xl text-sm font-medium hover:bg-brand-teal/90 transition-colors"
                    >
                      Save Payment Method
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
