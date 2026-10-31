import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agency Command Center | HomePulse",
  description: "Executive operations telemetry, cross-department queue synchronization, and real-time agency oversight.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

