import {
  AgencyCaregiver,
  AgencyClient,
  AgencyShiftStatus,
  AgencyShiftVisit,
} from "@/types/agency";
import { Caregiver, Shift, ShiftStatus } from "@/lib/scheduling/mockData";

export function mapAgencyToBoardStatus(status: AgencyShiftStatus): ShiftStatus {
  switch (status) {
    case "Unfilled":
      return "Unfilled";
    case "Call-Off":
      return "Call-Off";
    case "Offer Sent":
      return "Pending Confirmation";
    case "Scheduled":
      return "Confirmed";
    case "In Progress":
      return "In Progress";
    case "Completed":
    case "Incomplete":
      return "Completed";
  }
}

export function mapBoardToAgencyStatus(status: ShiftStatus): AgencyShiftStatus {
  switch (status) {
    case "Unfilled":
      return "Unfilled";
    case "Call-Off":
      return "Call-Off";
    case "Pending Confirmation":
      return "Offer Sent";
    case "Confirmed":
      return "Scheduled";
    case "In Progress":
      return "In Progress";
    case "Completed":
      return "Completed";
  }
}

function parseLabelTimeToIso(visitDate: string, timeStr: string): string {
  // Expected formats like "08:30 AM" or "02:00 PM"
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(timeStr.trim());
  if (!match) {
    return `${visitDate}T09:00:00Z`;
  }
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return `${visitDate}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`;
}

export function mapAgencyVisitsToShifts(
  visits: AgencyShiftVisit[],
  clients: AgencyClient[],
  caregivers: AgencyCaregiver[]
): Shift[] {
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const caregiverMap = new Map(caregivers.map((cg) => [cg.id, cg]));

  return visits.map((v) => {
    const client = clientMap.get(v.clientId);
    const cg = v.caregiverId ? caregiverMap.get(v.caregiverId) : undefined;
    const dateBase = v.visitDate || "2026-07-22";

    return {
      id: v.id,
      patientId: v.clientId,
      patientName: client?.name ?? "Assigned Client",
      patientAddress: client ? `${client.address}, ${client.cityStateZip}` : "Springfield, IL",
      requiredSkills: v.requiredSkills,
      startTime: parseLabelTimeToIso(dateBase, v.scheduledStart),
      endTime: parseLabelTimeToIso(dateBase, v.scheduledEnd),
      status: mapAgencyToBoardStatus(v.status),
      region: v.region,
      assignedCaregiverId: v.caregiverId,
      assignedCaregiverName: cg?.name,
      assignedCaregiverAvatar: cg?.avatarUrl,
      shiftNumber: v.shiftNumber,
      notes: v.visitNotes || v.exceptionDetail,
    };
  });
}

export function mapAgencyCaregiversToScheduling(caregivers: AgencyCaregiver[]): Caregiver[] {
  return caregivers.map((cg) => ({
    id: cg.id,
    name: cg.name,
    avatarUrl: cg.avatarUrl,
    credentials: cg.credentials,
    rating: cg.rating,
    distanceMiles: cg.distanceMiles,
  }));
}
