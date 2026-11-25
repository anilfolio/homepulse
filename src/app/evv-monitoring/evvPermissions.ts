import { Role } from "@/types/rbac";

export interface EvvRoleCapabilities {
  role: Role;
  roleLabel: string;
  isReadOnly: boolean;
  canViewOverview: boolean;
  canViewAllVisits: boolean;
  canViewExceptions: boolean;
  canViewAggregatorTab: boolean;
  canViewFinancials: boolean;
  canViewMedicaidId: boolean;
  canExportCsv: boolean;
  canBulkConfirm: boolean;
  canBulkSubmitAggregator: boolean;
  canResolveExceptions: boolean;
  canReopenExceptions: boolean;
  canRevealPhones: boolean;
  canSubmitAggregator: boolean;
  canManageBilling: boolean;
  canManagePayroll: boolean;
  canEditPayerRules: boolean;
}

const ROLE_LABELS: Partial<Record<Role, string>> = {
  ADMIN: "Agency Admin",
  FIELD_SUPERVISOR: "Field Supervisor (RN)",
  BILLING_FINANCE_STAFF: "Billing & Finance",
  SCHEDULER: "Scheduler / Dispatch",
  QA_COMPLIANCE_OFFICER: "QA & Compliance (Read-Only)",
  CLINICAL_SUPERVISOR_RN: "Clinical Supervisor (RN)",
  HR: "HR & Payroll",
};

/**
 * Computes least-privilege UI and action capabilities for the active RBAC role.
 */
export function getEvvRoleCapabilities(role: Role): EvvRoleCapabilities {
  const roleLabel = ROLE_LABELS[role] ?? role;

  switch (role) {
    case "ADMIN":
      return {
        role,
        roleLabel,
        isReadOnly: false,
        canViewOverview: true,
        canViewAllVisits: true,
        canViewExceptions: true,
        canViewAggregatorTab: true,
        canViewFinancials: true,
        canViewMedicaidId: true,
        canExportCsv: true,
        canBulkConfirm: true,
        canBulkSubmitAggregator: true,
        canResolveExceptions: true,
        canReopenExceptions: true,
        canRevealPhones: true,
        canSubmitAggregator: true,
        canManageBilling: true,
        canManagePayroll: true,
        canEditPayerRules: true,
      };

    case "FIELD_SUPERVISOR":
      return {
        role,
        roleLabel,
        isReadOnly: false,
        canViewOverview: true,
        canViewAllVisits: true,
        canViewExceptions: true,
        canViewAggregatorTab: false,
        canViewFinancials: false,
        canViewMedicaidId: false,
        canExportCsv: false,
        canBulkConfirm: true,
        canBulkSubmitAggregator: false,
        canResolveExceptions: true,
        canReopenExceptions: true,
        canRevealPhones: true,
        canSubmitAggregator: false,
        canManageBilling: false,
        canManagePayroll: false,
        canEditPayerRules: false,
      };

    case "BILLING_FINANCE_STAFF":
      return {
        role,
        roleLabel,
        isReadOnly: false,
        canViewOverview: true,
        canViewAllVisits: true,
        canViewExceptions: true,
        canViewAggregatorTab: true,
        canViewFinancials: true,
        canViewMedicaidId: true,
        canExportCsv: true,
        canBulkConfirm: false,
        canBulkSubmitAggregator: true,
        canResolveExceptions: false,
        canReopenExceptions: true,
        canRevealPhones: false,
        canSubmitAggregator: true,
        canManageBilling: true,
        canManagePayroll: false,
        canEditPayerRules: false,
      };

    case "SCHEDULER":
      return {
        role,
        roleLabel,
        isReadOnly: true,
        canViewOverview: true,
        canViewAllVisits: true,
        canViewExceptions: true,
        canViewAggregatorTab: false,
        canViewFinancials: false,
        canViewMedicaidId: false,
        canExportCsv: false,
        canBulkConfirm: false,
        canBulkSubmitAggregator: false,
        canResolveExceptions: false,
        canReopenExceptions: false,
        canRevealPhones: false,
        canSubmitAggregator: false,
        canManageBilling: false,
        canManagePayroll: false,
        canEditPayerRules: false,
      };

    case "QA_COMPLIANCE_OFFICER":
      return {
        role,
        roleLabel,
        isReadOnly: true,
        canViewOverview: true,
        canViewAllVisits: true,
        canViewExceptions: true,
        canViewAggregatorTab: true,
        canViewFinancials: true,
        canViewMedicaidId: true,
        canExportCsv: true,
        canBulkConfirm: false,
        canBulkSubmitAggregator: false,
        canResolveExceptions: false,
        canReopenExceptions: false,
        canRevealPhones: false,
        canSubmitAggregator: false,
        canManageBilling: false,
        canManagePayroll: false,
        canEditPayerRules: false,
      };

    default:
      return {
        role,
        roleLabel,
        isReadOnly: true,
        canViewOverview: true,
        canViewAllVisits: true,
        canViewExceptions: false,
        canViewAggregatorTab: false,
        canViewFinancials: false,
        canViewMedicaidId: false,
        canExportCsv: false,
        canBulkConfirm: false,
        canBulkSubmitAggregator: false,
        canResolveExceptions: false,
        canReopenExceptions: false,
        canRevealPhones: false,
        canSubmitAggregator: false,
        canManageBilling: false,
        canManagePayroll: false,
        canEditPayerRules: false,
      };
  }
}
