"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, FileWarning, ShieldAlert, ArrowRight, ChevronDown, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function PreBillingScrubGate() {
  const {
    state,
    autoResolveMinorEvv,
    releaseClearedClaimsBatch,
  } = useAgencyStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const blockedClaims = useMemo(
    () => state.claims.filter((c) => c.scrubStatus === "Blocked"),
    [state.claims]
  );

  const openEvvExceptions = useMemo(
    () =>
      state.visits.filter(
        (v) => v.evvCompliance === "Exception" && v.status === "Completed"
      ),
    [state.visits]
  );

  const readyDraftClaims = useMemo(
    () =>
      state.claims.filter(
        (c) => c.status === "Draft" && c.scrubStatus === "Passed"
      ),
    [state.claims]
  );

  const lowAuthClients = useMemo(
    () => state.clients.filter((c) => c.authorizedUnitsRemaining <= 10),
    [state.clients]
  );

  const scrubItems = useMemo(() => {
    const items: {
      id: string;
      type: string;
      count: number;
      amount: number;
      urgent: boolean;
      details: string[];
      canAutoResolve: boolean;
    }[] = [];

    if (blockedClaims.length > 0 || openEvvExceptions.length > 0) {
      const amount = blockedClaims.reduce((sum, c) => sum + c.amount, 0);
      items.push({
        id: "evv-exceptions",
        type: "EVV Exceptions",
        count: Math.max(blockedClaims.length, openEvvExceptions.length),
        amount,
        urgent: true,
        details: [
          ...blockedClaims.map(
            (c) => `${c.id} (${c.patientName}) — ${c.scrubIssues[0] ?? "EVV Hold"}`
          ),
          ...openEvvExceptions
            .filter((v) => !blockedClaims.some((c) => c.visitId === v.id))
            .map((v) => `${v.evvId} — ${v.exceptionDetail}`),
        ],
        canAutoResolve: openEvvExceptions.length > 0,
      });
    }

    if (lowAuthClients.length > 0) {
      items.push({
        id: "auth-alerts",
        type: "Low Authorization Units",
        count: lowAuthClients.length,
        amount: lowAuthClients.length * 180,
        urgent: false,
        details: lowAuthClients.map(
          (c) => `${c.name} (${c.authNumber}) — ${c.authorizedUnitsRemaining} hrs left`
        ),
        canAutoResolve: false,
      });
    }

    return items;
  }, [blockedClaims, lowAuthClients, openEvvExceptions]);

  const totalBlocked = blockedClaims.reduce((acc, curr) => acc + curr.amount, 0);

  const handleAutoResolveEvv = () => {
    const resolved = autoResolveMinorEvv();
    if (resolved > 0) {
      toast.success(`Resolved ${resolved} EVV exception(s) & released blocked claims!`);
    } else {
      toast.info("No completed EVV exceptions awaiting auto-resolution.");
    }
  };

  const handleGenerate837Batch = () => {
    const submitted = releaseClearedClaimsBatch();
    if (submitted > 0) {
      toast.success(`Submitted ${submitted} scrubbed claim(s) in 837 batch!`);
    } else {
      toast.info("No scrubbed Draft claims ready for batch submission.");
    }
  };

  if (blockedClaims.length === 0 && openEvvExceptions.length === 0) {
    return (
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
        <div className="bg-white rounded-3xl border border-teal-200 overflow-hidden shadow-[0_8px_30px_rgba(20,184,166,0.08)] relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-teal-500" />
          <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-teal-100 p-3 rounded-xl text-teal-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">All Claims Scrubbed</h2>
                <p className="text-slate-600 mt-1 text-sm">
                  {readyDraftClaims.length > 0
                    ? `${readyDraftClaims.length} clean Draft claim(s) ready for 837 submission.`
                    : "No pending EVV holds. Claims pipeline is synchronized."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate837Batch}
              className="bg-brand-teal text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-brand-teal/20 hover:bg-brand-teal/90 transition-colors cursor-pointer"
            >
              Generate 837 Batch ({readyDraftClaims.length})
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
      <div className="bg-white rounded-3xl border border-rose-200 overflow-hidden shadow-[0_8px_30px_rgba(225,29,72,0.08)] relative">
        <div className="absolute top-0 left-0 w-2 h-full bg-rose-500" />
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1 space-y-2 max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Pre-Billing Scrub Gate</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed pl-14">
                These visits cannot be generated into claims until EVV or authorization exceptions are resolved.
                Resolving EVV holds will release{" "}
                <span className="font-bold text-rose-600">${totalBlocked.toLocaleString()}</span> to the billing pipeline.
              </p>
              {readyDraftClaims.length > 0 && (
                <div className="pl-14 pt-2">
                  <button
                    type="button"
                    onClick={handleGenerate837Batch}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Submit {readyDraftClaims.length} Clean Draft Claim(s) Now
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 shrink-0 w-full md:w-[360px]">
              <AnimatePresence>
                {scrubItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {item.urgent ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <FileWarning className="w-4 h-4 text-slate-400" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.type}</p>
                            <p className="text-xs text-slate-500">{item.count} item(s) affected</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-bold text-rose-600">
                            ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <ChevronDown
                            className={clsx(
                              "w-4 h-4 text-slate-400 transition-transform",
                              expandedId === item.id && "rotate-180"
                            )}
                          />
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedId === item.id && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden bg-white border-t border-slate-100"
                          >
                            <div className="p-3 space-y-2">
                              {item.details.map((detail, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg"
                                >
                                  {detail}
                                </div>
                              ))}
                              {item.canAutoResolve && (
                                <div className="pt-2 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={handleAutoResolveEvv}
                                    className="inline-flex items-center gap-1.5 text-xs bg-[#141D3C] text-white px-3 py-1.5 rounded-lg hover:bg-[#1E2B58] transition-colors cursor-pointer font-semibold"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-[#57EAB6]" />
                                    Auto-Resolve EVV &amp; Release
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 md:flex items-center justify-between lg:pl-14">
            <p className="text-sm font-medium text-slate-500">
              Review manually in <span className="font-bold text-slate-700">EVV Monitoring</span> or use automated scrub release.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3 md:mt-0">
              {openEvvExceptions.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoResolveEvv}
                  className="flex items-center gap-2 bg-[#141D3C] hover:bg-[#1E2B58] text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#57EAB6]" />
                  Auto-Resolve EVV
                </button>
              )}
              <Link
                href="/evv-monitoring"
                className="flex items-center gap-2 text-brand-teal hover:text-teal-700 font-semibold text-sm bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-xl transition-colors"
              >
                Review Blocked Visits
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
