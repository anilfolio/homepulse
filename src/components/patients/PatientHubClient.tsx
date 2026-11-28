"use client";

import React, { useMemo } from "react";
import { notFound } from "next/navigation";
import { mockPatients, Patient } from "@/lib/patients/mockData";
import { PatientHeader } from "@/components/patients/PatientHeader";
import { PatientTabs } from "@/components/patients/PatientTabs";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { AgencyClient } from "@/types/agency";

function buildPatientFromAgencyClient(
  client: AgencyClient,
  visits: ReturnType<typeof useAgencyStore>["state"]["visits"],
  caregivers: ReturnType<typeof useAgencyStore>["state"]["caregivers"]
): Patient {
  const clientVisits = visits.filter((v) => v.clientId === client.id);
  const caregiverMap = new Map(caregivers.map((cg) => [cg.id, cg]));

  return {
    id: client.id,
    name: client.name,
    status: "Active",
    age: 74,
    address: `${client.address}, ${client.cityStateZip}`,
    primaryDiagnosis: `${client.serviceName} (${client.serviceCode})`,
    riskLevel: client.fallRiskLevel,
    intakeStatus: "Admitted",
    safetyAlerts: {
      dnr: "Full Code",
      isolationProtocols: [],
    },
    demographics: {
      dob: "1952-04-12",
      gender: "Female",
      phone: client.phone,
      email: "portal-verified@homepulse.com",
      preferredLanguage: "English",
      emergencyContacts: [
        { name: "Authorized Guardian", relation: "Family POA", phone: client.phone },
      ],
    },
    insurance: {
      primary: client.payer,
      policyNumber: client.medicaidIdMasked,
      groupNumber: client.authNumber,
      authorizationStatus: `${client.authorizedUnitsRemaining}/${client.authorizedUnitsTotal} units (${client.authExpiresInDays}d left)`,
    },
    careTeam: {
      pcp: "Dr. Sarah Jenkins, MD",
      specialists: ["Home Health RN Supervisor"],
      caseManager: { name: "Rachel Miller, RN" },
      primaryCaregivers: Array.from(
        new Set(
          clientVisits
            .map((v) => (v.caregiverId ? caregiverMap.get(v.caregiverId)?.name : undefined))
            .filter(Boolean) as string[]
        )
      ).map((name) => ({ name })),
    },
    riskSummary: {
      fallRisk: { level: client.fallRiskLevel, lastAssessment: "Today" },
      medicationRisk: { level: "Medium", lastAssessment: "Today" },
      cognitiveStatus: { level: "Low", lastAssessment: "Today" },
    },
    recentActivity: clientVisits.slice(0, 5).map((v) => ({
      id: v.id,
      type: "visit",
      title: `${v.evvId} — ${v.status} (${v.evvCompliance})`,
      timestamp: `${v.visitDateLabel} ${v.scheduledStart}`,
      message: v.visitNotes || v.exceptionDetail,
    })),
    carePlan: {
      approval: {
        signer: "Rachel Miller, RN",
        date: client.carePlanUpdatedAt
          ? new Date(client.carePlanUpdatedAt).toLocaleDateString()
          : "Active",
      },
      problems: (client.carePlanGoals ?? [
        "Maintain safe home ambulation & zero falls",
        "100% medication reminder adherence",
      ]).map((goal, idx) => ({
        id: `goal-${idx}`,
        title: goal,
        targetDate: "60-Day Review",
        status: "On track" as const,
      })),
      tasks: (clientVisits[0]?.tasks ?? []).map((t) => ({
        id: t.id,
        task: t.title,
        frequency: "Every Visit",
        assigned: "Assigned Caregiver",
        lastCompleted: t.completed ? "Today" : "Pending",
        nextDue: "Today",
      })),
      versionHistory: { revisions: 2 },
    },
    visits: {
      upcoming: clientVisits
        .filter((v) => v.status !== "Completed")
        .map((v) => ({
          id: v.id,
          date: v.visitDateLabel,
          time: `${v.scheduledStart} - ${v.scheduledEnd}`,
          staff: (v.caregiverId && caregiverMap.get(v.caregiverId)?.name) || "Unassigned",
          duration: `${v.scheduledHours}h`,
          status: "pending" as const,
          type: "Scheduled" as const,
        })),
      history: clientVisits
        .filter((v) => v.status === "Completed")
        .map((v) => ({
          id: v.id,
          date: v.visitDateLabel,
          time: `${v.clockInTime ?? v.scheduledStart} - ${v.clockOutTime ?? v.scheduledEnd}`,
          staff: (v.caregiverId && caregiverMap.get(v.caregiverId)?.name) || "Caregiver",
          duration: `${v.scheduledHours}h`,
          status: v.evvCompliance === "Exception" ? ("flagged" as const) : ("verified" as const),
          type: "Completed" as const,
        })),
    },
  };
}

export function PatientHubClient({ patientId }: { patientId: string }) {
  const { state } = useAgencyStore();

  const patient = useMemo(() => {
    const agencyClient = state.clients.find((c) => c.id === patientId);
    if (agencyClient) {
      return buildPatientFromAgencyClient(agencyClient, state.visits, state.caregivers);
    }
    return mockPatients[patientId] ?? null;
  }, [patientId, state.clients, state.visits, state.caregivers]);

  if (!patient) {
    notFound();
  }

  return (
    <div className="w-full">
      <PatientHeader patient={patient} />
      <PatientTabs patient={patient} />
    </div>
  );
}
