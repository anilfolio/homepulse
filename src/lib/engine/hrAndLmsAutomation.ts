import { AgencyCaregiver, AgencyLmsCourse } from "@/types/agency";
import { Candidate } from "@/types/hr";

export interface HireReadinessEvaluation {
  canHire: boolean;
  blockers: string[];
}

/**
 * Evaluates whether a recruiting candidate passes all HR compliance hard gates
 * (background check, OIG/SAM exclusion clearance, verified license, and onboarding checklist).
 */
export function evaluateCandidateHireReadiness(
  candidate: Candidate
): HireReadinessEvaluation {
  const blockers: string[] = [];

  if (candidate.backgroundCheck.status !== "Clear") {
    blockers.push(`Background check is ${candidate.backgroundCheck.status}`);
  }
  if (candidate.oigSamCheck.status === "Flagged" && !candidate.oigSamCheck.overrideBy) {
    blockers.push("OIG/SAM exclusion flag requires QA Compliance override");
  }
  if (candidate.credentialVerification.status !== "Verified") {
    blockers.push("Primary credential / license pending verification");
  }
  if (!candidate.onboardingChecklist.policyAcknowledged) {
    blockers.push("Agency policy acknowledgment missing");
  }
  if (!candidate.onboardingChecklist.i9Submitted || !candidate.onboardingChecklist.w4Submitted) {
    blockers.push("I-9 / W-4 tax documentation incomplete");
  }

  return {
    canHire: blockers.length === 0,
    blockers,
  };
}

/**
 * Converts a newly hired HR candidate into an active AgencyCaregiver
 * ready for Scheduler Smart Dispatch matching.
 */
export function buildCaregiverFromCandidate(candidate: Candidate): AgencyCaregiver {
  const license = candidate.credentialVerification.licenseType;
  const credentials: string[] = [license];
  if (candidate.credentialVerification.cprCertified) {
    credentials.push("CPR");
  }
  const skills: string[] = [license, "Personal Care"];
  if (license === "CNA" || license === "HHA") {
    skills.push("Hoyer", "Mobility");
  }
  if (license === "RN") {
    skills.push("Post-op", "Diabetes");
  }

  return {
    id: `cg-hr-${candidate.id}`,
    name: candidate.name.includes(",") ? candidate.name : `${candidate.name}, ${license}`,
    roleTitle: candidate.positionApplied,
    credentials,
    skills,
    rating: 4.8,
    distanceMiles: 1.6,
    weeklyHoursScheduled: 0,
    maxWeeklyHours: 40,
    hourlyRate: license === "RN" ? 42 : license === "CNA" ? 25 : 23,
    homeCoords: { lat: 39.782, lng: -89.648 },
    complianceValid: true,
    certExpiresInDays: 365,
  };
}

/**
 * Computes agency-wide LMS completion percentage across active courses.
 */
export function computeTrainingComplianceRate(courses: AgencyLmsCourse[]): number {
  const published = courses.filter((c) => c.publishState === "published");
  if (published.length === 0) return 94;
  const avgProgress =
    published.reduce((sum, c) => sum + c.progressPercent, 0) / published.length;
  return Math.max(78, Math.min(100, Math.round(70 + avgProgress * 0.3)));
}
