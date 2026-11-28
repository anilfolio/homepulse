import React from "react";
import { mockPatients } from "@/lib/patients/mockData";
import { INITIAL_AGENCY_CLIENTS } from "@/lib/store/agencySeedData";
import { PatientHubClient } from "@/components/patients/PatientHubClient";

export default async function PatientHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <PatientHubClient patientId={resolvedParams.id} />;
}

export function generateStaticParams() {
  const ids = new Set<string>([
    ...Object.keys(mockPatients),
    ...INITIAL_AGENCY_CLIENTS.map((c) => c.id),
  ]);
  return Array.from(ids).map((id) => ({ id }));
}
