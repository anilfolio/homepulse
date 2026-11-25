import {
  AuditEvent,
  EVVVisit,
  ExceptionCategory,
  RuleProfile,
  ServiceLocation,
  VisitStatus,
} from "./types";

let auditSeq = 5000;

/**
 * Generates a unique, monotonic audit/entity ID and UTC event object outside component render.
 */
export function nextId(prefix = "aud"): string {
  auditSeq += 1;
  return `${prefix}-${auditSeq}`;
}

export function createAuditEvent(
  event: Omit<AuditEvent, "id" | "timestamp">
): AuditEvent {
  return {
    ...event,
    id: nextId("aud"),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Derives lifecycle status strictly from actual clock-in and clock-out events.
 * Rule: A visit CANNOT be Completed if it has no actual clock-in or clock-out.
 */
export function deriveVisitStatus(
  clockIn: string | null,
  clockOut: string | null,
  scheduledWindowPassed: boolean
): VisitStatus {
  if (!clockIn && !clockOut) {
    return scheduledWindowPassed ? "Incomplete" : "Not Started";
  }
  if (clockIn && !clockOut) {
    return scheduledWindowPassed ? "Incomplete" : "In Progress";
  }
  if (!clockIn && clockOut) {
    return "Incomplete";
  }
  return "Completed";
}

/**
 * Parses a "HH:MM AM/PM" string into minutes since midnight for variance checks.
 */
export function parseTimeToMinutes(timeStr: string | null): number | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Computes maximum absolute variance in minutes between scheduled and actual start/end.
 */
export function computeMaxTimeVarianceMinutes(
  scheduledStart: string,
  scheduledEnd: string,
  actualStart: string | null,
  actualEnd: string | null
): number {
  const sStart = parseTimeToMinutes(scheduledStart);
  const sEnd = parseTimeToMinutes(scheduledEnd);
  const aStart = parseTimeToMinutes(actualStart);
  const aEnd = parseTimeToMinutes(actualEnd);

  let maxDelta = 0;
  if (sStart !== null && aStart !== null) {
    maxDelta = Math.max(maxDelta, Math.abs(aStart - sStart));
  }
  if (sEnd !== null && aEnd !== null) {
    maxDelta = Math.max(maxDelta, Math.abs(aEnd - sEnd));
  }
  return maxDelta;
}

/**
 * Evaluates whether time variance exceeds the configured agency/payer/state tolerance.
 * Rule: 1-2 minute variance should not automatically create an exception.
 */
export function isTimeVarianceWithinTolerance(
  varianceMinutes: number,
  ruleProfile: RuleProfile
): boolean {
  return varianceMinutes <= ruleProfile.timeToleranceMinutes;
}

/**
 * Masks phone numbers for HIPAA Rule 3.3 UI compliance.
 */
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "•••-••••";
  const last4 = digits.slice(-4);
  return `(•••) •••-${last4}`;
}

/**
 * Checks if a visit is eligible for bulk confirmation.
 */
export function isVisitEligibleForBulkConfirm(visit: EVVVisit): boolean {
  return (
    visit.evvCompliance === "Exception" ||
    visit.exceptionCategory === "Missed Call" ||
    visit.exceptionCategory === "Missed In" ||
    visit.exceptionCategory === "Missed Out" ||
    visit.exceptionCategory === "Time Variance"
  );
}

export function getRecommendedWorkflowTitle(category: ExceptionCategory): string {
  switch (category) {
    case "Missed In":
      return "Missed Clock-In Recovery Workflow";
    case "Missed Out":
      return "Missed Clock-Out Recovery Workflow";
    case "Missed Call":
      return "Missed Call / Manual Timesheet Confirmation";
    case "Location Mismatch":
      return "Location Verification & Service Address Review";
    case "Time Variance":
      return "Time Tolerance & Schedule Variance Review";
    case "Verification Missing":
      return "Patient Verification (Signature / IVR Voice)";
    default:
      return "EVV Visit Audit & Verification";
  }
}

/**
 * Prepends a newly stamped audit event to a visit's immutable audit history.
 */
export function appendVisitAudit(
  visit: EVVVisit,
  event: Omit<AuditEvent, "id" | "timestamp">
): EVVVisit {
  return {
    ...visit,
    auditHistory: [createAuditEvent(event), ...visit.auditHistory],
  };
}

/**
 * Applies a service location correction while preserving the original raw GPS event.
 */
export function applyLocationCorrection(
  visit: EVVVisit,
  addressLine1: string,
  cityStateZip: string,
  locationType: ServiceLocation["locationType"],
  actor: { name: string; role: string } = {
    name: "Admin Coordinator",
    role: "ADMIN",
  }
): EVVVisit {
  const prevAddr = `${visit.serviceLocation.addressLine1}, ${visit.serviceLocation.cityStateZip}`;
  const newAddr = `${addressLine1.trim()}, ${cityStateZip.trim()}`;
  const updated: EVVVisit = {
    ...visit,
    gpsDistanceFt: 18,
    serviceLocation: {
      ...visit.serviceLocation,
      addressLine1: addressLine1.trim(),
      cityStateZip: cityStateZip.trim(),
      locationType,
    },
  };
  return appendVisitAudit(updated, {
    actorName: actor.name,
    actorRole: actor.role,
    actionType: "LOCATION_UPDATED",
    summary: `Updated service location (${locationType}). Original GPS distance (${visit.originalEvv.gpsDistanceFt ?? 0} ft) preserved.`,
    previousValue: prevAddr,
    newValue: newAddr,
  });
}

/**
 * Returns payer authorization details for a visit, deriving a deterministic fallback when omitted.
 */
export function getVisitAuthorization(visit: EVVVisit): NonNullable<EVVVisit["authorization"]> {
  if (visit.authorization) return visit.authorization;
  const suffix = visit.id.slice(-3);
  if (visit.processing.aggregator === "Rejected") {
    return {
      authNumber: `AUTH-${visit.ruleProfile.state}-${suffix}`,
      status: "Expiring Soon",
      remainingUnits: 8,
      totalUnits: 120,
      unitLabel: "15m units",
      expiresAt: "2026-12-05",
    };
  }
  return {
    authNumber: `AUTH-${visit.ruleProfile.state}-${suffix}`,
    status: "Active",
    remainingUnits: 64,
    totalUnits: 120,
    unitLabel: "15m units",
    expiresAt: "2027-02-28",
  };
}

/**
 * Returns documented care task progress for a visit.
 */
export function getVisitTasksSummary(visit: EVVVisit): NonNullable<EVVVisit["tasksSummary"]> {
  if (visit.tasksSummary) return visit.tasksSummary;
  if (visit.visitStatus === "Not Started") {
    return {
      completed: 0,
      total: 4,
      items: ["Bathing / Hygiene", "Meal Preparation", "Medication Reminder", "Light Housekeeping"],
    };
  }
  if (visit.visitStatus === "In Progress") {
    return {
      completed: 2,
      total: 4,
      items: ["Bathing / Hygiene", "Meal Preparation", "Medication Reminder", "Light Housekeeping"],
    };
  }
  return {
    completed: visit.visitStatus === "Completed" ? 4 : 3,
    total: 4,
    items: ["Bathing / Hygiene", "Meal Preparation", "Medication Reminder", "Light Housekeeping"],
  };
}

/**
 * Returns a deterministic mock contact phone for the caregiver when not explicitly provided.
 */
export function getCaregiverPhone(visit: EVVVisit): string {
  if (visit.caregiver.phone) return visit.caregiver.phone;
  const digits = visit.caregiver.id.replace(/\D/g, "").padStart(4, "0").slice(-4);
  return `(614) 555-${digits}`;
}
