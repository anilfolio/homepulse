import {
  AuditEvent,
  EVVVisit,
  ExceptionCategory,
  RuleProfile,
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
