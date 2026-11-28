import { AgencyCaregiver, AgencyClient, AgencyShiftVisit } from "@/types/agency";
import type { Caregiver as TrackerCaregiver, Visit as TrackerVisit, VisitStatus } from "@/lib/mockTrackerData";

function coordsToMapPoint(lat: number, lng: number, index: number): { x: number; y: number } {
  // Normalize Springfield area coords (39.77..39.80, -89.66..-89.63) onto 15..85 map grid
  const xNorm = ((lng + 89.665) / 0.035) * 60 + 20;
  const yNorm = ((39.795 - lat) / 0.025) * 60 + 20;
  const x = Math.max(12, Math.min(88, Math.round(Number.isFinite(xNorm) ? xNorm : 25 + (index * 17) % 60)));
  const y = Math.max(12, Math.min(88, Math.round(Number.isFinite(yNorm) ? yNorm : 25 + (index * 23) % 60)));
  return { x, y };
}

export function mapAgencyToTrackerCaregivers(
  caregivers: AgencyCaregiver[],
  visits: AgencyShiftVisit[],
  clients: AgencyClient[]
): TrackerCaregiver[] {
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  return caregivers.map((cg, idx) => {
    const activeVisit = visits.find(
      (v) => v.caregiverId === cg.id && (v.status === "In Progress" || v.status === "Scheduled")
    );
    const activeClient = activeVisit ? clientMap.get(activeVisit.clientId) : undefined;
    const initials = cg.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return {
      id: cg.id,
      name: cg.name,
      avatar: initials,
      status: cg.complianceValid ? "Active" : "Offline",
      currentRoute: activeClient ? `${activeClient.name.split(" ")[0]} Residence` : "Standby Zone",
      distanceToNext: cg.distanceMiles,
      email: `${cg.name.toLowerCase().replace(/[^a-z]+/g, ".")}@homepulse.com`,
      phone: "(217) 555-0140",
      certNo: cg.credentials[0] ?? "CNA",
      specialty: cg.skills.slice(0, 2).join(", ") || cg.roleTitle,
      shiftStart: activeVisit?.scheduledStart ?? "08:00 AM",
      shiftEnd: activeVisit?.scheduledEnd ?? "04:00 PM",
      location: coordsToMapPoint(cg.homeCoords.lat, cg.homeCoords.lng, idx),
    };
  });
}

function mapVisitStatus(status: AgencyShiftVisit["status"]): VisitStatus {
  if (status === "In Progress") return "In Progress";
  if (status === "Completed" || status === "Incomplete") return "Completed";
  if (status === "Unfilled" || status === "Call-Off") return "Unassigned";
  return "Assigned";
}

export function mapAgencyToTrackerVisits(
  visits: AgencyShiftVisit[],
  clients: AgencyClient[]
): TrackerVisit[] {
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  return visits.map((v, idx) => {
    const client = clientMap.get(v.clientId);
    const location = client
      ? coordsToMapPoint(client.coords.lat, client.coords.lng, idx)
      : { x: 30 + (idx * 13) % 50, y: 25 + (idx * 19) % 50 };

    return {
      id: v.id,
      patientName: client?.name ?? "Assigned Client",
      address: client ? `${client.address}, ${client.cityStateZip}` : "Springfield, IL",
      time: `${v.scheduledStart} - ${v.scheduledEnd}`,
      status: mapVisitStatus(v.status),
      caregiverId: v.caregiverId ?? undefined,
      location,
    };
  });
}
