"use client";

import React, { useMemo, useState } from "react";
import { User, Search, MessageSquare, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PerformanceTab } from "@/components/caregivers/tabs/PerformanceTab";
import { Card, CardHeader, cn } from "@/components/ui/Card";
import { Caregiver } from "@/lib/caregivers/mockData";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { AgencyCaregiver, AgencyShiftVisit } from "@/types/agency";

function mapToCaregiverView(cg: AgencyCaregiver, visits: AgencyShiftVisit[]): Caregiver {
  const cgVisits = visits.filter((v) => v.caregiverId === cg.id);
  const completedCount = cgVisits.filter((v) => v.status === "Completed").length;
  return {
    id: cg.id,
    name: cg.name,
    avatarUrl: cg.avatarUrl ?? "",
    role: cg.roleTitle,
    status: cg.complianceValid ? "Active" : "On Leave",
    rating: cg.rating,
    yearsWithAgency: 2,
    phone: "(555) 234-8910",
    email: `${cg.name.toLowerCase().replace(/[^a-z]+/g, ".")}@homepulse.com`,
    address: `${cg.distanceMiles} mi from service hub`,
    emergencyContact: "Agency HR on File",
    languages: ["English", "Spanish"],
    skills: cg.skills,
    hireDate: "2024-03-15",
    employmentType: "W2",
    payRate: cg.hourlyRate,
    complianceScore: cg.complianceValid ? 98 : 74,
    assignedPatientsCount: new Set(cgVisits.map((v) => v.clientId)).size,
    lastActiveDate: completedCount > 0 ? "Today" : "This Week",
    certifications: cg.credentials.map((cred, idx) => ({
      id: `${cg.id}-cert-${idx}`,
      name: cred,
      issueDate: "2025-01-10",
      expiryDate: cg.certExpiresInDays <= 14 ? "Expiring Soon" : "2027-01-10",
      status: cg.certExpiresInDays <= 14 ? "Expiring Soon" : "Active",
      issuer: "State Registry",
    })),
    recentShifts: [],
  };
}

export default function ScopedCaregiversPage() {
  const { state, logAuditEvent } = useAgencyStore();
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string>(
    () => state.caregivers[0]?.id ?? ""
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [coachingNote, setCoachingNote] = useState("");
  const [savedNotes, setSavedNotes] = useState<{ caregiverId: string; note: string; at: string }[]>([]);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const filteredCaregivers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return state.caregivers.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.roleTitle.toLowerCase().includes(q)
    );
  }, [state.caregivers, searchTerm]);

  const activeAgencyCaregiver = useMemo(
    () =>
      filteredCaregivers.find((c) => c.id === selectedCaregiverId) ||
      state.caregivers.find((c) => c.id === selectedCaregiverId) ||
      filteredCaregivers[0] ||
      state.caregivers[0] ||
      null,
    [filteredCaregivers, state.caregivers, selectedCaregiverId]
  );

  const selectedCaregiverView = useMemo(
    () =>
      activeAgencyCaregiver
        ? mapToCaregiverView(activeAgencyCaregiver, state.visits)
        : null,
    [activeAgencyCaregiver, state.visits]
  );

  const handleSaveNote = () => {
    if (!coachingNote.trim() || !activeAgencyCaregiver) return;
    setIsSavingNote(true);
    logAuditEvent({
      action: "UPDATE",
      resourceType: "Compliance",
      resourceId: activeAgencyCaregiver.id,
      summary: `Field Supervisor logged coaching feedback note for ${activeAgencyCaregiver.name}.`,
      status: "Success",
    });
    setSavedNotes((prev) => [
      {
        caregiverId: activeAgencyCaregiver.id,
        note: coachingNote.trim(),
        at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      ...prev,
    ]);
    setCoachingNote("");
    setIsSavingNote(false);
    toast.success(`Coaching note logged for ${activeAgencyCaregiver.name}`);
  };

  const caregiverNotes = savedNotes.filter(
    (n) => n.caregiverId === activeAgencyCaregiver?.id
  );

  return (
    <div className="w-full flex flex-col">
      <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">My Field Team Performance</h1>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Live caregiver roster synced with Dispatch, EVV Compliance, and Field Coaching Logs.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-teal/10 text-brand-teal border border-brand-teal/20 w-fit">
          {state.caregivers.length} Active Field Staff
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
        {/* Left sidebar: Live Caregiver Roster */}
        <Card className="lg:col-span-1 flex flex-col h-[40vh] lg:h-auto bg-white backdrop-blur-xl rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] relative overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search field team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {filteredCaregivers.map((cg) => {
              const isSelected = activeAgencyCaregiver?.id === cg.id;
              return (
                <button
                  key={cg.id}
                  type="button"
                  onClick={() => setSelectedCaregiverId(cg.id)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 mb-2",
                    isSelected
                      ? "bg-brand-teal/10 border border-brand-teal/25"
                      : "hover:bg-slate-50 border border-slate-200"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-600 font-semibold text-xs">
                    {cg.name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className={cn("text-sm font-semibold truncate", isSelected ? "text-brand-teal" : "text-slate-700")}>
                      {cg.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {cg.roleTitle} • ★ {cg.rating.toFixed(1)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right side: Coaching + Live Performance View */}
        <div className="lg:col-span-3 space-y-4 flex flex-col">
          {selectedCaregiverView && activeAgencyCaregiver ? (
            <>
              <Card className="shrink-0 flex flex-col bg-white backdrop-blur-xl rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] relative overflow-hidden">
                <CardHeader
                  title={
                    <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-brand-teal" />
                      Log Coaching Note for {activeAgencyCaregiver.name}
                    </span>
                  }
                  className="border-b border-slate-100 bg-slate-50/50 px-4 py-3 mb-0"
                />
                <div className="px-4 py-3 space-y-3">
                  <textarea
                    rows={3}
                    placeholder="Document field guidance, EVV reminders, or positive supervisory feedback..."
                    value={coachingNote}
                    onChange={(e) => setCoachingNote(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white transition-colors resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      disabled={!coachingNote.trim() || isSavingNote}
                      className="px-4 py-2 bg-brand-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save & Audit Note
                    </button>
                  </div>

                  {caregiverNotes.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      {caregiverNotes.map((entry, idx) => (
                        <div key={idx} className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-2 rounded-lg flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {entry.note}
                          </span>
                          <span className="text-[10px] text-emerald-700 shrink-0">{entry.at}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              <div className="flex-1 min-h-0 bg-transparent">
                <PerformanceTab caregiver={selectedCaregiverView} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-10">
              <User className="w-12 h-12 mb-3 text-slate-300" />
              <p>Select a team member to view performance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
