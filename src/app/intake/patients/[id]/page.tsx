import { redirect } from "next/navigation";
import { mockPatients } from "@/lib/patients/mockData";
import { INITIAL_AGENCY_CLIENTS } from "@/lib/store/agencySeedData";

export default async function IntakePatientRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  redirect(`/patients/${resolvedParams.id}`);
}

export function generateStaticParams() {
  const ids = new Set<string>([
    ...Object.keys(mockPatients),
    ...INITIAL_AGENCY_CLIENTS.map((c) => c.id),
  ]);
  return Array.from(ids).map((id) => ({ id }));
}
