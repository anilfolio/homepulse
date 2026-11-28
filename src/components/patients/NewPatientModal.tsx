import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { UserPlus, User, Calendar, Activity, Phone, MapPin, Building, AlertCircle, Shield, Hash } from "lucide-react";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { toast } from "sonner";

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewPatientModal({ isOpen, onClose }: NewPatientModalProps) {
  const { createIntakeReferral } = useAgencyStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [source, setSource] = useState("Hospital Discharge");
  const [priority, setPriority] = useState<"routine" | "urgent" | "expedited">("routine");
  const [insurance, setInsurance] = useState("Medicare");
  const [memberId, setMemberId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() && !lastName.trim()) {
      toast.error("Please enter patient first and last name.");
      return;
    }
    setIsSubmitting(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const urgencyLevel = priority === "expedited" || priority === "urgent" ? "High" : "Medium";

    createIntakeReferral({
      workflowType: "Referral",
      clientName: fullName,
      dob: dob || undefined,
      phone: phone || undefined,
      address: address || undefined,
      gender: gender || undefined,
      facilityName: source,
      payer: insurance || "Medicare",
      urgency: urgencyLevel,
      notes: [diagnosis && `Primary Dx: ${diagnosis}`, memberId && `Member ID: ${memberId}`]
        .filter(Boolean)
        .join(" • "),
    });

    toast.success(`${fullName} added to Intake & Clinical Pending Assessment queue`);
    setIsSubmitting(false);
    setFirstName("");
    setLastName("");
    setDiagnosis("");
    setPhone("");
    setAddress("");
    setMemberId("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Patient Referral"
      description="Creates a live Intake & RN Assessment referral synced across the platform."
      maxWidth="2xl"
      icon={
        <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center border border-brand-teal/20 shadow-[0_6px_32px_rgba(0,0,0,0.06)]">
          <UserPlus className="w-5 h-5 text-brand-teal" />
        </div>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all shadow-[0_6px_32px_rgba(0,0,0,0.06)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium text-white bg-brand-teal rounded-xl hover:bg-brand-teal/90 transition-all shadow-[0_6px_32px_rgba(0,0,0,0.06)] shadow-brand-teal/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? "Saving..." : "Save Patient"}
          </button>
        </>
      }
    >
      <form id="new-patient-form" onSubmit={handleSubmit} className="p-1">
        <div className="space-y-4">
          <div>
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              Personal Details
              <div className="h-px bg-slate-100 flex-1"></div>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-normal text-slate-700">First Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all placeholder:text-slate-400"
                    placeholder="e.g. John"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700">Last Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all placeholder:text-slate-400"
                    placeholder="e.g. Doe"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700">Date of Birth</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all text-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all text-slate-600"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              Clinical & Contact Details
              <div className="h-px bg-slate-100 flex-1"></div>
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700">Primary Diagnosis</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Activity className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all placeholder:text-slate-400"
                      placeholder="e.g. Type 2 Diabetes"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all placeholder:text-slate-400"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700">Address</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all resize-none placeholder:text-slate-400"
                    placeholder="Street address, city, state, zip"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              Intake Logistics & Insurance
              <div className="h-px bg-slate-100 flex-1"></div>
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700">Referral Source</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all text-slate-600 appearance-none"
                    >
                      <option value="Hospital Discharge">Hospital Discharge</option>
                      <option value="Primary Care Physician">Primary Care Physician</option>
                      <option value="Family / Self">Family / Self</option>
                      <option value="Home Health Agency">Home Health Agency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700">Intake Priority</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AlertCircle className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as "routine" | "urgent" | "expedited")}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all text-slate-600 appearance-none"
                    >
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="expedited">Expedited (Same Day)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700">Insurance Provider</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={insurance}
                      onChange={(e) => setInsurance(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all placeholder:text-slate-400"
                      placeholder="e.g. Medicare, Medicaid"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700">Member ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={memberId}
                      onChange={(e) => setMemberId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all placeholder:text-slate-400"
                      placeholder="e.g. ABC123456789"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
