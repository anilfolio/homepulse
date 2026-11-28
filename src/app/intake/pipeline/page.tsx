"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { UserPlus, FileText, CheckCircle, Clock, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { ReferralDetailPanel } from "@/components/referrals/ReferralDetailPanel";
import { AgencyReferral } from "@/types/agency";

export default function IntakePipelinePage() {
  const {
    state,
    autoTriagePendingReferrals,
    admitReferralToActiveCare,
    updateReferral,
  } = useAgencyStore();
  const [selectedReferral, setSelectedReferral] = useState<AgencyReferral | null>(null);

  const columns = useMemo(
    () => [
      {
        id: "new",
        title: "New Referrals",
        headerBg: "bg-slate-100 border-slate-200 text-slate-700",
        badgeBg: "bg-slate-200 text-slate-700",
        accent: "border-l-brand-teal",
        items: state.referrals.filter(
          (r) => r.stage === "Referral Received" || r.stage === "Contact Attempted"
        ),
      },
      {
        id: "verify",
        title: "Verification & RN Review",
        headerBg: "bg-amber-50 border-amber-200 text-amber-800",
        badgeBg: "bg-amber-100 text-amber-800",
        accent: "border-l-amber-500",
        items: state.referrals.filter(
          (r) =>
            r.stage === "Insurance Verification" ||
            r.stage === "Clinical Review" ||
            r.stage === "Eligibility Confirmed"
        ),
      },
      {
        id: "assess",
        title: "Assessment & Consent",
        headerBg: "bg-indigo-50 border-indigo-200 text-indigo-800",
        badgeBg: "bg-indigo-100 text-indigo-700",
        accent: "border-l-indigo-500",
        items: state.referrals.filter(
          (r) =>
            r.stage === "Initial Assessment Scheduled" ||
            r.stage === "Assigned to Care Team" ||
            r.stage === "Consent & Agreements"
        ),
      },
      {
        id: "admitted",
        title: "Admitted (Active Care)",
        headerBg: "bg-emerald-50 border-emerald-200 text-emerald-800",
        badgeBg: "bg-emerald-100 text-emerald-700",
        accent: "border-l-emerald-500",
        items: state.referrals.filter(
          (r) => r.stage === "Admitted" || r.stage === "Converted"
        ),
      },
    ],
    [state.referrals]
  );

  const handleAutoTriage = () => {
    const count = autoTriagePendingReferrals();
    if (count > 0) {
      toast.success(`Auto-triaged ${count} referral(s) with 270/271 eligibility check.`);
    } else {
      toast.info("All inbound referrals are already triaged.");
    }
  };

  return (
    <>
      <div className="w-full animate-in fade-in duration-500 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Live Referral Pipeline
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Connected end-to-end from Partner Portal submissions to Clinical RN admission.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleAutoTriage}
              className="flex items-center gap-2 bg-[#141D3C] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#1E2B58] transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#57EAB6]" />
              Auto-Triage Pending
            </button>
            <Link
              href="/intake/referrals/new"
              className="flex items-center gap-2 bg-brand-teal text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-teal-600 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              New Intake
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col gap-3">
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-xl border ${col.headerBg}`}
              >
                <span className="font-semibold text-sm">{col.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeBg}`}>
                  {col.items.length}
                </span>
              </div>

              {col.items.length === 0 ? (
                <Card className="p-4 text-center text-xs text-slate-400 border-dashed">
                  No referrals in this stage
                </Card>
              ) : (
                col.items.map((ref) => (
                  <Card
                    key={ref.id}
                    onClick={() => setSelectedReferral(ref)}
                    className={`p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 ${col.accent} space-y-2`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-slate-900 text-sm">{ref.clientName}</div>
                      {ref.urgency === "High" && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                          URGENT
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {ref.serviceRequested || ref.diagnosis || ref.sourceDetails}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {ref.daysInStage}d in stage
                      </span>
                      {col.id === "assess" ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const admitted = admitReferralToActiveCare(ref.id);
                            if (admitted) {
                              toast.success(
                                `${admitted.name} admitted & synced to Clinical + Scheduler.`
                              );
                            }
                          }}
                          className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline cursor-pointer"
                        >
                          <CheckCircle className="w-3 h-3" /> Admit
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-brand-teal font-semibold">
                          Inspect <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      <ReferralDetailPanel
        referral={selectedReferral}
        onClose={() => setSelectedReferral(null)}
        onUpdate={(updated) => {
          const existing = state.referrals.find((r) => r.id === updated.id);
          if (existing) {
            updateReferral({ ...existing, ...updated });
            setSelectedReferral({ ...existing, ...updated });
          }
        }}
      />
    </>
  );
}
