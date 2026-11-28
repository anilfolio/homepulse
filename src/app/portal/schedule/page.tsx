"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, Clock, MessageSquare, ChevronRight, CalendarCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { AgencyShiftVisit } from "@/types/agency";

export default function PortalSchedulePage() {
  const { currentUser } = useAuth();
  const { state, getCaregiverById, getClientById, sendConversationMessage } = useAgencyStore();
  const isClient = currentUser?.role === "CLIENT";

  const [selectedVisit, setSelectedVisit] = useState<AgencyShiftVisit | null>(null);
  const [panelType, setPanelType] = useState<"visit" | "change-request" | null>(null);
  const [changeRequestNote, setChangeRequestNote] = useState("");

  const client = state.clients[0];
  const allClientVisits = useMemo(
    () =>
      client
        ? state.visits.filter((v) => v.clientId === client.id)
        : state.visits,
    [client, state.visits]
  );

  const todaysVisit = allClientVisits.find((v) => v.visitDateLabel === "Today") ?? allClientVisits[0];
  const upcomingVisits = allClientVisits.filter((v) => v.id !== todaysVisit?.id);

  const closePanel = () => {
    setPanelType(null);
    setSelectedVisit(null);
  };

  const handleSubmitChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeRequestNote.trim()) return;
    const conv = state.conversations[0];
    if (conv) {
      sendConversationMessage({
        conversationId: conv.id,
        content: `[Schedule Change Request]: ${changeRequestNote.trim()}`,
        channelMode: "in-app",
        isInternalNote: false,
      });
    }
    setChangeRequestNote("");
    closePanel();
    toast.success("Schedule adjustment request sent to Scheduler Dispatch");
  };

  const todayCg = todaysVisit ? getCaregiverById(todaysVisit.caregiverId) : undefined;

  return (
    <div className="max-w-7xl mx-auto space-y-4 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{isClient ? "My Schedule" : "Schedule"}</h1>
          <p className="text-xs text-text-secondary mt-1">
            Live visits synced with Scheduler Dispatch &amp; EVV check-in status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPanelType("change-request")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-border-subtle hover:bg-slate-50 text-text-primary rounded-xl text-sm font-medium transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.04)] w-full sm:w-auto"
        >
          <MessageSquare className="w-4 h-4" />
          Request Change
        </button>
      </div>

      <div className="space-y-6">
        {todaysVisit && (
          <section>
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3 pl-1 border-b border-border-subtle pb-2">
              Today
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                setSelectedVisit(todaysVisit);
                setPanelType("visit");
              }}
              className="relative overflow-hidden bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-brand-teal/20 cursor-pointer hover:border-brand-teal/50 transition-colors group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-[#E6F7F1] text-brand-teal text-xs font-semibold rounded-full flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      {todaysVisit.status}
                    </span>
                    <span className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {todaysVisit.scheduledStart} - {todaysVisit.scheduledEnd}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    Visit with {todayCg?.name ?? "Care Team Member"}
                  </h3>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 px-4 py-3 rounded-xl border border-border-subtle">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-600 shrink-0">
                    {(todayCg?.name ?? "C").charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-text-primary text-sm">{todayCg?.name ?? "Unassigned"}</div>
                    <div className="text-xs text-text-secondary">{todayCg?.roleTitle ?? "Primary Caregiver"}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3 pl-1 border-b border-border-subtle pb-2 mt-4">
            Upcoming &amp; Recent Visits
          </h2>
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border-subtle overflow-hidden">
            <div className="divide-y divide-border-subtle">
              {upcomingVisits.map((visit) => {
                const cg = getCaregiverById(visit.caregiverId);
                return (
                  <div
                    key={visit.id}
                    onClick={() => {
                      setSelectedVisit(visit);
                      setPanelType("visit");
                    }}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 w-52">
                        <div className="w-10 h-10 rounded-xl bg-brand-teal/20 text-brand-teal flex items-center justify-center shrink-0">
                          <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary text-sm">{visit.visitDateLabel}</div>
                          <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {visit.scheduledStart} - {visit.scheduledEnd}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-600 border border-slate-200 text-xs shrink-0">
                          {(cg?.name ?? "?").charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{cg?.name ?? "Pending Caregiver Assignment"}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-teal transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {panelType && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePanel}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-border-subtle"
            >
              <div className="flex items-center justify-between p-6 border-b border-border-subtle">
                <h2 className="text-lg font-semibold text-text-primary">
                  {panelType === "visit" ? "Visit Details" : "Request Schedule Change"}
                </h2>
                <button type="button" onClick={closePanel} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                {panelType === "visit" && selectedVisit && (
                  <div className="space-y-4 text-sm">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="font-semibold text-slate-900">
                        {getClientById(selectedVisit.clientId)?.name ?? selectedVisit.clientId}
                      </div>
                      <div className="text-xs text-slate-500">
                        {selectedVisit.visitDateLabel} ({selectedVisit.scheduledStart} - {selectedVisit.scheduledEnd})
                      </div>
                      <div className="text-xs text-brand-teal font-semibold">Status: {selectedVisit.status}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Caregiver</div>
                      <div className="font-medium text-slate-800">
                        {getCaregiverById(selectedVisit.caregiverId)?.name ?? "Pending Dispatch"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Planned Tasks</div>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {selectedVisit.tasks.map((t) => (
                          <li key={t.id}>• {t.title}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {panelType === "change-request" && (
                  <form onSubmit={handleSubmitChange} className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Describe the visit date/time change needed and our Scheduler will adjust dispatch live.
                    </p>
                    <textarea
                      rows={4}
                      required
                      value={changeRequestNote}
                      onChange={(e) => setChangeRequestNote(e.target.value)}
                      placeholder="e.g., Move Thursday morning shift from 9 AM to 11 AM..."
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-brand-teal text-white rounded-xl text-sm font-semibold hover:bg-teal-600"
                    >
                      Send Schedule Request
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
