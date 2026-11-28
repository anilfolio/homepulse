"use client";

import React, { useState, useRef, useEffect } from "react";
import { KpiCardStrip } from "@/components/compliance/KpiCardStrip";
import { RestrictedIncidentQueue } from "@/components/compliance/RestrictedIncidentQueue";
import { StateReportingDeadlineTracker } from "@/components/compliance/StateReportingDeadlineTracker";
import { VerificationQueue } from "@/components/compliance/VerificationQueue";
import { QualityTrends } from "@/components/compliance/QualityTrends";
import { CalendarDays, FileDown, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { KpiSummaryData } from "@/types/compliance";
import { RestrictedIncident } from "@/lib/mock-data/compliance-dashboard";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { computeSurveyReadinessScore } from "@/lib/engine/complianceAutomation";

export function ComplianceDashboard() {
  const { state, logAuditEvent } = useAgencyStore();
  const [nowMs] = useState(() => Date.now());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("This Quarter");
  const filterRef = useRef<HTMLDivElement>(null);

  const liveKpiSummary: KpiSummaryData = {
    fullyCompliantCount: state.caregivers.filter((c) => c.complianceValid && c.certExpiresInDays > 14).length,
    expiringCount: state.caregivers.filter((c) => c.certExpiresInDays > 0 && c.certExpiresInDays <= 30).length + state.credentialWatchlist.length,
    expiredCount: state.caregivers.filter((c) => !c.complianceValid || c.certExpiresInDays <= 0).length,
    pendingCount: state.verificationQueue.length,
    remindersSent: state.auditLogs.filter((l) => l.resourceType === "Compliance").length + 12,
    avgDaysToRenewal:
      state.caregivers.length > 0
        ? Number(
            (
              state.caregivers.reduce((acc, c) => acc + Math.max(0, c.certExpiresInDays), 0) /
              Math.max(1, state.caregivers.length * 10)
            ).toFixed(1)
          )
        : 4.5,
  };

  const liveRestrictedIncidents: RestrictedIncident[] = state.incidents
    .filter((inc) => inc.isRestricted && inc.status !== "Closed")
    .map((inc) => {
      const patient = inc.peopleInvolved.find((p) => p.role === "Patient")?.name || "Agency / PHI Record";
      const deadlineMins = inc.regulatoryReport.deadline
        ? Math.max(60, Math.round((new Date(inc.regulatoryReport.deadline).getTime() - nowMs) / 60000))
        : 24 * 60;
      return {
        id: inc.id,
        client: patient,
        date: inc.reportedDate,
        type: inc.type,
        notificationChainStatus: inc.supervisorAlert
          ? "Executive & QA Officer Notified"
          : "Logged in Restricted Vault",
        stateReportingDeadline: deadlineMins,
        investigationStatus:
          inc.status === "Investigated"
            ? "Under Review"
            : inc.status === "Corrective Action"
              ? "Pending Sign-off"
              : "Open",
      };
    });

  const readinessScore = computeSurveyReadinessScore(
    state.incidents,
    state.stateDeadlines,
    state.verificationQueue,
    state.caregivers
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterOptions = ["This Week", "This Month", "This Quarter", "This Year", "All Time"];

  return (
    <div className="full-width space-y-4">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Good morning, David</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            {state.verificationQueue.length} credential(s) pending, {liveRestrictedIncidents.length} restricted incident(s) open, survey readiness at {readinessScore}%
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="hidden sm:flex items-center gap-2 bg-white border border-border-subtle rounded-full px-4 py-2 shadow-[0_6px_32px_rgba(0,0,0,0.06)] text-sm text-slate-700 font-medium transition-colors whitespace-nowrap active:scale-95 hover:bg-slate-50">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              {selectedFilter}
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 py-1">
                {filterOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedFilter(option);
                      setIsFilterOpen(false);
                      toast.success(`Filter applied: ${option}`);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${selectedFilter === option ? 'text-brand-teal font-medium bg-slate-50/50' : 'text-slate-700'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              logAuditEvent({
                action: "EXPORT",
                resourceType: "Compliance",
                resourceId: `qa-summary-${selectedFilter.toLowerCase().replace(/\s+/g, "-")}`,
                summary: `Generated HIPAA/State Survey Readiness report (${readinessScore}% readiness).`,
                status: "Success",
              });
              toast.success("Survey Readiness Compliance Report generated & audited");
            }}
            className="flex items-center gap-2 bg-brand-teal text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-brand-teal/90 transition-colors shadow-[0_6px_32px_rgba(0,0,0,0.06)] shadow-brand-teal/20 whitespace-nowrap active:scale-95">
            <FileDown className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Row 1: Live KPI Strip */}
      <div className="w-full">
        <KpiCardStrip data={liveKpiSummary} />
      </div>

      {/* Main Grid Layout for better responsiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
        
        {/* Restricted Incident Queue */}
        <div className="col-span-1 lg:col-span-2 xl:col-span-2 h-auto lg:h-[450px]">
          <RestrictedIncidentQueue incidents={liveRestrictedIncidents} />
        </div>

        {/* Verification Queue */}
        <div className="col-span-1 h-auto lg:h-[450px]">
          <VerificationQueue items={state.verificationQueue} />
        </div>

        {/* State Reporting Deadline Tracker */}
        <div className="col-span-1 h-auto lg:h-[450px]">
          <StateReportingDeadlineTracker deadlines={state.stateDeadlines} />
        </div>

        {/* Quality Trends */}
        <div className="col-span-1 lg:col-span-2 xl:col-span-2 h-auto lg:h-[450px]">
          <QualityTrends />
        </div>

      </div>
    </div>
  );
}
