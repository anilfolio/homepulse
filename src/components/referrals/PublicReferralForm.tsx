"use client";

import React, { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

interface PublicReferralFormProps {
  onSubmitSuccess: (referenceNumber: string) => void;
}

export function PublicReferralForm({ onSubmitSuccess }: PublicReferralFormProps) {
  const { submitPartnerReferral } = useAgencyStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [providerName, setProviderName] = useState("");
  const [organization, setOrganization] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientContact, setPatientContact] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parts = patientName.trim().split(/\s+/);
    const firstName = parts[0] || "New";
    const lastName = parts.slice(1).join(" ") || "Patient";

    const created = submitPartnerReferral({
      firstName,
      lastName,
      phone: patientContact,
      serviceRequested: reason || "Home Care Services",
      isUrgent,
      notes,
      submittingMember: providerName || "Referring Provider",
      partnerOrgName: organization || "External Provider",
    });

    setIsSubmitting(false);
    toast.success(`Referral ${created.id} submitted to HomePulse Intake.`);
    onSubmitSuccess(created.id.toUpperCase());
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Submit a New Referral</h1>
        <p className="text-slate-500">
          Enter patient details below to route directly into the live HomePulse Intake Queue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-sm">
              1
            </span>
            Referring Provider Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="providerName" className="text-sm font-medium text-slate-700">
                Your Name *
              </label>
              <input
                required
                id="providerName"
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Dr. Jane Smith"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="organization" className="text-sm font-medium text-slate-700">
                Organization/Facility *
              </label>
              <input
                required
                id="organization"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="General Hospital"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="providerEmail" className="text-sm font-medium text-slate-700">
                Your Email *
              </label>
              <input
                required
                id="providerEmail"
                type="email"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="jane.smith@hospital.org"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="providerPhone" className="text-sm font-medium text-slate-700">
                Your Phone *
              </label>
              <input
                required
                id="providerPhone"
                type="tel"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-sm">
                2
              </span>
              Patient Details
            </h2>
            <div className="text-xs text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
              <ShieldCheck className="w-3.5 h-3.5" /> Minimum PHI Required
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="patientName" className="text-sm font-medium text-slate-700">
                Patient Name *
              </label>
              <input
                required
                id="patientName"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="patientContact" className="text-sm font-medium text-slate-700">
                Best Contact for Patient/Family *
              </label>
              <input
                required
                id="patientContact"
                type="text"
                value={patientContact}
                onChange={(e) => setPatientContact(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="(555) 987-6543"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="reason" className="text-sm font-medium text-slate-700">
                Reason for Referral / Care Needs *
              </label>
              <textarea
                required
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                placeholder="Requires post-op wound care and assistance with ADLs..."
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="notes" className="text-sm font-medium text-slate-700">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                placeholder="Any other context..."
              />
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="pt-0.5">
            <input
              type="checkbox"
              id="urgency"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="w-5 h-5 text-amber-600 rounded border-amber-300"
            />
          </div>
          <div>
            <label htmlFor="urgency" className="font-semibold text-amber-900 cursor-pointer block">
              Urgent Discharge (24–48 hours)
            </label>
            <p className="text-xs text-amber-700 mt-0.5">
              Routes directly to top of Intake Coordinator triage queue.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-teal hover:bg-teal-600 text-white font-semibold rounded-xl cursor-pointer"
          >
            {isSubmitting ? "Submitting..." : "Submit Referral"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
