"use client";

import React, { useMemo, useState } from "react";
import { visitHistory } from "@/lib/portalMockData";
import { CalendarDays, Clock, CheckCircle2, ChevronRight, Image as ImageIcon, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

interface PortalVisitView {
  id: string;
  date: string;
  caregiver: string;
  duration: string;
  statusLabel: string;
  shortNote: string;
  firstPersonShortNote?: string;
  tasksCompleted: string[];
  photos: string[];
  rating?: number | null;
  feedback?: string | null;
}

export default function PortalVisitsPage() {
  const { currentUser } = useAuth();
  const { state, getCaregiverById, getClientById } = useAgencyStore();
  const isClient = currentUser?.role === "CLIENT";

  const [selectedVisit, setSelectedVisit] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});

  const liveVisits: PortalVisitView[] = useMemo(() => {
    const syncedFromStore: PortalVisitView[] = state.visits
      .filter((v) => v.status === "In Progress" || v.status === "Completed")
      .map((v) => {
        const cg = getCaregiverById(v.caregiverId);
        const client = getClientById(v.clientId);
        const completedTasks = v.tasks
          .filter((t) => t.completed)
          .map((t) => t.title);
        return {
          id: v.id,
          date: `${v.visitDateLabel} • ${v.scheduledStart} - ${v.scheduledEnd} (${client?.name ?? "Client"})`,
          caregiver: cg?.name ?? "Care Team",
          duration: `${v.scheduledHours} hours`,
          statusLabel:
            v.status === "In Progress"
              ? `In Progress (Clocked in ${v.clockInTime ?? "Active"})`
              : `Completed (${v.evvCompliance})`,
          shortNote:
            v.visitNotes ||
            (v.status === "In Progress"
              ? "Caregiver is currently on-site delivering scheduled care plan tasks."
              : "Scheduled care plan visit completed and verified via EVV."),
          tasksCompleted:
            completedTasks.length > 0
              ? completedTasks
              : v.tasks.map((t) => `${t.title} (Pending)`),
          photos: [],
        };
      });

    const historical: PortalVisitView[] = visitHistory.map((h) => ({
      id: h.id,
      date: h.date,
      caregiver: h.caregiver,
      duration: h.duration,
      statusLabel: "Visit completed",
      shortNote: h.shortNote,
      firstPersonShortNote: (h as { firstPersonShortNote?: string }).firstPersonShortNote,
      tasksCompleted: h.tasksCompleted,
      photos: h.photos,
      rating: h.rating,
      feedback: h.feedback,
    }));

    return [...syncedFromStore, ...historical];
  }, [getCaregiverById, getClientById, state.visits]);

  const handleRate = (visitId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [visitId]: rating }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            {isClient ? "My Visits" : "Visit History & Live Care Feed"}
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Live caregiver arrival status, completed tasks, and visit notes synced from Point of Care.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {liveVisits.map((visit) => {
          const isExpanded = selectedVisit === visit.id;
          const isInProgress = visit.statusLabel.startsWith("In Progress");
          return (
            <div
              key={visit.id}
              className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border-subtle overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setSelectedVisit(isExpanded ? null : visit.id)}
                className="w-full text-left p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{visit.date}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm text-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> {visit.duration}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        Caregiver:{" "}
                        <span className="font-medium text-text-primary">{visit.caregiver}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      isInProgress
                        ? "bg-amber-100 text-amber-800"
                        : "bg-[#E6F7F1] text-brand-teal"
                    }`}
                  >
                    {visit.statusLabel}
                  </span>
                  <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </motion.div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border-subtle bg-slate-50 overflow-hidden"
                  >
                    <div className="p-4 sm:px-20 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary mb-2">
                          Caregiver Note
                        </h4>
                        <p className="text-sm text-text-secondary leading-relaxed bg-white px-3 py-2 rounded-xl border border-border-subtle">
                          &ldquo;
                          {isClient && visit.firstPersonShortNote
                            ? visit.firstPersonShortNote
                            : visit.shortNote}
                          &rdquo;
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-text-primary mb-2">
                          Care Plan Tasks
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {visit.tasksCompleted.map((task, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm text-text-secondary bg-white px-3 py-2 rounded-lg border border-border-subtle"
                            >
                              <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
                              {task}
                            </div>
                          ))}
                        </div>
                      </div>

                      {visit.photos.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-slate-400" />
                            Shared Photos
                          </h4>
                          <div className="flex gap-2">
                            {visit.photos.map((photo, idx) => (
                              <div
                                key={idx}
                                className="w-20 h-20 rounded-lg overflow-hidden bg-slate-200"
                              >
                                <img
                                  src={photo}
                                  alt="Visit detail"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-200">
                        <h4 className="text-sm font-semibold text-text-primary mb-2">
                          Visit Feedback
                        </h4>
                        {visit.rating || ratings[visit.id] ? (
                          <div className="bg-white p-3 rounded-xl border border-border-subtle inline-block">
                            <div className="flex items-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    (ratings[visit.id] ?? visit.rating ?? 0) >= star
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-slate-200"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-text-secondary">
                              {visit.feedback ||
                                feedbackText[visit.id] ||
                                "Thank you for your feedback!"}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => handleRate(visit.id, star)}
                                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                                >
                                  <Star className="w-5 h-5 text-slate-300 hover:text-amber-400" />
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              placeholder="Optional note for care coordinator..."
                              value={feedbackText[visit.id] || ""}
                              onChange={(e) =>
                                setFeedbackText((prev) => ({
                                  ...prev,
                                  [visit.id]: e.target.value,
                                }))
                              }
                              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
