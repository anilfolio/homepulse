"use client";

import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { Search, Filter, Clock, ChevronDown, Send, FileText, CheckCircle2 } from "lucide-react";
import { getStatusColor } from "@/components/partner/dashboard/PartnerRecentReferrals";
import { Modal } from "@/components/ui/Modal";
import clsx from "clsx";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { AgencyReferral } from "@/types/agency";

export function MyReferralsTable() {
  const { state, respondToPartnerReferralInfo } = useAgencyStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [memberFilter, setMemberFilter] = useState<string>("All");
  const [selectedReferral, setSelectedReferral] = useState<AgencyReferral | null>(null);
  const [replyNote, setReplyNote] = useState("");
  const [attachedDocName, setAttachedDocName] = useState("");

  const mappedReferrals = state.referrals.map((r) => ({
    raw: r,
    id: r.id,
    patientName: r.clientName,
    serviceRequested: r.serviceRequested || r.diagnosis || "Home Care Services",
    submittingMember: r.referringParty || r.assignedCoordinator.name,
    submittedAt: r.dateReceived,
    status: r.partnerStatus,
    urgency: r.urgency === "High" ? ("Discharge within 24-48h" as const) : ("Normal" as const),
    notes: r.intakeNotes,
  }));

  const filteredReferrals = mappedReferrals.filter((ref) => {
    const matchesSearch =
      ref.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.serviceRequested.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || ref.status === statusFilter;
    const matchesMember =
      memberFilter === "All" || ref.submittingMember.includes(memberFilter);
    return matchesSearch && matchesStatus && matchesMember;
  });

  const handleSendInfo = () => {
    if (!selectedReferral || !replyNote.trim()) {
      toast.error("Please enter a clinical/intake update note.");
      return;
    }
    respondToPartnerReferralInfo(
      selectedReferral.id,
      replyNote.trim(),
      attachedDocName.trim() || undefined
    );
    toast.success(`Update sent to HomePulse Intake for ${selectedReferral.clientName}.`);
    setReplyNote("");
    setAttachedDocName("");
    setSelectedReferral(null);
  };

  return (
    <>
      <div className="bg-white backdrop-blur-xl rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] relative overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-teal"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none w-full sm:w-auto bg-white border border-slate-200 text-slate-700 py-2 pl-4 pr-10 rounded-xl text-sm cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Received">Received</option>
                <option value="Under Review">Under Review</option>
                <option value="Assessment Scheduled">Assessment Scheduled</option>
                <option value="Accepted as Client">Accepted as Client</option>
                <option value="Not a Fit">Not a Fit</option>
                <option value="Referred Elsewhere">Referred Elsewhere</option>
                <option value="Additional Info Requested">Additional Info Requested</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="appearance-none w-full sm:w-auto bg-white border border-slate-200 text-slate-700 py-2 pl-4 pr-10 rounded-xl text-sm cursor-pointer"
              >
                <option value="All">All Members</option>
                {state.partnerTeamMembers.map((tm) => (
                  <option key={tm.id} value={tm.name}>
                    {tm.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[360px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                  Patient Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                  Service Requested
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                  Submitted By
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                  Date Submitted
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                  Current Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReferrals.length > 0 ? (
                filteredReferrals.map((ref) => (
                  <tr
                    key={ref.id}
                    onClick={() => setSelectedReferral(ref.raw)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                        {ref.patientName}
                      </div>
                      {ref.urgency === "Discharge within 24-48h" && (
                        <div className="flex items-center gap-1 text-[10px] font-medium text-red-600 mt-1 whitespace-nowrap">
                          <Clock className="w-3 h-3" /> Urgent
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[220px] truncate">
                      {ref.serviceRequested}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{ref.submittingMember}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {format(parseISO(ref.submittedAt), "MMM d, yyyy")}
                      <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                        {format(parseISO(ref.submittedAt), "h:mm a")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap",
                          getStatusColor(ref.status)
                        )}
                      >
                        {ref.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Filter className="w-8 h-8 text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-700 mb-1">No referrals found</p>
                      <p className="text-xs">Try adjusting your filters or search term.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Two-Way Partner <-> Intake Sync Modal */}
      <Modal
        isOpen={Boolean(selectedReferral)}
        onClose={() => setSelectedReferral(null)}
        title={selectedReferral ? `Referral Sync: ${selectedReferral.clientName}` : ""}
        description={
          selectedReferral
            ? `Stage: ${selectedReferral.stage} • Clinical Review: ${selectedReferral.clinicalReviewStatus} • Auth: ${selectedReferral.authorizationStatus}`
            : ""
        }
        icon={
          <div className="p-2 bg-brand-teal/10 rounded-xl">
            <FileText className="w-5 h-5 text-brand-teal" />
          </div>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedReferral(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSendInfo}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal/90 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" /> Send Update to Intake
            </button>
          </>
        }
      >
        {selectedReferral && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500">Intake Stage</div>
                <div className="font-bold text-slate-800 mt-0.5">{selectedReferral.stage}</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500">RN Review</div>
                <div className="font-bold text-slate-800 mt-0.5">
                  {selectedReferral.clinicalReviewStatus}
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500">Insurance</div>
                <div className="font-bold text-slate-800 mt-0.5">
                  {selectedReferral.insurance?.status ?? "Pending"}
                </div>
              </div>
            </div>

            <div>
              <div className="font-semibold text-slate-700 mb-1.5">Submitted Documents</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedReferral.documents.map((doc, idx) => (
                  <span
                    key={`${doc.name}-${idx}`}
                    className={clsx(
                      "px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 border",
                      doc.status === "Uploaded" || doc.status === "Verified"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {doc.name} ({doc.status})
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="block font-semibold text-slate-700">
                Send Additional Info / Discharge Packet to Intake
              </label>
              <input
                type="text"
                value={attachedDocName}
                onChange={(e) => setAttachedDocName(e.target.value)}
                placeholder="Optional document name (e.g. Updated_Physician_Orders.pdf)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <textarea
                rows={3}
                value={replyNote}
                onChange={(e) => setReplyNote(e.target.value)}
                placeholder="Write clinical update or respond to Intake coordinator request..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
