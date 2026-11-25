"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckSquare,
  Send,
  Download,
  Filter,
  X,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import {
  EVVComplianceStatus,
  EVVMethod,
  EVVVisit,
  ExceptionCategory,
  VisitStatus,
} from "../types";
import {
  complianceStyles,
  getInitials,
  methodConfig,
  visitStatusStyles,
} from "./evvStatusStyles";

interface VisitsTableProps {
  visits: EVVVisit[];
  mode?: "all" | "exceptions";
  initialExceptionFilter?: ExceptionCategory | "All";
  onBulkConfirm: (visitIds: string[]) => void;
  onBulkSubmitAggregator: (visitIds: string[]) => void;
  onExportSelected: (visitIds: string[]) => void;
}

export function VisitsTable({
  visits,
  mode = "all",
  initialExceptionFilter = "All",
  onBulkConfirm,
  onBulkSubmitAggregator,
  onExportSelected,
}: VisitsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [complianceFilter, setComplianceFilter] = useState<
    EVVComplianceStatus | "All"
  >(mode === "exceptions" ? "Exception" : "All");
  const [visitStatusFilter, setVisitStatusFilter] = useState<VisitStatus | "All">(
    "All"
  );
  const [exceptionFilter, setExceptionFilter] = useState<
    ExceptionCategory | "All"
  >(initialExceptionFilter);
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
      if (complianceFilter !== "All" && v.evvCompliance !== complianceFilter)
        return false;
      if (visitStatusFilter !== "All" && v.visitStatus !== visitStatusFilter)
        return false;
      if (exceptionFilter !== "All" && v.exceptionCategory !== exceptionFilter)
        return false;
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
        v.exceptionCategory.toLowerCase().includes(q) ||
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
    filteredVisits.length > 0 &&
    filteredVisits.every((v) => selectedIds.includes(v.id));

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
      if (
        v.evvCompliance === "Exception" &&
        counts[v.exceptionCategory] !== undefined
      ) {
        counts[v.exceptionCategory] += 1;
      }
    });
    return counts;
  }, [visits]);

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_10px_40px_rgba(20,29,60,0.05)] overflow-hidden">
      {/* Toolbar & Multi-Filter Command Deck */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 space-y-3.5 bg-gradient-to-b from-slate-50/90 to-white">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md group">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Visit ID, caregiver, client, or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by EVV compliance"
              value={complianceFilter}
              onChange={(e) =>
                setComplianceFilter(e.target.value as EVVComplianceStatus | "All")
              }
              className="px-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 cursor-pointer"
            >
              <option value="All">Compliance: All</option>
              <option value="Verified">Verified</option>
              <option value="Exception">Exception</option>
              <option value="Resolved">Resolved (Post-Review)</option>
            </select>

            <select
              aria-label="Filter by visit lifecycle status"
              value={visitStatusFilter}
              onChange={(e) =>
                setVisitStatusFilter(e.target.value as VisitStatus | "All")
              }
              className="px-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 cursor-pointer"
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
              onChange={(e) =>
                setMethodFilter(e.target.value as EVVMethod | "All")
              }
              className="px-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 cursor-pointer"
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
                "px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs",
                billingHoldOnly
                  ? "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-200"
                  : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Billing Holds Only
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Exception Category Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
          <button
            type="button"
            onClick={() => setExceptionFilter("All")}
            className={clsx(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap",
              exceptionFilter === "All"
                ? "bg-brand-navy text-white border-brand-navy shadow-xs"
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
              onClick={() =>
                setExceptionFilter(exceptionFilter === cat ? "All" : cat)
              }
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                exceptionFilter === cat
                  ? "bg-brand-primary text-white border-brand-primary shadow-sm shadow-brand-primary/20"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              <span>{cat}</span>
              <span
                className={clsx(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums",
                  exceptionFilter === cat
                    ? "bg-white/20 text-white"
                    : exceptionCounts[cat] > 0
                      ? "bg-red-50 text-red-600 border border-red-100"
                      : "bg-slate-100 text-slate-500"
                )}
              >
                {exceptionCounts[cat]}
              </span>
            </button>
          ))}
        </div>

        {/* Executive Bulk Action Dock */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#141D3C] to-[#1E2B58] text-white px-4 py-3 rounded-xl shadow-[0_10px_28px_rgba(20,29,60,0.22)] border border-[#2A3B75]/70">
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <span className="w-6 h-6 rounded-lg bg-[#57EAB6]/15 text-[#57EAB6] flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </span>
              <span>
                <strong className="tabular-nums">{selectedIds.length}</strong>{" "}
                visit(s) selected
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onBulkConfirm(selectedIds)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6C88FF] to-[#5371F3] hover:from-[#5A77FF] hover:to-[#4362E6] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
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
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#57EAB6]" />
                Submit to Aggregator
              </button>
              <button
                type="button"
                onClick={() => onExportSelected(selectedIds)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clean Summary Table (7 Core Columns) */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[780px] border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/95 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[44px]">
                <input
                  type="checkbox"
                  aria-label="Select all visible visits"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-4">Visit</th>
              <th className="py-3.5 px-4">Caregiver</th>
              <th className="py-3.5 px-4">Client</th>
              <th className="py-3.5 px-4">Time</th>
              <th className="py-3.5 px-4">
                {mode === "exceptions" ? "Issue & Status" : "EVV Status"}
              </th>
              <th className="py-3.5 px-4 text-right">Details</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredVisits.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-900">
                      No matching visits found
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Adjust your filters or search query to inspect other visit
                      records.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredVisits.map((visit) => {
                const isSelected = selectedIds.includes(visit.id);
                const MethodIcon = methodConfig[visit.evvMethod].icon;
                const detailHref = `/evv-monitoring/${visit.id}`;

                return (
                  <tr
                    key={visit.id}
                    onClick={() => router.push(detailHref)}
                    className={clsx(
                      "group border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer",
                      isSelected
                        ? "bg-indigo-50/50"
                        : "bg-white hover:bg-[#F8FAFF]"
                    )}
                  >
                    {/* 1. Checkbox */}
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="py-3.5 px-4 w-[44px] align-middle"
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select visit ${visit.id}`}
                        checked={isSelected}
                        onChange={() => toggleSelectOne(visit.id)}
                        className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                      />
                    </td>

                    {/* 2. Visit */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-bold text-slate-900 text-xs font-mono tabular-nums tracking-tight">
                        {visit.id}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span
                          className={clsx(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border",
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

                    {/* 3. Caregiver */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {getInitials(visit.caregiver.name)}
                        </div>
                        <span className="font-semibold text-slate-900 text-xs truncate">
                          {visit.caregiver.name}
                        </span>
                      </div>
                    </td>

                    {/* 4. Client */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {getInitials(visit.client.name)}
                        </div>
                        <span className="font-semibold text-slate-900 text-xs truncate">
                          {visit.client.name}
                        </span>
                      </div>
                    </td>

                    {/* 5. Time (Actual + compact Scheduled subline) */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="text-xs font-semibold whitespace-nowrap flex items-center gap-1 tabular-nums">
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
                            (visit.visitStatus === "Not Started"
                              ? "—"
                              : "Missing In")}
                        </span>
                        <span className="text-slate-300">–</span>
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
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5 whitespace-nowrap tabular-nums">
                        Sched: {visit.scheduledTime.start} –{" "}
                        {visit.scheduledTime.end}
                      </div>
                    </td>

                    {/* 6. EVV Status / Issue & Status */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap",
                            complianceStyles[visit.evvCompliance].pill
                          )}
                        >
                          <span
                            className={clsx(
                              "w-1.5 h-1.5 rounded-full",
                              complianceStyles[visit.evvCompliance].dot
                            )}
                          />
                          {visit.evvCompliance}
                        </span>

                        {mode === "exceptions" &&
                        visit.exceptionCategory !== "None" ? (
                          <span
                            className={clsx(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border whitespace-nowrap",
                              visit.evvCompliance === "Exception"
                                ? "bg-red-50/70 text-red-700 border-red-200/80"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            )}
                          >
                            {visit.evvCompliance === "Exception" && (
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                            )}
                            {visit.exceptionCategory}
                          </span>
                        ) : (
                          <span
                            className={clsx(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border whitespace-nowrap",
                              methodConfig[visit.evvMethod].style
                            )}
                          >
                            <MethodIcon className="w-3 h-3" />
                            {visit.evvMethod}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 7. Details Link */}
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="py-3.5 px-4 align-middle text-right"
                    >
                      <Link
                        href={detailHref}
                        className={clsx(
                          "inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                          visit.evvCompliance === "Exception"
                            ? "bg-gradient-to-r from-[#6C88FF] to-[#5371F3] hover:from-[#5A77FF] hover:to-[#4362E6] text-white shadow-sm shadow-[#6C88FF]/25 active:scale-95"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/70"
                        )}
                      >
                        <span>
                          {visit.evvCompliance === "Exception"
                            ? "Review"
                            : "Details"}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="px-4 sm:px-5 py-3 border-t border-slate-200/70 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          Showing{" "}
          <strong className="text-slate-900 tabular-nums">
            {filteredVisits.length}
          </strong>{" "}
          of{" "}
          <strong className="text-slate-900 tabular-nums">
            {baseVisits.length}
          </strong>{" "}
          visits
        </span>
        <span className="flex items-center gap-2 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-brand-primary" />
          Select any visit row to open full verification, exception resolution,
          and readiness details.
        </span>
      </div>
    </div>
  );
}
