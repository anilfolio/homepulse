"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { PartnerKpiStrip } from "@/components/partner/dashboard/PartnerKpiStrip";
import { PartnerRecentReferrals } from "@/components/partner/dashboard/PartnerRecentReferrals";
import { ReferralSubmitWidget } from "@/components/partner/dashboard/ReferralSubmitWidget";
import { Bell, Building2 } from "lucide-react";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function PartnerDashboard() {
  const { state } = useAgencyStore();
  const activeCount = state.referrals.filter(
    (r) => r.partnerStatus !== "Not a Fit" && r.partnerStatus !== "Referred Elsewhere"
  ).length;
  const pendingReviewCount = state.referrals.filter(
    (r) => r.partnerStatus === "Received" || r.partnerStatus === "Under Review"
  ).length;
  const infoRequestedCount = state.referrals.filter(
    (r) => r.partnerStatus === "Additional Info Requested"
  ).length;

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="w-full mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] transition-all duration-300 relative">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
              Welcome back, {state.partnerOrg.name}
            </h1>
            <span className="inline-flex items-center gap-1 bg-brand-teal/10 text-brand-teal text-xs font-medium px-3 py-1 rounded-full border border-brand-teal/20">
              <Building2 className="w-3.5 h-3.5" />
              {state.partnerOrg.type}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
            <span>{today}</span>
            <span>&bull;</span>
            <span>
              <span className="text-brand-teal font-semibold">{activeCount} active</span> referrals
            </span>
            <span>&bull;</span>
            <span>
              <span className="text-indigo-600 font-semibold">{pendingReviewCount} pending</span> review
            </span>
            {infoRequestedCount > 0 && (
              <>
                <span>&bull;</span>
                <span className="text-amber-600 font-semibold">
                  {infoRequestedCount} info requested
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={itemVariants}>
          <PartnerKpiStrip />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col h-full">
            <PartnerRecentReferrals />
          </motion.div>

          <div className="lg:col-span-1 flex flex-col gap-4">
            <motion.div variants={itemVariants}>
              <ReferralSubmitWidget />
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-br from-[#141D3C] to-[#0E152E] rounded-2xl p-4 text-white shadow-[0_6px_32px_rgba(0,0,0,0.06)] border border-[#2A3B75] relative overflow-hidden flex-1"
            >
              <div className="relative z-10 flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-[#57EAB6]" />
                <h3 className="font-semibold text-base">Live Agency Intake Sync</h3>
              </div>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                {state.clients.length} active client(s) admitted across service zones. Urgent 24–48h hospital discharges are auto-triaged to Clinical RN review within 15 minutes.
              </p>
              <div className="text-xs font-semibold text-[#57EAB6]">
                Primary Contact: {state.partnerOrg.primaryContact}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
