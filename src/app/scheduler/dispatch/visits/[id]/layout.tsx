import React from "react";
import { INITIAL_AGENCY_VISITS } from "@/lib/store/agencySeedData";

export function generateStaticParams() {
  return INITIAL_AGENCY_VISITS.map((visit) => ({
    id: visit.id,
  }));
}

export default function VisitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
