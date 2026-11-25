import React from "react";
import { initialVisits } from "../mockData";
import { VisitDetailsClient } from "./_components/VisitDetailsClient";

export function generateStaticParams() {
  return initialVisits.map((visit) => ({ id: visit.id }));
}

export const dynamicParams = false;

export default async function EVVVisitDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VisitDetailsClient visitId={id} />;
}
