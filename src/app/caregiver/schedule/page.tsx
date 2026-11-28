"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  MapPin,
  CheckCircle2,
  Plus,
  AlertTriangle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CaregiverLayout } from "@/components/caregiver/CaregiverLayout";
import {
  INITIAL_TIME_OFF,
  TimeOffRequest,
} from "@/lib/caregiver/caregiverPortalData";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { Avatar } from "@/components/ui/Avatar";

type ScheduleTab = "week" | "open" | "availability" | "timeoff";

const WEEK_COLUMNS = [
  { day: "Mon", label: "Day -2", dateMatch: "Yesterday" },
  { day: "Tue", label: "Day -1", dateMatch: "Mon" },
  { day: "Wed", label: "Today", dateMatch: "Today", isToday: true },
  { day: "Thu", label: "Tomorrow", dateMatch: "Tomorrow" },
  { day: "Fri", label: "Upcoming", dateMatch: "Fri" },
  { day: "Sat", label: "Weekend", dateMatch: "Sat" },
  { day: "Sun", label: "Weekend", dateMatch: "Sun" },
];

export default function CaregiverSchedulePage() {
  const router = useRouter();
  const {
    state,
    getClientById,
    assignShift,
    acceptBackfillOffer,
    triggerCallOff,
    logAuditEvent,
  } = useAgencyStore();

  const [weekOffset, setWeekOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<ScheduleTab>("week");
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>(INITIAL_TIME_OFF);

  const [showCallOffModal, setShowCallOffModal] = useState(false);
  const [selectedCallOffVisitId, setSelectedCallOffVisitId] = useState<string>("");
  const [callOffReason, setCallOffReason] = useState("Illness / Unwell");
  const [callOffSubmitted, setCallOffSubmitted] = useState(false);

  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [startDate, setStartDate] = useState("2026-08-01");
  const [endDate, setEndDate] = useState("2026-08-03");
  const [toReason, setToReason] = useState("Personal / Family");

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [availability, setAvailability] = useState<Record<string, boolean>>({
    "Mon-morning": true,
    "Mon-afternoon": true,
    "Tue-morning": true,
    "Tue-afternoon": true,
    "Wed-morning": true,
    "Wed-afternoon": true,
    "Thu-morning": true,
    "Thu-afternoon": true,
    "Fri-morning": true,
    "Fri-afternoon": false,
    "Sat-morning": true,
    "Sat-afternoon": false,
    "Sun-morning": false,
    "Sun-afternoon": false,
  });

  // Live assigned shifts for active caregiver (cg-101)
  const myAssignedVisits = useMemo(
    () =>
      state.visits.filter(
        (v) =>
          v.caregiverId === "cg-101" &&
          v.status !== "Call-Off" &&
          v.status !== "Unfilled"
      ),
    [state.visits]
  );

  // Live open shifts & backfill broadcasts
  const openShiftVisits = useMemo(
    () =>
      state.visits.filter(
        (v) =>
          v.status === "Unfilled" ||
          v.status === "Call-Off" ||
          v.status === "Offer Sent"
      ),
    [state.visits]
  );

  const activeCallOffVisitId =
    selectedCallOffVisitId || myAssignedVisits[0]?.id || "";

  const getWeekRangeLabel = (offset: number) => {
    if (offset === 0) return "Current Operational Week (Live Store)";
    if (offset > 0) return `Week +${offset} Ahead`;
    return `Week ${offset} Prior`;
  };

  const toggleAvailabilityCell = (key: string) => {
    setAvailability((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveAvailability = () => {
    logAuditEvent({
      action: "UPDATE",
      resourceType: "Session",
      resourceId: "cg-101",
      summary: "Updated caregiver weekly availability matrix for scheduler dispatch matching.",
      status: "Success",
    });
    toast.success("Availability preferences saved & synced with Admin Scheduler");
  };

  const handleAcceptOpenShift = (visitId: string, status: string) => {
    if (status === "Call-Off" || status === "Offer Sent") {
      acceptBackfillOffer(visitId, "cg-101");
    } else {
      assignShift(visitId, "cg-101");
    }
    toast.success("Open shift accepted! Added to your active dispatch schedule.");
  };

  const handleTimeOffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: TimeOffRequest = {
      id: `to-${timeOffRequests.length + 10}`,
      startDate,
      endDate,
      reason: toReason,
      status: "Pending",
      submittedAt: new Date().toISOString().split("T")[0],
    };
    setTimeOffRequests([newReq, ...timeOffRequests]);
    logAuditEvent({
      action: "CREATE",
      resourceType: "Session",
      resourceId: newReq.id,
      summary: `Submitted caregiver time-off request (${startDate} to ${endDate}).`,
      status: "Success",
    });
    setShowTimeOffModal(false);
    toast.success("Time-off request routed to HR & Scheduler");
  };

  const handleCallOffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCallOffVisitId) return;
    setCallOffSubmitted(true);
    triggerCallOff(activeCallOffVisitId, callOffReason);
    toast.warning("Call-off broadcast sent to Scheduler Backfill Queue");
    setTimeout(() => {
      setCallOffSubmitted(false);
      setShowCallOffModal(false);
    }, 600);
  };

  return (
    <CaregiverLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Tabs */}
        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule & Shift Management</h1>
            <p className="text-xs text-gray-500 mt-1">
              Live shifts synced with Scheduler Dispatch, Open Shift Backfill Board, and HR Availability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl text-xs font-semibold">
            {(
              [
                { id: "week", label: `My Week Grid (${myAssignedVisits.length})` },
                { id: "open", label: `Open Shifts (${openShiftVisits.length})` },
                { id: "availability", label: "Availability Editor" },
                { id: "timeoff", label: "Time-Off Requests" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 rounded-lg transition-all ${
                  activeTab === t.id
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: WEEK CALENDAR GRID */}
        {activeTab === "week" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.04)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setWeekOffset((prev) => prev - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-gray-100 text-gray-600 cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekOffset((prev) => prev + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-gray-100 text-gray-600 cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-gray-900">{getWeekRangeLabel(weekOffset)}</h3>
              </div>

              <button
                type="button"
                onClick={() => setShowCallOffModal(true)}
                disabled={myAssignedVisits.length === 0}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Call-off / Can&apos;t Make Shift</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {WEEK_COLUMNS.map((col) => {
                const dayShifts = myAssignedVisits.filter(
                  (v) =>
                    v.visitDateLabel === col.dateMatch ||
                    v.visitDateLabel.toLowerCase().includes(col.day.toLowerCase())
                );
                return (
                  <div
                    key={col.day}
                    className="bg-white rounded-2xl border border-slate-200 p-3 min-h-[220px] flex flex-col space-y-2"
                  >
                    <div className="border-b border-gray-100 pb-2 text-center">
                      <span className="text-xs font-bold text-gray-500 uppercase">{col.day}</span>
                      <div className={`text-xs ${col.isToday ? "text-brand-teal font-bold" : "text-gray-700 font-semibold"}`}>
                        {col.label}
                      </div>
                    </div>

                    <div className="space-y-2 flex-1">
                      {dayShifts.length > 0 ? (
                        dayShifts.map((v) => {
                          const client = getClientById(v.clientId);
                          return (
                            <div
                              key={v.id}
                              onClick={() => router.push("/caregiver/visits/active")}
                              className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1 cursor-pointer hover:bg-blue-100 transition-colors"
                            >
                              <span className="font-bold text-blue-950 block truncate">
                                {client?.name ?? v.clientId}
                              </span>
                              <span className="text-[11px] font-mono text-blue-800 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-600" /> {v.scheduledStart}
                              </span>
                              <span className="text-[10px] bg-white text-blue-700 px-1.5 py-0.5 rounded font-medium inline-block border border-blue-100">
                                {v.status}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex items-center justify-center text-[11px] text-gray-400 italic">
                          No shifts
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: OPEN SHIFTS TABLE */}
        {activeTab === "open" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Available Open & Backfill Shifts</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Live unfilled shifts & call-off broadcasts from Scheduler Dispatch.
                </p>
              </div>

              <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
                Instant Acceptance Enabled
              </span>
            </div>

            {openShiftVisits.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                All agency shifts are currently staffed. Check back soon or update your availability.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {openShiftVisits.map((v) => {
                  const client = getClientById(v.clientId);
                  return (
                    <div
                      key={v.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white shadow-[0_6px_32px_rgba(0,0,0,0.04)] space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Avatar name={client?.name ?? "Client"} size="md" className="rounded-xl" />
                          <div>
                            <h4 className="font-bold text-sm text-gray-900">
                              {client?.name ?? v.clientId}
                            </h4>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-brand-teal" /> {v.region}
                            </p>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-gray-50 text-xs space-y-1 font-medium">
                          <div className="text-gray-800 font-bold">
                            {v.visitDateLabel} ({v.visitDate})
                          </div>
                          <div className="text-gray-600 flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-blue-600" /> {v.scheduledStart} - {v.scheduledEnd}
                          </div>
                        </div>

                        {v.status === "Call-Off" && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-amber-600" /> Urgent Backfill (+$4/hr bonus)
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-400 font-medium block">Est. Hours</span>
                          <span className="text-sm font-bold text-gray-900">{v.scheduledHours} hrs</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAcceptOpenShift(v.id, v.status)}
                          className="px-4 py-2 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Accept Shift
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AVAILABILITY GRID */}
        {activeTab === "availability" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Weekly Availability Hours Editor</h3>
                <p className="text-xs text-gray-500 mt-0.5">Feeds the Scheduler match algorithm for shift dispatching.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveAvailability}
                className="px-4 py-2 bg-brand-teal text-white font-bold rounded-xl text-xs shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:bg-brand-teal/90"
              >
                Save Availability
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {days.map((day) => (
                <div key={day} className="space-y-3">
                  <div className="text-center font-bold text-xs text-gray-700 uppercase pb-2 border-b border-gray-100">{day}</div>

                  {["morning", "afternoon"].map((period) => {
                    const key = `${day}-${period}`;
                    const isAvail = availability[key];
                    return (
                      <button
                        key={period}
                        type="button"
                        onClick={() => toggleAvailabilityCell(key)}
                        className={`w-full p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                          isAvail
                            ? "bg-brand-teal/10 border-brand-teal text-brand-teal shadow-2xs"
                            : "bg-gray-50 border-gray-200 text-gray-400"
                        }`}
                      >
                        <div className="capitalize">{period}</div>
                        <div className="text-[10px] font-normal mt-0.5">{period === "morning" ? "8am - 2pm" : "2pm - 8pm"}</div>
                        <div className="mt-1 font-bold">{isAvail ? "AVAILABLE" : "UNAVAILABLE"}</div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TIME-OFF REQUESTS */}
        {activeTab === "timeoff" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Time-Off Requests & Status</h3>
                <p className="text-xs text-gray-500 mt-0.5">Submit upcoming PTO or medical leave for HR approval.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTimeOffModal(true)}
                className="px-4 py-2 bg-brand-teal text-white font-bold rounded-xl text-xs shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:bg-brand-teal/90 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Request Time Off
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Dates</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Submitted</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Reviewer Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {timeOffRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/60 font-medium">
                      <td className="p-3 font-bold text-gray-900">{req.startDate} to {req.endDate}</td>
                      <td className="p-3 text-gray-700">{req.reason}</td>
                      <td className="p-3 text-gray-500">{req.submittedAt}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            req.status === "Approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : req.status === "Pending"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">{req.reviewerNote || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Call-off Modal */}
      <AnimatePresence>
        {showCallOffModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Call-off / Shift Relief Request</h3>
              <p className="text-xs text-gray-600 mt-1">
                Immediately triggers Scheduler backfill broadcast and ranks eligible replacement caregivers.
              </p>
              <form onSubmit={handleCallOffSubmit} className="my-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Select Shift to Call Off</label>
                  <select
                    value={activeCallOffVisitId}
                    onChange={(e) => setSelectedCallOffVisitId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium bg-white"
                  >
                    {myAssignedVisits.map((v) => {
                      const client = getClientById(v.clientId);
                      return (
                        <option key={v.id} value={v.id}>
                          {v.visitDateLabel}: {client?.name ?? v.clientId} ({v.scheduledStart} - {v.scheduledEnd})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Call-off Reason *</label>
                  <select
                    value={callOffReason}
                    onChange={(e) => setCallOffReason(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium bg-white"
                  >
                    <option value="Illness / Unwell">Illness / Unwell</option>
                    <option value="Family Emergency">Family Emergency</option>
                    <option value="Vehicle Breakdown">Vehicle Breakdown</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCallOffModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-rose-700"
                  >
                    {callOffSubmitted ? "Notifying Dispatcher..." : "Submit Call-off"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Time Off Modal */}
      <AnimatePresence>
        {showTimeOffModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100"
            >
              <h3 className="text-lg font-bold text-gray-900">Request Time Off</h3>
              <form onSubmit={handleTimeOffSubmit} className="my-4 space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Reason</label>
                  <input
                    type="text"
                    value={toReason}
                    onChange={(e) => setToReason(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTimeOffModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-brand-teal text-white rounded-xl font-bold"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </CaregiverLayout>
  );
}
