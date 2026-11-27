"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin, X, ArrowRight, CheckCircle2, AlertTriangle, Info } from "lucide-react";

import { KpiStrip } from "@/components/dashboard/KpiStrip";
import { VisitsChart } from "@/components/dashboard/VisitsChart";
import { PatientSatisfaction } from "@/components/dashboard/PatientSatisfaction";
import { LiveVisitFeed } from "@/components/dashboard/LiveVisitFeed";
import { RecentIncidents } from "@/components/dashboard/RecentIncidents";
import { TopCaregivers } from "@/components/dashboard/TopCaregivers";
import { CredentialTracker } from "@/components/dashboard/CredentialTracker";
import { FinancialHealth } from "@/components/dashboard/FinancialHealth";
import { AuthUtilization } from "@/components/dashboard/AuthUtilization";
import { CaregiverOvertime } from "@/components/dashboard/CaregiverOvertime";
import { EvvCompliance } from "@/components/dashboard/EvvCompliance";
import { WastedHours } from "@/components/dashboard/WastedHours";
import { AiInsights } from "@/components/dashboard/AiInsights";
import { BottomGlance } from "@/components/dashboard/BottomGlance";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { buildExecutiveBriefing } from "@/lib/engine/aiCopilotSimulator";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DashboardPage() {
  const { state, executeBriefingAction } = useAgencyStore();
  const [showBriefingModal, setShowBriefingModal] = useState(false);

  const briefingItems = useMemo(() => buildExecutiveBriefing(state), [state]);

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Good morning, Sarah!</h2>
          <p className="text-sm text-text-secondary mt-1">
            {today} • {briefingItems.length} live operational insight(s) ready
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/caregivers-tracker"
            target="_blank"
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all text-slate-700 px-4 py-2.5 rounded-full text-sm font-medium shadow-[0_6px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_32px_rgba(0,0,0,0.06)]"
          >
            <MapPin className="w-4 h-4 text-brand-teal" />
            Track Caregivers
          </Link>
          <button
            type="button"
            onClick={() => setShowBriefingModal(true)}
            className="flex items-center gap-2 bg-brand-teal text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-brand-teal/90 transition-colors shadow-[0_6px_32px_rgba(0,0,0,0.06)] shadow-brand-teal/20 whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-white" />
            AI Briefing ({briefingItems.length})
          </button>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={item}>
          <KpiStrip />
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <VisitsChart />
          </div>
          <div className="xl:col-span-1">
            <PatientSatisfaction />
          </div>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EvvCompliance />
          <WastedHours />
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FinancialHealth />
          <AuthUtilization />
          <CaregiverOvertime />
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RecentIncidents />
          <TopCaregivers />
          <CredentialTracker />
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 flex flex-col gap-4">
            <BottomGlance />
            <AiInsights />
          </div>
          <div className="xl:col-span-1">
            <LiveVisitFeed />
          </div>
        </motion.div>
      </motion.div>

      {/* Live Executive AI Briefing Modal */}
      <AnimatePresence>
        {showBriefingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200"
            >
              <div className="px-6 py-4 bg-[#141D3C] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-[#57EAB6]" />
                  <div>
                    <h3 className="text-base font-bold">Executive AI Operational Briefing</h3>
                    <p className="text-xs text-slate-300">
                      Synthesized live from Dispatch, EVV, Authorizations &amp; Billing
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBriefingModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
                {briefingItems.length === 0 ? (
                  <div className="p-6 text-center bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="font-bold text-emerald-900">All Operations Nominal</p>
                    <p className="text-xs text-emerald-700 mt-1">
                      Zero unfilled shifts, zero EVV holds, and all clean claims submitted.
                    </p>
                  </div>
                ) : (
                  briefingItems.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {b.severity === "critical" ? (
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : b.severity === "warning" ? (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <Info className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          <span className="text-sm font-bold text-slate-900">{b.title}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                          {b.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{b.summary}</p>
                      <div className="flex items-center justify-between pt-1">
                        <Link
                          href={b.route}
                          onClick={() => setShowBriefingModal(false)}
                          className="text-xs font-semibold text-slate-600 hover:text-brand-teal inline-flex items-center gap-1"
                        >
                          Open Module <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => executeBriefingAction(b.actionType)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#141D3C] hover:bg-[#1E2B58] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#57EAB6]" />
                          {b.actionLabel}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
