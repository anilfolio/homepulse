"use client";

import React, { useMemo, useState } from "react";
import { CaregiverLayout } from "@/components/caregiver/CaregiverLayout";
import { ClockInOutCard } from "@/components/caregiver/ClockInOutCard";
import { TodayVisitsPanel } from "@/components/caregiver/TodayVisitsPanel";
import { VisitTaskChecklist } from "@/components/caregiver/VisitTaskChecklist";
import { EndVisitModal } from "@/components/caregiver/EndVisitModal";
import { Visit } from "@/lib/caregiver/caregiverPortalData";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { VOICE_NOTE_PRESETS } from "@/lib/engine/aiCopilotSimulator";
import { Calendar, CheckCircle2, Mic, PhoneOff, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

export default function CaregiverTodayPage() {
  const {
    state,
    getClientById,
    clockInVisit,
    toggleVisitTask,
    skipVisitTask,
    logVisitMedication,
    applyVoiceNoteToVisit,
    clockOutVisit,
    triggerCallOff,
    acceptBackfillOffer,
  } = useAgencyStore();

  const [selectedVisitId, setSelectedVisitId] = useState<string>("visit-101");
  const [showEndModal, setShowEndModal] = useState<boolean>(false);

  // Show today's visits assigned to Maria Santos (cg-101) or any newly dispatched today visit
  const caregiverVisits: Visit[] = useMemo(() => {
    return state.visits
      .filter(
        (v) =>
          v.visitDateLabel === "Today" &&
          (v.caregiverId === "cg-101" || v.caregiverId !== null) &&
          v.status !== "Unfilled" &&
          v.status !== "Call-Off"
      )
      .map((v) => {
        const client = getClientById(v.clientId);
        return {
          id: v.id,
          clientId: v.clientId,
          clientName: client?.name ?? "Assigned Client",
          clientPhoto: "",
          address: client?.address ?? "412 Maplewood Drive",
          cityStateZip: client?.cityStateZip ?? "Springfield, IL 62704",
          phone: client?.phone ?? "(217) 555-0194",
          scheduledStartTime: v.scheduledStart,
          scheduledEndTime: v.scheduledEnd,
          status:
            v.status === "In Progress"
              ? "In Progress"
              : v.status === "Completed"
                ? "Completed"
                : "Scheduled",
          clockInTime: v.clockInTime ?? undefined,
          clockOutTime: v.clockOutTime ?? undefined,
          clockInMethod:
            v.evvMethod === "IVR"
              ? "ivr"
              : v.evvMethod === "Fixed"
                ? "fvv"
                : v.evvMethod === "Manual"
                  ? "manual"
                  : "gps",
          clientCoords: client?.coords ?? { lat: 39.7817, lng: -89.6501 },
          distanceFromClientMiles: Number((v.gpsDistanceMeters / 1609.34).toFixed(2)),
          travelTimeFromPreviousMin: 12,
          travelDistanceMiles: 3.4,
          tasks: v.tasks,
          medications: v.medications,
          visitNotes: v.visitNotes,
          mileageRecorded: v.mileageRecorded,
          syncedOffline: v.syncedOffline,
        };
      });
  }, [getClientById, state.visits]);

  const backfillOffers = useMemo(() => {
    return state.visits.filter(
      (v) =>
        v.status === "Call-Off" &&
        v.backfillOffers?.some((o) => o.caregiverId === "cg-101" && o.offerStatus === "Pending")
    );
  }, [state.visits]);

  const activeVisit =
    caregiverVisits.find((v) => v.id === selectedVisitId) || caregiverVisits[0];

  const activeAgencyVisit = state.visits.find((v) => v.id === activeVisit?.id);
  const isClockedIn = activeVisit?.status === "In Progress";

  const handleClockIn = (
    method: "gps" | "ivr" | "fvv",
    reason?: string,
    distanceMeters?: number
  ) => {
    if (!activeVisit) return;
    const resolvedMeters = distanceMeters ?? 18;
    clockInVisit(activeVisit.id, method, resolvedMeters, reason);
    if (method === "gps" && resolvedMeters > 100) {
      toast.warning(`Clocked in with GPS variance (${resolvedMeters}m) — EVV exception flagged.`);
    } else {
      toast.success(`Clocked in for ${activeVisit.clientName} via ${method.toUpperCase()}.`);
    }
  };

  const handleToggleTask = (taskId: string) => {
    if (!activeVisit) return;
    toggleVisitTask(activeVisit.id, taskId);
  };

  const handleSkipTaskReason = (taskId: string, reason: string) => {
    if (!activeVisit) return;
    skipVisitTask(activeVisit.id, taskId, reason);
  };

  const handleLogMedication = (
    medId: string,
    status: "reminded" | "took" | "declined" | "pending"
  ) => {
    if (!activeVisit) return;
    logVisitMedication(activeVisit.id, medId, status);
  };

  const handleVoiceCopilot = (presetKey: keyof typeof VOICE_NOTE_PRESETS) => {
    if (!activeVisit) return;
    applyVoiceNoteToVisit(activeVisit.id, presetKey);
    toast.success("AI Voice-to-Care-Note applied — vitals, tasks, and SOAP note updated.");
  };

  const handleRequestCallOff = () => {
    if (!activeVisit) return;
    triggerCallOff(activeVisit.id, "Caregiver requested urgent schedule relief");
    toast.warning("Call-off sent to Scheduler — automated Top-3 replacement offers dispatched.");
  };

  const handleCompleteVisit = (data: {
    notes: string;
    signatureUrl?: string;
    unableToSignReason?: string;
    photos: unknown[];
    mileage: number;
  }) => {
    if (!activeVisit) return;
    setShowEndModal(false);
    clockOutVisit(activeVisit.id, {
      notes: data.notes,
      signatureCaptured: Boolean(data.signatureUrl),
      unableToSignReason: data.unableToSignReason,
      mileage: data.mileage,
    });
    toast.success("Visit completed & evaluated by EVV + Pre-Billing Scrub Gate!");
  };

  return (
    <CaregiverLayout
      isClockedIn={isClockedIn}
      activeClientName={activeVisit?.clientName ?? "No Active Shift"}
      pendingSyncCount={isClockedIn ? 1 : 0}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_32px_rgba(0,0,0,0.06)] transition-all duration-300">
          <div>
            <div className="flex items-center gap-2 text-brand-teal text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Caregiver Today Dashboard
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Welcome back, Maria!</h1>
            <p className="text-xs text-gray-500 mt-1">
              You have {caregiverVisits.length} visit(s) in your live itinerary. Clock-outs sync directly to EVV, Billing &amp; Family Portal.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <span className="text-gray-400 font-medium block">Today&apos;s Date</span>
              <span className="font-bold text-gray-800 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-brand-teal" /> Wednesday, Jul 22, 2026
              </span>
            </div>
          </div>
        </div>

        {/* Live Backfill Offers Banner (from Call-Off Cascade) */}
        {backfillOffers.length > 0 && (
          <div className="bg-gradient-to-r from-[#141D3C] to-[#1E2B58] text-white rounded-2xl p-4 border border-[#2A3B75] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#57EAB6]/15 text-[#57EAB6] flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#57EAB6]">
                  Urgent Shift Offer (Smart Backfill)
                </p>
                {backfillOffers.map((offerVisit) => {
                  const offerClient = getClientById(offerVisit.clientId);
                  return (
                    <p key={offerVisit.id} className="text-xs text-slate-200 mt-0.5">
                      {offerClient?.name} • {offerVisit.scheduledStart} – {offerVisit.scheduledEnd} ({offerVisit.region})
                    </p>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const target = backfillOffers[0];
                acceptBackfillOffer(target.id, "cg-101");
                setSelectedVisitId(target.id);
                toast.success("Backfill offer accepted — shift added to Today's Visits!");
              }}
              className="px-4 py-2 rounded-xl bg-[#57EAB6] hover:bg-[#36D49D] text-[#141D3C] font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Accept Urgent Shift
            </button>
          </div>
        )}

        {activeVisit ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Primary Column */}
            <div className="lg:col-span-8 space-y-6">
              <ClockInOutCard
                visit={activeVisit}
                isClockedIn={isClockedIn}
                onClockIn={handleClockIn}
                onClockOutClick={() => setShowEndModal(true)}
              />

              {/* Automation & Manual Quick Controls */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#6C88FF]/10 text-[#6C88FF] flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Ambient AI Voice-to-Care-Note &amp; Shift Controls
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {activeAgencyVisit?.vitals
                        ? `Logged Vitals: BP ${activeAgencyVisit.vitals.bp} • HR ${activeAgencyVisit.vitals.hr}`
                        : "1-click simulate voice charting or request schedule relief."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleVoiceCopilot("routine_stable")}
                    className="px-3 py-2 rounded-xl bg-[#6C88FF] hover:bg-[#5371F3] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Voice Chart
                  </button>
                  {activeVisit.status === "Scheduled" && (
                    <button
                      type="button"
                      onClick={handleRequestCallOff}
                      className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <PhoneOff className="w-3.5 h-3.5 text-amber-600" />
                      Request Call-Off
                    </button>
                  )}
                </div>
              </div>

              <VisitTaskChecklist
                clientName={activeVisit.clientName}
                tasks={activeVisit.tasks}
                medications={activeVisit.medications}
                onToggleTask={handleToggleTask}
                onSkipTaskReason={handleSkipTaskReason}
                onLogMedication={handleLogMedication}
              />
            </div>

            {/* Secondary Side Panel */}
            <div className="lg:col-span-4 space-y-6 sticky top-20">
              <TodayVisitsPanel
                visits={caregiverVisits}
                activeVisitId={activeVisit.id}
                onSelectVisit={(id) => setSelectedVisitId(id)}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            No scheduled visits in your queue right now. Assign a shift in Scheduler or accept an urgent offer above.
          </div>
        )}
      </div>

      {activeVisit && (
        <EndVisitModal
          isOpen={showEndModal}
          visit={activeVisit}
          onClose={() => setShowEndModal(false)}
          onComplete={handleCompleteVisit}
        />
      )}
    </CaregiverLayout>
  );
}
