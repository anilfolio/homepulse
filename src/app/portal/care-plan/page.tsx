"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Heart,
  Target,
  CheckCircle2,
  ClipboardList,
  Pill,
  AlertCircle,
  Clock,
  Info,
  FileText,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

type Tab = "overview" | "medications" | "todos";

export default function PortalCarePlanPage() {
  const { currentUser } = useAuth();
  const { state, sendConversationMessage, logAuditEvent } = useAgencyStore();
  const isClient = currentUser?.role === "CLIENT";

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [changeNote, setChangeNote] = useState("");
  const [completedReminders, setCompletedReminders] = useState<Record<string, boolean>>({});

  const client = state.clients[0];
  const clientVisits = useMemo(
    () =>
      client
        ? state.visits.filter((v) => v.clientId === client.id)
        : state.visits,
    [client, state.visits]
  );

  const tasks = useMemo(() => {
    const firstWithTasks = clientVisits.find((v) => v.tasks.length > 0) ?? state.visits[0];
    return firstWithTasks?.tasks ?? [];
  }, [clientVisits, state.visits]);

  const medications = useMemo(() => {
    const firstWithMeds = clientVisits.find((v) => v.medications.length > 0) ?? state.visits[0];
    return firstWithMeds?.medications ?? [];
  }, [clientVisits, state.visits]);

  const goals = client?.carePlanGoals ?? [
    "Maintain safe ambulation & fall-free home environment",
    "Complete daily ADL & hydration routines comfortably",
    "Ensure timely medication reminders & wellness monitoring",
  ];

  const handleSubmitChangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeNote.trim()) return;
    const conv = state.conversations[0];
    if (conv) {
      sendConversationMessage({
        conversationId: conv.id,
        content: `[Care Plan Request for ${client?.name ?? "Client"}]: ${changeNote.trim()}`,
        channelMode: "in-app",
        isInternalNote: false,
      });
    }
    logAuditEvent({
      action: "CARE_PLAN_SYNC",
      resourceType: "CarePlan",
      resourceId: client?.id ?? "client-101",
      summary: "Client/Family submitted care plan adjustment request from Portal.",
      status: "Success",
    });
    setChangeNote("");
    toast.success("Care plan update request sent to RN Clinical Supervisor");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            {isClient ? "My Care Plan" : `Care Plan — ${client?.name ?? "Client"}`}
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            {client?.carePlanVersion
              ? `Version ${client.carePlanVersion} (Updated ${client.carePlanUpdatedAt ?? "Recently"})`
              : "Live goals, daily visit tasks, and medication reminders synced with Clinical."}
          </p>
        </div>
        <div className="w-10 h-10 bg-[#b8e1d3] rounded-full flex items-center justify-center text-brand-teal shrink-0">
          <Heart className="w-5 h-5" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1.5 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl overflow-x-auto border border-slate-200 w-full sm:w-max max-w-full">
        {(
          [
            { id: "overview", label: "Overview & Tasks" },
            { id: "medications", label: `Medications (${medications.length})` },
            { id: "todos", label: isClient ? "My Reminders" : "Family Action Items" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "relative px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap rounded-xl",
              activeTab === tab.id ? "text-brand-teal bg-brand-teal/10 border border-brand-teal/20" : "text-slate-500 hover:text-slate-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border-subtle">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-teal" />
                Active Care Plan Goals
              </h2>
              <div className="space-y-3">
                {goals.map((goal, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-border-subtle flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-sm font-medium text-text-primary">{goal}</span>
                    </div>
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">Active</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border-subtle">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-brand-teal" />
                {isClient ? "What my caregivers help me with" : "Scheduled Visit Tasks"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{task.title}</div>
                      <div className="text-xs text-slate-500">{task.category}</div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        task.completed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {task.completed ? "Done" : "Scheduled"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex gap-3 items-start">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Changes signed by your Clinical Supervisor RN immediately synchronize into upcoming caregiver checklists.
                </p>
              </div>
              <Link
                href="/portal/messages"
                className="inline-flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium w-fit ml-8"
              >
                <AlertCircle className="w-4 h-4" />
                Message Care Coordinator
              </Link>
            </div>

            <form
              onSubmit={handleSubmitChangeRequest}
              className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border-subtle space-y-3"
            >
              <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-teal" />
                Request Care Plan Adjustment
              </h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  placeholder="Describe any task, timing, or mobility update..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-600 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Send Request
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === "medications" && (
          <motion.div
            key="medications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border-subtle space-y-4"
          >
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Pill className="w-5 h-5 text-brand-teal" />
              Active Medication Reminder Schedule
            </h2>
            {medications.length === 0 ? (
              <p className="text-sm text-slate-500">No medication reminders listed on today&apos;s plan.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {medications.map((med) => (
                  <div key={med.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        {med.medicationName} ({med.dosage})
                      </div>
                      <div className="text-xs text-slate-500">
                        {med.scheduleTime} • {med.instructions}
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
                      {med.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "todos" && (
          <motion.div
            key="todos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border-subtle space-y-3"
          >
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-brand-teal" />
              {isClient ? "Daily Home Checklist" : "Family Preparation Reminders"}
            </h2>
            {[
              { id: "rem-1", text: "Keep pathway to bathroom clutter-free before caregiver arrival" },
              { id: "rem-2", text: "Leave spare pill organizer clearly accessible on kitchen counter" },
              { id: "rem-3", text: "Review upcoming week's visit window in Schedule tab" },
            ].map((item) => {
              const checked = Boolean(completedReminders[item.id]);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setCompletedReminders((prev) => ({ ...prev, [item.id]: !checked }))
                  }
                  className="w-full text-left p-3.5 rounded-xl border border-slate-200 flex items-center gap-3 hover:bg-slate-50"
                >
                  <CheckCircle2
                    className={clsx(
                      "w-5 h-5 shrink-0",
                      checked ? "text-emerald-600" : "text-slate-300"
                    )}
                  />
                  <span className={clsx("text-sm", checked ? "line-through text-slate-400" : "text-slate-800")}>
                    {item.text}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
