"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { createAuditEvent } from "@/app/evv-monitoring/evvRules";
import { EVVMethod } from "@/app/evv-monitoring/types";
import { useAuth } from "@/lib/auth/RBACContext";
import {
  draftClaimAppealLetter,
  parseVoiceNoteToCharting,
  VOICE_NOTE_PRESETS,
} from "@/lib/engine/aiCopilotSimulator";
import { rankCaregiversForShift } from "@/lib/engine/dispatchEngine";
import {
  evaluateVisitCompletion,
  normalizeEvvMethod,
} from "@/lib/engine/evvAutomation";
import {
  buildIncidentAutomationBundle,
  ReportIncidentInput,
} from "@/lib/engine/complianceAutomation";
import {
  mapStageToPartnerStatus,
  runEligibilityCheck,
  scoreReferralUrgency,
} from "@/lib/engine/intakeAutomation";
import {
  buildCaregiverFromCandidate,
  evaluateCandidateHireReadiness,
} from "@/lib/engine/hrAndLmsAutomation";
import {
  loadPersistedOfflineEvvQueue,
  persistOfflineEvvQueue,
  signEvvPayloadHmac,
} from "@/lib/engine/offlineEvvQueue";
import { buildInitialAgencyStoreState } from "@/lib/store/agencySeedData";
import {
  PartnerOrganization,
  PartnerTeamMember,
  ReferralStatus as PartnerReferralStatus,
} from "@/lib/partner/types";
import { Candidate } from "@/types/hr";
import {
  AgencyAuditAction,
  AgencyAuditLogEntry,
  AgencyCaregiver,
  AgencyCarePlanReview,
  AgencyClaim,
  AgencyClaimStatus,
  AgencyClient,
  AgencyConversationCategory,
  AgencyFieldFinding,
  AgencyLmsCourse,
  AgencyMessageChannel,
  AgencyNotification,
  AgencyReferral,
  AgencyShiftStatus,
  AgencyShiftVisit,
  AgencyStoreState,
  AgencyVisitTask,
  BriefingActionItem,
  OfflineEvvRecord,
  RankedCaregiverCandidate,
} from "@/types/agency";

const AGENCY_STORE_STORAGE_KEY = "homepulse_agency_store_v1";

export interface ResolveVisitPayload {
  visitId: string;
  reasonCode: string;
  reasonLabel?: string;
  notes: string;
  attestationRef: string;
}

export interface CreateShiftInput {
  clientId: string;
  caregiverId: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  scheduledHours: number;
  requiredSkills: string[];
  region: string;
}

export interface SubmitPartnerReferralInput {
  firstName: string;
  lastName: string;
  dob?: string;
  phone?: string;
  serviceRequested: string;
  isUrgent: boolean;
  notes?: string;
  submittingMember?: string;
  partnerOrgName?: string;
  attachmentName?: string;
}

export interface CreateIntakeReferralInput {
  workflowType: "Inquiry" | "Referral";
  clientName: string;
  dob?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  gender?: string;
  facilityName?: string;
  physicianName?: string;
  npi?: string;
  payer?: string;
  urgency?: "Low" | "Medium" | "High";
  notes?: string;
}

interface AgencyStoreContextValue {
  state: AgencyStoreState;
  isHydrated: boolean;
  getClientById: (clientId: string) => AgencyClient | undefined;
  getCaregiverById: (caregiverId: string | null) => AgencyCaregiver | undefined;
  getRankedCandidates: (visitId: string) => RankedCaregiverCandidate[];
  // Dispatch (Manual + Automated)
  createShift: (input: CreateShiftInput) => AgencyShiftVisit | null;
  assignShift: (visitId: string, caregiverId: string) => void;
  autoAssignBestCaregiver: (visitId: string) => boolean;
  autoFillAllUnfilled: () => number;
  triggerCallOff: (visitId: string, reason: string) => void;
  acceptBackfillOffer: (visitId: string, caregiverId: string) => void;
  // Caregiver Point-of-Care (Manual + Automated)
  clockInVisit: (
    visitId: string,
    method: "gps" | "ivr" | "fvv" | "manual",
    gpsDistanceMeters: number,
    reason?: string,
    syncedOffline?: boolean
  ) => void;
  toggleVisitTask: (visitId: string, taskId: string) => void;
  skipVisitTask: (visitId: string, taskId: string, reason: string) => void;
  logVisitMedication: (
    visitId: string,
    medId: string,
    status: "pending" | "reminded" | "took" | "declined"
  ) => void;
  applyVoiceNoteToVisit: (
    visitId: string,
    presetKey: keyof typeof VOICE_NOTE_PRESETS
  ) => void;
  clockOutVisit: (
    visitId: string,
    payload: {
      notes: string;
      signatureCaptured: boolean;
      unableToSignReason?: string;
      mileage?: number;
    }
  ) => void;
  // EVV & Billing (Manual + Automated)
  resolveEvvException: (payload: ResolveVisitPayload) => void;
  autoResolveMinorEvv: () => number;
  moveClaimStatus: (claimId: string, status: AgencyClaimStatus) => void;
  releaseClearedClaimsBatch: () => number;
  generateAiAppealDraft: (claimId: string) => string;
  // Wave 2: Partner, Intake, Clinical & QA Compliance
  submitPartnerReferral: (input: SubmitPartnerReferralInput) => AgencyReferral;
  createIntakeReferral: (input: CreateIntakeReferralInput) => AgencyReferral;
  updateReferral: (updated: AgencyReferral) => void;
  autoTriagePendingReferrals: () => number;
  scheduleReferralAssessment: (
    referralId: string,
    rnName: string,
    scheduledDate?: string
  ) => void;
  admitReferralToActiveCare: (referralId: string) => AgencyClient | null;
  declineOrReferOutReferral: (
    referralId: string,
    reason: string,
    partnerStatus: PartnerReferralStatus
  ) => void;
  acknowledgeEscalation: (escalationId: string) => void;
  completeCarePlanReview: (reviewId: string, signedBy?: string) => void;
  completeSupervisoryVisit: (visitId: string) => void;
  reportIncident: (input: ReportIncidentInput) => string;
  resolveRestrictedIncident: (
    incidentId: string,
    action: "acknowledge" | "resolve"
  ) => void;
  submitStateReport: (deadlineId: string) => void;
  verifyComplianceDocument: (itemId: string, approved: boolean) => void;
  // Wave 3: HR, Trainer LMS & Field Supervisor
  addCandidate: (candidate: Candidate) => void;
  updateCandidate: (updated: Candidate) => void;
  autoClearAndHireEligibleCandidates: () => number;
  resolveHrActionItem: (actionId: string) => void;
  sendCredentialReminder: (watchItemId: string) => void;
  publishLmsCourse: (input: {
    id?: string;
    title: string;
    category: AgencyLmsCourse["category"];
    durationMinutes?: number;
    ceUnits?: number;
    description?: string;
    complianceLinked: boolean;
  }) => void;
  archiveLmsCourse: (courseId: string) => void;
  completeCaregiverCourse: (courseId: string) => void;
  submitFieldEvaluation: (payload: {
    visitId?: string;
    clientName: string;
    caregiverName: string;
    findings: { description: string; severity: "minor" | "moderate" | "urgent" }[];
  }) => void;
  resolveFieldFinding: (findingId: string, action: "followup" | "escalate") => void;
  // Wave 4: HIPAA Audit, Offline HMAC EVV, Care Plan Sync, Authorizations, Private-Pay & Unified Comms
  logAuditEvent: (input: {
    action: AgencyAuditAction;
    resourceType: AgencyAuditLogEntry["resourceType"];
    resourceId: string;
    summary: string;
    status?: "Success" | "Flagged";
  }) => void;
  updateVisitStatus: (visitId: string, status: AgencyShiftStatus) => void;
  queueOfflineEvvClock: (input: {
    visitId: string;
    actionType: "CLOCK_IN" | "CLOCK_OUT";
    method: "gps" | "ivr" | "fvv";
    gpsDistanceMeters: number;
    notes?: string;
    signatureCaptured?: boolean;
    mileage?: number;
  }) => Promise<OfflineEvvRecord | null>;
  syncOfflineEvvQueue: () => number;
  syncCarePlanToClientVisits: (input: {
    clientId: string;
    goals: string[];
    taskTitles: string[];
    medicationReminders: string[];
    signedBy?: string;
  }) => number;
  requestAuthorizationRenewal: (clientId: string) => void;
  createClientAuthorization: (input: {
    clientId: string;
    authNumber: string;
    additionalUnits: number;
    expiresInDays: number;
    serviceCode?: string;
  }) => void;
  processDraftInvoices: () => number;
  markInvoicePaid: (invoiceId: string) => void;
  sendConversationMessage: (input: {
    conversationId: string;
    content: string;
    channelMode: AgencyMessageChannel;
    isInternalNote: boolean;
  }) => void;
  createConversationThread: (input: {
    categoryId: AgencyConversationCategory;
    title: string;
    participantRole: string;
    initialMessage: string;
    channelMode: AgencyMessageChannel;
    linkedClientId?: string;
  }) => string;
  markConversationRead: (conversationId: string) => void;
  // Role 1: Partner Organization, Team & Two-Way Info Sync
  updatePartnerOrgProfile: (updates: Partial<PartnerOrganization>) => void;
  addPartnerTeamMember: (member: { name: string; email: string; role: string; phone?: string }) => void;
  updatePartnerTeamMemberRole: (memberId: string, role: string) => void;
  removePartnerTeamMember: (memberId: string) => void;
  respondToPartnerReferralInfo: (referralId: string, note: string, attachmentName?: string) => void;
  // Admin / Scenarios / Notifications
  executeBriefingAction: (actionType: BriefingActionItem["actionType"]) => void;
  simulateOutOfRadiusException: () => void;
  simulateUrgentHospitalReferral: () => void;
  simulateCaregiverFallIncident: () => void;
  simulateHrCandidateHire: () => void;
  simulateFieldFindingEscalation: () => void;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoData: () => void;
}

const AgencyStoreContext = createContext<AgencyStoreContextValue | null>(null);

export function AgencyStoreProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [state, setState] = useState<AgencyStoreState>(buildInitialAgencyStoreState);
  const [isHydrated, setIsHydrated] = useState(false);

  const actorName = currentUser?.name ?? "System Operator";
  const actorRole = currentUser?.role ?? "ADMIN";

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const saved = localStorage.getItem(AGENCY_STORE_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<AgencyStoreState>;
          const fallback = buildInitialAgencyStoreState();
          if (parsed && Array.isArray(parsed.visits) && Array.isArray(parsed.claims)) {
            setState({
              ...fallback,
              ...parsed,
              referrals: Array.isArray(parsed.referrals) ? parsed.referrals : fallback.referrals,
              clinicalEscalations: Array.isArray(parsed.clinicalEscalations)
                ? parsed.clinicalEscalations
                : fallback.clinicalEscalations,
              carePlanReviews: Array.isArray(parsed.carePlanReviews)
                ? parsed.carePlanReviews
                : fallback.carePlanReviews,
              supervisoryVisits: Array.isArray(parsed.supervisoryVisits)
                ? parsed.supervisoryVisits
                : fallback.supervisoryVisits,
              incidents: Array.isArray(parsed.incidents) ? parsed.incidents : fallback.incidents,
              stateDeadlines: Array.isArray(parsed.stateDeadlines)
                ? parsed.stateDeadlines
                : fallback.stateDeadlines,
              verificationQueue: Array.isArray(parsed.verificationQueue)
                ? parsed.verificationQueue
                : fallback.verificationQueue,
              candidates: Array.isArray(parsed.candidates)
                ? parsed.candidates
                : fallback.candidates,
              hrActionQueue: Array.isArray(parsed.hrActionQueue)
                ? parsed.hrActionQueue
                : fallback.hrActionQueue,
              credentialWatchlist: Array.isArray(parsed.credentialWatchlist)
                ? parsed.credentialWatchlist
                : fallback.credentialWatchlist,
              lmsCourses: Array.isArray(parsed.lmsCourses)
                ? parsed.lmsCourses
                : fallback.lmsCourses,
              fieldFindings: Array.isArray(parsed.fieldFindings)
                ? parsed.fieldFindings
                : fallback.fieldFindings,
              auditLogs: Array.isArray(parsed.auditLogs)
                ? parsed.auditLogs
                : fallback.auditLogs,
              offlineEvvQueue:
                Array.isArray(parsed.offlineEvvQueue) && parsed.offlineEvvQueue.length > 0
                  ? parsed.offlineEvvQueue
                  : loadPersistedOfflineEvvQueue(),
              invoices: Array.isArray(parsed.invoices)
                ? parsed.invoices
                : fallback.invoices,
              conversations: Array.isArray(parsed.conversations)
                ? parsed.conversations
                : fallback.conversations,
              partnerOrg: parsed.partnerOrg ? parsed.partnerOrg : fallback.partnerOrg,
              partnerTeamMembers: Array.isArray(parsed.partnerTeamMembers)
                ? parsed.partnerTeamMembers
                : fallback.partnerTeamMembers,
            });
          }
        }
      } catch {
        // Fall back safely to initial seed data without logging PHI
      } finally {
        setIsHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const commitState = useCallback(
    (updater: (prev: AgencyStoreState) => AgencyStoreState) => {
      setState((prev) => {
        const next = {
          ...updater(prev),
          lastUpdatedAt: new Date().toISOString(),
        };
        try {
          localStorage.setItem(AGENCY_STORE_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage quota errors cleanly
        }
        return next;
      });
    },
    []
  );

  const getClientById = useCallback(
    (clientId: string) => state.clients.find((c) => c.id === clientId),
    [state.clients]
  );

  const getCaregiverById = useCallback(
    (caregiverId: string | null) =>
      caregiverId ? state.caregivers.find((cg) => cg.id === caregiverId) : undefined,
    [state.caregivers]
  );

  const getRankedCandidates = useCallback(
    (visitId: string): RankedCaregiverCandidate[] => {
      const visit = state.visits.find((v) => v.id === visitId);
      if (!visit) return [];
      const client = state.clients.find((c) => c.id === visit.clientId);
      return rankCaregiversForShift(visit, client, state.caregivers);
    },
    [state.visits, state.clients, state.caregivers]
  );

  const createShift = useCallback(
    (input: CreateShiftInput): AgencyShiftVisit | null => {
      const client = state.clients.find((c) => c.id === input.clientId);
      if (!client) return null;
      const newId = `sh-${Date.now()}`;
      const newEvvId = `EVV-2026-${Math.floor(100 + Math.random() * 899)}`;
      const isAssigned = Boolean(input.caregiverId);

      const created: AgencyShiftVisit = {
        id: newId,
        evvId: newEvvId,
        shiftNumber: `SH-${Math.floor(500 + Math.random() * 499)}`,
        clientId: client.id,
        caregiverId: input.caregiverId,
        region: input.region || "Springfield North",
        visitDate: "2026-07-22",
        visitDateLabel: "Today",
        scheduledStart: input.scheduledStart,
        scheduledEnd: input.scheduledEnd,
        scheduledHours: input.scheduledHours,
        requiredSkills: input.requiredSkills,
        status: isAssigned ? "Scheduled" : "Unfilled",
        clockInTime: null,
        clockOutTime: null,
        evvMethod: "GPS",
        evvCompliance: isAssigned ? "Verified" : "Exception",
        exceptionCategory: isAssigned ? "None" : "Missed Call",
        exceptionDetail: isAssigned
          ? "Assigned shift ready for clock-in."
          : "New open shift awaiting caregiver assignment.",
        gpsDistanceMeters: 15,
        timeVarianceMinutes: 0,
        geofenceThresholdMeters: 100,
        tasks: [
          { id: `t-${Date.now()}-1`, category: "Personal Care", title: "Assist with daily hygiene & comfort", completed: false },
          { id: `t-${Date.now()}-2`, category: "Mobility", title: "Safe transfer & ambulation check", completed: false },
          { id: `t-${Date.now()}-3`, category: "Health Monitoring", title: "Medication & hydration reminder", completed: false },
        ],
        medications: [],
        billingStatus: isAssigned ? "Pending Review" : "Hold",
        auditHistory: [
          createAuditEvent({
            actorName,
            actorRole,
            actionType: "EVV_CAPTURE",
            summary: `Shift ${newEvvId} created (${isAssigned ? "Assigned" : "Unfilled"}).`,
          }),
        ],
      };

      commitState((prev) => ({
        ...prev,
        visits: [created, ...prev.visits],
      }));
      return created;
    },
    [actorName, actorRole, commitState, state.clients]
  );

  const assignShift = useCallback(
    (visitId: string, caregiverId: string) => {
      const cg = state.caregivers.find((c) => c.id === caregiverId);
      if (!cg) return;

      commitState((prev) => {
        const targetVisit = prev.visits.find((v) => v.id === visitId);
        const client = targetVisit
          ? prev.clients.find((c) => c.id === targetVisit.clientId)
          : undefined;

        const nextVisits = prev.visits.map((v) => {
          if (v.id !== visitId) return v;
          return {
            ...v,
            caregiverId: cg.id,
            status: "Scheduled" as const,
            evvCompliance: "Verified" as const,
            exceptionCategory: "None" as const,
            exceptionDetail: `Assigned to ${cg.name}; ready for EVV clock-in.`,
            billingStatus: "Pending Review" as const,
            billingHoldReason: undefined,
            backfillOffers: v.backfillOffers?.map((o) => ({
              ...o,
              offerStatus:
                o.caregiverId === cg.id ? ("Accepted" as const) : ("Declined" as const),
            })),
            auditHistory: [
              createAuditEvent({
                actorName,
                actorRole,
                actionType: "RESOLUTION_SAVED",
                summary: `Assigned shift to ${cg.name}.`,
                previousValue: v.status,
                newValue: "Scheduled",
              }),
              ...v.auditHistory,
            ],
          };
        });

        const nextCaregivers = prev.caregivers.map((c) =>
          c.id === cg.id && targetVisit
            ? {
                ...c,
                weeklyHoursScheduled:
                  c.weeklyHoursScheduled + targetVisit.scheduledHours,
              }
            : c
        );

        const newNotif: AgencyNotification = {
          id: `notif-${Date.now()}`,
          type: "success",
          title: "Shift Assigned",
          description: `${cg.name} assigned to ${client?.name ?? "client"} (${targetVisit?.scheduledStart ?? ""}).`,
          timeLabel: "Just now",
          route: "/caregiver",
          read: false,
        };

        return {
          ...prev,
          visits: nextVisits,
          caregivers: nextCaregivers,
          notifications: [newNotif, ...prev.notifications],
        };
      });
    },
    [actorName, actorRole, commitState, state.caregivers]
  );

  const autoAssignBestCaregiver = useCallback(
    (visitId: string): boolean => {
      const ranked = getRankedCandidates(visitId);
      const best = ranked.find((r) => r.caregiver.complianceValid);
      if (!best) return false;
      assignShift(visitId, best.caregiver.id);
      return true;
    },
    [assignShift, getRankedCandidates]
  );

  const autoFillAllUnfilled = useCallback((): number => {
    const openVisits = state.visits.filter(
      (v) => v.status === "Unfilled" || v.status === "Call-Off"
    );
    let filled = 0;
    openVisits.forEach((v) => {
      const ranked = rankCaregiversForShift(
        v,
        state.clients.find((c) => c.id === v.clientId),
        state.caregivers
      );
      const best = ranked.find((r) => r.caregiver.complianceValid);
      if (best) {
        assignShift(v.id, best.caregiver.id);
        filled += 1;
      }
    });
    return filled;
  }, [assignShift, state.caregivers, state.clients, state.visits]);

  const triggerCallOff = useCallback(
    (visitId: string, reason: string) => {
      commitState((prev) => {
        const target = prev.visits.find((v) => v.id === visitId);
        if (!target) return prev;
        const previousCg = prev.caregivers.find((c) => c.id === target.caregiverId);
        const client = prev.clients.find((c) => c.id === target.clientId);
        const candidates = rankCaregiversForShift(
          target,
          client,
          prev.caregivers.filter((c) => c.id !== target.caregiverId)
        ).slice(0, 3);

        const nextVisits = prev.visits.map((v) => {
          if (v.id !== visitId) return v;
          return {
            ...v,
            caregiverId: null,
            status: "Call-Off" as const,
            callOffReason: reason,
            calledOffByName: previousCg?.name ?? "Assigned Caregiver",
            calledOffAt: "Just now",
            evvCompliance: "Exception" as const,
            exceptionCategory: "Missed In" as const,
            exceptionDetail: `Caregiver call-off (${reason}). Top-${candidates.length} backfill offers sent.`,
            billingStatus: "Hold" as const,
            billingHoldReason: "Caregiver call-off — backfill pending",
            backfillOffers: candidates.map((c) => ({
              caregiverId: c.caregiver.id,
              caregiverName: c.caregiver.name,
              matchScore: c.matchScore,
              distanceMiles: c.caregiver.distanceMiles,
              overtimeRisk: c.overtimeRisk,
              offerStatus: "Pending" as const,
            })),
            auditHistory: [
              createAuditEvent({
                actorName,
                actorRole,
                actionType: "EXCEPTION_DETECTED",
                summary: `Call-off triggered (${reason}). Dispatched automated backfill offers to ${candidates.length} candidates.`,
                previousValue: "Scheduled",
                newValue: "Call-Off",
              }),
              ...v.auditHistory,
            ],
          };
        });

        const notif: AgencyNotification = {
          id: `notif-${Date.now()}`,
          type: "alert",
          title: "Urgent Call-Off — Auto-Backfill Sent",
          description: `${previousCg?.name ?? "Caregiver"} called off for ${client?.name ?? "client"}. ${candidates.length} replacement offers sent.`,
          timeLabel: "Just now",
          route: "/scheduler",
          read: false,
        };

        return {
          ...prev,
          visits: nextVisits,
          notifications: [notif, ...prev.notifications],
        };
      });
    },
    [actorName, actorRole, commitState]
  );

  const acceptBackfillOffer = useCallback(
    (visitId: string, caregiverId: string) => {
      assignShift(visitId, caregiverId);
    },
    [assignShift]
  );

  const clockInVisit = useCallback(
    (
      visitId: string,
      method: "gps" | "ivr" | "fvv" | "manual",
      gpsDistanceMeters: number,
      reason?: string,
      syncedOffline?: boolean
    ) => {
      const nowTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const evvMethod: EVVMethod = normalizeEvvMethod(method);

      commitState((prev) => {
        const nextVisits = prev.visits.map((v) => {
          if (v.id !== visitId) return v;
          const isGeoAlert =
            evvMethod === "GPS" && gpsDistanceMeters > v.geofenceThresholdMeters;
          return {
            ...v,
            status: "In Progress" as const,
            clockInTime: nowTime,
            evvMethod,
            gpsDistanceMeters,
            syncedOffline: Boolean(syncedOffline),
            evvCompliance: isGeoAlert ? ("Exception" as const) : ("Verified" as const),
            exceptionCategory: isGeoAlert ? ("Location Mismatch" as const) : ("None" as const),
            exceptionDetail: isGeoAlert
              ? `Clock-in captured ${gpsDistanceMeters}m from home (limit ${v.geofenceThresholdMeters}m). ${reason ?? ""}`.trim()
              : `Clocked in via ${evvMethod} (${gpsDistanceMeters}m).`,
            auditHistory: [
              createAuditEvent({
                actorName,
                actorRole,
                actionType: "EVV_CAPTURE",
                summary: `Clock-in at ${nowTime} via ${evvMethod} (${gpsDistanceMeters}m)${syncedOffline ? " [Offline Cached]" : ""}.`,
                previousValue: v.status,
                newValue: "In Progress",
              }),
              ...v.auditHistory,
            ],
          };
        });
        return { ...prev, visits: nextVisits };
      });
    },
    [actorName, actorRole, commitState]
  );

  const toggleVisitTask = useCallback(
    (visitId: string, taskId: string) => {
      commitState((prev) => ({
        ...prev,
        visits: prev.visits.map((v) => {
          if (v.id !== visitId) return v;
          return {
            ...v,
            tasks: v.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    completed: !t.completed,
                    completedAt: !t.completed
                      ? new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : undefined,
                    skipped: false,
                  }
                : t
            ),
          };
        }),
      }));
    },
    [commitState]
  );

  const skipVisitTask = useCallback(
    (visitId: string, taskId: string, reason: string) => {
      commitState((prev) => ({
        ...prev,
        visits: prev.visits.map((v) => {
          if (v.id !== visitId) return v;
          return {
            ...v,
            tasks: v.tasks.map((t) =>
              t.id === taskId
                ? { ...t, completed: false, skipped: true, skipReason: reason }
                : t
            ),
          };
        }),
      }));
    },
    [commitState]
  );

  const logVisitMedication = useCallback(
    (
      visitId: string,
      medId: string,
      status: "pending" | "reminded" | "took" | "declined"
    ) => {
      commitState((prev) => ({
        ...prev,
        visits: prev.visits.map((v) => {
          if (v.id !== visitId) return v;
          return {
            ...v,
            medications: v.medications.map((m) =>
              m.id === medId
                ? { ...m, status, loggedAt: new Date().toLocaleTimeString() }
                : m
            ),
          };
        }),
      }));
    },
    [commitState]
  );

  const applyVoiceNoteToVisit = useCallback(
    (visitId: string, presetKey: keyof typeof VOICE_NOTE_PRESETS) => {
      const parsed = parseVoiceNoteToCharting(presetKey);
      if (!parsed) return;
      const nowTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      commitState((prev) => ({
        ...prev,
        visits: prev.visits.map((v) => {
          if (v.id !== visitId) return v;
          const updatedTasks = v.tasks.map((t) => {
            const matched = parsed.taskKeywordsToComplete.some((kw) =>
              t.title.toLowerCase().includes(kw) || t.category.toLowerCase().includes(kw)
            );
            return matched && !t.completed
              ? { ...t, completed: true, completedAt: nowTime, skipped: false }
              : t;
          });
          return {
            ...v,
            tasks: updatedTasks,
            vitals: parsed.vitals,
            visitNotes: v.visitNotes
              ? `${v.visitNotes}\n${parsed.formattedNote}`
              : parsed.formattedNote,
          };
        }),
      }));
    },
    [commitState]
  );

  const clockOutVisit = useCallback(
    (
      visitId: string,
      payload: {
        notes: string;
        signatureCaptured: boolean;
        unableToSignReason?: string;
        mileage?: number;
      }
    ) => {
      const nowTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      commitState((prev) => {
        const target = prev.visits.find((v) => v.id === visitId);
        if (!target) return prev;
        const client = prev.clients.find((c) => c.id === target.clientId);

        const prepared: AgencyShiftVisit = {
          ...target,
          clockInTime: target.clockInTime ?? target.scheduledStart,
          clockOutTime: nowTime,
          visitNotes: payload.notes,
          signatureCaptured: payload.signatureCaptured,
          unableToSignReason: payload.unableToSignReason,
          mileageRecorded: payload.mileage,
        };

        const evalResult = evaluateVisitCompletion(
          prepared,
          client,
          actorName,
          actorRole
        );

        const newClaimId = target.claimId ?? `CLM-${Math.floor(10300 + Math.random() * 699)}`;
        const claimAmount = Math.round(
          prepared.scheduledHours * (client?.hourlyBillRate ?? 38)
        );

        const newClaim: AgencyClaim = {
          id: newClaimId,
          visitId: prepared.id,
          patientId: client?.id ?? prepared.clientId,
          patientName: client?.name ?? "Client",
          payer: client?.payer ?? "Medicaid",
          amount: claimAmount,
          status: "Draft",
          scrubStatus: evalResult.shouldCreateCleanClaim ? "Passed" : "Blocked",
          scrubIssues: evalResult.scrubIssues,
          serviceCode: client?.serviceCode ?? "T1019",
          authNumber: client?.authNumber ?? "AUTH-PENDING",
          date: "Today",
          age: "",
        };

        const finalVisit: AgencyShiftVisit = {
          ...evalResult.updatedVisit,
          claimId: newClaimId,
        };

        const existingClaimIndex = prev.claims.findIndex((c) => c.id === newClaimId);
        const nextClaims =
          existingClaimIndex >= 0
            ? prev.claims.map((c, idx) => (idx === existingClaimIndex ? newClaim : c))
            : [newClaim, ...prev.claims];

        const nextClients = prev.clients.map((c) =>
          c.id === client?.id && evalResult.unitsDeducted > 0
            ? {
                ...c,
                authorizedUnitsRemaining: Math.max(
                  0,
                  c.authorizedUnitsRemaining - evalResult.unitsDeducted
                ),
              }
            : c
        );

        const notif: AgencyNotification = evalResult.shouldCreateCleanClaim
          ? {
              id: `notif-${Date.now()}`,
              type: "success",
              title: "Visit Auto-Scrubbed & Claim Ready",
              description: `${client?.name ?? "Visit"} verified via EVV (${finalVisit.gpsDistanceMeters}m). Draft claim ${newClaimId} ($${claimAmount}) cleared.`,
              timeLabel: "Just now",
              route: "/billing/workspace",
              read: false,
            }
          : {
              id: `notif-${Date.now()}`,
              type: "alert",
              title: "EVV Exception — Billing Placed on Hold",
              description: `${finalVisit.evvId} (${client?.name ?? "Visit"}) flagged for ${finalVisit.exceptionCategory}.`,
              timeLabel: "Just now",
              route: "/evv-monitoring",
              read: false,
            };

        const clockOutAudit: AgencyAuditLogEntry = {
          id: `aud-${Date.now()}-${Math.floor(Math.random() * 999)}`,
          timestampUtc: new Date().toISOString(),
          actorName,
          actorRole,
          action: "UPDATE",
          resourceType: "Visit",
          resourceId: finalVisit.evvId,
          summary: `Visit clocked out (${finalVisit.evvCompliance}); claim ${newClaimId} scrub=${newClaim.scrubStatus}`,
          status: evalResult.shouldCreateCleanClaim ? "Success" : "Flagged",
        };

        const shouldCreatePrivateInvoice = client?.payer === "Private Pay" && evalResult.shouldCreateCleanClaim;
        const nextInvoices = shouldCreatePrivateInvoice
          ? [
              {
                id: `INV-${new Date().getFullYear()}-${Math.floor(1100 + Math.random() * 8899)}`,
                clientId: client.id,
                clientName: client.name,
                visitIds: [finalVisit.id],
                visitCount: 1,
                totalHours: finalVisit.scheduledHours,
                amount: claimAmount,
                status: "Draft" as const,
                scheduledDateLabel: "Today, 5:00 PM",
                createdAtIso: new Date().toISOString(),
              },
              ...prev.invoices,
            ]
          : prev.invoices;

        return {
          ...prev,
          visits: prev.visits.map((v) => (v.id === visitId ? finalVisit : v)),
          claims: nextClaims,
          clients: nextClients,
          invoices: nextInvoices,
          auditLogs: [clockOutAudit, ...prev.auditLogs].slice(0, 150),
          notifications: [notif, ...prev.notifications],
        };
      });
    },
    [actorName, actorRole, commitState]
  );

  const resolveEvvException = useCallback(
    (payload: ResolveVisitPayload) => {
      commitState((prev) => {
        const target = prev.visits.find(
          (v) => v.id === payload.visitId || v.evvId === payload.visitId
        );
        if (!target) return prev;

        const client = prev.clients.find((c) => c.id === target.clientId);
        const auditEvent = createAuditEvent({
          actorName,
          actorRole,
          actionType: "RESOLUTION_SAVED",
          reasonCode: payload.reasonCode,
          summary: `Exception resolved (${payload.reasonCode}): ${payload.notes} [Ref: ${payload.attestationRef}]`,
          previousValue: target.evvCompliance,
          newValue: "Resolved / Cleared",
        });

        const updatedVisit: AgencyShiftVisit = {
          ...target,
          status: target.status === "Incomplete" ? "Completed" : target.status,
          clockInTime: target.clockInTime ?? target.scheduledStart,
          clockOutTime: target.clockOutTime ?? target.scheduledEnd,
          evvCompliance: "Resolved",
          exceptionDetail: `Resolved (${payload.reasonCode}): ${payload.notes}`,
          billingStatus: "Cleared",
          billingHoldReason: undefined,
          auditHistory: [auditEvent, ...target.auditHistory],
        };

        const nextClaims = prev.claims.map((c) =>
          c.visitId === target.id || c.id === target.claimId
            ? {
                ...c,
                scrubStatus: "Passed" as const,
                scrubIssues: [],
              }
            : c
        );

        const notif: AgencyNotification = {
          id: `notif-${Date.now()}`,
          type: "success",
          title: "EVV Exception Resolved — Billing Released",
          description: `${target.evvId} (${client?.name ?? "Visit"}) cleared for billing.`,
          timeLabel: "Just now",
          route: "/billing/workspace",
          read: false,
        };

        return {
          ...prev,
          visits: prev.visits.map((v) => (v.id === target.id ? updatedVisit : v)),
          claims: nextClaims,
          notifications: [notif, ...prev.notifications],
        };
      });
    },
    [actorName, actorRole, commitState]
  );

  const autoResolveMinorEvv = useCallback((): number => {
    const exceptions = state.visits.filter(
      (v) => v.evvCompliance === "Exception" && v.status === "Completed"
    );
    exceptions.forEach((v) => {
      resolveEvvException({
        visitId: v.id,
        reasonCode: "RC-04",
        notes: "Supervisor automated review — verified GPS drift within adjacent apartment boundary.",
        attestationRef: `AUTO-ATT-${Date.now().toString().slice(-4)}`,
      });
    });
    return exceptions.length;
  }, [resolveEvvException, state.visits]);

  const moveClaimStatus = useCallback(
    (claimId: string, status: AgencyClaimStatus) => {
      commitState((prev) => ({
        ...prev,
        claims: prev.claims.map((c) => {
          if (c.id !== claimId) return c;
          if (status === "Submitted" && c.scrubStatus === "Blocked") {
            return c;
          }
          return {
            ...c,
            status,
            age:
              status === "Submitted" || status === "Pending"
                ? `0d in ${status.toLowerCase()}`
                : "",
            date: status === "Submitted" || status === "Pending" ? "" : c.date || "Today",
          };
        }),
      }));
    },
    [commitState]
  );

  const releaseClearedClaimsBatch = useCallback((): number => {
    const eligible = state.claims.filter(
      (c) => c.status === "Draft" && c.scrubStatus === "Passed"
    );
    if (eligible.length === 0) return 0;

    commitState((prev) => ({
      ...prev,
      claims: prev.claims.map((c) =>
        c.status === "Draft" && c.scrubStatus === "Passed"
          ? { ...c, status: "Submitted", age: "0d in submitted", date: "" }
          : c
      ),
      visits: prev.visits.map((v) =>
        eligible.some((e) => e.id === v.claimId)
          ? { ...v, billingStatus: "Billed" }
          : v
      ),
      notifications: [
        {
          id: `notif-${Date.now()}`,
          type: "success",
          title: "837 Claims Batch Submitted",
          description: `${eligible.length} clean claim(s) submitted to clearinghouse.`,
          timeLabel: "Just now",
          route: "/billing/workspace",
          read: false,
        },
        ...prev.notifications,
      ],
    }));
    return eligible.length;
  }, [commitState, state.claims]);

  const generateAiAppealDraft = useCallback(
    (claimId: string): string => {
      const claim = state.claims.find((c) => c.id === claimId);
      if (!claim) return "";
      const linkedVisit = state.visits.find(
        (v) => v.id === claim.visitId || v.clientId === claim.patientId
      );
      const draft = draftClaimAppealLetter(claim, linkedVisit);
      commitState((prev) => ({
        ...prev,
        claims: prev.claims.map((c) =>
          c.id === claimId
            ? { ...c, appealDraft: draft, denialStatus: "Appealing" }
            : c
        ),
      }));
      return draft;
    },
    [commitState, state.claims, state.visits]
  );

  // =========================================================================
  // WAVE 2: PARTNER -> INTAKE -> CLINICAL -> QA COMPLIANCE -> WAVE 1 BRIDGE
  // =========================================================================

  const submitPartnerReferral = useCallback(
    (input: SubmitPartnerReferralInput): AgencyReferral => {
      const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
      const initials = `${input.firstName.trim().charAt(0)}${input.lastName.trim().charAt(0)}`.toUpperCase() || "PT";
      const id = `ref-${Date.now().toString().slice(-5)}`;
      const nowIso = new Date().toISOString();
      const orgName = input.partnerOrgName || "Mercy General Hospital";
      const submitter = input.submittingMember || "Dr. Sarah Jenkins";

      const newRef: AgencyReferral = {
        id,
        workflowType: "Referral",
        clientName: fullName,
        clientInitials: initials,
        dob: input.dob,
        phone: input.phone,
        source: input.isUrgent ? "Hospital Discharge" : "Hospital",
        sourceDetails: orgName,
        referringParty: `${submitter} (${orgName})`,
        partnerOrgName: orgName,
        serviceRequested: input.serviceRequested || "Post-op & ADL Care",
        intakeNotes: input.notes || "Submitted directly via B2B Referral Partner Portal.",
        dateReceived: nowIso,
        stage: "Referral Received",
        partnerStatus: "Received",
        urgency: input.isUrgent ? "High" : "Medium",
        dischargeDeadline: input.isUrgent
          ? new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString()
          : undefined,
        daysInStage: 0,
        assignedCoordinator: { name: "James Wilson" },
        serviceZoneStatus: "in-zone",
        serviceZoneName: "Springfield North",
        clinicalReviewStatus: "Pending",
        authorizationStatus: "Pending",
        documents: [
          {
            name: input.attachmentName || "Hospital Referral Packet",
            status: input.attachmentName ? "Uploaded" : "Missing",
          },
          { name: "Physician Orders", status: "Missing" },
        ],
        consents: [{ name: "HIPAA Consent", signed: false }],
        communications: [
          {
            id: `comm-${Date.now()}`,
            timestamp: nowIso,
            author: submitter,
            type: "note",
            content: `Partner referral submitted (${input.serviceRequested})${input.isUrgent ? " — URGENT 24-48h discharge." : "."}`,
          },
        ],
        insurance: { payer: "Medicare Part A & B", status: "Pending" },
      };
      newRef.triageScore = scoreReferralUrgency(newRef);

      commitState((prev) => ({
        ...prev,
        referrals: [newRef, ...prev.referrals],
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: input.isUrgent ? "alert" : "info",
            title: input.isUrgent
              ? "Urgent Hospital Discharge Referral"
              : "New Partner Referral Received",
            description: `${orgName} referred ${fullName} (${newRef.serviceRequested}).`,
            timeLabel: "Just now",
            route: "/intake/referrals",
            read: false,
          },
          ...prev.notifications,
        ],
      }));

      return newRef;
    },
    [commitState]
  );

  const createIntakeReferral = useCallback(
    (input: CreateIntakeReferralInput): AgencyReferral => {
      const parts = input.clientName.trim().split(/\s+/);
      const initials =
        parts.length >= 2
          ? `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
          : input.clientName.slice(0, 2).toUpperCase() || "PT";
      const id = `ref-${Date.now().toString().slice(-5)}`;
      const nowIso = new Date().toISOString();

      const created: AgencyReferral = {
        id,
        workflowType: input.workflowType,
        clientName: input.clientName.trim(),
        clientInitials: initials,
        dob: input.dob,
        phone: input.phone,
        source: input.workflowType === "Referral" ? "Hospital" : "Online Form",
        sourceDetails: input.facilityName || "Direct Intake",
        referringParty: input.physicianName || input.facilityName,
        partnerOrgName: input.facilityName || "Direct Intake",
        serviceRequested: input.notes || "Home Care Services",
        intakeNotes: input.notes,
        npi: input.npi,
        dateReceived: nowIso,
        stage: "Referral Received",
        partnerStatus: "Received",
        urgency: input.urgency || "Medium",
        daysInStage: 0,
        assignedCoordinator: { name: actorName },
        serviceZoneStatus: "in-zone",
        serviceZoneName: input.city || "Springfield North",
        clinicalReviewStatus: "Pending",
        authorizationStatus: "Pending",
        documents: [{ name: "Intake Inquiry Form", status: "Verified" }],
        consents: [{ name: "HIPAA Consent", signed: false }],
        communications: [],
        insurance: {
          payer: input.payer || "Medicare Part A & B",
          status: "Pending",
        },
        demographics: {
          gender: input.gender,
          address: input.address,
          city: input.city,
          state: input.state,
          zip: input.zip,
          phone: input.phone,
          email: input.email,
        },
      };
      created.triageScore = scoreReferralUrgency(created);

      commitState((prev) => ({
        ...prev,
        referrals: [created, ...prev.referrals],
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: "info",
            title: `New ${input.workflowType} Logged`,
            description: `${created.clientName} added to Intake pipeline.`,
            timeLabel: "Just now",
            route: "/intake/referrals",
            read: false,
          },
          ...prev.notifications,
        ],
      }));

      return created;
    },
    [actorName, commitState]
  );

  const updateReferral = useCallback(
    (updated: AgencyReferral) => {
      const syncedPartnerStatus = mapStageToPartnerStatus(
        updated.stage,
        updated.partnerStatus
      );
      commitState((prev) => ({
        ...prev,
        referrals: prev.referrals.map((r) =>
          r.id === updated.id
            ? {
                ...updated,
                partnerStatus: syncedPartnerStatus,
                triageScore: scoreReferralUrgency(updated),
              }
            : r
        ),
      }));
    },
    [commitState]
  );

  const autoTriagePendingReferrals = useCallback((): number => {
    const pending = state.referrals.filter(
      (r) => r.stage === "Referral Received" || r.stage === "Insurance Verification"
    );
    if (pending.length === 0) return 0;

    commitState((prev) => ({
      ...prev,
      referrals: prev.referrals.map((r) => {
        if (r.stage !== "Referral Received" && r.stage !== "Insurance Verification") {
          return r;
        }
        const check = runEligibilityCheck(r);
        const nextStage = check.verified ? "Clinical Review" : "Contact Attempted";
        return {
          ...r,
          stage: nextStage,
          daysInStage: 0,
          partnerStatus: mapStageToPartnerStatus(nextStage, r.partnerStatus),
          authorizationStatus: check.verified ? "Approved" : "Pending",
          insurance: {
            payer: check.payer,
            status: check.verified ? "Verified" : "Pending",
            authorizedHours: check.authorizedHours,
            verificationDate: new Date().toISOString(),
          },
          communications: [
            {
              id: `comm-ai-${Date.now()}-${r.id}`,
              timestamp: new Date().toISOString(),
              author: "AI Intake Triage",
              type: "note",
              content: check.summary,
            },
            ...r.communications,
          ],
        };
      }),
      notifications: [
        {
          id: `notif-${Date.now()}`,
          type: "success",
          title: "Automated Referral Triage Complete",
          description: `Verified 270/271 eligibility & routed ${pending.length} referral(s) to Clinical Review.`,
          timeLabel: "Just now",
          route: "/intake/referrals",
          read: false,
        },
        ...prev.notifications,
      ],
    }));
    return pending.length;
  }, [commitState, state.referrals]);

  const scheduleReferralAssessment = useCallback(
    (referralId: string, rnName: string, scheduledDate?: string) => {
      const target = state.referrals.find((r) => r.id === referralId);
      if (!target) return;
      const dueIso =
        scheduledDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      commitState((prev) => ({
        ...prev,
        referrals: prev.referrals.map((r) =>
          r.id === referralId
            ? {
                ...r,
                stage: "Initial Assessment Scheduled",
                partnerStatus: "Assessment Scheduled",
                daysInStage: 0,
                assessment: {
                  assignedAssessor: rnName,
                  scheduledDate: dueIso,
                  type: "Initial RN Assessment",
                  status: "Pending",
                },
              }
            : r
        ),
        supervisoryVisits: [
          {
            id: `sv-ref-${Date.now().toString().slice(-4)}`,
            clientName: target.clientName,
            clientId: target.id,
            assignedRn: rnName,
            dueDate: dueIso,
            visitType: "initial_30",
            status: "scheduled",
            location: target.demographics?.address || "Client Home",
          },
          ...prev.supervisoryVisits,
        ],
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: "info",
            title: "Initial RN Assessment Scheduled",
            description: `${rnName} scheduled for ${target.clientName}. Partner portal updated.`,
            timeLabel: "Just now",
            route: "/clinical",
            read: false,
          },
          ...prev.notifications,
        ],
      }));
    },
    [commitState, state.referrals]
  );

  const admitReferralToActiveCare = useCallback(
    (referralId: string): AgencyClient | null => {
      const target = state.referrals.find((r) => r.id === referralId);
      if (!target) return null;

      const existingClient = state.clients.find(
        (c) =>
          c.id === target.admittedClientId ||
          c.name.toLowerCase() === target.clientName.toLowerCase()
      );

      const newClientId = existingClient?.id || `cl-${Date.now().toString().slice(-5)}`;
      const newClient: AgencyClient = existingClient || {
        id: newClientId,
        name: target.clientName,
        mrn: `MRN-${Math.floor(40000 + Math.random() * 59000)}`,
        address: target.demographics?.address || "520 Willow Creek Dr",
        cityStateZip: `${target.demographics?.city || "Springfield"}, ${target.demographics?.state || "IL"} ${target.demographics?.zip || "62704"}`,
        phone: target.phone || target.demographics?.phone || "(217) 555-0199",
        coords: { lat: 39.7832, lng: -89.6478 },
        medicaidIdMasked: `•••••${Math.floor(1000 + Math.random() * 8999)}`,
        payer: target.insurance?.payer?.includes("Medicaid")
          ? "Medicaid"
          : target.insurance?.payer?.includes("Commercial")
            ? "Commercial"
            : "Medicare",
        serviceCode: "T1019",
        serviceName: target.serviceRequested || "Personal Care & ADLs",
        hourlyBillRate: 42,
        authorizedUnitsRemaining: target.insurance?.authorizedHours || 24,
        authorizedUnitsTotal: 40,
        authNumber: `AUTH-${Math.floor(10000 + Math.random() * 89999)}N`,
        authExpiresInDays: 30,
        fallRiskLevel: target.readmissionRisk === "High" ? "High" : "Medium",
      };

      const initialShiftId = `sh-adm-${Date.now().toString().slice(-5)}`;
      const initialShift: AgencyShiftVisit = {
        id: initialShiftId,
        evvId: `EVV-2026-${Math.floor(600 + Math.random() * 399)}`,
        shiftNumber: `SH-${Math.floor(600 + Math.random() * 399)}`,
        clientId: newClientId,
        caregiverId: null,
        region: target.serviceZoneName || "Springfield North",
        visitDate: "2026-07-22",
        visitDateLabel: "Today",
        scheduledStart: "03:00 PM",
        scheduledEnd: "07:00 PM",
        scheduledHours: 4,
        requiredSkills: ["CNA", "Personal Care"],
        status: "Unfilled",
        clockInTime: null,
        clockOutTime: null,
        evvMethod: "GPS",
        evvCompliance: "Exception",
        exceptionCategory: "Missed Call",
        exceptionDetail: "Newly admitted client — initial shift awaiting Smart Dispatch.",
        gpsDistanceMeters: 0,
        timeVarianceMinutes: 0,
        geofenceThresholdMeters: 100,
        tasks: [
          {
            id: `t-adm-${Date.now()}-1`,
            category: "Personal Care",
            title: "Start-of-care hygiene & home safety orientation",
            completed: false,
          },
          {
            id: `t-adm-${Date.now()}-2`,
            category: "Health Monitoring",
            title: "Baseline vitals & medication reconciliation check",
            completed: false,
          },
        ],
        medications: [],
        billingStatus: "Hold",
        billingHoldReason: "Unfilled shift — assign caregiver in Scheduler",
        auditHistory: [
          createAuditEvent({
            actorName,
            actorRole,
            actionType: "EVV_CAPTURE",
            summary: `Admitted from Intake referral ${target.id}; open start-of-care shift queued for Scheduler.`,
          }),
        ],
      };

      const carePlanReview: AgencyCarePlanReview = {
        id: `cp-adm-${Date.now().toString().slice(-4)}`,
        clientName: newClient.name,
        clientId: newClientId,
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        triggerReason: "initial_admission",
        status: "approaching",
        linkedReferralId: target.id,
      };

      commitState((prev) => ({
        ...prev,
        clients: existingClient ? prev.clients : [newClient, ...prev.clients],
        visits: [initialShift, ...prev.visits],
        carePlanReviews: [carePlanReview, ...prev.carePlanReviews],
        referrals: prev.referrals.map((r) =>
          r.id === referralId
            ? {
                ...r,
                stage: "Admitted",
                partnerStatus: "Accepted as Client",
                admittedClientId: newClientId,
                clinicalReviewStatus: "Approved",
                authorizationStatus: "Approved",
                daysInStage: 0,
              }
            : r
        ),
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: "success",
            title: "Client Admitted — Shift Queued in Scheduler",
            description: `${newClient.name} admitted. Initial RN Care Plan queued & open shift created in Dispatch.`,
            timeLabel: "Just now",
            route: "/scheduler",
            read: false,
          },
          ...prev.notifications,
        ],
      }));

      return newClient;
    },
    [actorName, actorRole, commitState, state.clients, state.referrals]
  );

  const declineOrReferOutReferral = useCallback(
    (referralId: string, reason: string, partnerStatus: PartnerReferralStatus) => {
      commitState((prev) => ({
        ...prev,
        referrals: prev.referrals.map((r) =>
          r.id === referralId
            ? {
                ...r,
                stage: "Converted",
                partnerStatus,
                intakeNotes: reason ? `${r.intakeNotes ?? ""} [Closed: ${reason}]`.trim() : r.intakeNotes,
              }
            : r
        ),
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: "info",
            title: `Referral Status Updated: ${partnerStatus}`,
            description: `Partner portal notified for referral ${referralId}.`,
            timeLabel: "Just now",
            route: "/partner/referrals",
            read: false,
          },
          ...prev.notifications,
        ],
      }));
    },
    [commitState]
  );

  const acknowledgeEscalation = useCallback(
    (escalationId: string) => {
      commitState((prev) => ({
        ...prev,
        clinicalEscalations: prev.clinicalEscalations.filter((e) => e.id !== escalationId),
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: "success",
            title: "Clinical Escalation Acknowledged",
            description: `RN Supervisor ${actorName} triaged escalation ${escalationId}.`,
            timeLabel: "Just now",
            route: "/clinical",
            read: false,
          },
          ...prev.notifications,
        ],
      }));
    },
    [actorName, commitState]
  );

  const completeCarePlanReview = useCallback(
    (reviewId: string, signedBy?: string) => {
      const review = state.carePlanReviews.find((c) => c.id === reviewId);
      const signer = signedBy || actorName;
      commitState((prev) => ({
        ...prev,
        carePlanReviews: prev.carePlanReviews.filter((c) => c.id !== reviewId),
        referrals: review?.linkedReferralId
          ? prev.referrals.map((r) =>
              r.id === review.linkedReferralId
                ? { ...r, clinicalReviewStatus: "Approved" }
                : r
            )
          : prev.referrals,
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: "success",
            title: "RN Care Plan Signed Off",
            description: `${signer} signed off care plan review${review ? ` for ${review.clientName}` : ""}.`,
            timeLabel: "Just now",
            route: "/clinical",
            read: false,
          },
          ...prev.notifications,
        ],
      }));
    },
    [actorName, commitState, state.carePlanReviews]
  );

  const completeSupervisoryVisit = useCallback(
    (visitId: string) => {
      commitState((prev) => ({
        ...prev,
        supervisoryVisits: prev.supervisoryVisits.filter((sv) => sv.id !== visitId),
      }));
    },
    [commitState]
  );

  const reportIncident = useCallback(
    (input: ReportIncidentInput): string => {
      const bundle = buildIncidentAutomationBundle(input, actorName);
      commitState((prev) => ({
        ...prev,
        incidents: [bundle.incident, ...prev.incidents],
        clinicalEscalations: bundle.clinicalEscalation
          ? [bundle.clinicalEscalation, ...prev.clinicalEscalations]
          : prev.clinicalEscalations,
        carePlanReviews: bundle.carePlanReview
          ? [bundle.carePlanReview, ...prev.carePlanReviews]
          : prev.carePlanReviews,
        supervisoryVisits: bundle.supervisoryVisit
          ? [bundle.supervisoryVisit, ...prev.supervisoryVisits]
          : prev.supervisoryVisits,
        stateDeadlines: bundle.stateDeadline
          ? [bundle.stateDeadline, ...prev.stateDeadlines]
          : prev.stateDeadlines,
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: bundle.incident.isRestricted ? "alert" : "warning",
            title: bundle.incident.isRestricted
              ? `RESTRICTED Incident Filed (${bundle.incident.type})`
              : `Incident Reported: ${bundle.incident.type}`,
            description: `${bundle.incident.id} routed to ${bundle.incident.isRestricted ? "QA Compliance & Clinical RN" : "Clinical RN"}${bundle.stateDeadline ? " with state deadline timer." : "."}`,
            timeLabel: "Just now",
            route: bundle.incident.isRestricted ? "/compliance" : "/clinical",
            read: false,
          },
          ...prev.notifications,
        ],
      }));
      return bundle.incident.id;
    },
    [actorName, commitState]
  );

  const resolveRestrictedIncident = useCallback(
    (incidentId: string, action: "acknowledge" | "resolve") => {
      commitState((prev) => ({
        ...prev,
        incidents: prev.incidents.map((inc) => {
          if (inc.id !== incidentId) return inc;
          if (action === "acknowledge") {
            return { ...inc, status: "Investigated", investigatorName: actorName };
          }
          return {
            ...inc,
            status: "Closed",
            signOff: { name: actorName, date: new Date().toISOString() },
          };
        }),
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: "success",
            title:
              action === "resolve"
                ? `Restricted Incident ${incidentId} Closed`
                : `Restricted Incident ${incidentId} Under Investigation`,
            description: `Action attested by ${actorName}.`,
            timeLabel: "Just now",
            route: "/compliance",
            read: false,
          },
          ...prev.notifications,
        ],
      }));
    },
    [actorName, commitState]
  );

  const submitStateReport = useCallback(
    (deadlineId: string) => {
      commitState((prev) => ({
        ...prev,
        stateDeadlines: prev.stateDeadlines.filter((d) => d.id !== deadlineId),
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: "success",
            title: "State Regulatory Report Submitted",
            description: `Filing ${deadlineId} confirmed and logged in immutable audit trail.`,
            timeLabel: "Just now",
            route: "/compliance",
            read: false,
          },
          ...prev.notifications,
        ],
      }));
    },
    [commitState]
  );

  const verifyComplianceDocument = useCallback(
    (itemId: string, approved: boolean) => {
      const target = state.verificationQueue.find((v) => v.id === itemId);
      commitState((prev) => ({
        ...prev,
        verificationQueue: prev.verificationQueue.filter((v) => v.id !== itemId),
        caregivers: target
          ? prev.caregivers.map((cg) =>
              cg.name.toLowerCase().includes(target.caregiver.name.toLowerCase())
                ? { ...cg, complianceValid: approved }
                : cg
            )
          : prev.caregivers,
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: approved ? "success" : "warning",
            title: approved ? "Credential Verified" : "Credential Rejected",
            description: target
              ? `${target.documentType} for ${target.caregiver.name} ${approved ? "approved" : "rejected"}.`
              : `Verification item ${itemId} processed.`,
            timeLabel: "Just now",
            route: "/compliance",
            read: false,
          },
          ...prev.notifications,
        ],
      }));
    },
    [commitState, state.verificationQueue]
  );

  const simulateUrgentHospitalReferral = useCallback(() => {
    submitPartnerReferral({
      firstName: "Arthur",
      lastName: "Pendelton",
      dob: "1943-09-14",
      phone: "(217) 555-0177",
      serviceRequested: "Post-op Hip Rehab & Daily ADLs",
      isUrgent: true,
      notes: "Discharging from Mercy General within 24 hours; high fall-risk monitoring needed.",
      submittingMember: "Marcus Webb",
      partnerOrgName: "Mercy General Hospital",
      attachmentName: "Mercy_Discharge_Summary.pdf",
    });
  }, [submitPartnerReferral]);

  const simulateCaregiverFallIncident = useCallback(() => {
    reportIncident({
      type: "Fall",
      patientName: "Eleanor Ruth Whitfield",
      patientId: "cl-eleanor",
      caregiverName: "Maria Santos, CNA",
      location: "Patient Home — Hallway",
      description:
        "Client lost balance turning near bedroom doorway; caregiver assisted to chair, zero visible injury, vitals stable. RN reassessment requested.",
      notifySupervisor: true,
    });
  }, [reportIncident]);

  // =========================================================================
  // WAVE 3: HR -> TRAINER LMS -> FIELD SUPERVISOR -> DISPATCH / CLINICAL BRIDGE
  // =========================================================================

  const addCandidate = useCallback(
    (candidate: Candidate) => {
      commitState((prev) => ({
        ...prev,
        candidates: [candidate, ...prev.candidates],
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: "info",
            title: "New Recruiting Candidate Added",
            description: `${candidate.name} (${candidate.positionApplied}) entered HR pipeline.`,
            timeLabel: "Just now",
            route: "/hr/recruiting",
            read: false,
          },
          ...prev.notifications,
        ],
      }));
    },
    [commitState]
  );

  const updateCandidate = useCallback(
    (updated: Candidate) => {
      commitState((prev) => {
        const previous = prev.candidates.find((c) => c.id === updated.id);
        const newlyHired =
          updated.stage === "Hired" && previous?.stage !== "Hired";
        const newCaregiver = newlyHired
          ? buildCaregiverFromCandidate(updated)
          : null;
        const alreadyInRoster = newCaregiver
          ? prev.caregivers.some((cg) => cg.id === newCaregiver.id)
          : true;

        return {
          ...prev,
          candidates: prev.candidates.map((c) =>
            c.id === updated.id ? updated : c
          ),
          caregivers:
            newCaregiver && !alreadyInRoster
              ? [newCaregiver, ...prev.caregivers]
              : prev.caregivers,
          notifications: newlyHired
            ? [
                {
                  id: `notif-${Date.now()}`,
                  type: "success",
                  title: "New Hire Activated in Dispatch Roster",
                  description: `${updated.name} (${updated.credentialVerification.licenseType}) passed HR checks & is now eligible for Smart Dispatch.`,
                  timeLabel: "Just now",
                  route: "/scheduler",
                  read: false,
                },
                ...prev.notifications,
              ]
            : prev.notifications,
        };
      });
    },
    [commitState]
  );

  const autoClearAndHireEligibleCandidates = useCallback((): number => {
    const eligible = state.candidates.filter(
      (c) =>
        c.stage !== "Hired" &&
        c.backgroundCheck.status === "Clear" &&
        c.oigSamCheck.status !== "Flagged" &&
        c.credentialVerification.status === "Verified"
    );
    if (eligible.length === 0) return 0;

    commitState((prev) => {
      const hiredCaregivers: AgencyCaregiver[] = [];
      const nextCandidates = prev.candidates.map((c) => {
        const isTarget = eligible.some((e) => e.id === c.id);
        if (!isTarget) return c;
        const completedCandidate: Candidate = {
          ...c,
          stage: "Hired",
          statusTag: "Active — Dispatch Ready",
          offerLetter: { status: "Signed", sentDate: new Date().toISOString().split("T")[0] },
          onboardingChecklist: {
            policyAcknowledged: true,
            hipaaTrainingCompleted: true,
            abuseReportingCompleted: true,
            i9Submitted: true,
            w4Submitted: true,
          },
        };
        const readiness = evaluateCandidateHireReadiness(completedCandidate);
        if (readiness.canHire) {
          const cg = buildCaregiverFromCandidate(completedCandidate);
          if (!prev.caregivers.some((existing) => existing.id === cg.id)) {
            hiredCaregivers.push(cg);
          }
        }
        return completedCandidate;
      });

      return {
        ...prev,
        candidates: nextCandidates,
        caregivers: [...hiredCaregivers, ...prev.caregivers],
        hrActionQueue: prev.hrActionQueue.filter(
          (aq) => !eligible.some((e) => e.id === aq.relatedId)
        ),
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: "success",
            title: `${eligible.length} Candidate(s) Hired & Rostered`,
            description: `${eligible.map((e) => e.name).join(", ")} onboarded & added to Scheduler Smart Dispatch.`,
            timeLabel: "Just now",
            route: "/scheduler",
            read: false,
          },
          ...prev.notifications,
        ],
      };
    });

    return eligible.length;
  }, [commitState, state.candidates]);

  const resolveHrActionItem = useCallback(
    (actionId: string) => {
      commitState((prev) => ({
        ...prev,
        hrActionQueue: prev.hrActionQueue.filter((item) => item.id !== actionId),
      }));
    },
    [commitState]
  );

  const sendCredentialReminder = useCallback(
    (watchItemId: string) => {
      const target = state.credentialWatchlist.find((w) => w.id === watchItemId);
      commitState((prev) => ({
        ...prev,
        credentialWatchlist: prev.credentialWatchlist.map((w) =>
          w.id === watchItemId ? { ...w, lastNotified: "Just now" } : w
        ),
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: "info",
            title: "Credential Renewal Assigned",
            description: target
              ? `LMS renewal reminder dispatched to ${target.caregiverName} (${target.credentialType}).`
              : "Credential renewal notification sent.",
            timeLabel: "Just now",
            route: "/caregiver/training",
            read: false,
          },
          ...prev.notifications,
        ],
      }));
    },
    [commitState, state.credentialWatchlist]
  );

  const publishLmsCourse = useCallback(
    (input: {
      id?: string;
      title: string;
      category: AgencyLmsCourse["category"];
      durationMinutes?: number;
      ceUnits?: number;
      description?: string;
      complianceLinked: boolean;
    }) => {
      commitState((prev) => {
        const existing = input.id
          ? prev.lmsCourses.find((c) => c.id === input.id)
          : undefined;
        let nextCourses: AgencyLmsCourse[];

        if (existing) {
          nextCourses = prev.lmsCourses.map((c) =>
            c.id === existing.id
              ? {
                  ...c,
                  title: input.title || c.title,
                  publishState: "published",
                  complianceLinked: input.complianceLinked,
                  version: "v2.0",
                }
              : c
          );
        } else {
          const created: AgencyLmsCourse = {
            id: `tr-${Date.now().toString().slice(-4)}`,
            title: input.title,
            category: input.category,
            dueDate: "Sep 15, 2026",
            durationMinutes: input.durationMinutes || 35,
            progressPercent: 0,
            status: "Not Started",
            publishState: "published",
            version: "v1.0",
            enrollments: 24,
            complianceLinked: input.complianceLinked,
            ceUnits: input.ceUnits || 1.5,
            description:
              input.description ||
              "Published by Training Admin and automatically assigned to eligible field caregivers.",
            thumbnail:
              "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
          };
          nextCourses = [created, ...prev.lmsCourses];
        }

        return {
          ...prev,
          lmsCourses: nextCourses,
          notifications: [
            {
              id: `notif-${Date.now()}`,
              type: "success",
              title: "LMS Course Published to Field Staff",
              description: `"${input.title}" is now live in Caregiver Training Portal.`,
              timeLabel: "Just now",
              route: "/caregiver/training",
              read: false,
            },
            ...prev.notifications,
          ],
        };
      });
    },
    [commitState]
  );

  const archiveLmsCourse = useCallback(
    (courseId: string) => {
      commitState((prev) => ({
        ...prev,
        lmsCourses: prev.lmsCourses.map((c) =>
          c.id === courseId ? { ...c, publishState: "archived" } : c
        ),
      }));
    },
    [commitState]
  );

  const completeCaregiverCourse = useCallback(
    (courseId: string) => {
      const target = state.lmsCourses.find((c) => c.id === courseId);
      commitState((prev) => ({
        ...prev,
        lmsCourses: prev.lmsCourses.map((c) =>
          c.id === courseId
            ? {
                ...c,
                progressPercent: 100,
                status: "Completed",
                enrollments: c.enrollments + 1,
              }
            : c
        ),
        caregivers: prev.caregivers.map((cg) =>
          cg.id === "cg-101"
            ? { ...cg, complianceValid: true, certExpiresInDays: 365 }
            : cg
        ),
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: "success",
            title: "Caregiver Certification Completed",
            description: `${actorName} completed "${target?.title ?? courseId}" (+${target?.ceUnits ?? 1} CE). LMS compliance updated.`,
            timeLabel: "Just now",
            route: "/training-admin",
            read: false,
          },
          ...prev.notifications,
        ],
      }));
    },
    [actorName, commitState, state.lmsCourses]
  );

  const submitFieldEvaluation = useCallback(
    (payload: {
      visitId?: string;
      clientName: string;
      caregiverName: string;
      findings: { description: string; severity: "minor" | "moderate" | "urgent" }[];
    }) => {
      const nowIso = new Date().toISOString();
      const newFindings: AgencyFieldFinding[] = payload.findings
        .filter((f) => f.description.trim().length > 0)
        .map((f, idx) => ({
          id: `ff-${Date.now()}-${idx}`,
          clientName: payload.clientName,
          caregiverName: payload.caregiverName,
          description: f.description,
          severity: f.severity,
          dateIdentified: "Just now",
          status: f.severity === "urgent" ? "Escalated" : "Open",
        }));

      const urgentEscalations = newFindings
        .filter((f) => f.severity === "urgent")
        .map((f, idx) => ({
          id: `esc-fld-${Date.now()}-${idx}`,
          clientName: f.clientName,
          clientId: "cl-eleanor",
          reporter: actorName,
          reporterRole: "Field Supervisor",
          whatChanged: `Field Evaluation Urgent Finding: ${f.description}`,
          timeReported: nowIso,
          type: "reassessment_request" as const,
        }));

      commitState((prev) => ({
        ...prev,
        supervisoryVisits: payload.visitId
          ? prev.supervisoryVisits.map((sv) =>
              sv.id === payload.visitId ? { ...sv, status: "completed" } : sv
            )
          : prev.supervisoryVisits.map((sv) =>
              sv.clientName.toLowerCase() === payload.clientName.toLowerCase() &&
              sv.status !== "completed"
                ? { ...sv, status: "completed" }
                : sv
            ),
        fieldFindings: [...newFindings, ...prev.fieldFindings],
        clinicalEscalations: [...urgentEscalations, ...prev.clinicalEscalations],
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: urgentEscalations.length > 0 ? "alert" : "success",
            title:
              urgentEscalations.length > 0
                ? "Field Evaluation Escalated to Clinical RN"
                : "Supervisory Visit Evaluation Logged",
            description: `${payload.clientName} (${payload.caregiverName}) evaluated with ${newFindings.length} finding(s).`,
            timeLabel: "Just now",
            route: urgentEscalations.length > 0 ? "/clinical" : "/field-supervisor",
            read: false,
          },
          ...prev.notifications,
        ],
      }));
    },
    [actorName, commitState]
  );

  const resolveFieldFinding = useCallback(
    (findingId: string, action: "followup" | "escalate") => {
      const target = state.fieldFindings.find((f) => f.id === findingId);
      commitState((prev) => ({
        ...prev,
        fieldFindings: prev.fieldFindings.filter((f) => f.id !== findingId),
        clinicalEscalations:
          action === "escalate" && target
            ? [
                {
                  id: `esc-ff-${Date.now()}`,
                  clientName: target.clientName,
                  clientId: target.clientId || "cl-mabel",
                  reporter: actorName,
                  reporterRole: "Field Supervisor",
                  whatChanged: `Field Finding Escalated: ${target.description}`,
                  timeReported: new Date().toISOString(),
                  type: "reassessment_request",
                },
                ...prev.clinicalEscalations,
              ]
            : prev.clinicalEscalations,
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: action === "escalate" ? "warning" : "success",
            title:
              action === "escalate"
                ? "Field Finding Escalated to Clinical RN"
                : "Field Coaching Follow-Up Logged",
            description: target
              ? `${target.clientName}: ${target.description}`
              : `Finding ${findingId} updated.`,
            timeLabel: "Just now",
            route: action === "escalate" ? "/clinical" : "/field-supervisor",
            read: false,
          },
          ...prev.notifications,
        ],
      }));
    },
    [actorName, commitState, state.fieldFindings]
  );

  const simulateHrCandidateHire = useCallback(() => {
    const count = autoClearAndHireEligibleCandidates();
    if (count === 0) {
      const newCand: Candidate = {
        id: `cand-sim-${Date.now().toString().slice(-4)}`,
        name: "Maya Lin",
        email: "maya.lin@example.com",
        phone: "(217) 555-0188",
        positionApplied: "Certified Nursing Assistant (CNA)",
        source: "Employee Referral",
        dateApplied: "2026-07-22",
        assignedRecruiter: "Marcus Thompson",
        statusTag: "Active — Dispatch Ready",
        stage: "Hired",
        experienceYears: 4,
        backgroundCheck: { status: "Clear", provider: "Checkr" },
        sexOffenderCheck: { status: "Clear" },
        oigSamCheck: { status: "Clear" },
        tbTest: { result: "Negative" },
        credentialVerification: {
          licenseType: "CNA",
          licenseNumber: "CNA-772104",
          status: "Verified",
          cprCertified: true,
        },
        offerLetter: { status: "Signed" },
        onboardingChecklist: {
          policyAcknowledged: true,
          hipaaTrainingCompleted: true,
          abuseReportingCompleted: true,
          i9Submitted: true,
          w4Submitted: true,
        },
        notes: [],
      };
      addCandidate(newCand);
      updateCandidate(newCand);
    }
  }, [addCandidate, autoClearAndHireEligibleCandidates, updateCandidate]);

  const simulateFieldFindingEscalation = useCallback(() => {
    submitFieldEvaluation({
      clientName: "Mabel Ortiz",
      caregiverName: "Maria Alvarez",
      findings: [
        {
          description: "Observed slight shortness of breath during transfer; RN supervisory check requested.",
          severity: "urgent",
        },
      ],
    });
  }, [submitFieldEvaluation]);

  const executeBriefingAction = useCallback(
    (actionType: BriefingActionItem["actionType"]) => {
      if (actionType === "AUTO_FILL_ALL") {
        const count = autoFillAllUnfilled();
        toast.success(`Smart Dispatch assigned ${count} open shift(s).`);
      } else if (actionType === "RESOLVE_MINOR_EVV") {
        const count = autoResolveMinorEvv();
        toast.success(`Resolved ${count} EVV exception(s) and released billing holds.`);
      } else if (actionType === "RELEASE_CLEARED_CLAIMS") {
        const count = releaseClearedClaimsBatch();
        toast.success(`Submitted ${count} scrubbed claim(s) in 837 batch.`);
      } else if (actionType === "SEND_AUTH_ALERTS") {
        toast.success("Renewal reminders queued for expiring payer authorizations.");
      } else if (actionType === "AUTO_TRIAGE_REFERRALS") {
        const count = autoTriagePendingReferrals();
        toast.success(`Auto-verified eligibility & triaged ${count} inbound referral(s).`);
      } else if (actionType === "SUBMIT_DUE_STATE_REPORTS") {
        const first = state.stateDeadlines[0];
        if (first) {
          submitStateReport(first.id);
          toast.success(`Submitted state filing ${first.id} to regulatory portal.`);
        } else {
          toast.info("No pending state regulatory filings.");
        }
      } else if (actionType === "HIRE_ELIGIBLE_CANDIDATES") {
        const count = autoClearAndHireEligibleCandidates();
        toast.success(`Onboarded ${count} cleared candidate(s) into Dispatch roster.`);
      } else if (actionType === "ASSIGN_OVERDUE_SUPERVISORY") {
        const overdue = state.supervisoryVisits.find((sv) => sv.status === "overdue");
        if (overdue) {
          submitFieldEvaluation({
            visitId: overdue.id,
            clientName: overdue.clientName,
            caregiverName: "Maria Santos, CNA",
            findings: [],
          });
          toast.success(`Completed overdue supervisory visit for ${overdue.clientName}.`);
        }
      }
    },
    [
      autoClearAndHireEligibleCandidates,
      autoFillAllUnfilled,
      autoResolveMinorEvv,
      autoTriagePendingReferrals,
      releaseClearedClaimsBatch,
      state.stateDeadlines,
      state.supervisoryVisits,
      submitFieldEvaluation,
      submitStateReport,
    ]
  );

  const simulateOutOfRadiusException = useCallback(() => {
    const newId = `sim-evv-${Date.now()}`;
    const newClaimId = `CLM-${Math.floor(10400 + Math.random() * 599)}`;
    const client = state.clients[0];

    const simulatedVisit: AgencyShiftVisit = {
      id: newId,
      evvId: `EVV-2026-${Math.floor(700 + Math.random() * 299)}`,
      shiftNumber: `SH-${Math.floor(700 + Math.random() * 299)}`,
      clientId: client.id,
      caregiverId: "cg-101",
      region: "Springfield North",
      visitDate: "2026-07-22",
      visitDateLabel: "Today",
      scheduledStart: "07:00 AM",
      scheduledEnd: "11:00 AM",
      scheduledHours: 4,
      requiredSkills: ["CNA"],
      status: "Completed",
      clockInTime: "07:03 AM",
      clockOutTime: "11:02 AM",
      evvMethod: "GPS",
      evvCompliance: "Exception",
      exceptionCategory: "Location Mismatch",
      exceptionDetail: "GPS capture was 210m from client residence (limit 100m).",
      gpsDistanceMeters: 210,
      timeVarianceMinutes: 3,
      geofenceThresholdMeters: 100,
      tasks: [
        { id: `t-${Date.now()}`, category: "Personal Care", title: "Morning care completed", completed: true },
      ],
      medications: [],
      signatureCaptured: true,
      billingStatus: "Hold",
      billingHoldReason: "GPS capture was 210m from client residence (limit 100m).",
      claimId: newClaimId,
      auditHistory: [
        createAuditEvent({
          actorName: "Demo Simulator",
          actorRole: "SYSTEM",
          actionType: "EXCEPTION_DETECTED",
          summary: "Simulated >100m GPS exception (210m). Billing placed on Hold.",
        }),
      ],
    };

    const blockedClaim: AgencyClaim = {
      id: newClaimId,
      visitId: newId,
      patientId: client.id,
      patientName: client.name,
      payer: client.payer,
      amount: Math.round(4 * client.hourlyBillRate),
      status: "Draft",
      scrubStatus: "Blocked",
      scrubIssues: ["GPS capture was 210m from client residence (limit 100m)."],
      serviceCode: client.serviceCode,
      authNumber: client.authNumber,
      date: "Today",
      age: "",
    };

    commitState((prev) => ({
      ...prev,
      visits: [simulatedVisit, ...prev.visits],
      claims: [blockedClaim, ...prev.claims],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          type: "alert",
          title: "Simulated Geofence Exception (210m)",
          description: `${simulatedVisit.evvId} flagged in EVV Monitoring; claim ${newClaimId} held.`,
          timeLabel: "Just now",
          route: "/evv-monitoring",
          read: false,
        },
        ...prev.notifications,
      ],
    }));
  }, [commitState, state.clients]);

  // =========================================================================
  // WAVE 4: AUDIT TRAIL, OFFLINE HMAC EVV, CARE PLAN SYNC, AUTHS, INVOICING & COMMS
  // =========================================================================

  const logAuditEvent = useCallback(
    (input: {
      action: AgencyAuditAction;
      resourceType: AgencyAuditLogEntry["resourceType"];
      resourceId: string;
      summary: string;
      status?: "Success" | "Flagged";
    }) => {
      const entry: AgencyAuditLogEntry = {
        id: `aud-${Date.now()}-${Math.floor(Math.random() * 999)}`,
        timestampUtc: new Date().toISOString(),
        actorName,
        actorRole,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        summary: input.summary,
        status: input.status ?? "Success",
      };
      commitState((prev) => ({
        ...prev,
        auditLogs: [entry, ...prev.auditLogs].slice(0, 150),
      }));
    },
    [actorName, actorRole, commitState]
  );

  const updateVisitStatus = useCallback(
    (visitId: string, status: AgencyShiftStatus) => {
      commitState((prev) => ({
        ...prev,
        visits: prev.visits.map((v) => {
          if (v.id !== visitId) return v;
          if (status === "Unfilled") {
            return {
              ...v,
              status,
              caregiverId: null,
              evvCompliance: "Exception",
              exceptionCategory: "Missed Call",
              exceptionDetail: "Moved back to Unfilled queue from Dispatch Board.",
            };
          }
          return { ...v, status };
        }),
      }));
    },
    [commitState]
  );

  const queueOfflineEvvClock = useCallback(
    async (input: {
      visitId: string;
      actionType: "CLOCK_IN" | "CLOCK_OUT";
      method: "gps" | "ivr" | "fvv";
      gpsDistanceMeters: number;
      notes?: string;
      signatureCaptured?: boolean;
      mileage?: number;
    }): Promise<OfflineEvvRecord | null> => {
      const visit = state.visits.find((v) => v.id === input.visitId);
      if (!visit) return null;

      const capturedAtIso = new Date().toISOString();
      const hmacSignature = await signEvvPayloadHmac({
        visitId: visit.id,
        actionType: input.actionType,
        capturedAtIso,
        gpsDistanceMeters: input.gpsDistanceMeters,
      });

      const record: OfflineEvvRecord = {
        id: `off-${Date.now()}`,
        visitId: visit.id,
        evvId: visit.evvId,
        actionType: input.actionType,
        method: input.method,
        gpsDistanceMeters: input.gpsDistanceMeters,
        capturedAtIso,
        hmacSignature,
        notes: input.notes,
        signatureCaptured: input.signatureCaptured,
        mileage: input.mileage,
        synced: false,
      };

      commitState((prev) => {
        const nextQueue = [record, ...prev.offlineEvvQueue];
        persistOfflineEvvQueue(nextQueue);
        const auditEntry: AgencyAuditLogEntry = {
          id: `aud-${Date.now()}`,
          timestampUtc: capturedAtIso,
          actorName,
          actorRole,
          action: "EVV_OFFLINE_SYNC",
          resourceType: "Visit",
          resourceId: visit.evvId,
          summary: `Offline ${input.actionType} cached with HMAC signature (${hmacSignature.slice(0, 18)}...)`,
          status: "Success",
        };
        return {
          ...prev,
          offlineEvvQueue: nextQueue,
          auditLogs: [auditEntry, ...prev.auditLogs].slice(0, 150),
        };
      });

      return record;
    },
    [actorName, actorRole, commitState, state.visits]
  );

  const syncOfflineEvvQueue = useCallback((): number => {
    const pending = state.offlineEvvQueue.filter((r) => !r.synced);
    if (pending.length === 0) return 0;

    pending.forEach((rec) => {
      if (rec.actionType === "CLOCK_IN") {
        clockInVisit(
          rec.visitId,
          rec.method,
          rec.gpsDistanceMeters,
          `Offline HMAC sync (${rec.hmacSignature.slice(0, 16)})`,
          true
        );
      } else {
        clockOutVisit(rec.visitId, {
          notes: rec.notes || `Offline HMAC clock-out synced (${rec.hmacSignature.slice(0, 16)})`,
          signatureCaptured: rec.signatureCaptured ?? true,
          mileage: rec.mileage,
        });
      }
    });

    commitState((prev) => {
      const nextQueue = prev.offlineEvvQueue.map((r) => ({ ...r, synced: true }));
      persistOfflineEvvQueue(nextQueue);
      return {
        ...prev,
        offlineEvvQueue: nextQueue,
        notifications: [
          {
            id: `notif-${Date.now()}`,
            type: "success",
            title: "Offline HMAC EVV Queue Synced",
            description: `${pending.length} cryptographically signed EVV event(s) reconciled to live visits.`,
            timeLabel: "Just now",
            route: "/evv-monitoring",
            read: false,
          },
          ...prev.notifications,
        ],
      };
    });

    return pending.length;
  }, [clockInVisit, clockOutVisit, commitState, state.offlineEvvQueue]);

  const syncCarePlanToClientVisits = useCallback(
    (input: {
      clientId: string;
      goals: string[];
      taskTitles: string[];
      medicationReminders: string[];
      signedBy?: string;
    }): number => {
      let updatedVisitsCount = 0;
      const signer = input.signedBy || actorName;
      const nowIso = new Date().toISOString();

      commitState((prev) => {
        const client = prev.clients.find((c) => c.id === input.clientId);
        if (!client) return prev;

        const nextClients = prev.clients.map((c) =>
          c.id === input.clientId
            ? {
                ...c,
                carePlanVersion: "v2.2 (RN Signed)",
                carePlanGoals: input.goals,
                carePlanUpdatedAt: nowIso,
              }
            : c
        );

        const nextVisits = prev.visits.map((v) => {
          if (v.clientId !== input.clientId) return v;
          if (v.status === "Completed") return v;
          updatedVisitsCount += 1;

          const existingTitles = new Set(v.tasks.map((t) => t.title.toLowerCase()));
          const addedTasks: AgencyVisitTask[] = input.taskTitles
            .filter((title) => !existingTitles.has(title.toLowerCase()))
            .map((title, idx) => ({
              id: `cp-task-${Date.now()}-${idx}`,
              category: "Personal Care",
              title,
              description: "Synced from RN Comprehensive Care Plan",
              completed: false,
            }));

          const existingMeds = new Set(
            v.medications.map((m) => m.medicationName.toLowerCase())
          );
          const addedMeds = input.medicationReminders
            .filter((m) => m.trim().length > 0 && !existingMeds.has(m.toLowerCase()))
            .map((medName, idx) => ({
              id: `cp-med-${Date.now()}-${idx}`,
              medicationName: medName,
              dosage: "Per Care Plan",
              scheduleTime: v.scheduledStart,
              instructions: "Reminder only — synced from RN Care Plan",
              status: "pending" as const,
            }));

          return {
            ...v,
            tasks: [...v.tasks, ...addedTasks],
            medications: [...v.medications, ...addedMeds],
          };
        });

        const nextReviews = prev.carePlanReviews.map((r) =>
          r.clientId === input.clientId && r.status !== "completed"
            ? {
                ...r,
                status: "completed" as const,
                signedBy: signer,
                signedAt: "Just now",
              }
            : r
        );

        const carePlanAudit: AgencyAuditLogEntry = {
          id: `aud-${Date.now()}`,
          timestampUtc: nowIso,
          actorName: signer,
          actorRole,
          action: "CARE_PLAN_SYNC",
          resourceType: "CarePlan",
          resourceId: client.id,
          summary: `Care Plan signed & synced (${input.taskTitles.length} tasks) to ${updatedVisitsCount} active/upcoming visit(s).`,
          status: "Success",
        };

        return {
          ...prev,
          clients: nextClients,
          visits: nextVisits,
          carePlanReviews: nextReviews,
          auditLogs: [carePlanAudit, ...prev.auditLogs].slice(0, 150),
          notifications: [
            {
              id: `notif-${Date.now()}`,
              type: "success",
              title: "Care Plan Synced to Field Caregivers",
              description: `${client.name}'s updated ADL tasks & meds pushed to ${updatedVisitsCount} visit(s).`,
              timeLabel: "Just now",
              route: "/caregiver",
              read: false,
            },
            ...prev.notifications,
          ],
        };
      });

      return updatedVisitsCount;
    },
    [actorName, actorRole, commitState]
  );

  const requestAuthorizationRenewal = useCallback(
    (clientId: string) => {
      commitState((prev) => {
        const client = prev.clients.find((c) => c.id === clientId);
        if (!client) return prev;
        const authAudit: AgencyAuditLogEntry = {
          id: `aud-${Date.now()}`,
          timestampUtc: new Date().toISOString(),
          actorName,
          actorRole,
          action: "UPDATE",
          resourceType: "Authorization",
          resourceId: client.authNumber,
          summary: `Payer authorization renewal packet queued for ${client.payer} (${client.authNumber}).`,
          status: "Success",
        };
        return {
          ...prev,
          auditLogs: [authAudit, ...prev.auditLogs].slice(0, 150),
          notifications: [
            {
              id: `notif-${Date.now()}`,
              type: "info",
              title: "Authorization Renewal Requested",
              description: `278 Prior Auth renewal sent to ${client.payer} for ${client.name} (${client.authNumber}).`,
              timeLabel: "Just now",
              route: "/billing/authorizations",
              read: false,
            },
            ...prev.notifications,
          ],
        };
      });
    },
    [actorName, actorRole, commitState]
  );

  const createClientAuthorization = useCallback(
    (input: {
      clientId: string;
      authNumber: string;
      additionalUnits: number;
      expiresInDays: number;
      serviceCode?: string;
    }) => {
      commitState((prev) => {
        const client = prev.clients.find((c) => c.id === input.clientId);
        if (!client) return prev;

        const nextClients = prev.clients.map((c) =>
          c.id === input.clientId
            ? {
                ...c,
                authNumber: input.authNumber,
                serviceCode: input.serviceCode || c.serviceCode,
                authorizedUnitsRemaining: c.authorizedUnitsRemaining + input.additionalUnits,
                authorizedUnitsTotal: c.authorizedUnitsTotal + input.additionalUnits,
                authExpiresInDays: Math.max(c.authExpiresInDays, input.expiresInDays),
              }
            : c
        );

        const nextClaims = prev.claims.map((cl) =>
          cl.patientId === input.clientId &&
          cl.scrubIssues.some((i) => i.toLowerCase().includes("auth"))
            ? {
                ...cl,
                authNumber: input.authNumber,
                scrubIssues: cl.scrubIssues.filter((i) => !i.toLowerCase().includes("auth")),
                scrubStatus:
                  cl.scrubIssues.filter((i) => !i.toLowerCase().includes("auth")).length === 0
                    ? ("Passed" as const)
                    : ("Blocked" as const),
              }
            : cl
        );

        const createAuthAudit: AgencyAuditLogEntry = {
          id: `aud-${Date.now()}`,
          timestampUtc: new Date().toISOString(),
          actorName,
          actorRole,
          action: "CREATE",
          resourceType: "Authorization",
          resourceId: input.authNumber,
          summary: `Added ${input.additionalUnits} authorized units (${input.expiresInDays}d window) for Client ID ${client.id}.`,
          status: "Success",
        };

        return {
          ...prev,
          clients: nextClients,
          claims: nextClaims,
          auditLogs: [createAuthAudit, ...prev.auditLogs].slice(0, 150),
        };
      });
    },
    [actorName, actorRole, commitState]
  );

  const processDraftInvoices = useCallback((): number => {
    const drafts = state.invoices.filter((inv) => inv.status === "Draft");
    if (drafts.length === 0) return 0;

    const invoiceAudit: AgencyAuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestampUtc: new Date().toISOString(),
      actorName,
      actorRole,
      action: "UPDATE",
      resourceType: "Invoice",
      resourceId: drafts.map((d) => d.id).join(","),
      summary: `Auto-dispatched ${drafts.length} private-pay draft invoice(s).`,
      status: "Success",
    };

    commitState((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) =>
        inv.status === "Draft"
          ? { ...inv, status: "Sent", scheduledDateLabel: "Sent just now" }
          : inv
      ),
      auditLogs: [invoiceAudit, ...prev.auditLogs].slice(0, 150),
    }));

    return drafts.length;
  }, [actorName, actorRole, commitState, state.invoices]);

  const markInvoicePaid = useCallback(
    (invoiceId: string) => {
      commitState((prev) => ({
        ...prev,
        invoices: prev.invoices.map((inv) =>
          inv.id === invoiceId
            ? { ...inv, status: "Paid", scheduledDateLabel: "Paid today" }
            : inv
        ),
      }));
    },
    [commitState]
  );

  const sendConversationMessage = useCallback(
    (input: {
      conversationId: string;
      content: string;
      channelMode: AgencyMessageChannel;
      isInternalNote: boolean;
    }) => {
      const trimmed = input.content.trim();
      if (!trimmed) return;

      const msgId = `msg-${Date.now()}`;
      const timeLabel = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      commitState((prev) => {
        const targetConv = prev.conversations.find((c) => c.id === input.conversationId);
        if (!targetConv) return prev;

        const nextMessage = {
          id: msgId,
          conversationId: input.conversationId,
          senderName: actorName,
          senderRole: actorRole,
          isCurrentUser: true,
          content: trimmed,
          timestampLabel: timeLabel,
          channelMode: input.channelMode,
          isInternalNote: input.isInternalNote,
          deliveryStatus: "delivered" as const,
        };

        const msgAudit: AgencyAuditLogEntry = {
          id: `aud-${Date.now()}`,
          timestampUtc: new Date().toISOString(),
          actorName,
          actorRole,
          action: "MESSAGE_SENT",
          resourceType: "Communication",
          resourceId: input.conversationId,
          summary: `Sent ${input.isInternalNote ? "internal clinical note" : input.channelMode} message on thread ${input.conversationId}.`,
          status: "Success",
        };

        return {
          ...prev,
          conversations: prev.conversations.map((c) =>
            c.id === input.conversationId
              ? {
                  ...c,
                  unreadCount: 0,
                  messages: [...c.messages, nextMessage],
                }
              : c
          ),
          auditLogs: [msgAudit, ...prev.auditLogs].slice(0, 150),
        };
      });
    },
    [actorName, actorRole, commitState]
  );

  const createConversationThread = useCallback(
    (input: {
      categoryId: AgencyConversationCategory;
      title: string;
      participantRole: string;
      initialMessage: string;
      channelMode: AgencyMessageChannel;
      linkedClientId?: string;
    }): string => {
      const id = `conv-${Date.now()}`;
      const timeLabel = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const linkedClient = input.linkedClientId
        ? state.clients.find((c) => c.id === input.linkedClientId)
        : undefined;

      commitState((prev) => ({
        ...prev,
        conversations: [
          {
            id,
            categoryId: input.categoryId,
            title: input.title,
            participantRole: input.participantRole,
            participantStatus: "online",
            phoneMasked: linkedClient ? "(•••) •••-0194" : "(•••) •••-0100",
            linkedRecord: linkedClient
              ? {
                  id: linkedClient.id,
                  type: "Client",
                  label: `Client Chart • ${linkedClient.id}`,
                  route: `/patients/${linkedClient.id}`,
                }
              : undefined,
            unreadCount: 0,
            isUrgent: false,
            messages: [
              {
                id: `msg-${Date.now()}`,
                conversationId: id,
                senderName: actorName,
                senderRole: actorRole,
                isCurrentUser: true,
                content: input.initialMessage,
                timestampLabel: timeLabel,
                channelMode: input.channelMode,
                isInternalNote: input.channelMode === "in-app",
                deliveryStatus: "delivered",
              },
            ],
          },
          ...prev.conversations,
        ],
      }));

      return id;
    },
    [actorName, actorRole, commitState, state.clients]
  );

  const markConversationRead = useCallback(
    (conversationId: string) => {
      commitState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
      }));
    },
    [commitState]
  );

  const updatePartnerOrgProfile = useCallback(
    (updates: Partial<PartnerOrganization>) => {
      commitState((prev) => ({
        ...prev,
        partnerOrg: { ...prev.partnerOrg, ...updates },
      }));
    },
    [commitState]
  );

  const addPartnerTeamMember = useCallback(
    (member: { name: string; email: string; role: string; phone?: string }) => {
      const created: PartnerTeamMember = {
        id: `tm-${Date.now()}`,
        name: member.name.trim(),
        email: member.email.trim(),
        role: member.role,
        phone: member.phone?.trim() || "(555) 019-2000",
        status: "Active",
      };
      commitState((prev) => ({
        ...prev,
        partnerTeamMembers: [...prev.partnerTeamMembers, created],
      }));
    },
    [commitState]
  );

  const updatePartnerTeamMemberRole = useCallback(
    (memberId: string, role: string) => {
      commitState((prev) => ({
        ...prev,
        partnerTeamMembers: prev.partnerTeamMembers.map((m) =>
          m.id === memberId ? { ...m, role } : m
        ),
      }));
    },
    [commitState]
  );

  const removePartnerTeamMember = useCallback(
    (memberId: string) => {
      commitState((prev) => ({
        ...prev,
        partnerTeamMembers: prev.partnerTeamMembers.filter((m) => m.id !== memberId),
      }));
    },
    [commitState]
  );

  const respondToPartnerReferralInfo = useCallback(
    (referralId: string, note: string, attachmentName?: string) => {
      const nowIso = new Date().toISOString();
      commitState((prev) => {
        const target = prev.referrals.find((r) => r.id === referralId);
        if (!target) return prev;

        const nextReferrals = prev.referrals.map((r) => {
          if (r.id !== referralId) return r;
          const updatedDocs = attachmentName
            ? [
                ...r.documents,
                { name: attachmentName, status: "Uploaded" as const },
              ]
            : r.documents;
          return {
            ...r,
            partnerStatus: "Under Review" as const,
            intakeNotes: note ? `${r.intakeNotes ?? ""} | Partner Update: ${note}`.trim() : r.intakeNotes,
            documents: updatedDocs,
            communications: [
              {
                id: `comm-${Date.now()}`,
                timestamp: nowIso,
                author: prev.partnerOrg.primaryContact,
                type: "note" as const,
                content: `Partner response: ${note}${attachmentName ? ` [Attached: ${attachmentName}]` : ""}`,
              },
              ...r.communications,
            ],
          };
        });

        const auditEntry: AgencyAuditLogEntry = {
          id: `aud-${Date.now()}`,
          timestampUtc: nowIso,
          actorName,
          actorRole,
          action: "UPDATE",
          resourceType: "Client",
          resourceId: referralId,
          summary: `Partner submitted requested clinical/intake documentation for Referral ${referralId}.`,
          status: "Success",
        };

        return {
          ...prev,
          referrals: nextReferrals,
          auditLogs: [auditEntry, ...prev.auditLogs].slice(0, 150),
          notifications: [
            {
              id: `notif-${Date.now()}`,
              type: "info",
              title: "Partner Sent Requested Referral Info",
              description: `${prev.partnerOrg.name} updated referral ${target.clientName}${attachmentName ? ` (+${attachmentName})` : ""}.`,
              timeLabel: "Just now",
              route: "/intake/referrals",
              read: false,
            },
            ...prev.notifications,
          ],
        };
      });
    },
    [actorName, actorRole, commitState]
  );

  const markNotificationRead = useCallback(
    (notifId: string) => {
      commitState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notifId ? { ...n, read: true } : n
        ),
      }));
    },
    [commitState]
  );

  const markAllNotificationsRead = useCallback(() => {
    commitState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, [commitState]);

  const resetDemoData = useCallback(() => {
    const fresh = buildInitialAgencyStoreState();
    setState(fresh);
    try {
      localStorage.setItem(AGENCY_STORE_STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // Ignore
    }
  }, []);

  return (
    <AgencyStoreContext.Provider
      value={{
        state,
        isHydrated,
        getClientById,
        getCaregiverById,
        getRankedCandidates,
        createShift,
        assignShift,
        autoAssignBestCaregiver,
        autoFillAllUnfilled,
        triggerCallOff,
        acceptBackfillOffer,
        clockInVisit,
        toggleVisitTask,
        skipVisitTask,
        logVisitMedication,
        applyVoiceNoteToVisit,
        clockOutVisit,
        resolveEvvException,
        autoResolveMinorEvv,
        moveClaimStatus,
        releaseClearedClaimsBatch,
        generateAiAppealDraft,
        submitPartnerReferral,
        createIntakeReferral,
        updateReferral,
        autoTriagePendingReferrals,
        scheduleReferralAssessment,
        admitReferralToActiveCare,
        declineOrReferOutReferral,
        acknowledgeEscalation,
        completeCarePlanReview,
        completeSupervisoryVisit,
        reportIncident,
        resolveRestrictedIncident,
        submitStateReport,
        verifyComplianceDocument,
        addCandidate,
        updateCandidate,
        autoClearAndHireEligibleCandidates,
        resolveHrActionItem,
        sendCredentialReminder,
        publishLmsCourse,
        archiveLmsCourse,
        completeCaregiverCourse,
        submitFieldEvaluation,
        resolveFieldFinding,
        executeBriefingAction,
        simulateOutOfRadiusException,
        simulateUrgentHospitalReferral,
        simulateCaregiverFallIncident,
        simulateHrCandidateHire,
        simulateFieldFindingEscalation,
        logAuditEvent,
        updateVisitStatus,
        queueOfflineEvvClock,
        syncOfflineEvvQueue,
        syncCarePlanToClientVisits,
        requestAuthorizationRenewal,
        createClientAuthorization,
        processDraftInvoices,
        markInvoicePaid,
        sendConversationMessage,
        createConversationThread,
        markConversationRead,
        updatePartnerOrgProfile,
        addPartnerTeamMember,
        updatePartnerTeamMemberRole,
        removePartnerTeamMember,
        respondToPartnerReferralInfo,
        markNotificationRead,
        markAllNotificationsRead,
        resetDemoData,
      }}
    >
      {children}
    </AgencyStoreContext.Provider>
  );
}

export function useAgencyStore() {
  const ctx = useContext(AgencyStoreContext);
  if (!ctx) {
    throw new Error("useAgencyStore must be used within an AgencyStoreProvider");
  }
  return ctx;
}
