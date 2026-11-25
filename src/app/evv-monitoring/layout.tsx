import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { EvvVisitsProvider } from "./EvvVisitsContext";

export default function EVVMonitoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <EvvVisitsProvider>{children}</EvvVisitsProvider>
    </AppLayout>
  );
}
