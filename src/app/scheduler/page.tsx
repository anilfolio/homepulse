"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, CheckCircle2, MapPin } from "lucide-react";
import { SchedulerKpiStrip } from "@/components/scheduler/SchedulerKpiStrip";
import { UnfilledShiftsQueue, type UnfilledShiftItem } from "@/components/scheduler/UnfilledShiftsQueue";
import { CallOffQueue, type CallOffItem } from "@/components/scheduler/CallOffQueue";
import { CompactCoverageMap } from "@/components/scheduler/CompactCoverageMap";
import { WeekAtAGlance } from "@/components/scheduler/WeekAtAGlance";
import { CreateShiftModal } from "@/components/scheduling/CreateShiftModal";
import { type Shift } from "@/lib/scheduling/mockData";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { toast } from "sonner";

export default function SchedulerDashboardPage() {
  const {
    state,
    getClientById,
    getRankedCandidates,
    assignShift,
    autoFillAllUnfilled,
    acceptBackfillOffer,
    triggerCallOff,
    createShift,
  } = useAgencyStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const unfilledShifts: UnfilledShiftItem[] = useMemo(() => {
    return state.visits
      .filter((v) => v.status === "Unfilled")
      .map((v) => {
        const client = getClientById(v.clientId);
        const ranked = getRankedCandidates(v.id);
        return {
          id: v.id,
          patientName: client?.name ?? "Unknown Client",
          patientAddress: client?.address ?? "Address pending",
          timeWindow: `${v.scheduledStart} - ${v.scheduledEnd}`,
          requiredSkills: v.requiredSkills,
          unfilledDuration: "Urgent",
          region: v.region,
          suggestedCaregivers: ranked.map((r) => ({
            id: r.caregiver.id,
            name: r.caregiver.name,
            rating: r.caregiver.rating,
            distanceMiles: r.caregiver.distanceMiles,
            matchingSkills: r.matchingSkills,
            matchScore: r.matchScore,
            overtimeRisk: r.overtimeRisk,
          })),
        };
      });
  }, [getClientById, getRankedCandidates, state.visits]);

  const callOffItems: CallOffItem[] = useMemo(() => {
    return state.visits
      .filter((v) => v.status === "Call-Off")
      .map((v) => {
        const client = getClientById(v.clientId);
        const ranked = getRankedCandidates(v.id);
        const replacements =
          v.backfillOffers && v.backfillOffers.length > 0
            ? v.backfillOffers.map((o) => {
                const cg = state.caregivers.find((c) => c.id === o.caregiverId);
                return {
                  id: o.caregiverId,
                  name: o.caregiverName,
                  rating: cg?.rating ?? 4.8,
                  distanceMiles: o.distanceMiles,
                  credentials: cg?.credentials ?? ["CNA"],
                };
              })
            : ranked.slice(0, 2).map((r) => ({
                id: r.caregiver.id,
                name: r.caregiver.name,
                rating: r.caregiver.rating,
                distanceMiles: r.caregiver.distanceMiles,
                credentials: r.caregiver.credentials,
              }));

        return {
          id: v.id,
          caregiverName: v.calledOffByName ?? "Assigned Caregiver",
          patientName: client?.name ?? "Client",
          timeUntilStart: "1h 45m",
          reason: v.callOffReason ?? "Last-minute availability change",
          calledOffAt: v.calledOffAt ?? "Just now",
          suggestedReplacements: replacements,
        };
      });
  }, [getClientById, getRankedCandidates, state.caregivers, state.visits]);

  const confirmedCount = useMemo(
    () =>
      state.visits.filter(
        (v) => v.status === "Scheduled" || v.status === "In Progress" || v.status === "Completed"
      ).length,
    [state.visits]
  );

  const handleAssignUnfilledShift = (
    shiftId: string,
    caregiverId: string,
    caregiverName: string
  ) => {
    const target = state.visits.find((v) => v.id === shiftId);
    const client = target ? getClientById(target.clientId) : undefined;
    assignShift(shiftId, caregiverId);
    showToast(
      `Assigned ${caregiverName} to ${client?.name ?? "client"} (${target?.scheduledStart ?? ""})`
    );
  };

  const handleAutoFillAll = () => {
    const count = autoFillAllUnfilled();
    if (count > 0) {
      toast.success(`Smart Dispatch auto-filled ${count} open shift(s).`);
    } else {
      toast.info("All open shifts are already assigned.");
    }
  };

  const handleReassignCallOff = (
    callOffId: string,
    replacementId: string,
    replacementName: string
  ) => {
    acceptBackfillOffer(callOffId, replacementId);
    showToast(`Call-off resolved: ${replacementName} assigned & synced to Caregiver portal!`);
  };

  const handleSimulateCallOff = () => {
    const scheduled = state.visits.find((v) => v.status === "Scheduled");
    if (!scheduled) {
      toast.info("No scheduled shift available to simulate a call-off.");
      return;
    }
    triggerCallOff(scheduled.id, "Transit delay / Emergency");
    toast.warning("Simulated call-off — Top-3 ranked replacement offers dispatched.");
  };

  const handleCreateShift = (newShift: Shift) => {
    const matchedClient =
      state.clients.find((c) =>
        c.name.toLowerCase().includes(newShift.patientName.toLowerCase())
      ) ?? state.clients[0];

    const created = createShift({
      clientId: matchedClient.id,
      caregiverId: null,
      scheduledStart: newShift.startTime.slice(11, 16) || "09:00 AM",
      scheduledEnd: newShift.endTime.slice(11, 16) || "01:00 PM",
      scheduledHours: 4,
      requiredSkills: newShift.requiredSkills,
      region: newShift.region || "Springfield North",
    });

    if (created) {
      showToast(`Created open shift ${created.shiftNumber} for ${matchedClient.name}`);
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500 relative">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 sm:mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Good morning, Alex 👋
            </h1>
            <span className="bg-brand-teal/10 text-brand-teal text-xs font-bold px-2.5 py-1 rounded-full border border-brand-teal/20 shrink-0">
              Scheduler On Duty
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-1.5 leading-normal">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>
              <strong className="text-slate-800">{unfilledShifts.length} unfilled</strong> and{" "}
              <strong className="text-slate-800">{callOffItems.length} call-off</strong> shift(s) tracked in live Agency Store.
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 xs:flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link
            href="/scheduler/tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 min-h-[44px] rounded-full bg-white hover:bg-teal-50/50 text-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 :shadow-[0_6px_32px_rgba(0,0,0,0.04)] hover:border-brand-teal/40 transition-all cursor-pointer text-center"
          >
            <div className="w-5 h-5 rounded-full bg-teal-50 border border-brand-teal/30 flex items-center justify-center text-brand-teal shrink-0">
              <MapPin className="w-3 h-3" />
            </div>
            <span className="truncate">Track Caregivers</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 min-h-[44px] rounded-full bg-brand-teal hover:bg-teal-600 text-white font-bold text-xs sm:text-sm :shadow-[0_6px_32px_rgba(0,0,0,0.04)] shadow-brand-teal/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span className="truncate">Create Shift</span>
          </button>
        </div>
      </div>

      {/* Row 1 — Urgency-First KPI Strip */}
      <SchedulerKpiStrip
        unfilledCount={unfilledShifts.length}
        fillingSoonCount={callOffItems.length}
        callOffsCount={callOffItems.length}
        confirmedCount={confirmedCount}
        avgFillTimeMins={18}
        availabilityGapsCount={unfilledShifts.length + callOffItems.length}
      />

      {/* Row 2 — Today's Unfilled/At-Risk Shifts (Action Queue) */}
      <UnfilledShiftsQueue
        shifts={unfilledShifts}
        onAssign={handleAssignUnfilledShift}
        onAutoFillAll={handleAutoFillAll}
      />

      {/* Row 3 — Call-Off Queue */}
      <CallOffQueue
        items={callOffItems}
        onReassign={handleReassignCallOff}
        onSimulateCallOff={handleSimulateCallOff}
      />

      {/* Row 4 — Live Coverage Map Embed */}
      <CompactCoverageMap />

      {/* Row 5 — This Week at a Glance */}
      <WeekAtAGlance />

      {/* Create Shift Modal */}
      <CreateShiftModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateShift}
      />

      {/* Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-2.5 z-50 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-brand-teal shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
