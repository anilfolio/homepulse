"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Calendar, User, FileText, ArrowRight, CheckCircle2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export default function SchedulerRequirementsPage() {
  const router = useRouter();
  const { state, createShift, autoAssignBestCaregiver } = useAgencyStore();

  const requirements = useMemo(() => {
    return state.clients.map((client) => {
      const clientVisits = state.visits.filter((v) => v.clientId === client.id);
      const signedReview = state.carePlanReviews.find(
        (r) => r.clientId === client.id && r.status === "completed"
      );
      return {
        client,
        visitCount: clientVisits.length,
        signedLabel: signedReview?.signedAt || (client.carePlanUpdatedAt ? "Recently Signed" : "Active Care Plan"),
      };
    });
  }, [state.clients, state.visits, state.carePlanReviews]);

  const handleGenerateShift = (clientId: string, clientName: string, serviceName: string) => {
    const created = createShift({
      clientId,
      caregiverId: null,
      scheduledStart: "02:00 PM",
      scheduledEnd: "05:00 PM",
      scheduledHours: 3,
      requiredSkills: serviceName.toLowerCase().includes("hoyer")
        ? ["HHA", "Hoyer"]
        : ["CNA", "Personal Care"],
      region: "Springfield North",
    });
    if (created) {
      autoAssignBestCaregiver(created.id);
      toast.success(`Shift generated & auto-staffed for ${clientName}.`);
      router.push("/scheduler/shifts/board");
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Scheduling Requirements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Active &amp; newly signed Care Plans ready for recurring shift generation.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {requirements.map(({ client, visitCount, signedLabel }) => (
          <Card
            key={client.id}
            className="p-4 shadow-sm border-brand-teal/20 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-teal/10 rounded-xl text-brand-teal mt-1">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-lg">{client.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {visitCount} Active Shift(s)
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {client.serviceName} ({client.serviceCode}) • {client.authorizedUnitsRemaining} units left
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" />
                      Fall Risk: {client.fallRiskLevel}
                    </span>
                  </div>
                  <div className="text-xs text-brand-teal mt-2 font-semibold">
                    Care Plan Status: {signedLabel}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleGenerateShift(client.id, client.name, client.serviceName)
                }
                className="bg-brand-teal text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Generate &amp; Auto-Staff Shift
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
