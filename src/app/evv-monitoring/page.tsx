"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Calendar as CalendarIcon,
  LayoutDashboard,
  ListChecks,
  AlertTriangle,
  Send,
  Info,
} from "lucide-react";
import clsx from "clsx";

import { initialVisits, REASON_CODES } from "./mockData";
import { EVVVisit, ExceptionCategory } from "./types";
import {
  computeMaxTimeVarianceMinutes,
  createAuditEvent,
  deriveVisitStatus,
  nextId,
} from "./evvRules";

import { EvvOverviewTab } from "./_components/EvvOverviewTab";
import { VisitsTable } from "./_components/VisitsTable";
import { AggregatorBillingTab } from "./_components/AggregatorBillingTab";
import { VisitReviewDrawer } from "./_components/VisitReviewDrawer";
import { BulkConfirmModal } from "./_components/BulkConfirmModal";

type EVVNavTab = "overview" | "visits" | "exceptions" | "aggregator";

export default function EVVMonitoringPage() {
  const [visits, setVisits] = useState<EVVVisit[]>(initialVisits);
  const [activeTab, setActiveTab] = useState<EVVNavTab>("visits");
  const [exceptionFilterPreset, setExceptionFilterPreset] = useState<
    ExceptionCategory | "All"
  >("All");
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [bulkConfirmIds, setBulkConfirmIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState("Today & Recent");
  const [showCalendar, setShowCalendar] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedVisit = useMemo(
    () => visits.find((v) => v.id === selectedVisitId) ?? null,
    [visits, selectedVisitId]
  );

  const bulkModalVisits = useMemo(
    () => visits.filter((v) => bulkConfirmIds.includes(v.id)),
    [visits, bulkConfirmIds]
  );

  const openExceptionsCount = useMemo(
    () => visits.filter((v) => v.evvCompliance === "Exception").length,
    [visits]
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateVisit = (updated: EVVVisit, toast?: string) => {
    setVisits((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    if (toast) showToast(toast);
  };

  const handleNavigateTab = (tab: EVVNavTab, exceptionFilter?: ExceptionCategory) => {
    if (exceptionFilter) {
      setExceptionFilterPreset(exceptionFilter);
    } else if (tab !== "exceptions") {
      setExceptionFilterPreset("All");
    }
    setActiveTab(tab);
  };

  const handleExportCsv = (ids?: string[]) => {
    setIsDownloading(true);
    const exportRows = ids && ids.length > 0 ? visits.filter((v) => ids.includes(v.id)) : visits;
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
    }, 500);
  };

  const handleBulkConfirmSave = (payload: {
    visitIds: string[];
    reasonCode: string;
    attestationRef: string;
    notes: string;
    useScheduledTimes: boolean;
  }) => {
    const reasonObj = REASON_CODES.find((r) => r.code === payload.reasonCode);
    const nowIso = new Date().toISOString();

    setVisits((prev) =>
      prev.map((v) => {
        if (!payload.visitIds.includes(v.id)) return v;

        const nextStart =
          payload.useScheduledTimes && !v.actualTime.start
            ? v.scheduledTime.start
            : v.actualTime.start;
        const nextEnd =
          payload.useScheduledTimes && !v.actualTime.end
            ? v.scheduledTime.end
            : v.actualTime.end;

        const nextVisitStatus = deriveVisitStatus(
          nextStart,
          nextEnd,
          v.scheduledWindowPassed
        );
        const nextDelta = computeMaxTimeVarianceMinutes(
          v.scheduledTime.start,
          v.scheduledTime.end,
          nextStart,
          nextEnd
        );

        return {
          ...v,
          actualTime: { start: nextStart, end: nextEnd },
          visitStatus: nextVisitStatus,
          timeDeltaMinutes: nextDelta,
          evvCompliance: "Resolved",
          exceptionSeverity: "info",
          exceptionDetail: `Resolved after bulk review (${payload.reasonCode})`,
          resolution: {
            acknowledged: true,
            acknowledgedAt: nowIso,
            acknowledgedBy: "Admin Coordinator",
            reasonCode: payload.reasonCode,
            reasonLabel: reasonObj?.label,
            resolutionCode: "RES-CALL-TS",
            resolutionLabel: "Manual timesheet confirmation with attestation",
            notes: payload.notes,
            attestationConfirmed: true,
            attestationRef: payload.attestationRef,
            resolvedAt: nowIso,
            resolvedBy: "Admin Coordinator",
          },
          auditHistory: [
            createAuditEvent({
              actorName: "Admin Coordinator",
              actorRole: "ADMIN",
              actionType: "MANUAL_CONFIRMATION",
              summary: `Bulk visit confirmation with documentation attestation (${payload.attestationRef}). Original EVV events preserved.`,
              reasonCode: payload.reasonCode,
              resolutionCode: "RES-CALL-TS",
              previousValue: `In: ${v.originalEvv.clockIn ?? "null"} / Out: ${v.originalEvv.clockOut ?? "null"}`,
              newValue: `In: ${nextStart ?? "null"} / Out: ${nextEnd ?? "null"}`,
            }),
            ...v.auditHistory,
          ],
        };
      })
    );

    showToast(
      `Confirmed ${payload.visitIds.length} visit(s) with documentation attestation.`
    );
  };

  const handleBulkSubmitAggregator = (visitIds: string[]) => {
    let submittedCount = 0;
    let skippedExceptions = 0;

    setVisits((prev) =>
      prev.map((v) => {
        if (!visitIds.includes(v.id)) return v;
        if (v.evvCompliance === "Exception") {
          skippedExceptions += 1;
          return v;
        }
        submittedCount += 1;
        return {
          ...v,
          processing: {
            ...v.processing,
            aggregator: "Submitted",
            aggregatorRef: nextId("BATCH"),
          },
          auditHistory: [
            createAuditEvent({
              actorName: "Admin Coordinator",
              actorRole: "ADMIN",
              actionType: "AGGREGATOR_SUBMITTED",
              summary: `Bulk submitted to ${v.ruleProfile.aggregator}.`,
              previousValue: v.processing.aggregator,
              newValue: "Submitted",
            }),
            ...v.auditHistory,
          ],
        };
      })
    );

    if (skippedExceptions > 0) {
      showToast(
        `Submitted ${submittedCount} eligible visit(s); ${skippedExceptions} unresolved exception(s) held.`
      );
    } else {
      showToast(`Submitted ${submittedCount} visit(s) to state aggregator.`);
    }
  };

  const navTabs: {
    id: EVVNavTab;
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: "overview",
      label: "EVV Overview",
      subtitle: "Compliance & trends",
      icon: LayoutDashboard,
    },
    {
      id: "visits",
      label: "All Visits",
      subtitle: "Unified operational table",
      icon: ListChecks,
      badge: visits.length,
    },
    {
      id: "exceptions",
      label: "Exceptions",
      subtitle: "Resolution queue",
      icon: AlertTriangle,
      badge: openExceptionsCount,
    },
    {
      id: "aggregator",
      label: "Aggregator & Billing",
      subtitle: "Submission, holds & rules",
      icon: Send,
    },
  ];

  return (
    <div className="flex-1 min-h-screen">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                EVV & Visits
              </h1>
              <span className="text-xs font-bold bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full">
                {openExceptionsCount} Open Exception{openExceptionsCount === 1 ? "" : "s"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Operational visit visibility, exception resolution, patient verification, and aggregator/billing/payroll readiness.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <button
                type="button"
                onClick={() => setShowCalendar((p) => !p)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                {dateRange}
              </button>
              {showCalendar && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-40 p-2">
                  {["Today Only", "Today & Recent", "This Week", "Pay Period"].map((opt) => (
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

            <button
              type="button"
              onClick={() => handleExportCsv()}
              disabled={isDownloading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-brand-primary/90 transition-all shadow-sm whitespace-nowrap disabled:opacity-60 cursor-pointer"
            >
              <Download className={clsx("w-4 h-4", isDownloading && "animate-bounce")} />
              {isDownloading ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>

        {/* Proposed 4-Section Navigation */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => handleNavigateTab(tab.id)}
                className={clsx(
                  "relative flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer",
                  isActive
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/70"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="evv-main-nav"
                    className="absolute inset-0 bg-brand-primary/10 border border-brand-primary/25 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                  <tab.icon
                    className={clsx(
                      "w-4 h-4 shrink-0",
                      isActive ? "text-brand-primary" : "text-slate-400"
                    )}
                  />
                  <div className="min-w-0">
                    <div
                      className={clsx(
                        "text-xs sm:text-sm font-bold truncate",
                        isActive ? "text-brand-navy" : "text-slate-700"
                      )}
                    >
                      {tab.label}
                    </div>
                    <div className="text-[10px] text-slate-400 hidden sm:block truncate">
                      {tab.subtitle}
                    </div>
                  </div>
                </div>
                {tab.badge !== undefined && (
                  <span
                    className={clsx(
                      "relative z-10 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0",
                      tab.id === "exceptions" && tab.badge > 0
                        ? "bg-red-100 text-red-700"
                        : isActive
                          ? "bg-brand-primary text-white"
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
            visits={visits}
            onNavigateTab={handleNavigateTab}
            onReviewVisit={(visit) => setSelectedVisitId(visit.id)}
          />
        )}

        {/* Section 2: All Visits */}
        {activeTab === "visits" && (
          <VisitsTable
            key="all-visits-table"
            visits={visits}
            mode="all"
            onReviewVisit={(visit) => setSelectedVisitId(visit.id)}
            onBulkConfirm={(ids) => setBulkConfirmIds(ids)}
            onBulkSubmitAggregator={handleBulkSubmitAggregator}
            onExportSelected={handleExportCsv}
          />
        )}

        {/* Section 3: Exceptions */}
        {activeTab === "exceptions" && (
          <div className="space-y-4">
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Distinct Resolution Workflows:</strong> Missed In, Missed Out, Missed Call, Location Mismatch, Time Variance, and Verification failures route into tailored 5-step resolution workflows with original event preservation and documentation attestation.
                </div>
              </div>
            </div>

            <VisitsTable
              key={`exceptions-table-${exceptionFilterPreset}`}
              visits={visits}
              mode="exceptions"
              initialExceptionFilter={exceptionFilterPreset}
              onReviewVisit={(visit) => setSelectedVisitId(visit.id)}
              onBulkConfirm={(ids) => setBulkConfirmIds(ids)}
              onBulkSubmitAggregator={handleBulkSubmitAggregator}
              onExportSelected={handleExportCsv}
            />
          </div>
        )}

        {/* Section 4: Aggregator & Billing */}
        {activeTab === "aggregator" && (
          <AggregatorBillingTab
            visits={visits}
            onReviewVisit={(visit) => setSelectedVisitId(visit.id)}
            onUpdateVisit={handleUpdateVisit}
          />
        )}
      </div>

      {/* Review & Resolution Slide-Over Drawer */}
      <VisitReviewDrawer
        visit={selectedVisit}
        onClose={() => setSelectedVisitId(null)}
        onUpdateVisit={handleUpdateVisit}
      />

      {/* Bulk Confirmation & Attestation Modal */}
      <BulkConfirmModal
        isOpen={bulkConfirmIds.length > 0}
        selectedVisits={bulkModalVisits}
        onClose={() => setBulkConfirmIds([])}
        onConfirm={handleBulkConfirmSave}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-brand-navy text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl shadow-xl border border-white/10 z-[100]">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
