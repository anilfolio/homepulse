"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { UserMinus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { AgencyReferral } from "@/types/agency";

const isNonAdmit = (r: AgencyReferral) =>
  r.partnerStatus === "Not a Fit" || r.partnerStatus === "Referred Elsewhere";

export default function IntakeDischargePage() {
  const { state, declineOrReferOutReferral } = useAgencyStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedReferralId, setSelectedReferralId] = useState(
    state.referrals.find(
      (r) => !isNonAdmit(r) && r.stage !== "Admitted" && r.stage !== "Converted"
    )?.id ?? ""
  );
  const [reason, setReason] = useState("Outside Service Area");
  const [partnerStatus, setPartnerStatus] = useState<"Not a Fit" | "Referred Elsewhere">(
    "Referred Elsewhere"
  );

  const nonAdmits = useMemo(
    () => state.referrals.filter((r) => isNonAdmit(r)),
    [state.referrals]
  );

  const activeCandidates = useMemo(
    () =>
      state.referrals.filter(
        (r) => !isNonAdmit(r) && r.stage !== "Admitted" && r.stage !== "Converted"
      ),
    [state.referrals]
  );

  const handleConfirmNonAdmit = () => {
    const targetId = selectedReferralId || activeCandidates[0]?.id;
    if (!targetId) {
      toast.error("No active referral selected.");
      return;
    }
    declineOrReferOutReferral(targetId, reason, partnerStatus);
    toast.warning(`Logged non-admit & notified Partner Portal (${partnerStatus}).`);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="w-full animate-in fade-in duration-500 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Non-Admits &amp; Discharges
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live log of referrals marked Not a Fit or Referred Elsewhere — synced directly with Partner Portal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={activeCandidates.length === 0}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <UserMinus className="w-4 h-4" />
            Log Non-Admit
          </button>
        </div>

        <Card className="p-0 overflow-hidden shadow-sm border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Source / Partner</th>
                  <th className="px-4 py-3">Partner Status</th>
                  <th className="px-4 py-3">Reason / Notes</th>
                  <th className="px-4 py-3">Coordinator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {nonAdmits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">
                      No non-admits logged in the current intake cycle.
                    </td>
                  </tr>
                ) : (
                  nonAdmits.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{ref.clientName}</td>
                      <td className="px-4 py-3 text-xs">{ref.sourceDetails || ref.source}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> {ref.partnerStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                        {ref.intakeNotes || "Referred out to partner network"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {ref.assignedCoordinator.name}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Non-Admit / Refer Out"
        description="Updates Intake queue and notifies the referring Partner Portal"
        icon={
          <div className="p-2 bg-rose-100 rounded-xl">
            <UserMinus className="w-5 h-5 text-rose-600" />
          </div>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmNonAdmit}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer"
            >
              Confirm Non-Admit
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Referral</label>
            <select
              value={selectedReferralId}
              onChange={(e) => setSelectedReferralId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              {activeCandidates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.clientName} ({r.stage})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Partner Outcome
            </label>
            <select
              value={partnerStatus}
              onChange={(e) =>
                setPartnerStatus(e.target.value as "Not a Fit" | "Referred Elsewhere")
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="Referred Elsewhere">Referred Elsewhere</option>
              <option value="Not a Fit">Not a Fit</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
