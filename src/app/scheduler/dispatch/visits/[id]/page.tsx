"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
  Edit2,
  XCircle,
  Phone,
  ShieldCheck,
  FileText,
  Check,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export default function VisitDetailsPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const {
    state,
    getClientById,
    getCaregiverById,
    triggerCallOff,
    autoAssignBestCaregiver,
  } = useAgencyStore();

  const visit = useMemo(
    () => state.visits.find((v) => v.id === id) ?? state.visits[0],
    [state.visits, id]
  );

  const client = visit ? getClientById(visit.clientId) : undefined;
  const caregiver = visit ? getCaregiverById(visit.caregiverId) : undefined;

  if (!visit) {
    return (
      <div className="p-6 text-center text-slate-500">
        Visit not found.{" "}
        <Link href="/scheduler/dispatch/visits" className="text-indigo-600 underline">
          Return to Dispatch Visits
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Unfilled":
      case "Call-Off":
        return "bg-rose-500/10 text-rose-700 border-rose-500/20";
      case "Completed":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
      case "In Progress":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "Offer Sent":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      case "Incomplete":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20";
      case "Scheduled":
        return "bg-brand-teal/10 text-teal-800 border-brand-teal/20";
      default:
        return "bg-slate-500/10 text-slate-700 border-slate-500/20";
    }
  };

  const isDispatched = visit.status !== "Unfilled" && visit.status !== "Call-Off";
  const isInProgress =
    visit.status === "In Progress" ||
    visit.status === "Completed" ||
    visit.status === "Incomplete";
  const isCompleted = visit.status === "Completed";

  const timelineSteps = [
    { label: "Scheduled", completed: true, time: visit.scheduledStart },
    { label: "Dispatched", completed: isDispatched, time: isDispatched ? visit.scheduledStart : null },
    { label: "In Progress", completed: isInProgress, time: visit.clockInTime },
    { label: "Completed", completed: isCompleted, time: visit.clockOutTime },
  ];

  const handleTriggerCallOff = () => {
    triggerCallOff(visit.id, "Marked Call-Off / Cancelled from Visit Detail");
    toast.warning(`Visit ${visit.id} flagged for backfill`);
  };

  const handleAutoAssign = () => {
    const ok = autoAssignBestCaregiver(visit.id);
    if (ok) {
      toast.success("Best-matched caregiver assigned to visit");
    } else {
      toast.error("No eligible caregiver currently available");
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <Link
            href="/scheduler/dispatch/visits"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-teal transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Visits
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Visit Details
            </h1>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
              {visit.id}
            </span>
            <span className={clsx("px-3 py-1 rounded-full text-xs font-semibold border", getStatusColor(visit.status))}>
              {visit.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {visit.status !== "Completed" && visit.status !== "Call-Off" && (
            <button
              type="button"
              onClick={handleTriggerCallOff}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 transition-all"
            >
              <XCircle className="w-4 h-4 text-rose-500" />
              Flag Call-Off
            </button>
          )}
          <Link
            href={`/scheduler/dispatch/visits/${visit.id}/edit`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-teal hover:bg-teal-600 text-white font-semibold text-sm shadow-[0_6px_32px_rgba(0,0,0,0.04)] shadow-brand-teal/25 active:scale-95 transition-all"
          >
            <Edit2 className="w-4 h-4" />
            Edit Visit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status Timeline Card */}
          <Card className="p-4 bg-white/80 backdrop-blur-xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight mb-4">Execution Timeline</h2>
            <div className="relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 rounded-full hidden sm:block"></div>
              <div
                className="absolute top-1/2 left-0 h-0.5 bg-brand-teal -translate-y-1/2 rounded-full hidden sm:block transition-all duration-1000"
                style={{ width: `${Math.max(0, timelineSteps.filter((s) => s.completed).length - 1) * 33.33}%` }}
              ></div>
              <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-0 relative z-10">
                {timelineSteps.map((step, idx) => (
                  <div key={idx} className="flex flex-row sm:flex-col items-center gap-4 sm:gap-2 text-center group">
                    <div
                      className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors shrink-0",
                        step.completed ? "bg-brand-teal border-white text-white shadow-md" : "bg-slate-100 border-white text-slate-300"
                      )}
                    >
                      {step.completed ? <Check className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />}
                    </div>
                    <div className="text-left sm:text-center">
                      <p className={clsx("text-sm font-bold", step.completed ? "text-slate-900" : "text-slate-400")}>
                        {step.label}
                      </p>
                      {step.time && (
                        <p className="text-xs text-slate-500 font-medium">{step.time}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Info Card */}
            <Card className="p-4 bg-gradient-to-br from-indigo-50/50 to-white backdrop-blur-xl border border-indigo-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                  {(client?.name ?? "C").charAt(0)}
                </div>
                {client && (
                  <Link
                    href={`/patients/${client.id}`}
                    className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors"
                    title="Open 360 Patient Hub"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-900">{client?.name ?? visit.clientId}</h3>
              <p className="text-xs text-slate-500 mb-3 font-medium">
                {client?.payer ?? "Active Client"} • {visit.region}
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {client?.phone ?? "(555) 000-0000"}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  Auth remaining: {client?.authorizedUnitsRemaining ?? 0} units
                </div>
              </div>
            </Card>

            {/* Caregiver Info Card */}
            <Card className="p-4 bg-gradient-to-br from-emerald-50/50 to-white backdrop-blur-xl border border-emerald-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-semibold text-lg">
                  {caregiver ? caregiver.name.charAt(0) : "?"}
                </div>
                {caregiver && (
                  <Link
                    href="/scheduler/caregivers"
                    className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {caregiver ? caregiver.name : "Unassigned Shift"}
              </h3>
              <p className="text-xs text-slate-500 mb-4 font-medium">
                {caregiver ? `${caregiver.roleTitle} • ★ ${caregiver.rating.toFixed(1)}` : "Assigned Resource"}
              </p>

              {caregiver ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {caregiver.weeklyHoursScheduled}/{caregiver.maxWeeklyHours} hrs/wk • {caregiver.distanceMiles} mi away
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    {caregiver.credentials.join(", ")}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Requires caregiver assignment before dispatch.
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoAssign}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Assign Best Match
                  </button>
                </div>
              )}
            </Card>
          </div>

          <Card className="p-4 bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-amber-500" />
              Service Notes & Required Skills
            </h2>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {client?.serviceName ?? "Personal Care"}
              </span>
              {visit.requiredSkills.map((skill) => (
                <span key={skill} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {skill}
                </span>
              ))}
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 leading-relaxed min-h-[90px]">
              {visit.visitNotes || "Follow standard agency ADL/IADL care plan tasks and verify EVV geofence upon arrival."}
            </div>
          </Card>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-4">
          <Card className="p-4 bg-slate-900 border border-slate-800 shadow-xl shadow-slate-900/20 rounded-2xl text-white">
            <h3 className="font-semibold text-base mb-4 text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-teal" />
              Schedule Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-normal mb-1">Date</p>
                <div className="text-sm flex items-center gap-2 text-slate-100">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {visit.visitDate} ({visit.visitDateLabel})
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-normal mb-1">Time Window</p>
                <div className="text-sm flex items-center gap-2 text-slate-100">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {visit.scheduledStart} - {visit.scheduledEnd}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-400 font-normal mb-1">Duration Estimate</p>
                <div className="text-sm text-slate-100 font-medium">
                  {visit.scheduledHours} Hours
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              Service Location
            </h2>
            <p className="text-xs text-slate-600 font-medium mb-3">
              {client ? `${client.address}, ${client.cityStateZip}` : `${visit.region} Territory`}
            </p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p>
                <span className="font-semibold text-slate-800">EVV Method:</span>{" "}
                {visit.evvMethod}
              </p>
              <p>
                <span className="font-semibold text-slate-800">GPS Offset:</span>{" "}
                {visit.gpsDistanceMeters}m (limit {visit.geofenceThresholdMeters}m)
              </p>
              <p>
                <span className="font-semibold text-slate-800">Compliance:</span>{" "}
                {visit.evvCompliance}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
