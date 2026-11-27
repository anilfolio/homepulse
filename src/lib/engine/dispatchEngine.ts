import {
  AgencyCaregiver,
  AgencyClient,
  AgencyShiftVisit,
  RankedCaregiverCandidate,
} from "@/types/agency";

/**
 * Ranks caregivers for a given shift using deterministic multi-factor scoring:
 * - Required skill alignment (+45 max, penalizes missing skills)
 * - Proximity / travel distance (+30 max)
 * - Quality rating (+15 max)
 * - Compliance standing (+10 or disqualifying penalty)
 * - Overtime protection (-25 if shift pushes caregiver over maxWeeklyHours)
 */
export function rankCaregiversForShift(
  shift: Pick<AgencyShiftVisit, "requiredSkills" | "scheduledHours" | "caregiverId">,
  _client: AgencyClient | undefined,
  caregivers: AgencyCaregiver[]
): RankedCaregiverCandidate[] {
  return caregivers
    .map((cg) => {
      const matchingSkills = shift.requiredSkills.filter((skill) =>
        cg.skills.some((s) => s.toLowerCase() === skill.toLowerCase()) ||
        cg.credentials.some((c) => c.toLowerCase() === skill.toLowerCase())
      );
      const missingSkills = shift.requiredSkills.filter(
        (skill) => !matchingSkills.includes(skill)
      );

      const skillRatio =
        shift.requiredSkills.length > 0
          ? matchingSkills.length / shift.requiredSkills.length
          : 1;
      const skillScore = Math.round(skillRatio * 45) - missingSkills.length * 10;

      const distanceScore = Math.max(0, Math.round(30 - cg.distanceMiles * 4));
      const ratingScore = Math.round((cg.rating / 5) * 15);
      const complianceScore = cg.complianceValid ? 10 : -40;
      const overtimeRisk =
        cg.weeklyHoursScheduled + shift.scheduledHours > cg.maxWeeklyHours;
      const overtimePenalty = overtimeRisk ? 25 : 0;

      const rawScore =
        skillScore + distanceScore + ratingScore + complianceScore - overtimePenalty;
      const matchScore = Math.max(10, Math.min(99, rawScore));

      const reasons: string[] = [];
      if (missingSkills.length === 0) {
        reasons.push("100% required skill match");
      } else {
        reasons.push(`Missing: ${missingSkills.join(", ")}`);
      }
      reasons.push(`${cg.distanceMiles.toFixed(1)} mi away`);
      if (overtimeRisk) {
        reasons.push("Overtime threshold risk (>40h)");
      } else {
        reasons.push("Within regular hours");
      }
      if (!cg.complianceValid) {
        reasons.push("Compliance hold");
      }

      return {
        caregiver: cg,
        matchScore,
        overtimeRisk,
        matchingSkills,
        missingSkills,
        reasons,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
