import { AgencyCaregiver, AgencyClient, AgencyShiftVisit } from "@/types/agency";

export interface CaregiverPayrollShiftDetail {
  visitId: string;
  evvId: string;
  clientName: string;
  dateLabel: string;
  timeRange: string;
  hours: number;
  evvCompliance: AgencyShiftVisit["evvCompliance"];
  billingStatus: AgencyShiftVisit["billingStatus"];
  mileage: number;
}

export interface CaregiverPayrollRow {
  caregiverId: string;
  name: string;
  roleTitle: string;
  hourlyRate: number;
  baseHours: number;
  otHours: number;
  dtHours: number;
  totalHours: number;
  travelMiles: number;
  mileageReimbursement: number;
  evvVerifiedCount: number;
  exceptionCount: number;
  grossPay: number;
  otReason: string | null;
  dtReason: string | null;
  shifts: CaregiverPayrollShiftDetail[];
}

export interface PayrollSummaryMetrics {
  totalEvvHours: number;
  totalOvertimeHours: number;
  totalMileageReimbursement: number;
  totalGrossPayroll: number;
  evvVerifiedPercent: number;
  rows: CaregiverPayrollRow[];
}

const MILEAGE_RATE_USD = 0.67;

/**
 * Reconciles EVV-verified / active shifts from AgencyStore into live payroll
 * calculations with daily (>8h) & weekly (>40h) overtime and mileage reimbursement.
 */
export function calculateAgencyPayroll(
  caregivers: AgencyCaregiver[],
  visits: AgencyShiftVisit[],
  clients: AgencyClient[]
): PayrollSummaryMetrics {
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  const rows: CaregiverPayrollRow[] = caregivers.map((cg) => {
    const cgVisits = visits.filter(
      (v) =>
        v.caregiverId === cg.id &&
        (v.status === "Completed" || v.status === "In Progress" || v.status === "Scheduled")
    );

    const workedVisits = cgVisits.filter(
      (v) => v.status === "Completed" || v.status === "In Progress"
    );

    const shifts: CaregiverPayrollShiftDetail[] = workedVisits.map((v) => ({
      visitId: v.id,
      evvId: v.evvId,
      clientName: clientMap.get(v.clientId)?.name ?? "Assigned Client",
      dateLabel: v.visitDateLabel,
      timeRange: `${v.scheduledStart} - ${v.scheduledEnd}`,
      hours: v.scheduledHours,
      evvCompliance: v.evvCompliance,
      billingStatus: v.billingStatus,
      mileage: v.mileageRecorded ?? Number((cg.distanceMiles * 1.4).toFixed(1)),
    }));

    // Combine baseline weekly hours with newly completed/in-progress shift hours
    const completedShiftHours = workedVisits.reduce((sum, v) => sum + v.scheduledHours, 0);
    const totalHours = Number(
      Math.max(cg.weeklyHoursScheduled, completedShiftHours).toFixed(1)
    );

    const dailyOt = workedVisits.reduce(
      (sum, v) => sum + Math.max(0, v.scheduledHours - 8),
      0
    );
    const weeklyOt = Math.max(0, totalHours - cg.maxWeeklyHours);
    const otHours = Number(Math.max(dailyOt, weeklyOt).toFixed(1));
    const dtHours = workedVisits.reduce(
      (sum, v) => sum + Math.max(0, v.scheduledHours - 12),
      0
    );
    const baseHours = Number(Math.max(0, totalHours - otHours - dtHours).toFixed(1));

    const travelMiles = Number(
      shifts.reduce((sum, s) => sum + s.mileage, 0).toFixed(1)
    );
    const mileageReimbursement = Number((travelMiles * MILEAGE_RATE_USD).toFixed(2));

    const regularPay = baseHours * cg.hourlyRate;
    const otPay = otHours * cg.hourlyRate * 1.5;
    const dtPay = dtHours * cg.hourlyRate * 2.0;
    const grossPay = Number((regularPay + otPay + dtPay + mileageReimbursement).toFixed(2));

    const evvVerifiedCount = workedVisits.filter(
      (v) => v.evvCompliance === "Verified"
    ).length;
    const exceptionCount = workedVisits.filter(
      (v) => v.evvCompliance === "Exception"
    ).length;

    return {
      caregiverId: cg.id,
      name: cg.name,
      roleTitle: cg.roleTitle,
      hourlyRate: cg.hourlyRate,
      baseHours,
      otHours,
      dtHours,
      totalHours,
      travelMiles,
      mileageReimbursement,
      evvVerifiedCount,
      exceptionCount,
      grossPay,
      otReason:
        otHours > 0
          ? weeklyOt > 0
            ? `Weekly >${cg.maxWeeklyHours}h threshold`
            : "Daily >8h shift rule"
          : null,
      dtReason: dtHours > 0 ? "Daily >12h shift rule" : null,
      shifts,
    };
  });

  const totalEvvHours = Number(
    rows.reduce((sum, r) => sum + r.totalHours, 0).toFixed(1)
  );
  const totalOvertimeHours = Number(
    rows.reduce((sum, r) => sum + r.otHours + r.dtHours, 0).toFixed(1)
  );
  const totalMileageReimbursement = Number(
    rows.reduce((sum, r) => sum + r.mileageReimbursement, 0).toFixed(2)
  );
  const totalGrossPayroll = Number(
    rows.reduce((sum, r) => sum + r.grossPay, 0).toFixed(2)
  );

  const totalWorked = rows.reduce(
    (sum, r) => sum + r.evvVerifiedCount + r.exceptionCount,
    0
  );
  const totalVerified = rows.reduce((sum, r) => sum + r.evvVerifiedCount, 0);
  const evvVerifiedPercent =
    totalWorked > 0 ? Math.round((totalVerified / totalWorked) * 100) : 100;

  return {
    totalEvvHours,
    totalOvertimeHours,
    totalMileageReimbursement,
    totalGrossPayroll,
    evvVerifiedPercent,
    rows,
  };
}
