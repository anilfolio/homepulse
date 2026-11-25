export type VisitStatus = "Not Started" | "In Progress" | "Incomplete" | "Completed";

export type EVVMethod = "GPS" | "IVR" | "Fixed" | "Manual";

export type EVVComplianceStatus = "Verified" | "Exception" | "Resolved";

export type ExceptionCategory =
  | "None"
  | "Location Mismatch"
  | "Missed In"
  | "Missed Out"
  | "Missed Call"
  | "Time Variance"
  | "Verification Missing";

export type ExceptionSeverity = "critical" | "warning" | "info" | "none";

export type EvidenceRequirement = "Required" | "Optional" | "Not Applicable";

export type VerificationCaptureStatus =
  | "Captured"
  | "Pending"
  | "Failed"
  | "Not Required";

export type AggregatorStatus =
  | "Not Submitted"
  | "Pending"
  | "Submitted"
  | "Accepted"
  | "Rejected";

export type BillingStatus = "Hold" | "Pending Review" | "Cleared" | "Billed";

export type PayrollStatus = "Hold" | "Pending Review" | "Approved" | "Processed";

export interface RuleProfile {
  id: string;
  state: string;
  payer: string;
  aggregator: "HHAeXchange" | "Sandata" | "Netsmart" | "CareBridge" | "AuthentiCare";
  timeToleranceMinutes: number;
  geofenceRadiusFt: number;
  gpsRequirement: EvidenceRequirement;
  signatureRequirement: EvidenceRequirement;
  voiceRequirement: EvidenceRequirement;
}

export interface ServiceLocationPhone {
  id: string;
  label: string;
  number: string; // Stored for click-to-reveal; always masked by default in UI
  type: "Landline" | "Mobile" | "Authorized Family";
  isVerifiedForIVR: boolean;
}

export interface ServiceLocation {
  addressLine1: string;
  cityStateZip: string;
  lat: number;
  lng: number;
  locationType: "Patient Home" | "Family Residence" | "Community";
  associatedPhones: ServiceLocationPhone[];
}

export interface OriginalEVVEvent {
  clockIn: string | null;
  clockOut: string | null;
  method: EVVMethod;
  gpsDistanceFt?: number;
  capturedAt?: string;
  deviceOrPhoneRef?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string; // UTC ISO or formatted UTC timestamp
  actorName: string;
  actorRole: string;
  actionType:
    | "EVV_CAPTURE"
    | "EXCEPTION_DETECTED"
    | "EXCEPTION_ACKNOWLEDGED"
    | "RESOLUTION_SAVED"
    | "MANUAL_CONFIRMATION"
    | "LOCATION_UPDATED"
    | "PHONE_ASSOCIATED"
    | "VOICE_VERIFIED"
    | "PHI_UNMASKED"
    | "AGGREGATOR_SUBMITTED"
    | "BILLING_UPDATED"
    | "PAYROLL_UPDATED";
  summary: string;
  reasonCode?: string;
  resolutionCode?: string;
  previousValue?: string;
  newValue?: string;
}

export interface ResolutionRecord {
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  reasonCode?: string;
  reasonLabel?: string;
  resolutionCode?: string;
  resolutionLabel?: string;
  notes?: string;
  attestationConfirmed?: boolean;
  attestationRef?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface EVVVisit {
  id: string; // e.g., EVV-2026-003
  visitDate: string; // YYYY-MM-DD
  visitDateLabel: string; // e.g., "Today", "Yesterday"
  caregiver: {
    id: string;
    name: string;
    role: string;
  };
  client: {
    id: string;
    name: string;
    medicaidIdMasked: string;
  };
  service: {
    code: string;
    name: string; // Personal Care, Respite, etc.
  };
  scheduledWindowPassed: boolean;
  scheduledTime: {
    start: string;
    end: string;
  };
  actualTime: {
    start: string | null;
    end: string | null;
  };
  originalEvv: OriginalEVVEvent;
  visitStatus: VisitStatus;
  evvMethod: EVVMethod;
  evvCompliance: EVVComplianceStatus;
  exceptionCategory: ExceptionCategory;
  exceptionSeverity: ExceptionSeverity;
  exceptionDetail: string;
  timeDeltaMinutes: number;
  gpsDistanceFt?: number;
  serviceLocation: ServiceLocation;
  actualCoordinates?: {
    lat: number;
    lng: number;
  };
  verification: {
    signatureStatus: VerificationCaptureStatus;
    signatureCapturedAt?: string;
    voiceStatus: VerificationCaptureStatus;
    voiceDurationSec?: number;
    voiceMatchScore?: number;
    ivrCallerIdMatched?: boolean;
  };
  processing: {
    aggregator: AggregatorStatus;
    aggregatorRef?: string;
    aggregatorRejectReason?: string;
    billing: BillingStatus;
    payroll: PayrollStatus;
  };
  estimatedBillingAmount: number;
  ruleProfile: RuleProfile;
  resolution?: ResolutionRecord;
  auditHistory: AuditEvent[];
}

export interface ReasonCodeOption {
  code: string;
  label: string;
  applicableTo: ExceptionCategory[];
}

export interface ResolutionCodeOption {
  code: string;
  label: string;
  description: string;
  applicableTo: ExceptionCategory[];
}

export interface TopOffender {
  id: string;
  caregiverCode: string;
  name: string;
  exceptionCount: number;
  mostCommonType: ExceptionCategory;
  trend: "improving" | "worsening" | "stable";
}
