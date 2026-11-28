"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import {
  MapPin,
  CheckCircle,
  Circle,
  Play,
  Square,
  FileSignature,
  Mic,
  AlertTriangle,
  WifiOff,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function ActiveVisitPage() {
  const {
    state,
    getClientById,
    clockInVisit,
    toggleVisitTask,
    applyVoiceNoteToVisit,
    clockOutVisit,
    queueOfflineEvvClock,
    syncOfflineEvvQueue,
  } = useAgencyStore();

  const [simulateOutOfRadius, setSimulateOutOfRadius] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const activeVisit = useMemo(() => {
    return (
      state.visits.find((v) => v.visitDateLabel === "Today" && v.status === "In Progress") ||
      state.visits.find((v) => v.visitDateLabel === "Today" && v.status === "Scheduled") ||
      state.visits[0]
    );
  }, [state.visits]);

  const client = activeVisit ? getClientById(activeVisit.clientId) : undefined;
  const pendingOfflineRecords = state.offlineEvvQueue.filter((r) => !r.synced);
  const hasQueuedClockIn = pendingOfflineRecords.some(
    (r) => r.visitId === activeVisit?.id && r.actionType === "CLOCK_IN"
  );
  const hasQueuedClockOut = pendingOfflineRecords.some(
    (r) => r.visitId === activeVisit?.id && r.actionType === "CLOCK_OUT"
  );

  const hasClockedIn =
    activeVisit?.status === "In Progress" ||
    activeVisit?.status === "Completed" ||
    hasQueuedClockIn;
  const hasClockedOut = activeVisit?.status === "Completed" || hasQueuedClockOut;

  const handleClockIn = async () => {
    if (!activeVisit) return;
    const meters = simulateOutOfRadius ? 195 : 22;

    if (offlineMode) {
      const rec = await queueOfflineEvvClock({
        visitId: activeVisit.id,
        actionType: "CLOCK_IN",
        method: "gps",
        gpsDistanceMeters: meters,
      });
      if (rec) {
        toast.info(
          `Offline Clock-In cached with HMAC (${rec.hmacSignature.slice(0, 18)}...). Sync when online.`
        );
      }
      return;
    }

    clockInVisit(activeVisit.id, "gps", meters);
    if (simulateOutOfRadius) {
      toast.warning(`Clocked in at ${meters}m — Geofence exception flagged for EVV review.`);
    } else {
      toast.success("Clocked in successfully. GPS verified (<100m).");
    }
  };

  const handleClockOut = async () => {
    if (!activeVisit) return;
    if (activeVisit.tasks.some((t) => !t.completed)) {
      toast.error("Please complete all tasks before clocking out (or use AI Voice Fill).");
      return;
    }

    if (offlineMode) {
      const rec = await queueOfflineEvvClock({
        visitId: activeVisit.id,
        actionType: "CLOCK_OUT",
        method: "gps",
        gpsDistanceMeters: simulateOutOfRadius ? 195 : 22,
        notes: activeVisit.visitNotes || "Completed scheduled care tasks safely (Offline Mode).",
        signatureCaptured: true,
        mileage: 3.4,
      });
      if (rec) {
        toast.info(
          `Offline Clock-Out signed (${rec.hmacSignature.slice(0, 18)}...). Ready to sync.`
        );
      }
      return;
    }

    clockOutVisit(activeVisit.id, {
      notes: activeVisit.visitNotes || "Completed scheduled care tasks safely.",
      signatureCaptured: true,
      mileage: 3.4,
    });
    toast.success("Clocked out! EVV, Billing Scrub & Payroll updated automatically.");
  };

  const handleSyncOffline = () => {
    const count = syncOfflineEvvQueue();
    if (count > 0) {
      setOfflineMode(false);
      toast.success(`Synced ${count} HMAC-signed EVV record(s) to Agency Store.`);
    }
  };

  if (!activeVisit) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center text-sm text-slate-500">
        No active visits available.
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500 max-w-lg mx-auto pb-20">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Visit</h1>
        <p className="text-sm text-slate-500 mt-1">{client?.name ?? "Client"}</p>
        <div className="flex justify-center items-center gap-1 mt-2 text-xs font-semibold text-slate-500">
          <MapPin className="w-3.5 h-3.5" /> {client?.address}, {client?.cityStateZip}
        </div>
      </div>

      <div className="space-y-4">
        {/* Offline HMAC Queue Banner */}
        {(offlineMode || pendingOfflineRecords.length > 0) && (
          <Card className="p-3 bg-[#141D3C] text-white border-[#2A3B75] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <WifiOff className="w-4 h-4 text-[#57EAB6] shrink-0" />
              <div>
                <div className="font-semibold">
                  Offline HMAC-SHA256 EVV Queue ({pendingOfflineRecords.length} pending)
                </div>
                <div className="text-slate-300 text-[11px]">
                  Cryptographically signed per 21st Century Cures Act durability rules.
                </div>
              </div>
            </div>
            {pendingOfflineRecords.length > 0 && (
              <button
                type="button"
                onClick={handleSyncOffline}
                className="px-3 py-1.5 rounded-lg bg-[#57EAB6] text-[#141D3C] font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer hover:opacity-90"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sync Now
              </button>
            )}
          </Card>
        )}

        <Card className="p-4 shadow-sm border-slate-200 text-center space-y-3">
          {!hasClockedOut && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSimulateOutOfRadius((prev) => !prev)}
                className={`px-2.5 py-2 rounded-xl font-bold cursor-pointer border ${
                  simulateOutOfRadius
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-emerald-100 text-emerald-800 border-emerald-300"
                }`}
              >
                {simulateOutOfRadius ? "Off-Site (195m Exception)" : "On-Site (22m Verified)"}
              </button>
              <button
                type="button"
                onClick={() => setOfflineMode((prev) => !prev)}
                className={`px-2.5 py-2 rounded-xl font-bold cursor-pointer border flex items-center justify-center gap-1.5 ${
                  offlineMode
                    ? "bg-[#141D3C] text-[#57EAB6] border-[#2A3B75]"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                {offlineMode ? <WifiOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                {offlineMode ? "Offline HMAC Mode ON" : "Online Live Sync"}
              </button>
            </div>
          )}

          {!hasClockedIn ? (
            <button
              type="button"
              onClick={handleClockIn}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-colors flex justify-center items-center gap-2 shadow-[0_8px_30px_rgba(16,185,129,0.2)] cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current" />{" "}
              {offlineMode ? "Offline HMAC Clock In" : "Clock In"}
            </button>
          ) : !hasClockedOut ? (
            <div className="space-y-4">
              <div
                className={`text-sm font-semibold p-2.5 rounded-lg border flex items-center justify-center gap-2 ${
                  activeVisit.evvCompliance === "Exception"
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-emerald-600 bg-emerald-50 border-emerald-100"
                }`}
              >
                {activeVisit.evvCompliance === "Exception" && <AlertTriangle className="w-4 h-4" />}
                <span>
                  {hasQueuedClockIn
                    ? "Clocked in Offline (HMAC Signed — awaiting sync)"
                    : `Clocked in at ${activeVisit.clockInTime} (${activeVisit.gpsDistanceMeters}m)`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClockOut}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-lg hover:bg-red-600 transition-colors flex justify-center items-center gap-2 shadow-[0_8px_30px_rgba(239,68,68,0.2)] cursor-pointer"
              >
                <Square className="w-6 h-6 fill-current" />{" "}
                {offlineMode ? "Offline HMAC Clock Out" : "Clock Out"}
              </button>
            </div>
          ) : (
            <div className="text-sm font-bold text-slate-700 bg-slate-100 p-4 rounded-xl">
              {hasQueuedClockOut
                ? "Visit Clock-Out Signed Offline (Pending Sync)"
                : `Visit Completed (${activeVisit.evvCompliance})`}
              <br />
              <span className="text-xs font-normal text-slate-500">
                {activeVisit.clockInTime ?? "Offline"} – {activeVisit.clockOutTime ?? "Pending Sync"} • Billing:{" "}
                {activeVisit.billingStatus}
              </span>
            </div>
          )}
        </Card>

        <Card
          className={`p-4 shadow-sm border-slate-200 ${
            !hasClockedIn || hasClockedOut ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Care Plan Tasks ({activeVisit.tasks.filter((t) => t.completed).length}/{activeVisit.tasks.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                applyVoiceNoteToVisit(activeVisit.id, "routine_stable");
                toast.success("AI Voice-to-Care-Note completed matching tasks & vitals.");
              }}
              className="text-xs font-bold text-[#6C88FF] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" /> AI Voice Fill
            </button>
          </div>
          <div className="space-y-2">
            {activeVisit.tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleVisitTask(activeVisit.id, task.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  task.completed
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                }`}
              >
                {task.completed ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    task.completed ? "text-emerald-800 line-through" : "text-slate-700"
                  }`}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {activeVisit.visitNotes && (
          <Card className="p-4 shadow-sm border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileSignature className="w-4 h-4 text-brand-teal" /> Visit Note &amp; Vitals
            </div>
            <p className="leading-relaxed">{activeVisit.visitNotes}</p>
            {activeVisit.vitals && (
              <p className="text-[11px] font-semibold text-emerald-700 pt-1">
                BP {activeVisit.vitals.bp} • HR {activeVisit.vitals.hr} • Temp {activeVisit.vitals.temp}
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
