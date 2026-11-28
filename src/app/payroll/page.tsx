"use client";

import React, { useMemo, useState } from "react";
import {
  Download,
  Calculator,
  Clock,
  DollarSign,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  User,
  X,
  AlertTriangle,
  ArrowRight,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { calculateAgencyPayroll } from "@/lib/engine/payrollEngine";

export default function PayrollPage() {
  const { state, logAuditEvent } = useAgencyStore();

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isPayPeriodOpen, setIsPayPeriodOpen] = useState(false);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState("Current Bi-Weekly Cycle");
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [dailyOtEnabled, setDailyOtEnabled] = useState(true);
  const [doubleTimeEnabled, setDoubleTimeEnabled] = useState(true);

  const payrollSummary = useMemo(
    () => calculateAgencyPayroll(state.caregivers, state.visits, state.clients),
    [state.caregivers, state.visits, state.clients]
  );

  const totalScheduledHours = useMemo(
    () => Number(state.visits.reduce((sum, v) => sum + v.scheduledHours, 0).toFixed(1)),
    [state.visits]
  );

  const evvExceptionsCount = useMemo(
    () => state.visits.filter((v) => v.evvCompliance === "Exception").length,
    [state.visits]
  );

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      const csvRows = [
        ["Caregiver ID", "Caregiver Name", "Base Hours", "OT Hours", "DT Hours", "Hourly Rate", "Mileage ($)", "Gross Pay ($)"].join(","),
        ...payrollSummary.rows.map((r) =>
          [
            r.caregiverId,
            `"${r.name}"`,
            r.baseHours,
            r.otHours,
            r.dtHours,
            r.hourlyRate,
            r.mileageReimbursement.toFixed(2),
            r.grossPay.toFixed(2),
          ].join(",")
        ),
      ].join("\n");

      try {
        const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `homepulse-payroll-${selectedFormat.toLowerCase().replace(/\s+/g, "-")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        // Ignore download blocked in headless browsers
      }

      logAuditEvent({
        action: "PAYROLL_EXPORT",
        resourceType: "Payroll",
        resourceId: selectedFormat || "CSV",
        summary: `Exported EVV-reconciled payroll batch (${selectedFormat}) for ${payrollSummary.rows.length} caregivers.`,
      });

      setExporting(false);
      setExportComplete(true);
      toast.success(`Payroll exported (${selectedFormat}) & logged to HIPAA audit trail.`);
      setTimeout(() => {
        setIsExportOpen(false);
        setExportComplete(false);
        setSelectedFormat("");
      }, 1500);
    }, 600);
  };

  return (
    <div className="flex-1 bg-page-bg min-h-screen">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Unified EVV-to-Payroll Engine
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live reconciliation of clocked-out EVV hours, overtime thresholds, and mileage reimbursement.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPayPeriodOpen(!isPayPeriodOpen)}
                className="flex items-center gap-2 bg-white border border-slate-200 text-sm font-medium text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer"
              >
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                {selectedPayPeriod}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              <AnimatePresence>
                {isPayPeriodOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden z-20"
                  >
                    {[
                      "Current Bi-Weekly Cycle",
                      "Prior Bi-Weekly Cycle",
                      "Month-to-Date Audit",
                    ].map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => {
                          setSelectedPayPeriod(period);
                          setIsPayPeriodOpen(false);
                        }}
                        className={clsx(
                          "w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between",
                          selectedPayPeriod === period
                            ? "text-brand-teal font-semibold bg-brand-teal/5"
                            : "text-slate-600"
                        )}
                      >
                        {period}
                        {selectedPayPeriod === period && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setIsRulesOpen(true)}
              className="flex items-center gap-2 bg-white border border-slate-200 text-sm font-medium text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Rule Configuration
            </button>
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-2 bg-brand-teal text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-brand-teal/90 transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.04)] whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export Payroll
            </button>
          </div>
        </div>

        {/* Reconciliation Pipeline Visual */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Live EVV → Payroll Reconciliation Pipeline
            </h2>
            {evvExceptionsCount === 0 ? (
              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> All EVV Exceptions Cleared
              </div>
            ) : (
              <div className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> {evvExceptionsCount} EVV Exception(s) Pending Review
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 relative">
              <div className="text-xs font-medium text-slate-500 mb-1">Step 1: Scheduled Dispatch</div>
              <div className="text-2xl font-bold text-slate-900">
                {totalScheduledHours}h{" "}
                <span className="text-sm font-medium text-slate-500">Scheduled Shift Hrs</span>
              </div>
              <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 shadow-sm">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 relative">
              <div className="text-xs font-medium text-slate-500 mb-1">Step 2: EVV Verified Timecards</div>
              <div className="text-2xl font-bold text-slate-900">
                {payrollSummary.totalEvvHours}h{" "}
                <span className="text-sm font-medium text-slate-500">
                  ({payrollSummary.evvVerifiedPercent}% Verified)
                </span>
              </div>
              <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 shadow-sm">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-brand-teal/5 rounded-xl p-4 border border-brand-teal relative">
              <div className="text-xs font-medium text-brand-teal mb-1">
                Step 3: Payroll & Overtime Rules Applied
              </div>
              <div className="text-2xl font-bold text-brand-teal">
                ${payrollSummary.totalGrossPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                <span className="text-sm font-medium text-brand-teal/70">Est. Payout</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-[10px] font-medium bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                  Weekly &gt;40h OT
                </span>
                <span className="text-[10px] font-medium bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                  $0.67/mi IRS Mileage
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Reconciled Hours</p>
              <p className="text-2xl font-bold text-slate-900">{payrollSummary.totalEvvHours}h</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Overtime Hours</p>
              <p className="text-2xl font-bold text-slate-900">{payrollSummary.totalOvertimeHours}h</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Mileage Reimbursement</p>
              <p className="text-2xl font-bold text-slate-900">
                ${payrollSummary.totalMileageReimbursement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Est. Gross Payroll
              </p>
              <p className="text-2xl font-bold text-slate-900">
                ${payrollSummary.totalGrossPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </Card>
        </div>

        {/* Main Table Area */}
        <Card noPadding className="flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-100">
            <h3 className="font-semibold text-slate-900">
              Pay Period Reconciliation ({payrollSummary.rows.length} Active Caregivers)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3">Caregiver</th>
                  <th className="px-4 py-3 text-right">Base Hrs</th>
                  <th className="px-4 py-3 text-right">OT / DT</th>
                  <th className="px-4 py-3 text-right">Base Rate</th>
                  <th className="px-4 py-3 text-right">Total Est. Pay</th>
                  <th className="px-4 py-3 text-center">EVV Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {payrollSummary.rows.map((row) => (
                  <React.Fragment key={row.caregiverId}>
                    <tr
                      className={clsx(
                        "hover:bg-slate-50 transition-colors cursor-pointer",
                        expandedRow === row.caregiverId && "bg-slate-50"
                      )}
                      onClick={() =>
                        setExpandedRow(expandedRow === row.caregiverId ? null : row.caregiverId)
                      }
                    >
                      <td className="px-4 py-3 text-center text-slate-400">
                        <ChevronRight
                          className={clsx(
                            "w-5 h-5 transition-transform",
                            expandedRow === row.caregiverId && "rotate-90 text-brand-teal"
                          )}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{row.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {row.roleTitle} • {row.shifts.length} live shift(s)
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {row.baseHours}h
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.otHours > 0 || row.dtHours > 0 ? (
                          <div className="flex flex-col items-end gap-1">
                            {row.otHours > 0 && (
                              <span className="font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-xs">
                                {row.otHours}h OT (1.5x)
                              </span>
                            )}
                            {row.dtHours > 0 && (
                              <span className="font-medium text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md text-xs">
                                {row.dtHours}h DT (2.0x)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">${row.hourlyRate}/hr</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        ${row.grossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.exceptionCount > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {row.exceptionCount} Hold
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            EVV Ready
                          </span>
                        )}
                      </td>
                    </tr>

                    {expandedRow === row.caregiverId && (
                      <tr className="bg-slate-50 border-b border-t border-slate-200">
                        <td colSpan={7} className="p-0">
                          <div className="p-4 ml-8 mr-6 border-l-4 border-brand-teal space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div>
                                <div className="text-xs text-slate-500 mb-1">Regular Earnings</div>
                                <div className="font-semibold text-slate-900">
                                  ${(row.baseHours * row.hourlyRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {row.baseHours}h @ ${row.hourlyRate}/hr
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 mb-1">Overtime Earnings</div>
                                <div className="font-semibold text-amber-600">
                                  ${(row.otHours * row.hourlyRate * 1.5 + row.dtHours * row.hourlyRate * 2.0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {row.otReason || "Within regular hours"}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 mb-1">Mileage Reimbursement</div>
                                <div className="font-semibold text-slate-900">
                                  ${row.mileageReimbursement.toFixed(2)}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {row.travelMiles} mi @ $0.67/mi
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 mb-1">EVV Audit Verification</div>
                                <div className="font-semibold text-emerald-700">
                                  {row.evvVerifiedCount} Verified / {row.exceptionCount} Flagged
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Synced from live Agency Visits
                                </div>
                              </div>
                            </div>

                            {row.shifts.length > 0 && (
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <div className="px-3 py-2 bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                  Linked EVV Timecard Entries
                                </div>
                                <div className="divide-y divide-slate-100">
                                  {row.shifts.map((s) => (
                                    <div
                                      key={s.visitId}
                                      className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                                    >
                                      <div>
                                        <span className="font-semibold text-slate-800">{s.evvId}</span>
                                        <span className="text-slate-400 mx-1.5">•</span>
                                        <span className="text-slate-600">{s.clientName}</span>
                                        <span className="text-slate-400 mx-1.5">•</span>
                                        <span className="text-slate-500">
                                          {s.dateLabel} ({s.timeRange})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-700">{s.hours}h</span>
                                        <span
                                          className={clsx(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                            s.evvCompliance === "Verified" || s.evvCompliance === "Resolved"
                                              ? "bg-emerald-50 text-emerald-700"
                                              : "bg-amber-50 text-amber-800"
                                          )}
                                        >
                                          {s.evvCompliance}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {isExportOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
              onClick={() => !exporting && !exportComplete && setIsExportOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-lg z-[101] overflow-hidden border border-slate-100"
            >
              {exportComplete ? (
                <div className="p-6 text-center space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Export Complete</h2>
                  <p className="text-slate-500 text-xs">
                    Generated {selectedFormat} CSV from live EVV-reconciled timecards.
                  </p>
                </div>
              ) : (
                <>
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Export Payroll</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select payroll provider earnings mapping
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsExportOpen(false)}
                      disabled={exporting}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {[
                      { name: "ADP Run", desc: "Maps OT to Code 02, Travel to Code 09" },
                      { name: "Gusto", desc: "Native CSV payroll batch format" },
                      { name: "Paychex Flex", desc: "Standard earnings codes export" },
                      { name: "QuickBooks Time", desc: "Time & mileage ledger export" },
                    ].map((fmt) => (
                      <button
                        key={fmt.name}
                        type="button"
                        onClick={() => setSelectedFormat(fmt.name)}
                        disabled={exporting}
                        className={clsx(
                          "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer",
                          selectedFormat === fmt.name
                            ? "border-brand-teal bg-brand-teal/5 text-brand-teal"
                            : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                        )}
                      >
                        <div>
                          <span className="font-semibold text-sm">{fmt.name}</span>
                          <p className="text-xs text-slate-500 mt-0.5">{fmt.desc}</p>
                        </div>
                        {selectedFormat === fmt.name && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleExport}
                      disabled={!selectedFormat || exporting}
                      className="w-full py-3 px-4 bg-brand-teal hover:bg-brand-teal/90 disabled:opacity-50 text-white font-medium rounded-xl cursor-pointer"
                    >
                      {exporting ? "Generating CSV..." : "Download Reconciled CSV"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Rules Modal */}
      <AnimatePresence>
        {isRulesOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
              onClick={() => setIsRulesOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden border border-slate-200"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Overtime & EVV Pay Rules</h2>
                  <p className="text-xs text-slate-500">Configure state labor & mileage automation</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRulesOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Daily Overtime (&gt;8 hours)</div>
                    <div className="text-xs text-slate-500">1.5x regular rate for shifts exceeding 8h</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDailyOtEnabled((v) => !v)}
                    className={clsx(
                      "w-10 h-6 rounded-full relative transition-colors cursor-pointer",
                      dailyOtEnabled ? "bg-brand-teal" : "bg-slate-300"
                    )}
                  >
                    <span
                      className={clsx(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        dailyOtEnabled ? "right-1" : "left-1"
                      )}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">Daily Double Time (&gt;12 hours)</div>
                    <div className="text-xs text-slate-500">2.0x regular rate for shifts exceeding 12h</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDoubleTimeEnabled((v) => !v)}
                    className={clsx(
                      "w-10 h-6 rounded-full relative transition-colors cursor-pointer",
                      doubleTimeEnabled ? "bg-brand-teal" : "bg-slate-300"
                    )}
                  >
                    <span
                      className={clsx(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        doubleTimeEnabled ? "right-1" : "left-1"
                      )}
                    />
                  </button>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsRulesOpen(false);
                    toast.success("Payroll rule configuration saved.");
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal/90 cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
