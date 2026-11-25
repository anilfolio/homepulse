"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Download,
  Calendar as CalendarIcon,
  LayoutDashboard,
  ListChecks,
  AlertTriangle,
  Send,
  Clock,
  MapPin,
  FileCheck2,
  Building2,
} from "lucide-react";
import clsx from "clsx";

import { ExceptionCategory } from "./types";
import { EVVNavTab, useEvvVisits } from "./EvvVisitsContext";
import { EvvOverviewTab } from "./_components/EvvOverviewTab";
import { VisitsTable } from "./_components/VisitsTable";
import { AggregatorBillingTab } from "./_components/AggregatorBillingTab";
import { BulkConfirmModal } from "./_components/BulkConfirmModal";

export default function EVVMonitoringPage() {
  const router = useRouter();
  const {
    visits,
    capabilities,
    activeTab,
    exceptionFilterPreset,
    setExceptionFilterPreset,
    navigateTab,
    showToast,
    updateVisit,
    bulkConfirmVisits,
    bulkSubmitAggregator,
  } = useEvvVisits();

  const [bulkConfirmIds, setBulkConfirmIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState("Today & Recent");
  const [stateFilter, setStateFilter] = useState("All");
  const [showCalendar, setShowCalendar] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const scopedVisits = useMemo(() => {
    return visits.filter((v) => {
      if (dateRange === "Today Only" && v.visitDateLabel !== "Today") {
        return false;
      }
      if (stateFilter !== "All" && v.ruleProfile.state !== stateFilter) {
        return false;
      }
      return true;
    });
  }, [visits, dateRange, stateFilter]);

  const bulkModalVisits = useMemo(
    () => scopedVisits.filter((v) => bulkConfirmIds.includes(v.id)),
    [scopedVisits, bulkConfirmIds]
  );

  const openExceptionsCount = useMemo(
    () => scopedVisits.filter((v) => v.evvCompliance === "Exception").length,
    [scopedVisits]
  );

  const handleExportCsv = (ids?: string[]) => {
    if (!capabilities.canExportCsv) return;
    setIsDownloading(true);
    const exportRows =
      ids && ids.length > 0
        ? scopedVisits.filter((v) => ids.includes(v.id))
        : scopedVisits;
    setTimeout(() => {
      const header =
        "VisitID,VisitStatus,CaregiverID,ClientID,Service,Scheduled,Actual,Method,EVVCompliance,ExceptionReason,Aggregator,Billing,Payroll";
      const lines = exportRows.map((v) =>
        [
          v.id,
          v.visitStatus,
          v.caregiver.id,
          v.client.id,
          v.service.name,
          `${v.scheduledTime.start}-${v.scheduledTime.end}`,
          `${v.actualTime.start ?? "Missing"}-${v.actualTime.end ?? "Missing"}`,
          v.evvMethod,
          v.evvCompliance,
          `"${v.exceptionCategory}"`,
          v.processing.aggregator,
          v.processing.billing,
          v.processing.payroll,
        ].join(",")
      );
      const csvContent = `data:text/csv;charset=utf-8,${[header, ...lines].join("\n")}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "homepulse_evv_visits.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsDownloading(false);
      showToast(`Exported ${exportRows.length} visit record(s) to CSV.`);
    }, 450);
  };

  const navTabs = useMemo(() => {
    const allTabs: {
      id: EVVNavTab;
      label: string;
      subtitle: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: number;
      visible: boolean;
    }[] = [
      {
        id: "overview",
        label: "EVV Overview",
        subtitle: "Compliance & trends",
        icon: LayoutDashboard,
        visible: capabilities.canViewOverview,
      },
      {
        id: "visits",
        label: "All Visits",
        subtitle: "Unified operational grid",
        icon: ListChecks,
        badge: scopedVisits.length,
        visible: capabilities.canViewAllVisits,
      },
      {
        id: "exceptions",
        label: "Exceptions",
        subtitle: capabilities.canResolveExceptions
          ? "Guided resolution queue"
          : "Exception visibility queue",
        icon: AlertTriangle,
        badge: openExceptionsCount,
        visible: capabilities.canViewExceptions,
      },
      {
        id: "aggregator",
        label: "Aggregator & Billing",
        subtitle: "Submission, holds & rules",
        icon: Send,
        visible: capabilities.canViewAggregatorTab,
      },
    ];
    return allTabs.filter((t) => t.visible);
  }, [capabilities, scopedVisits.length, openExceptionsCount]);

  return (
    <div className="flex-1 min-h-screen">
      <div className="space-y-5">
        {/* Executive Command Header */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_8px_32px_rgba(20,29,60,0.04)] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-gradient-to-l from-[#6C88FF]/8 via-[#57EAB6]/5 to-transparent pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                EVV & Visits
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {openExceptionsCount} Open Exception
                {openExceptionsCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto relative z-10">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Filter by state or payer jurisdiction"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="All">All Jurisdictions</option>
                <option value="OH">OH Medicaid</option>
                <option value="NJ">NJ FamilyCare</option>
                <option value="FL">FL AHCA</option>
                <option value="Agency">Private Pay</option>
              </select>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCalendar((p) => !p)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
              >
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                {dateRange}
              </button>
              {showCalendar && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-40 p-1.5">
                  {[
                    "Today Only",
                    "Today & Recent",
                    "This Week",
                    "Pay Period",
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => {
                        setDateRange(opt);
                        setShowCalendar(false);
                      }}
                      className={clsx(
                        "w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer",
                        dateRange === opt
                          ? "bg-brand-primary/10 text-brand-primary font-bold"
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {capabilities.canExportCsv && (
              <button
                type="button"
                onClick={() => handleExportCsv()}
                disabled={isDownloading}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#6C88FF] to-[#5371F3] hover:from-[#5A77FF] hover:to-[#4362E6] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#6C88FF]/25 hover:shadow-lg active:scale-95 whitespace-nowrap disabled:opacity-60 cursor-pointer"
              >
                <Download
                  className={clsx("w-4 h-4", isDownloading && "animate-bounce")}
                />
                {isDownloading ? "Exporting..." : "Export CSV"}
              </button>
            )}
          </div>
        </div>

        {/* Segmented Executive Navigation */}
        <div
          className={clsx(
            "grid gap-2 bg-white/85 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200/80 shadow-[0_6px_28px_rgba(20,29,60,0.04)]",
            navTabs.length === 4
              ? "grid-cols-2 lg:grid-cols-4"
              : navTabs.length === 3
                ? "grid-cols-1 sm:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2"
          )}
        >
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => navigateTab(tab.id)}
                className={clsx(
                  "relative flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer",
                  isActive
                    ? "text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="evv-main-nav"
                    className="absolute inset-0 bg-gradient-to-r from-[#141D3C] to-[#1E2B58] rounded-xl shadow-[0_8px_20px_rgba(20,29,60,0.2)]"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.16, duration: 0.42 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                  <div
                    className={clsx(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      isActive
                        ? "bg-white/10 text-[#57EAB6]"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={clsx(
                        "text-xs sm:text-sm font-bold truncate",
                        isActive ? "text-white" : "text-slate-800"
                      )}
                    >
                      {tab.label}
                    </div>
                    <div
                      className={clsx(
                        "text-[10px] hidden sm:block truncate",
                        isActive ? "text-slate-300" : "text-slate-400"
                      )}
                    >
                      {tab.subtitle}
                    </div>
                  </div>
                </div>
                {tab.badge !== undefined && (
                  <span
                    className={clsx(
                      "relative z-10 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 tabular-nums",
                      tab.id === "exceptions" && tab.badge > 0
                        ? isActive
                          ? "bg-red-500 text-white"
                          : "bg-red-100 text-red-700"
                        : isActive
                          ? "bg-[#57EAB6]/20 text-[#57EAB6] border border-[#57EAB6]/30"
                          : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Section 1: EVV Overview */}
        {activeTab === "overview" && (
          <EvvOverviewTab
            visits={scopedVisits}
            capabilities={capabilities}
            onNavigateTab={navigateTab}
            onReviewVisit={(visit) => router.push(`/evv-monitoring/${visit.id}`)}
          />
        )}

        {/* Section 2: All Visits */}
        {activeTab === "visits" && (
          <VisitsTable
            key={`all-visits-${dateRange}-${stateFilter}`}
            visits={scopedVisits}
            capabilities={capabilities}
            mode="all"
            onBulkConfirm={(ids) => setBulkConfirmIds(ids)}
            onBulkSubmitAggregator={bulkSubmitAggregator}
            onExportSelected={handleExportCsv}
          />
        )}

        {/* Section 3: Exceptions */}
        {activeTab === "exceptions" && capabilities.canViewExceptions && (
          <div className="space-y-4">
            {/* Exception Workflow Playbook Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setExceptionFilterPreset("Missed In")}
                className="text-left bg-white/90 backdrop-blur-xl rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:border-brand-primary/40 hover:-translate-y-0.5 transition-all flex items-start gap-3 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Missed In / Missed Out
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Capture missing start or end punch while preserving raw
                    original EVV events.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExceptionFilterPreset("Missed Call")}
                className="text-left bg-white/90 backdrop-blur-xl rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:border-brand-primary/40 hover:-translate-y-0.5 transition-all flex items-start gap-3 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Missed Call & Manual Attestation
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Confirm via signed timesheet, alternate IVR voice, and
                    mandatory attestation.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setExceptionFilterPreset(
                    "Location Mismatch" as ExceptionCategory
                  )
                }
                className="text-left bg-white/90 backdrop-blur-xl rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:border-brand-primary/40 hover:-translate-y-0.5 transition-all flex items-start gap-3 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-primary border border-blue-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Location & Verification Review
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Update service addresses, link patient phones, and verify
                    GPS/IVR variance.
                  </div>
                </div>
              </button>
            </div>

            <VisitsTable
              key={`exceptions-table-${exceptionFilterPreset}-${dateRange}-${stateFilter}`}
              visits={scopedVisits}
              capabilities={capabilities}
              mode="exceptions"
              initialExceptionFilter={exceptionFilterPreset}
              onBulkConfirm={(ids) => setBulkConfirmIds(ids)}
              onBulkSubmitAggregator={bulkSubmitAggregator}
              onExportSelected={handleExportCsv}
            />
          </div>
        )}

        {/* Section 4: Aggregator & Billing */}
        {activeTab === "aggregator" && capabilities.canViewAggregatorTab && (
          <AggregatorBillingTab
            visits={scopedVisits}
            capabilities={capabilities}
            onUpdateVisit={updateVisit}
          />
        )}
      </div>

      {/* Bulk Confirmation & Attestation Modal */}
      {capabilities.canBulkConfirm && (
        <BulkConfirmModal
          isOpen={bulkConfirmIds.length > 0}
          selectedVisits={bulkModalVisits}
          onClose={() => setBulkConfirmIds([])}
          onConfirm={bulkConfirmVisits}
        />
      )}
    </div>
  );
}
