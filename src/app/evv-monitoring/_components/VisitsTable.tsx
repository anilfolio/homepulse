"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  MapPin,
  PhoneCall,
  Cpu,
  PenLine,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Mic,
  FileSignature,
  CheckSquare,
  Send,
  Download,
  Filter,
  X,
} from "lucide-react";
import clsx from "clsx";
import {
  EVVComplianceStatus,
  EVVMethod,
  EVVVisit,
  ExceptionCategory,
  VisitStatus,
} from "../types";
import { maskPhoneNumber } from "../evvRules";

interface VisitsTableProps {
  visits: EVVVisit[];
  mode?: "all" | "exceptions";
  initialExceptionFilter?: ExceptionCategory | "All";
  onReviewVisit: (visit: EVVVisit) => void;
  onBulkConfirm: (visitIds: string[]) => void;
  onBulkSubmitAggregator: (visitIds: string[]) => void;
  onExportSelected: (visitIds: string[]) => void;
}

const visitStatusStyles: Record<VisitStatus, string> = {
  Completed: "bg-slate-100 text-slate-700 border-slate-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  Incomplete: "bg-red-50 text-red-700 border-red-200",
  "Not Started": "bg-slate-50 text-slate-500 border-slate-200",
};

const complianceStyles: Record<EVVComplianceStatus, string> = {
  Verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Exception: "bg-red-50 text-red-700 border-red-200",
  Resolved: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const methodConfig: Record<
  EVVMethod,
  { icon: React.ComponentType<{ className?: string }>; style: string }
> = {
  GPS: { icon: MapPin, style: "bg-blue-50 text-blue-700 border-blue-200" },
  IVR: { icon: PhoneCall, style: "bg-purple-50 text-purple-700 border-purple-200" },
  Fixed: { icon: Cpu, style: "bg-slate-100 text-slate-700 border-slate-200" },
  Manual: { icon: PenLine, style: "bg-amber-50 text-amber-800 border-amber-200" },
};

function getProcessingBadgeStyle(status: string): string {
  switch (status) {
    case "Accepted":
    case "Cleared":
    case "Billed":
    case "Approved":
    case "Processed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Submitted":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Rejected":
    case "Hold":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export function VisitsTable({
  visits,
  mode = "all",
  initialExceptionFilter = "All",
  onReviewVisit,
  onBulkConfirm,
  onBulkSubmitAggregator,
  onExportSelected,
}: VisitsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [complianceFilter, setComplianceFilter] = useState<EVVComplianceStatus | "All">(
    mode === "exceptions" ? "Exception" : "All"
  );
  const [visitStatusFilter, setVisitStatusFilter] = useState<VisitStatus | "All">("All");
  const [exceptionFilter, setExceptionFilter] = useState<ExceptionCategory | "All">(
    initialExceptionFilter
  );
  const [methodFilter, setMethodFilter] = useState<EVVMethod | "All">("All");
  const [billingHoldOnly, setBillingHoldOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const baseVisits = useMemo(() => {
    if (mode === "exceptions") {
      return visits.filter(
        (v) => v.evvCompliance === "Exception" || v.evvCompliance === "Resolved"
      );
    }
    return visits;
  }, [visits, mode]);

  const filteredVisits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return baseVisits.filter((v) => {
      if (complianceFilter !== "All" && v.evvCompliance !== complianceFilter) return false;
      if (visitStatusFilter !== "All" && v.visitStatus !== visitStatusFilter) return false;
      if (exceptionFilter !== "All" && v.exceptionCategory !== exceptionFilter) return false;
      if (methodFilter !== "All" && v.evvMethod !== methodFilter) return false;
      if (billingHoldOnly && v.processing.billing !== "Hold") return false;
      if (!q) return true;
      return (
        v.id.toLowerCase().includes(q) ||
        v.caregiver.name.toLowerCase().includes(q) ||
        v.caregiver.id.toLowerCase().includes(q) ||
        v.client.name.toLowerCase().includes(q) ||
        v.client.id.toLowerCase().includes(q) ||
        v.service.name.toLowerCase().includes(q) ||
        v.exceptionDetail.toLowerCase().includes(q)
      );
    });
  }, [
    baseVisits,
    searchQuery,
    complianceFilter,
    visitStatusFilter,
    exceptionFilter,
    methodFilter,
    billingHoldOnly,
  ]);

  const allSelected =
    filteredVisits.length > 0 && filteredVisits.every((v) => selectedIds.includes(v.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredVisits.map((v) => v.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setComplianceFilter(mode === "exceptions" ? "Exception" : "All");
    setVisitStatusFilter("All");
    setExceptionFilter("All");
    setMethodFilter("All");
    setBillingHoldOnly(false);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    (mode === "all" && complianceFilter !== "All") ||
    (mode === "exceptions" && complianceFilter !== "Exception") ||
    visitStatusFilter !== "All" ||
    exceptionFilter !== "All" ||
    methodFilter !== "All" ||
    billingHoldOnly;

  const exceptionCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "Location Mismatch": 0,
      "Missed In": 0,
      "Missed Out": 0,
      "Missed Call": 0,
      "Time Variance": 0,
      "Verification Missing": 0,
    };
    visits.forEach((v) => {
      if (v.evvCompliance === "Exception" && counts[v.exceptionCategory] !== undefined) {
        counts[v.exceptionCategory] += 1;
      }
    });
    return counts;
  }, [visits]);

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_6px_32px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Toolbar & Multi-Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 space-y-3 bg-slate-50/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Visit ID, caregiver, client, ID, or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by EVV compliance"
              value={complianceFilter}
              onChange={(e) =>
                setComplianceFilter(e.target.value as EVVComplianceStatus | "All")
              }
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="All">Compliance: All</option>
              <option value="Verified">Verified</option>
              <option value="Exception">Exception</option>
              <option value="Resolved">Resolved (Post-Review)</option>
            </select>

            <select
              aria-label="Filter by visit lifecycle status"
              value={visitStatusFilter}
              onChange={(e) => setVisitStatusFilter(e.target.value as VisitStatus | "All")}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="All">Visit Status: All</option>
              <option value="Completed">Completed</option>
              <option value="Incomplete">Incomplete</option>
              <option value="In Progress">In Progress</option>
              <option value="Not Started">Not Started</option>
            </select>

            <select
              aria-label="Filter by EVV method"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as EVVMethod | "All")}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="All">Method: All</option>
              <option value="GPS">GPS</option>
              <option value="IVR">IVR</option>
              <option value="Fixed">Fixed</option>
              <option value="Manual">Manual</option>
            </select>

            <button
              type="button"
              onClick={() => setBillingHoldOnly((prev) => !prev)}
              className={clsx(
                "px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer",
                billingHoldOnly
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Billing Holds Only
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Exception Category Quick Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setExceptionFilter("All")}
            className={clsx(
              "px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer",
              exceptionFilter === "All"
                ? "bg-brand-navy text-white border-brand-navy"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            )}
          >
            All Issues ({baseVisits.length})
          </button>
          {(
            [
              "Location Mismatch",
              "Missed In",
              "Missed Out",
              "Missed Call",
              "Time Variance",
              "Verification Missing",
            ] as ExceptionCategory[]
          ).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setExceptionFilter(exceptionFilter === cat ? "All" : cat)}
              className={clsx(
                "px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5",
                exceptionFilter === cat
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              <span>{cat}</span>
              <span
                className={clsx(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                  exceptionFilter === cat
                    ? "bg-white/20 text-white"
                    : exceptionCounts[cat] > 0
                      ? "bg-red-50 text-red-600"
                      : "bg-slate-100 text-slate-500"
                )}
              >
                {exceptionCounts[cat]}
              </span>
            </button>
          ))}
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-navy text-white px-4 py-2.5 rounded-xl shadow-md">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <CheckSquare className="w-4 h-4 text-brand-mint" />
              <span>{selectedIds.length} visit(s) selected</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onBulkConfirm(selectedIds)}
                className="px-3 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Bulk Confirm & Attest
              </button>
              <button
                type="button"
                onClick={() => {
                  onBulkSubmitAggregator(selectedIds);
                  setSelectedIds([]);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Submit to Aggregator
              </button>
              <button
                type="button"
                onClick={() => onExportSelected(selectedIds)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2 py-1.5 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Horizontally Scrollable Table with Sticky Left Columns */}
      <div className="overflow-x-auto custom-scrollbar relative">
        <table className="w-full min-w-[1620px] border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-3 w-[44px] lg:sticky lg:left-0 lg:z-20 bg-slate-50">
                <input
                  type="checkbox"
                  aria-label="Select all visible visits"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                />
              </th>
              <th className="py-3 px-3 w-[156px] lg:sticky lg:left-[44px] lg:z-20 bg-slate-50">
                Visit ID
              </th>
              <th className="py-3 px-3 w-[170px] lg:sticky lg:left-[200px] lg:z-20 bg-slate-50">
                Caregiver
              </th>
              <th className="py-3 px-3 w-[175px] lg:sticky lg:left-[370px] lg:z-20 bg-slate-50 lg:shadow-[4px_0_10px_-4px_rgba(15,23,42,0.12)] border-r border-slate-200/70">
                Client
              </th>
              <th className="py-3 px-3 w-[145px]">Service</th>
              <th className="py-3 px-3 w-[145px]">Scheduled</th>
              <th className="py-3 px-3 w-[160px]">Actual</th>
              <th className="py-3 px-3 w-[105px]">EVV Method</th>
              <th className="py-3 px-3 w-[135px]">EVV Compliance</th>
              <th className="py-3 px-3 w-[225px]">Exception Reason</th>
              <th className="py-3 px-3 w-[145px]">Verification</th>
              <th className="py-3 px-3 w-[195px]">Processing</th>
              <th className="py-3 px-3 w-[105px] text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredVisits.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-900">No matching visits found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Adjust your filters or search query to inspect other visit records.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredVisits.map((visit) => {
                const isSelected = selectedIds.includes(visit.id);
                const MethodIcon = methodConfig[visit.evvMethod].icon;
                const primaryPhone = visit.serviceLocation.associatedPhones[0];

                return (
                  <tr
                    key={visit.id}
                    onClick={() => onReviewVisit(visit)}
                    className={clsx(
                      "group border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer",
                      isSelected ? "bg-indigo-50/40" : "bg-white hover:bg-slate-50/80"
                    )}
                  >
                    {/* 1. Checkbox (Sticky) */}
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className={clsx(
                        "py-3 px-3 w-[44px] align-top lg:sticky lg:left-0 lg:z-10",
                        isSelected
                          ? "bg-indigo-50/95"
                          : "bg-white group-hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select visit ${visit.id}`}
                        checked={isSelected}
                        onChange={() => toggleSelectOne(visit.id)}
                        className="w-4 h-4 mt-1 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                      />
                    </td>

                    {/* 2. Visit ID (Sticky) */}
                    <td
                      className={clsx(
                        "py-3 px-3 w-[156px] align-top lg:sticky lg:left-[44px] lg:z-10",
                        isSelected
                          ? "bg-indigo-50/95"
                          : "bg-white group-hover:bg-slate-50"
                      )}
                    >
                      <div className="font-bold text-slate-900 text-xs font-mono">
                        {visit.id}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span
                          className={clsx(
                            "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold border",
                            visitStatusStyles[visit.visitStatus]
                          )}
                        >
                          {visit.visitStatus}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {visit.visitDateLabel}
                        </span>
                      </div>
                    </td>

                    {/* 3. Caregiver (Sticky) */}
                    <td
                      className={clsx(
                        "py-3 px-3 w-[170px] align-top lg:sticky lg:left-[200px] lg:z-10",
                        isSelected
                          ? "bg-indigo-50/95"
                          : "bg-white group-hover:bg-slate-50"
                      )}
                    >
                      <div className="font-semibold text-slate-900 text-xs leading-snug">
                        {visit.caregiver.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {visit.caregiver.id} · {visit.caregiver.role}
                      </div>
                    </td>

                    {/* 4. Client (Sticky with shadow divider) */}
                    <td
                      className={clsx(
                        "py-3 px-3 w-[175px] align-top lg:sticky lg:left-[370px] lg:z-10 lg:shadow-[4px_0_10px_-4px_rgba(15,23,42,0.12)] border-r border-slate-100",
                        isSelected
                          ? "bg-indigo-50/95"
                          : "bg-white group-hover:bg-slate-50"
                      )}
                    >
                      <div className="font-semibold text-slate-900 text-xs leading-snug">
                        {visit.client.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {visit.client.id}
                      </div>
                      {primaryPhone && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {maskPhoneNumber(primaryPhone.number)}
                        </div>
                      )}
                    </td>

                    {/* 5. Service */}
                    <td className="py-3 px-3 align-top">
                      <div className="font-semibold text-slate-800 text-xs">
                        {visit.service.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {visit.service.code} · {visit.ruleProfile.state}
                      </div>
                    </td>

                    {/* 6. Scheduled */}
                    <td className="py-3 px-3 align-top">
                      <div className="text-xs font-medium text-slate-800 whitespace-nowrap">
                        {visit.scheduledTime.start} – {visit.scheduledTime.end}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Tol: ±{visit.ruleProfile.timeToleranceMinutes}m
                      </div>
                    </td>

                    {/* 7. Actual */}
                    <td className="py-3 px-3 align-top">
                      <div className="text-xs font-semibold whitespace-nowrap flex items-center gap-1">
                        <span
                          className={
                            visit.actualTime.start
                              ? "text-slate-900"
                              : visit.visitStatus === "Not Started"
                                ? "text-slate-400"
                                : "text-red-600 font-bold"
                          }
                        >
                          {visit.actualTime.start ??
                            (visit.visitStatus === "Not Started" ? "—" : "Missing In")}
                        </span>
                        <span className="text-slate-400">–</span>
                        <span
                          className={
                            visit.actualTime.end
                              ? "text-slate-900"
                              : visit.visitStatus === "Not Started" ||
                                  visit.visitStatus === "In Progress"
                                ? "text-slate-400"
                                : "text-red-600 font-bold"
                          }
                        >
                          {visit.actualTime.end ??
                            (visit.visitStatus === "Not Started" ||
                            visit.visitStatus === "In Progress"
                              ? "—"
                              : "Missing Out")}
                        </span>
                      </div>
                      {visit.timeDeltaMinutes > 0 && (
                        <div
                          className={clsx(
                            "text-[10px] mt-0.5 font-medium",
                            visit.timeDeltaMinutes <=
                              visit.ruleProfile.timeToleranceMinutes
                              ? "text-emerald-600"
                              : "text-amber-700"
                          )}
                        >
                          {visit.timeDeltaMinutes <=
                          visit.ruleProfile.timeToleranceMinutes
                            ? `±${visit.timeDeltaMinutes}m (within rule)`
                            : `+${visit.timeDeltaMinutes}m variance`}
                        </div>
                      )}
                    </td>

                    {/* 8. EVV Method */}
                    <td className="py-3 px-3 align-top">
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                          methodConfig[visit.evvMethod].style
                        )}
                      >
                        <MethodIcon className="w-3 h-3" />
                        {visit.evvMethod}
                      </span>
                    </td>

                    {/* 9. EVV Compliance */}
                    <td className="py-3 px-3 align-top">
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border",
                          complianceStyles[visit.evvCompliance]
                        )}
                      >
                        {visit.evvCompliance === "Verified" && (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {visit.evvCompliance === "Exception" && (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {visit.evvCompliance === "Resolved" && (
                          <ShieldCheck className="w-3 h-3" />
                        )}
                        {visit.evvCompliance}
                      </span>
                      {visit.evvCompliance === "Resolved" && (
                        <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                          Resolved after review
                        </div>
                      )}
                    </td>

                    {/* 10. Exception Reason */}
                    <td className="py-3 px-3 align-top">
                      {visit.exceptionCategory === "None" ? (
                        <span className="text-xs text-slate-500">
                          {visit.exceptionDetail}
                        </span>
                      ) : (
                        <div>
                          <div
                            className={clsx(
                              "text-xs font-bold",
                              visit.evvCompliance === "Resolved"
                                ? "text-slate-700"
                                : "text-red-700"
                            )}
                          >
                            {visit.exceptionCategory}
                          </div>
                          <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                            {visit.exceptionDetail}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* 11. Verification (Signature / Voice) */}
                    <td className="py-3 px-3 align-top space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <FileSignature className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-slate-500">Sig:</span>
                        <span
                          className={clsx(
                            "font-semibold",
                            visit.verification.signatureStatus === "Captured"
                              ? "text-emerald-700"
                              : visit.verification.signatureStatus === "Pending" &&
                                  visit.ruleProfile.signatureRequirement === "Required"
                                ? "text-amber-700"
                                : "text-slate-500"
                          )}
                        >
                          {visit.verification.signatureStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Mic className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-slate-500">Voice:</span>
                        <span
                          className={clsx(
                            "font-semibold",
                            visit.verification.voiceStatus === "Captured"
                              ? "text-emerald-700"
                              : visit.verification.voiceStatus === "Pending" &&
                                  visit.ruleProfile.voiceRequirement === "Required"
                                ? "text-red-600"
                                : "text-slate-500"
                          )}
                        >
                          {visit.verification.voiceStatus}
                        </span>
                      </div>
                    </td>

                    {/* 12. Processing (Aggregator / Billing / Payroll) */}
                    <td className="py-3 px-3 align-top">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={clsx(
                            "px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap",
                            getProcessingBadgeStyle(visit.processing.aggregator)
                          )}
                        >
                          Agg: {visit.processing.aggregator}
                        </span>
                        <span
                          className={clsx(
                            "px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap",
                            getProcessingBadgeStyle(visit.processing.billing)
                          )}
                        >
                          Bill: {visit.processing.billing}
                        </span>
                        <span
                          className={clsx(
                            "px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap",
                            getProcessingBadgeStyle(visit.processing.payroll)
                          )}
                        >
                          Pay: {visit.processing.payroll}
                        </span>
                      </div>
                    </td>

                    {/* 13. Action */}
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="py-3 px-3 align-top text-right"
                    >
                      <button
                        type="button"
                        onClick={() => onReviewVisit(visit)}
                        className={clsx(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                          visit.evvCompliance === "Exception"
                            ? "bg-brand-primary text-white hover:bg-brand-primary/90 shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        )}
                      >
                        {visit.evvCompliance === "Exception" ? "Review" : "Inspect"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-800">{filteredVisits.length}</strong> of{" "}
          <strong className="text-slate-800">{baseVisits.length}</strong> visits
        </span>
        <span className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Visit status, EVV compliance, resolution, and aggregator/billing/payroll statuses are tracked independently.
        </span>
      </div>
    </div>
  );
}
