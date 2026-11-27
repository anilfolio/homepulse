import { Referral, ReferralStage } from "@/components/referrals/types";
import { ReferralStatus as PartnerReferralStatus } from "@/lib/partner/types";
import { AgencyReferral } from "@/types/agency";

export interface RnCandidateMatch {
  rnName: string;
  distanceMiles: number;
  estMinutes: number;
  activeCaseload: number;
  badge: string;
}

const RN_ROSTER: RnCandidateMatch[] = [
  {
    rnName: "Rachel Miller, RN",
    distanceMiles: 2.1,
    estMinutes: 7,
    activeCaseload: 14,
    badge: "Closest Match",
  },
  {
    rnName: "Sarah Jenkins, RN",
    distanceMiles: 3.4,
    estMinutes: 11,
    activeCaseload: 12,
    badge: "Low Caseload",
  },
  {
    rnName: "Emily Chen, RN",
    distanceMiles: 4.8,
    estMinutes: 15,
    activeCaseload: 16,
    badge: "Available Today",
  },
];

/**
 * Maps internal Intake pipeline stages into external Partner-facing referral statuses.
 */
export function mapStageToPartnerStatus(
  stage: ReferralStage,
  currentPartnerStatus?: PartnerReferralStatus
): PartnerReferralStatus {
  if (
    currentPartnerStatus === "Not a Fit" ||
    currentPartnerStatus === "Referred Elsewhere" ||
    currentPartnerStatus === "Additional Info Requested"
  ) {
    if (stage === "Referral Received" || stage === "Contact Attempted") {
      return currentPartnerStatus;
    }
  }
  switch (stage) {
    case "Referral Received":
      return "Received";
    case "Contact Attempted":
    case "Clinical Review":
    case "Insurance Verification":
    case "Eligibility Confirmed":
      return "Under Review";
    case "Initial Assessment Scheduled":
    case "Assigned to Care Team":
    case "Consent & Agreements":
      return "Assessment Scheduled";
    case "Admitted":
    case "Converted":
      return "Accepted as Client";
    default:
      return "Under Review";
  }
}

/**
 * Computes an urgency priority score (0-100) for referral triage queues.
 */
export function scoreReferralUrgency(referral: Pick<Referral, "urgency" | "source" | "dischargeDeadline" | "readmissionRisk" | "stage">): number {
  let score = 35;
  if (referral.urgency === "High") score += 35;
  else if (referral.urgency === "Medium") score += 15;

  if (referral.source === "Hospital Discharge" || referral.source === "Hospital") {
    score += 15;
  }
  if (referral.readmissionRisk === "High") {
    score += 10;
  }
  if (referral.dischargeDeadline) {
    const hrsLeft = (new Date(referral.dischargeDeadline).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hrsLeft <= 24) score += 15;
    else if (hrsLeft <= 48) score += 8;
  }
  if (referral.stage === "Admitted" || referral.stage === "Converted") {
    score = Math.min(score, 30);
  }
  return Math.max(10, Math.min(99, score));
}

export interface EligibilityCheckResult {
  verified: boolean;
  payer: string;
  authorizedHours: number;
  summary: string;
}

/**
 * Simulates deterministic 270/271 clearinghouse payer eligibility & service-zone verification.
 */
export function runEligibilityCheck(referral: AgencyReferral): EligibilityCheckResult {
  const payer = referral.insurance?.payer || "Medicare Part A & B";
  const inZone = referral.serviceZoneStatus !== "out-of-zone";
  const authorizedHours = referral.urgency === "High" ? 28 : 20;

  if (!inZone) {
    return {
      verified: false,
      payer,
      authorizedHours: 0,
      summary: `Service zone out-of-area (${referral.serviceZoneName ?? "Unassigned"}); requires network referral.`,
    };
  }

  return {
    verified: true,
    payer,
    authorizedHours,
    summary: `271 Clearinghouse Verified (${payer}) • ${authorizedHours} hrs/wk authorized in ${referral.serviceZoneName ?? "Primary Zone"}.`,
  };
}

/**
 * Recommends top RN assessors for an intake referral.
 */
export function recommendRnForAssessment(referral: Pick<Referral, "urgency">): RnCandidateMatch[] {
  const sorted = [...RN_ROSTER].sort((a, b) => {
    if (referral.urgency === "High") {
      return a.distanceMiles - b.distanceMiles;
    }
    return a.activeCaseload - b.activeCaseload;
  });
  return sorted;
}
