import {
  AgencyClaim,
  AgencyShiftVisit,
  AgencyStoreState,
  BriefingActionItem,
} from "@/types/agency";

export interface VoiceNoteExtraction {
  presetLabel: string;
  formattedNote: string;
  vitals: {
    bp: string;
    hr: string;
    temp: string;
  };
  taskKeywordsToComplete: string[];
}

export const VOICE_NOTE_PRESETS: Record<string, VoiceNoteExtraction> = {
  routine_stable: {
    presetLabel: "Routine Morning Care (Stable)",
    formattedNote:
      "[AI Voice-to-Note] Assisted client with morning hygiene, meal prep, and ambulation safely. Client ate 90% of breakfast, tolerated fluids well, and reported zero pain. Vitals stable.",
    vitals: { bp: "122/78 mmHg", hr: "72 bpm", temp: "98.4 °F" },
    taskKeywordsToComplete: ["hygiene", "meal", "ambulation", "medication", "breakfast", "walk"],
  },
  mild_fatigue: {
    presetLabel: "Mild Fatigue & Mobility Assist",
    formattedNote:
      "[AI Voice-to-Note] Client reported mild morning fatigue during transfer; used gait belt for safe ambulation. Completed hydration reminder and light housekeeping. Encouraged rest.",
    vitals: { bp: "130/82 mmHg", hr: "78 bpm", temp: "98.6 °F" },
    taskKeywordsToComplete: ["ambulation", "transfer", "meal", "medication", "housekeeping", "hydration"],
  },
};

export function parseVoiceNoteToCharting(
  presetKey: keyof typeof VOICE_NOTE_PRESETS
): VoiceNoteExtraction | undefined {
  return VOICE_NOTE_PRESETS[presetKey];
}

/**
 * Generates dynamic, live-count Executive Briefing items with 1-click automated actions.
 */
export function buildExecutiveBriefing(state: AgencyStoreState): BriefingActionItem[] {
  const items: BriefingActionItem[] = [];

  const unfilledCount = state.visits.filter(
    (v) => v.status === "Unfilled" || v.status === "Call-Off"
  ).length;
  if (unfilledCount > 0) {
    items.push({
      id: "brief-dispatch",
      category: "Dispatch",
      severity: "critical",
      title: `${unfilledCount} Unfilled / Call-Off Shift(s) Need Coverage`,
      summary:
        "Smart Dispatch scored eligible nearby caregivers without overtime risk. Execute 1-click auto-fill to assign top matches.",
      actionLabel: "Auto-Fill All Open Shifts",
      actionType: "AUTO_FILL_ALL",
      route: "/scheduler",
    });
  }

  const evvHoldCount = state.visits.filter((v) => v.evvCompliance === "Exception").length;
  const blockedDollars = state.claims
    .filter((c) => c.scrubStatus === "Blocked")
    .reduce((sum, c) => sum + c.amount, 0);
  if (evvHoldCount > 0) {
    items.push({
      id: "brief-evv",
      category: "EVV",
      severity: "warning",
      title: `${evvHoldCount} EVV Exception(s) Holding Revenue ($${blockedDollars.toLocaleString()})`,
      summary:
        "Geofence or time-variance exceptions require supervisor attestation before claims can enter the 837 batch.",
      actionLabel: "Auto-Resolve Eligible Exceptions",
      actionType: "RESOLVE_MINOR_EVV",
      route: "/evv-monitoring",
    });
  }

  const draftClaims = state.claims.filter(
    (c) => c.status === "Draft" && c.scrubStatus === "Passed"
  );
  if (draftClaims.length > 0) {
    const draftTotal = draftClaims.reduce((sum, c) => sum + c.amount, 0);
    items.push({
      id: "brief-billing",
      category: "Billing",
      severity: "info",
      title: `${draftClaims.length} Scrubbed Claim(s) Ready ($${draftTotal.toLocaleString()})`,
      summary:
        "Visits passed Pre-Billing Scrub Gate with verified EVV and active payer authorizations.",
      actionLabel: "Submit Cleared Claims Batch",
      actionType: "RELEASE_CLEARED_CLAIMS",
      route: "/billing/workspace",
    });
  }

  const expiringAuthClients = state.clients.filter(
    (c) => c.authExpiresInDays <= 7 || c.authorizedUnitsRemaining <= 12
  );
  if (expiringAuthClients.length > 0) {
    items.push({
      id: "brief-auth",
      category: "Authorization",
      severity: "warning",
      title: `${expiringAuthClients.length} Client Authorization(s) Low / Expiring`,
      summary: `${expiringAuthClients.map((c) => c.name).join(", ")} approaching unit depletion.`,
      actionLabel: "Queue Renewal Alerts",
      actionType: "SEND_AUTH_ALERTS",
      route: "/billing/authorizations",
    });
  }

  const pendingReferrals = (state.referrals ?? []).filter(
    (r) => r.stage === "Referral Received" || r.stage === "Insurance Verification"
  );
  if (pendingReferrals.length > 0) {
    items.push({
      id: "brief-intake",
      category: "Intake",
      severity: pendingReferrals.some((r) => r.urgency === "High") ? "critical" : "info",
      title: `${pendingReferrals.length} Inbound Referral(s) Awaiting Triage`,
      summary: "Run automated 270/271 eligibility verification & fast-track clinical review.",
      actionLabel: "Auto-Triage Referrals",
      actionType: "AUTO_TRIAGE_REFERRALS",
      route: "/intake/referrals",
    });
  }

  const openDeadlines = (state.stateDeadlines ?? []).length;
  if (openDeadlines > 0) {
    items.push({
      id: "brief-compliance",
      category: "Compliance",
      severity: "warning",
      title: `${openDeadlines} State Regulatory Filing(s) Pending`,
      summary: "QA compliance countdown active for reportable clinical/HIPAA incidents.",
      actionLabel: "Open QA Compliance",
      actionType: "SUBMIT_DUE_STATE_REPORTS",
      route: "/compliance",
    });
  }

  const readyToHireCandidates = (state.candidates ?? []).filter(
    (c) =>
      c.stage !== "Hired" &&
      c.backgroundCheck.status === "Clear" &&
      c.oigSamCheck.status !== "Flagged" &&
      c.credentialVerification.status === "Verified"
  );
  if (readyToHireCandidates.length > 0) {
    items.push({
      id: "brief-hr",
      category: "HR",
      severity: "info",
      title: `${readyToHireCandidates.length} Cleared Candidate(s) Ready to Onboard`,
      summary: `${readyToHireCandidates.map((c) => c.name).join(", ")} cleared background & OIG checks. Promote to active Dispatch roster.`,
      actionLabel: "Auto-Onboard & Activate",
      actionType: "HIRE_ELIGIBLE_CANDIDATES",
      route: "/hr/dashboard",
    });
  }

  const overdueSup = (state.supervisoryVisits ?? []).filter(
    (sv) => sv.status === "overdue"
  );
  if (overdueSup.length > 0) {
    items.push({
      id: "brief-field",
      category: "Field Ops",
      severity: "warning",
      title: `${overdueSup.length} Overdue Field Supervisory Visit(s)`,
      summary: "Quarterly/periodic supervisory evaluations overdue; schedule Field Supervisor immediately.",
      actionLabel: "Dispatch Field Visit",
      actionType: "ASSIGN_OVERDUE_SUPERVISORY",
      route: "/field-supervisor",
    });
  }

  return items;
}

/**
 * Generates an evidence-backed Denial Appeal Letter referencing linked EVV audit data.
 */
export function draftClaimAppealLetter(
  claim: AgencyClaim,
  linkedVisit?: AgencyShiftVisit
): string {
  const evvSummary = linkedVisit
    ? `EVV Record ${linkedVisit.evvId} (${linkedVisit.evvMethod}, Clock-In: ${linkedVisit.clockInTime ?? "Verified"}, Clock-Out: ${linkedVisit.clockOutTime ?? "Verified"}, GPS Distance: ${linkedVisit.gpsDistanceMeters}m)`
    : "Verified Agency Timesheet & Clinical Care Plan Documentation";

  return [
    `RE: FORMAL CLAIM APPEAL — ${claim.id} | Patient: ${claim.patientName}`,
    `Payer: ${claim.payer} | Service Code: ${claim.serviceCode} | Authorization: ${claim.authNumber}`,
    `Billed Amount: $${claim.amount.toLocaleString("en-US")}`,
    ``,
    `Dear Claims Review Department,`,
    `HomePulse Home Health Agency respectfully appeals the denial of claim ${claim.id} (Denial Reason: ${claim.denialReason ?? "Administrative / Documentation Review"}).`,
    ``,
    `Supporting Verification Evidence:`,
    `- ${evvSummary}`,
    `- Care tasks & clinical notes attested at point of care with immutable audit trail.`,
    `- Active prior authorization ${claim.authNumber} confirmed for service period.`,
    ``,
    `Please reprocess claim ${claim.id} for full reimbursement. Contact Billing Compliance at billing@homepulse.com for encrypted documentation packet.`,
  ].join("\n");
}
