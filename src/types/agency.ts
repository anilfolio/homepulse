import { AuditEvent, EVVComplianceStatus, EVVMethod, ExceptionCategory, VisitStatus } from "@/app/evv-monitoring/types";
import { Referral } from "@/components/referrals/types";
import {
  PartnerOrganization,
  PartnerTeamMember,
  ReferralStatus as PartnerReferralStatus,
} from "@/lib/partner/types";
import { StateDeadlineIncident } from "@/lib/mock-data/compliance-dashboard";
import { VerificationQueueItem } from "@/types/compliance";
import { ActionQueueItem, Candidate, CredentialWatchItem } from "@/types/hr";
import { Incident } from "@/types/incidents";

export interface GeoCoords {
  lat: number;
  lng: number;
}

export interface AgencyCaregiver {
  id: string;
  name: string;
  roleTitle: string;
  avatarUrl?: string;
  credentials: string[];
  skills: string[];
  rating: number;
  distanceMiles: number;
  weeklyHoursScheduled: number;
  maxWeeklyHours: number;
  hourlyRate: number;
  homeCoords: GeoCoords;
  complianceValid: boolean;
  certExpiresInDays: number;
}

export interface AgencyClient {
  id: string;
  name: string;
  mrn: string;
  address: string;
  cityStateZip: string;
  phone: string;
  coords: GeoCoords;
  medicaidIdMasked: string;
  payer: "Medicare" | "Medicaid" | "Private Pay" | "Commercial";
  serviceCode: string;
  serviceName: string;
  hourlyBillRate: number;
  authorizedUnitsRemaining: number;
  authorizedUnitsTotal: number;
  authNumber: string;
  authExpiresInDays: number;
  fallRiskLevel: "Low" | "Medium" | "High";
  carePlanVersion?: string;
  carePlanGoals?: string[];
  carePlanUpdatedAt?: string;
}

export type AgencyAuditAction =
  | "VIEW_PHI"
  | "CREATE"
  | "UPDATE"
  | "EXPORT"
  | "EVV_OFFLINE_SYNC"
  | "AUTH_LOCKOUT"
  | "CARE_PLAN_SYNC"
  | "PAYROLL_EXPORT"
  | "MESSAGE_SENT";

export interface AgencyAuditLogEntry {
  id: string;
  timestampUtc: string;
  actorName: string;
  actorRole: string;
  action: AgencyAuditAction;
  resourceType:
    | "Client"
    | "Visit"
    | "Claim"
    | "CarePlan"
    | "Authorization"
    | "Payroll"
    | "Invoice"
    | "Compliance"
    | "Session"
    | "Communication";
  resourceId: string;
  /** Strictly non-PHI anonymized event summary per RULES.md 3.1 */
  summary: string;
  status: "Success" | "Flagged";
}

export interface OfflineEvvRecord {
  id: string;
  visitId: string;
  evvId: string;
  actionType: "CLOCK_IN" | "CLOCK_OUT";
  method: "gps" | "ivr" | "fvv";
  gpsDistanceMeters: number;
  capturedAtIso: string;
  hmacSignature: string;
  notes?: string;
  signatureCaptured?: boolean;
  mileage?: number;
  synced: boolean;
}

export interface AgencyPrivatePayInvoice {
  id: string;
  clientId: string;
  clientName: string;
  visitIds: string[];
  visitCount: number;
  totalHours: number;
  amount: number;
  status: "Draft" | "Sent" | "Paid";
  scheduledDateLabel: string;
  createdAtIso: string;
}

export type AgencyMessageChannel = "in-app" | "sms" | "email";
export type AgencyConversationCategory =
  | "Clients"
  | "Family Members"
  | "Staff & Caregivers"
  | "Care Team Channels"
  | "Announcements";

export interface AgencyMessageItem {
  id: string;
  conversationId: string;
  senderName: string;
  senderRole: string;
  isCurrentUser?: boolean;
  content: string;
  timestampLabel: string;
  channelMode: AgencyMessageChannel;
  isInternalNote: boolean;
  deliveryStatus: "sent" | "delivered" | "read";
}

export interface AgencyConversation {
  id: string;
  categoryId: AgencyConversationCategory;
  title: string;
  participantRole: string;
  participantStatus: "online" | "away" | "offline";
  phoneMasked: string;
  preferredLanguage?: string;
  linkedRecord?: {
    id: string;
    type: "Visit" | "Incident" | "Care Plan" | "Client" | "Claim";
    label: string;
    route: string;
  };
  unreadCount: number;
  isUrgent: boolean;
  isArchived?: boolean;
  messages: AgencyMessageItem[];
}

export interface AgencyVisitTask {
  id: string;
  category: "Personal Care" | "Meals" | "Household" | "Health Monitoring" | "Mobility" | "Companionship";
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  skipped?: boolean;
  skipReason?: string;
}

export interface AgencyMedicationItem {
  id: string;
  medicationName: string;
  dosage: string;
  scheduleTime: string;
  instructions: string;
  status: "pending" | "reminded" | "took" | "declined";
  loggedAt?: string;
  note?: string;
}

export type AgencyShiftStatus =
  | "Unfilled"
  | "Call-Off"
  | "Offer Sent"
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Incomplete";

export interface AgencyBackfillOffer {
  caregiverId: string;
  caregiverName: string;
  matchScore: number;
  distanceMiles: number;
  overtimeRisk: boolean;
  offerStatus: "Pending" | "Accepted" | "Declined";
}

export interface AgencyShiftVisit {
  id: string;
  evvId: string;
  shiftNumber: string;
  clientId: string;
  caregiverId: string | null;
  region: string;
  visitDate: string;
  visitDateLabel: string;
  scheduledStart: string; // e.g. "08:30 AM"
  scheduledEnd: string;   // e.g. "12:30 PM"
  scheduledHours: number;
  requiredSkills: string[];
  status: AgencyShiftStatus;
  callOffReason?: string;
  calledOffByName?: string;
  calledOffAt?: string;
  backfillOffers?: AgencyBackfillOffer[];
  // EVV & Point of Care
  clockInTime: string | null;
  clockOutTime: string | null;
  evvMethod: EVVMethod;
  evvCompliance: EVVComplianceStatus;
  exceptionCategory: ExceptionCategory;
  exceptionDetail: string;
  gpsDistanceMeters: number;
  timeVarianceMinutes: number;
  geofenceThresholdMeters: number;
  syncedOffline?: boolean;
  // Clinical & Care Tasks
  tasks: AgencyVisitTask[];
  medications: AgencyMedicationItem[];
  visitNotes?: string;
  vitals?: {
    bp?: string;
    hr?: string;
    temp?: string;
  };
  signatureCaptured?: boolean;
  unableToSignReason?: string;
  mileageRecorded?: number;
  // Billing Link
  billingStatus: "Hold" | "Pending Review" | "Cleared" | "Billed";
  billingHoldReason?: string;
  claimId?: string;
  auditHistory: AuditEvent[];
}

export type AgencyClaimStatus = "Draft" | "Submitted" | "Pending" | "Paid" | "Denied";

export interface AgencyClaim {
  id: string;
  visitId: string | null;
  patientId: string;
  patientName: string;
  payer: "Medicare" | "Medicaid" | "Private Pay" | "Commercial";
  amount: number;
  status: AgencyClaimStatus;
  scrubStatus: "Passed" | "Blocked";
  scrubIssues: string[];
  serviceCode: string;
  authNumber: string;
  date: string;
  age: string;
  denialReason?: string;
  denialStatus?: "Appealing" | "Resubmitted" | "Written off" | "Needs Action";
  appealDraft?: string;
}

export interface AgencyNotification {
  id: string;
  type: "alert" | "warning" | "info" | "success";
  title: string;
  description: string;
  timeLabel: string;
  route: string;
  read: boolean;
}

export interface RankedCaregiverCandidate {
  caregiver: AgencyCaregiver;
  matchScore: number;
  overtimeRisk: boolean;
  matchingSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

export interface AgencyReferral extends Referral {
  partnerStatus: PartnerReferralStatus;
  partnerOrgName?: string;
  serviceRequested?: string;
  admittedClientId?: string;
  triageScore?: number;
}

export interface AgencyClinicalEscalation {
  id: string;
  clientName: string;
  clientId: string;
  reporter: string;
  reporterRole: string;
  whatChanged: string;
  timeReported: string;
  type: "condition_change" | "reassessment_request" | "urgent_question";
  linkedIncidentId?: string;
}

export interface AgencyCarePlanReview {
  id: string;
  clientName: string;
  clientId: string;
  dueDate: string;
  triggerReason:
    | "periodic_60"
    | "post_hospitalization"
    | "condition_change"
    | "incident"
    | "family_request"
    | "initial_admission";
  status: "approaching" | "overdue" | "completed";
  signedBy?: string;
  signedAt?: string;
  linkedReferralId?: string;
}

export interface AgencySupervisoryVisit {
  id: string;
  clientName: string;
  clientId: string;
  assignedRn: string;
  dueDate: string;
  visitType: "initial_30" | "periodic_60" | "annual_unannounced" | "post_incident";
  status: "scheduled" | "overdue" | "pending_scheduling" | "completed";
  location: string;
}

export interface AgencyLmsCourse {
  id: string;
  title: string;
  category: "Required" | "Continuing Ed" | "Specialty" | "Compliance" | "Clinical Skills" | "HR";
  dueDate?: string;
  durationMinutes: number;
  progressPercent: number;
  status: "Not Started" | "In Progress" | "Completed" | "Expiring";
  publishState: "published" | "draft" | "archived";
  version: string;
  enrollments: number;
  complianceLinked: boolean;
  ceUnits: number;
  description: string;
  thumbnail: string;
}

export interface AgencyFieldFinding {
  id: string;
  clientName: string;
  clientId?: string;
  caregiverName?: string;
  description: string;
  severity: "minor" | "moderate" | "urgent";
  dateIdentified: string;
  status: "Open" | "Follow-Up Logged" | "Escalated";
}

export interface BriefingActionItem {
  id: string;
  category:
    | "Dispatch"
    | "EVV"
    | "Billing"
    | "Authorization"
    | "Intake"
    | "Clinical"
    | "Compliance"
    | "HR"
    | "Field Ops";
  severity: "critical" | "warning" | "info";
  title: string;
  summary: string;
  actionLabel: string;
  actionType:
    | "AUTO_FILL_ALL"
    | "RELEASE_CLEARED_CLAIMS"
    | "SEND_AUTH_ALERTS"
    | "RESOLVE_MINOR_EVV"
    | "AUTO_TRIAGE_REFERRALS"
    | "SUBMIT_DUE_STATE_REPORTS"
    | "HIRE_ELIGIBLE_CANDIDATES"
    | "ASSIGN_OVERDUE_SUPERVISORY";
  route: string;
}

export interface AgencyStoreState {
  caregivers: AgencyCaregiver[];
  clients: AgencyClient[];
  visits: AgencyShiftVisit[];
  claims: AgencyClaim[];
  notifications: AgencyNotification[];
  // Wave 2 Unified Operational Queues
  referrals: AgencyReferral[];
  clinicalEscalations: AgencyClinicalEscalation[];
  carePlanReviews: AgencyCarePlanReview[];
  supervisoryVisits: AgencySupervisoryVisit[];
  incidents: Incident[];
  stateDeadlines: StateDeadlineIncident[];
  verificationQueue: VerificationQueueItem[];
  // Wave 3 HR, LMS Training & Field Operations
  candidates: Candidate[];
  hrActionQueue: ActionQueueItem[];
  credentialWatchlist: CredentialWatchItem[];
  lmsCourses: AgencyLmsCourse[];
  fieldFindings: AgencyFieldFinding[];
  // Wave 4 Unified Audit, Offline EVV, Private-Pay & Communications
  auditLogs: AgencyAuditLogEntry[];
  offlineEvvQueue: OfflineEvvRecord[];
  invoices: AgencyPrivatePayInvoice[];
  conversations: AgencyConversation[];
  // Role 1: Partner Organization & Team
  partnerOrg: PartnerOrganization;
  partnerTeamMembers: PartnerTeamMember[];
  lastUpdatedAt: string;
}

export function mapAgencyStatusToEvvStatus(status: AgencyShiftStatus): VisitStatus {
  if (status === "In Progress") return "In Progress";
  if (status === "Completed") return "Completed";
  if (status === "Incomplete") return "Incomplete";
  return "Not Started";
}
