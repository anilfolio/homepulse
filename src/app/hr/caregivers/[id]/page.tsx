import React from "react";
import { mockCaregivers, Caregiver } from "@/lib/caregivers/mockData";
import { INITIAL_AGENCY_CAREGIVERS } from "@/lib/store/agencySeedData";
import { CaregiverProfileClient } from "@/components/caregivers/CaregiverProfileClient";

export default async function HrCaregiverProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const targetId = resolvedParams.id;

  const agencyCg = INITIAL_AGENCY_CAREGIVERS.find((c) => c.id === targetId);
  let caregiver: Caregiver | undefined = mockCaregivers[targetId];

  if (!caregiver && agencyCg) {
    caregiver = {
      id: agencyCg.id,
      name: agencyCg.name,
      avatarUrl: agencyCg.avatarUrl ?? "",
      role: agencyCg.roleTitle,
      status: agencyCg.complianceValid ? "Active" : "On Leave",
      rating: agencyCg.rating,
      yearsWithAgency: 2,
      phone: "(555) 234-8910",
      email: `${agencyCg.name.toLowerCase().replace(/[^a-z]+/g, ".")}@homepulse.com`,
      address: `${agencyCg.distanceMiles} mi from hub`,
      emergencyContact: "On File in HR",
      languages: ["English", "Spanish"],
      skills: agencyCg.skills,
      hireDate: "2024-03-15",
      employmentType: "W2",
      payRate: agencyCg.hourlyRate,
      complianceScore: agencyCg.complianceValid ? 98 : 74,
      assignedPatientsCount: 3,
      lastActiveDate: "Today",
      certifications: agencyCg.credentials.map((cred, idx) => ({
        id: `${agencyCg.id}-cert-${idx}`,
        name: cred,
        issueDate: "2025-01-10",
        expiryDate: `In ${agencyCg.certExpiresInDays} days`,
        status: agencyCg.certExpiresInDays <= 14 ? "Expiring Soon" : "Active",
        issuer: "State Registry",
      })),
      recentShifts: [],
    };
  }

  if (!caregiver) {
    const matchedKey = Object.keys(mockCaregivers).find(
      (key) => key.toLowerCase() === targetId.toLowerCase()
    );
    if (matchedKey) {
      caregiver = mockCaregivers[matchedKey];
    } else {
      const sample = Object.values(mockCaregivers)[0];
      caregiver = {
        ...sample,
        id: targetId,
        status: "Active",
      };
    }
  }

  return <CaregiverProfileClient initialCaregiver={caregiver} />;
}

export function generateStaticParams() {
  const ids = new Set<string>([
    "1",
    "2",
    "3",
    "cg-001",
    "pt-001",
    "c-1",
    "c-2",
    "c-3",
    ...Object.keys(mockCaregivers),
    ...INITIAL_AGENCY_CAREGIVERS.map((c) => c.id),
  ]);
  return Array.from(ids).map((id) => ({ id }));
}

export const dynamicParams = false;
