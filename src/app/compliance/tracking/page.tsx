"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileDown, CalendarDays, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ComplianceScoreCard } from "@/components/compliance/ComplianceScoreCard";
import { KpiCardStrip } from "@/components/compliance/KpiCardStrip";
import { CategoryProgressBars } from "@/components/compliance/CategoryProgressBars";
import { ComplianceItemTracker } from "@/components/compliance/ComplianceItemTracker";
import { ReminderConfigPanel } from "@/components/compliance/ReminderConfigPanel";
import { VerificationQueue } from "@/components/compliance/VerificationQueue";
import { SystemAuditLog } from "@/components/compliance/SystemAuditLog";
import { PolicyAcknowledgmentMatrix } from "@/components/compliance/PolicyAcknowledgmentMatrix";
import {
  mockReminderLogs,
  mockPolicyMatrix,
} from "@/lib/mock-data/compliance";
import {
  ComplianceItem,
  ComplianceScoreData,
  KpiSummaryData,
} from "@/types/compliance";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { computeSurveyReadiness } from "@/lib/engine/predictiveOpsEngine";

export default function ComplianceTrackingPage() {
  const { state, logAuditEvent } = useAgencyStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("This Quarter");
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const readiness = useMemo(() => computeSurveyReadiness(state), [state]);

  const liveScoreData: ComplianceScoreData = useMemo(
    () => ({
      overallScore: readiness.overallScore,
      trend: 1.4,
      breakdown: [
        { category: "HIPAA", score: 100 },
        { category: "State Compliance", score: readiness.supervisoryOnTimeRate },
        { category: "Medicaid", score: readiness.evvVerificationRate },
        { category: "Medicare", score: readiness.carePlanCurrencyRate },
        { category: "License Monitoring", score: readiness.credentialComplianceRate },
        { category: "OSHA", score: 96 },
      ],
    }),
    [readiness]
  );

  const liveKpiSummary: KpiSummaryData = useMemo(
    () => ({
      fullyCompliantCount: state.caregivers.filter(
        (c) => c.complianceValid && c.certExpiresInDays > 14
      ).length,
      expiringCount:
        state.caregivers.filter((c) => c.certExpiresInDays > 0 && c.certExpiresInDays <= 30)
          .length + state.credentialWatchlist.length,
      expiredCount: state.caregivers.filter(
        (c) => !c.complianceValid || c.certExpiresInDays <= 0
      ).length,
      pendingCount: state.verificationQueue.length,
      remindersSent: state.auditLogs.filter((l) => l.resourceType === "Compliance").length + 12,
      avgDaysToRenewal: 4.8,
    }),
    [state]
  );

  const liveComplianceItems: ComplianceItem[] = useMemo(() => {
    const caregiverItems: ComplianceItem[] = state.caregivers.map((cg) => ({
      id: `comp-${cg.id}`,
      caregiver: { id: cg.id, name: cg.name, role: cg.roleTitle },
      itemName: `${cg.credentials[0] ?? "Licensure"} & EVV Attestation`,
      category: "License Monitoring",
      issueDate: "2025-02-01",
      expiryDate: `In ${Math.max(0, cg.certExpiresInDays)}d`,
      status: !cg.complianceValid
        ? "Expired"
        : cg.certExpiresInDays <= 21
          ? "Expiring"
          : "Compliant",
    }));

    const watchlistItems: ComplianceItem[] = state.credentialWatchlist.map((w) => ({
      id: `watch-${w.id}`,
      caregiver: { id: w.caregiverId, name: w.caregiverName, role: w.role },
      itemName: w.credentialType,
      category: "State Compliance",
      expiryDate: w.expiryDate,
      status: w.status === "expired" ? "Expired" : "Expiring",
    }));

    return [...watchlistItems, ...caregiverItems];
  }, [state.caregivers, state.credentialWatchlist]);

  const filterOptions = ["This Week", "This Month", "This Quarter", "This Year", "All Time"];
  const attentionCount = liveKpiSummary.expiringCount + liveKpiSummary.expiredCount + liveKpiSummary.pendingCount;

  const handleGenerateReport = () => {
    logAuditEvent({
      action: "EXPORT",
      resourceType: "Compliance",
      resourceId: `compliance-tracking-${selectedFilter.toLowerCase().replace(/\s+/g, "-")}`,
      summary: `Exported Compliance Tracking packet (${readiness.overallScore}% agency readiness).`,
      status: "Success",
    });
    toast.success("Compliance Tracking report exported & audit logged");
  };

  return (
    <div className="full-width space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Compliance Tracking</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
            {attentionCount} live compliance item(s) requiring attention across credentials & verifications.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="hidden sm:flex items-center gap-2 bg-white border border-border-subtle rounded-full px-4 py-2 shadow-[0_6px_32px_rgba(0,0,0,0.06)] text-sm text-slate-700 font-medium transition-colors whitespace-nowrap active:scale-95 hover:bg-slate-50"
            >
              <CalendarDays className="w-4 h-4 text-slate-400" />
              {selectedFilter}
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} />
            </button>

            {isFilterOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 py-1">
                {filterOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSelectedFilter(option);
                      setIsFilterOpen(false);
                      toast.success(`Filter applied: ${option}`);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${selectedFilter === option ? "text-brand-teal font-medium bg-slate-50/50" : "text-slate-700"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleGenerateReport}
            className="flex items-center gap-2 bg-brand-teal text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-brand-teal/90 transition-all shadow-[0_6px_32px_rgba(0,0,0,0.06)] shadow-brand-teal/20 whitespace-nowrap active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>

      <div className="w-full">
        <ComplianceScoreCard
          data={liveScoreData}
          onCategoryClick={(category) => toast.info(`Drilling down into live category: ${category}`)}
        />
      </div>

      <div className="w-full">
        <KpiCardStrip data={liveKpiSummary} />
      </div>

      <div className="w-full">
        <CategoryProgressBars data={liveScoreData.breakdown} />
      </div>

      <div className="w-full">
        <ComplianceItemTracker items={liveComplianceItems} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div>
          <ReminderConfigPanel logs={mockReminderLogs} />
        </div>
        <div>
          <VerificationQueue items={state.verificationQueue} />
        </div>
      </div>

      <div className="w-full">
        <SystemAuditLog />
      </div>

      <div className="w-full pb-8">
        <PolicyAcknowledgmentMatrix policies={mockPolicyMatrix} />
      </div>
    </div>
  );
}
