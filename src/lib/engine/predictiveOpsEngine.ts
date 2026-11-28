import { AgencyStoreState } from "@/types/agency";

export interface CaregiverRiskPrediction {
  caregiverId: string;
  caregiverName: string;
  riskScore: number; // 0-100
  riskLevel: "High" | "Moderate" | "Low";
  primaryFactor: string;
  recommendedAction: string;
}

export interface AuthBurnForecast {
  clientId: string;
  clientName: string;
  payer: string;
  authNumber: string;
  unitsRemaining: number;
  projectedWeeklyBurn: number;
  estimatedDaysToDepletion: number;
  revenueAtRisk: number;
  urgency: "Critical" | "Watch" | "Healthy";
}

export interface SurveyReadinessReport {
  overallScore: number;
  evvVerificationRate: number;
  supervisoryOnTimeRate: number;
  credentialComplianceRate: number;
  carePlanCurrencyRate: number;
  openStateDeadlines: number;
  topRemediations: {
    label: string;
    route: string;
    impactPoints: number;
  }[];
}

export function predictCaregiverTurnoverAndCallOffRisk(
  state: AgencyStoreState
): CaregiverRiskPrediction[] {
  return state.caregivers
    .map((cg) => {
      let risk = 15;
      const factors: string[] = [];

      const utilization = cg.weeklyHoursScheduled / Math.max(1, cg.maxWeeklyHours);
      if (utilization >= 0.95) {
        risk += 38;
        factors.push(`Overtime saturation (${cg.weeklyHoursScheduled}/${cg.maxWeeklyHours}h)`);
      } else if (utilization >= 0.85) {
        risk += 20;
        factors.push(`High weekly load (${cg.weeklyHoursScheduled}h)`);
      }

      if (cg.certExpiresInDays <= 15) {
        risk += 28;
        factors.push(`Credential expiring in ${cg.certExpiresInDays}d`);
      } else if (cg.certExpiresInDays <= 30) {
        risk += 14;
        factors.push(`Cert renewal due in ${cg.certExpiresInDays}d`);
      }

      if (!cg.complianceValid) {
        risk += 30;
        factors.push("Compliance hold active");
      }

      const cgExceptions = state.visits.filter(
        (v) => v.caregiverId === cg.id && v.evvCompliance === "Exception"
      ).length;
      if (cgExceptions > 0) {
        risk += cgExceptions * 12;
        factors.push(`${cgExceptions} recent EVV exception(s)`);
      }

      const clamped = Math.min(98, risk);
      const riskLevel: CaregiverRiskPrediction["riskLevel"] =
        clamped >= 60 ? "High" : clamped >= 35 ? "Moderate" : "Low";

      return {
        caregiverId: cg.id,
        caregiverName: cg.name,
        riskScore: clamped,
        riskLevel,
        primaryFactor: factors[0] ?? "Balanced schedule & valid credentials",
        recommendedAction:
          riskLevel === "High"
            ? "Pre-assign standby backup & rebalance hours"
            : riskLevel === "Moderate"
            ? "Send automated credential/shift check-in"
            : "Maintain normal dispatch priority",
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

export function forecastAuthorizationBurn(state: AgencyStoreState): AuthBurnForecast[] {
  return state.clients
    .map((client) => {
      const clientVisits = state.visits.filter((v) => v.clientId === client.id);
      const scheduledHours = clientVisits.reduce((sum, v) => sum + v.scheduledHours, 0);
      // 1 hour = 4 15-min billing units (standard T1019/HHA)
      const projectedWeeklyBurn = Math.max(8, scheduledHours * 4);
      const dailyBurn = projectedWeeklyBurn / 7;
      const estimatedDaysToDepletion = Math.min(
        client.authExpiresInDays,
        Math.max(1, Math.round(client.authorizedUnitsRemaining / Math.max(1, dailyBurn)))
      );
      const revenueAtRisk = Math.round((client.authorizedUnitsRemaining / 4) * client.hourlyBillRate);

      const urgency: AuthBurnForecast["urgency"] =
        estimatedDaysToDepletion <= 7 || client.authorizedUnitsRemaining <= 12
          ? "Critical"
          : estimatedDaysToDepletion <= 14
          ? "Watch"
          : "Healthy";

      return {
        clientId: client.id,
        clientName: client.name,
        payer: client.payer,
        authNumber: client.authNumber,
        unitsRemaining: client.authorizedUnitsRemaining,
        projectedWeeklyBurn,
        estimatedDaysToDepletion,
        revenueAtRisk,
        urgency,
      };
    })
    .sort((a, b) => a.estimatedDaysToDepletion - b.estimatedDaysToDepletion);
}

export function computeSurveyReadiness(state: AgencyStoreState): SurveyReadinessReport {
  const evvTotal = state.visits.filter(
    (v) => v.status === "Completed" || v.status === "In Progress"
  );
  const evvVerified = evvTotal.filter((v) => v.evvCompliance === "Verified").length;
  const evvVerificationRate =
    evvTotal.length > 0 ? Math.round((evvVerified / evvTotal.length) * 100) : 100;

  const supTotal = state.supervisoryVisits.length;
  const supOverdue = state.supervisoryVisits.filter((s) => s.status === "overdue").length;
  const supervisoryOnTimeRate =
    supTotal > 0 ? Math.round(((supTotal - supOverdue) / supTotal) * 100) : 100;

  const credTotal = state.caregivers.length;
  const credValid = state.caregivers.filter(
    (c) => c.complianceValid && c.certExpiresInDays > 14
  ).length;
  const credentialComplianceRate =
    credTotal > 0 ? Math.round((credValid / credTotal) * 100) : 100;

  const cpTotal = state.carePlanReviews.length;
  const cpOverdue = state.carePlanReviews.filter((c) => c.status === "overdue").length;
  const carePlanCurrencyRate =
    cpTotal > 0 ? Math.round(((cpTotal - cpOverdue) / cpTotal) * 100) : 100;

  const openStateDeadlines = state.stateDeadlines.length;
  const deadlinePenalty = Math.min(18, openStateDeadlines * 6);

  const weighted =
    evvVerificationRate * 0.3 +
    supervisoryOnTimeRate * 0.25 +
    credentialComplianceRate * 0.25 +
    carePlanCurrencyRate * 0.2 -
    deadlinePenalty;
  const overallScore = Math.max(45, Math.min(100, Math.round(weighted)));

  const topRemediations: SurveyReadinessReport["topRemediations"] = [];
  if (supOverdue > 0) {
    topRemediations.push({
      label: `Complete ${supOverdue} overdue RN supervisory visit(s)`,
      route: "/field-supervisor/visits",
      impactPoints: 6,
    });
  }
  if (evvTotal.length - evvVerified > 0) {
    topRemediations.push({
      label: `Resolve ${evvTotal.length - evvVerified} EVV geofence/timing exception(s)`,
      route: "/evv-monitoring",
      impactPoints: 5,
    });
  }
  if (openStateDeadlines > 0) {
    topRemediations.push({
      label: `Submit ${openStateDeadlines} pending state incident filing(s)`,
      route: "/compliance",
      impactPoints: openStateDeadlines * 4,
    });
  }
  if (cpOverdue > 0) {
    topRemediations.push({
      label: `Sign ${cpOverdue} overdue 60-day care plan review(s)`,
      route: "/clinical",
      impactPoints: 4,
    });
  }

  return {
    overallScore,
    evvVerificationRate,
    supervisoryOnTimeRate,
    credentialComplianceRate,
    carePlanCurrencyRate,
    openStateDeadlines,
    topRemediations,
  };
}
