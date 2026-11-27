import {
  computeMaxTimeVarianceMinutes,
  createAuditEvent,
  isTimeVarianceWithinTolerance,
} from "@/app/evv-monitoring/evvRules";
import { EVVMethod, ExceptionCategory, RuleProfile } from "@/app/evv-monitoring/types";
import { AgencyClient, AgencyShiftVisit, GeoCoords } from "@/types/agency";

export const DEFAULT_GEOFENCE_THRESHOLD_METERS = 100; // 100m (~328 ft) per RULES.md

const DEFAULT_RULE_PROFILE: RuleProfile = {
  id: "rule-agency-default",
  state: "OH",
  payer: "Medicaid / Agency Standard",
  aggregator: "Sandata",
  timeToleranceMinutes: 7,
  geofenceRadiusFt: 328, // ~100m
  gpsRequirement: "Required",
  signatureRequirement: "Required",
  voiceRequirement: "Optional",
};

/**
 * Computes great-circle distance in meters using the Haversine formula.
 */
export function calculateHaversineMeters(a: GeoCoords, b: GeoCoords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return Math.round(2 * earthRadiusMeters * Math.asin(Math.min(1, Math.sqrt(h))));
}

export interface VisitCompletionEvaluation {
  updatedVisit: AgencyShiftVisit;
  unitsDeducted: number;
  shouldCreateCleanClaim: boolean;
  scrubIssues: string[];
}

/**
 * Evaluates a completed visit against GPS geofence, time variance, signature,
 * and client authorization rules, returning updated EVV & billing state.
 */
export function evaluateVisitCompletion(
  visit: AgencyShiftVisit,
  client: AgencyClient | undefined,
  actorName: string,
  actorRole: string
): VisitCompletionEvaluation {
  const thresholdMeters =
    visit.geofenceThresholdMeters || DEFAULT_GEOFENCE_THRESHOLD_METERS;
  const varianceMinutes = computeMaxTimeVarianceMinutes(
    visit.scheduledStart,
    visit.scheduledEnd,
    visit.clockInTime,
    visit.clockOutTime
  );

  const withinGeofence =
    visit.evvMethod !== "GPS" || visit.gpsDistanceMeters <= thresholdMeters;
  const withinTimeTolerance = isTimeVarianceWithinTolerance(
    varianceMinutes,
    DEFAULT_RULE_PROFILE
  );
  const hasSignatureOrReason = Boolean(
    visit.signatureCaptured || visit.unableToSignReason
  );
  const hasAuthUnits =
    !client || client.authorizedUnitsRemaining >= visit.scheduledHours;

  let exceptionCategory: ExceptionCategory = "None";
  let exceptionDetail = "All EVV and pre-billing checks passed.";
  const scrubIssues: string[] = [];

  if (!withinGeofence) {
    exceptionCategory = "Location Mismatch";
    exceptionDetail = `GPS capture was ${visit.gpsDistanceMeters}m from client residence (limit ${thresholdMeters}m).`;
    scrubIssues.push(exceptionDetail);
  } else if (!withinTimeTolerance) {
    exceptionCategory = "Time Variance";
    exceptionDetail = `Actual clock variance of ${varianceMinutes} mins exceeds ${DEFAULT_RULE_PROFILE.timeToleranceMinutes}-min tolerance.`;
    scrubIssues.push(exceptionDetail);
  } else if (!hasSignatureOrReason) {
    exceptionCategory = "Verification Missing";
    exceptionDetail = "Missing client signature or unable-to-sign attestation.";
    scrubIssues.push(exceptionDetail);
  }

  if (!hasAuthUnits) {
    scrubIssues.push(
      `Insufficient payer authorization units (${client?.authorizedUnitsRemaining ?? 0} remaining).`
    );
  }

  const isCleanEvv = exceptionCategory === "None";
  const isBillingCleared = isCleanEvv && hasAuthUnits;
  const billingHoldReason = scrubIssues.length > 0 ? scrubIssues[0] : undefined;

  const auditEvent = createAuditEvent({
    actorName,
    actorRole,
    actionType: isCleanEvv ? "EVV_CAPTURE" : "EXCEPTION_DETECTED",
    summary: isCleanEvv
      ? `Visit completed & EVV verified (${visit.evvMethod}, ${visit.gpsDistanceMeters}m). Auto-cleared for billing.`
      : `Visit completed with exception (${exceptionCategory}): ${exceptionDetail}`,
    previousValue: "In Progress",
    newValue: isCleanEvv ? "Verified / Cleared" : `Exception (${exceptionCategory})`,
  });

  const updatedVisit: AgencyShiftVisit = {
    ...visit,
    status: "Completed",
    timeVarianceMinutes: varianceMinutes,
    evvCompliance: isCleanEvv ? "Verified" : "Exception",
    exceptionCategory,
    exceptionDetail,
    billingStatus: isBillingCleared ? "Cleared" : "Hold",
    billingHoldReason,
    auditHistory: [auditEvent, ...visit.auditHistory],
  };

  return {
    updatedVisit,
    unitsDeducted: isBillingCleared ? visit.scheduledHours : 0,
    shouldCreateCleanClaim: isBillingCleared,
    scrubIssues,
  };
}

export function normalizeEvvMethod(method: "gps" | "ivr" | "fvv" | "manual"): EVVMethod {
  if (method === "gps") return "GPS";
  if (method === "ivr") return "IVR";
  if (method === "fvv") return "Fixed";
  return "Manual";
}
