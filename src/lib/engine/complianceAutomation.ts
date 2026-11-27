import { StateDeadlineIncident } from "@/lib/mock-data/compliance-dashboard";
import {
  AgencyCaregiver,
  AgencyCarePlanReview,
  AgencyClinicalEscalation,
  AgencySupervisoryVisit,
} from "@/types/agency";
import { VerificationQueueItem } from "@/types/compliance";
import { Incident, IncidentCategory, IncidentSeverity } from "@/types/incidents";

export const RESTRICTED_INCIDENT_CATEGORIES: IncidentCategory[] = [
  "Abuse",
  "Neglect",
  "HIPAA Breach",
  "Death",
];

export const HIGH_SEVERITY_INCIDENT_CATEGORIES: IncidentCategory[] = [
  "Abuse",
  "Neglect",
  "Death",
  "HIPAA Breach",
  "Emergency",
  "Hospital Transfer",
  "Medication Error",
  "Fall",
];

export interface ReportIncidentInput {
  type: IncidentCategory;
  patientName: string;
  patientId?: string;
  caregiverName: string;
  location: string;
  description: string;
  incidentDate?: string;
  notifySupervisor?: boolean;
}

export interface IncidentAutomationBundle {
  incident: Incident;
  clinicalEscalation?: AgencyClinicalEscalation;
  carePlanReview?: AgencyCarePlanReview;
  supervisoryVisit?: AgencySupervisoryVisit;
  stateDeadline?: StateDeadlineIncident;
}

/**
 * Creates a compliant Incident record and computes downstream Clinical & QA escalations,
 * mandatory state reporting timers, and post-incident RN reassessment triggers.
 */
export function buildIncidentAutomationBundle(
  input: ReportIncidentInput,
  reporterName: string
): IncidentAutomationBundle {
  const now = new Date();
  const nowIso = now.toISOString();
  const numericSuffix = Math.floor(100 + Math.random() * 899);
  const incidentId = `INC-2026-${numericSuffix}`;
  const isRestricted = RESTRICTED_INCIDENT_CATEGORIES.includes(input.type);
  const isHighSeverity = HIGH_SEVERITY_INCIDENT_CATEGORIES.includes(input.type);

  const severity: IncidentSeverity = isRestricted
    ? "Critical"
    : isHighSeverity
      ? "High"
      : "Medium";

  const regulatoryRequired =
    isRestricted ||
    input.type === "Hospital Transfer" ||
    input.type === "Medication Error";

  const agency =
    input.type === "HIPAA Breach"
      ? "OCR/HIPAA"
      : input.type === "Abuse" || input.type === "Neglect"
        ? "Adult Protective Services"
        : "State Health Dept";

  const deadlineMinutes =
    input.type === "HIPAA Breach"
      ? 59 * 24 * 60
      : isRestricted
        ? 24 * 60
        : 72 * 60;

  const deadlineIso = new Date(now.getTime() + deadlineMinutes * 60 * 1000).toISOString();

  const incident: Incident = {
    id: incidentId,
    type: input.type,
    severity,
    status: "Reported",
    reportedDate: nowIso,
    incidentDate: input.incidentDate || nowIso,
    location: input.location || "Patient Home",
    description: input.description,
    peopleInvolved: [
      {
        id: input.patientId || `pat-${numericSuffix}`,
        name: input.patientName || "Assigned Client",
        role: "Patient",
      },
      {
        id: `cg-${numericSuffix}`,
        name: input.caregiverName || reporterName,
        role: "Caregiver",
      },
    ],
    workflow: [
      {
        stage: "Reported",
        completedBy: reporterName,
        completedAt: nowIso,
        startedAt: nowIso,
      },
      {
        stage: "Assigned",
        startedAt: nowIso,
        slaTargetHours: isRestricted ? 1 : 2,
      },
    ],
    regulatoryReport: {
      required: regulatoryRequired,
      agency: regulatoryRequired ? agency : undefined,
      deadline: regulatoryRequired ? deadlineIso : undefined,
      status: regulatoryRequired ? "Pending" : "Not Required",
    },
    supervisorAlert: Boolean(input.notifySupervisor || isHighSeverity),
    isRestricted,
    investigatorName: isRestricted ? "David Chen (QA)" : "Rachel Miller, RN",
    patternDetected:
      input.type === "Fall"
        ? "Fall event flagged for post-incident RN reassessment."
        : undefined,
  };

  const clientId = input.patientId || "c-1";
  const clientName = input.patientName || "Assigned Client";

  const clinicalEscalation: AgencyClinicalEscalation | undefined =
    isHighSeverity || input.notifySupervisor
      ? {
          id: `esc-${numericSuffix}`,
          clientName,
          clientId,
          reporter: input.caregiverName || reporterName,
          reporterRole: "Field Staff",
          whatChanged: `${input.type}: ${input.description}`,
          timeReported: nowIso,
          type:
            input.type === "Fall" || input.type === "Hospital Transfer" || input.type === "Emergency"
              ? "reassessment_request"
              : "condition_change",
          linkedIncidentId: incidentId,
        }
      : undefined;

  const shouldTriggerReassessment =
    input.type === "Fall" ||
    input.type === "Hospital Transfer" ||
    input.type === "Medication Error" ||
    input.type === "Emergency";

  const carePlanReview: AgencyCarePlanReview | undefined = shouldTriggerReassessment
    ? {
        id: `cp-inc-${numericSuffix}`,
        clientName,
        clientId,
        dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        triggerReason: "incident",
        status: "approaching",
      }
    : undefined;

  const supervisoryVisit: AgencySupervisoryVisit | undefined = shouldTriggerReassessment
    ? {
        id: `sv-inc-${numericSuffix}`,
        clientName,
        clientId,
        assignedRn: "Rachel Miller, RN",
        dueDate: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
        visitType: "post_incident",
        status: "scheduled",
        location: input.location || "Client Residence",
      }
    : undefined;

  const stateDeadline: StateDeadlineIncident | undefined = regulatoryRequired
    ? {
        id: `dead-${numericSuffix}`,
        title: `${agency}: ${input.type} (${clientName})`,
        severity: severity === "Critical" ? "Critical" : "High",
        deadlineMinutes,
        assignedTo: isRestricted ? "David Chen" : "Rachel Miller, RN",
      }
    : undefined;

  return {
    incident,
    clinicalEscalation,
    carePlanReview,
    supervisoryVisit,
    stateDeadline,
  };
}

/**
 * Computes live survey readiness score based on open restricted incidents,
 * pending state deadlines, verification backlog, and caregiver compliance standing.
 */
export function computeSurveyReadinessScore(
  incidents: Incident[],
  stateDeadlines: StateDeadlineIncident[],
  verificationQueue: VerificationQueueItem[],
  caregivers: AgencyCaregiver[]
): number {
  const openRestricted = incidents.filter(
    (inc) => inc.isRestricted && inc.status !== "Closed"
  ).length;
  const overdueDeadlines = stateDeadlines.filter((d) => d.deadlineMinutes < 0).length;
  const pendingVerifications = verificationQueue.length;
  const nonCompliantCaregivers = caregivers.filter((c) => !c.complianceValid).length;

  const penalty =
    openRestricted * 1.5 +
    overdueDeadlines * 3 +
    pendingVerifications * 0.4 +
    nonCompliantCaregivers * 2;

  return Math.max(72, Math.min(100, Number((99.2 - penalty).toFixed(1))));
}
