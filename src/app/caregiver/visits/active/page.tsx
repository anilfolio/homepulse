"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { MapPin, CheckCircle, Circle, Play, Square, FileSignature, Mic, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function ActiveVisitPage() {
  const {
    state,
    getClientById,
    clockInVisit,
    toggleVisitTask,
    applyVoiceNoteToVisit,
    clockOutVisit,
  } = useAgencyStore();

  const [simulateOutOfRadius, setSimulateOutOfRadius] = useState(false);

  const activeVisit = useMemo(() => {
    return (
      state.visits.find((v) => v.visitDateLabel === "Today" && v.status === "In Progress") ||
      state.visits.find((v) => v.visitDateLabel === "Today" && v.status === "Scheduled") ||
      state.visits[0]
    );
  }, [state.visits]);

  const client = activeVisit ? getClientById(activeVisit.clientId) : undefined;
  const hasClockedIn = activeVisit?.status === "In Progress" || activeVisit?.status === "Completed";
  const hasClockedOut = activeVisit?.status === "Completed";

  const handleClockIn = () => {
    if (!activeVisit) return;
    const meters = simulateOutOfRadius ? 195 : 22;
    clockInVisit(activeVisit.id, "gps", meters);
    if (simulateOutOfRadius) {
      toast.warning(`Clocked in at ${meters}m — Geofence exception flagged for EVV review.`);
    } else {
      toast.success("Clocked in successfully. GPS verified (<100m).");
    }
  };

  const handleClockOut = () => {
    if (!activeVisit) return;
    if (activeVisit.tasks.some((t) => !t.completed)) {
      toast.error("Please complete all tasks before clocking out (or use AI Voice Chart).");
      return;
    }
    clockOutVisit(activeVisit.id, {
      notes: activeVisit.visitNotes || "Completed scheduled care tasks safely.",
      signatureCaptured: true,
      mileage: 3.4,
    });
    toast.success("Clocked out! EVV & Pre-Billing Scrub evaluated automatically.");
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
        <Card className="p-4 shadow-sm border-slate-200 text-center space-y-3">
          {!hasClockedIn && (
            <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-600">GPS Geofence Mode:</span>
              <button
                type="button"
                onClick={() => setSimulateOutOfRadius((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  simulateOutOfRadius
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                }`}
              >
                {simulateOutOfRadius ? "Off-Site (195m Exception)" : "On-Site (22m Verified)"}
              </button>
            </div>
          )}

          {!hasClockedIn ? (
            <button
              type="button"
              onClick={handleClockIn}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-colors flex justify-center items-center gap-2 shadow-[0_8px_30px_rgba(16,185,129,0.2)] cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current" /> Clock In
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
                  Clocked in at {activeVisit.clockInTime} ({activeVisit.gpsDistanceMeters}m)
                </span>
              </div>
              <button
                type="button"
                onClick={handleClockOut}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-lg hover:bg-red-600 transition-colors flex justify-center items-center gap-2 shadow-[0_8px_30px_rgba(239,68,68,0.2)] cursor-pointer"
              >
                <Square className="w-6 h-6 fill-current" /> Clock Out
              </button>
            </div>
          ) : (
            <div className="text-sm font-bold text-slate-700 bg-slate-100 p-4 rounded-xl">
              Visit Completed ({activeVisit.evvCompliance})
              <br />
              <span className="text-xs font-normal text-slate-500">
                {activeVisit.clockInTime} – {activeVisit.clockOutTime} • Billing: {activeVisit.billingStatus}
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
              Care Plan Tasks
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
