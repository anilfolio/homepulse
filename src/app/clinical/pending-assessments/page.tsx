"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ClipboardList, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export default function PendingAssessmentsPage() {
  const router = useRouter();
  const { state, admitReferralToActiveCare } = useAgencyStore();
  const [searchQuery, setSearchQuery] = useState("");

  const pendingReferrals = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return state.referrals
      .filter(
        (r) =>
          r.stage !== "Admitted" &&
          r.stage !== "Converted" &&
          r.partnerStatus !== "Not a Fit" &&
          r.partnerStatus !== "Referred Elsewhere"
      )
      .filter(
        (r) =>
          !q ||
          r.clientName.toLowerCase().includes(q) ||
          (r.insurance?.payer ?? "").toLowerCase().includes(q) ||
          r.stage.toLowerCase().includes(q)
      );
  }, [state.referrals, searchQuery]);

  const handleAdmit = (id: string, name: string) => {
    admitReferralToActiveCare(id);
    toast.success(`${name} admitted to Active Care census`);
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pending Initial Assessments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live Intake pipeline patients awaiting RN initial assessment, care plan authoring, or admission clearance.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pending assessments..."
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal w-full sm:w-64"
          />
        </div>
      </div>

      {pendingReferrals.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500 border-slate-200">
          All active Intake referrals have been assessed or admitted.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingReferrals.map((ref) => (
            <Card
              key={ref.id}
              className="p-4 shadow-sm border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow gap-4"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-lg">{ref.clientName}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                      ref.urgency === "High"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {ref.urgency === "High" ? "High Priority" : ref.urgency ?? "Normal"}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1 mb-3">
                  <p>
                    <strong>Stage:</strong> {ref.stage}
                  </p>
                  <p>
                    <strong>Payer:</strong> {ref.insurance?.payer ?? "Pending Verification"}
                  </p>
                  <p>
                    <strong>Clinical Context:</strong>{" "}
                    {ref.diagnosis || ref.serviceRequested || ref.intakeNotes || "ADL & Safety evaluation"}
                  </p>
                  <p className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" /> Assessor / Coordinator:{" "}
                    {ref.assessment?.assignedAssessor || ref.assignedCoordinator.name}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/clinical/assessments")}
                  className="flex-1 bg-brand-teal text-white py-2 px-3 rounded-xl text-xs font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ClipboardList className="w-3.5 h-3.5" /> Assessment <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAdmit(ref.id, ref.clientName)}
                  className="bg-emerald-50 text-emerald-700 border border-emerald-200 py-2 px-3 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Admit
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
