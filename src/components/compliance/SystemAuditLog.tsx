"use client";

import React, { useMemo, useState } from "react";
import { Download, Search, History, UserCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function SystemAuditLog() {
  const { state, logAuditEvent } = useAgencyStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  const filteredLogs = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return state.auditLogs.filter((log) => {
      if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
      if (!q) return true;
      return (
        log.action.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        log.actorRole.toLowerCase().includes(q) ||
        log.resourceId.toLowerCase().includes(q) ||
        log.summary.toLowerCase().includes(q)
      );
    });
  }, [state.auditLogs, searchTerm, actionFilter]);

  const handleExport = () => {
    logAuditEvent({
      action: "EXPORT",
      resourceType: "Compliance",
      resourceId: "HIPAA-AUDIT-CSV",
      summary: `Exported ${filteredLogs.length} immutable HIPAA audit log entries.`,
    });
    toast.success(`Exported ${filteredLogs.length} audit log records.`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-teal" />
            Immutable System-Wide Audit Log (HIPAA)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Live zero-PHI telemetry across visits, claims, care plans, payroll, and messaging.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search actor, resource, action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/20 w-full sm:w-56"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="CARE_PLAN_SYNC">Care Plan Sync</option>
            <option value="EVV_OFFLINE_SYNC">EVV Offline Sync</option>
            <option value="UPDATE">Updates</option>
            <option value="CREATE">Creations</option>
            <option value="PAYROLL_EXPORT">Payroll Export</option>
            <option value="MESSAGE_SENT">Messages</option>
            <option value="VIEW_PHI">PHI Access</option>
          </select>
          <button
            type="button"
            onClick={handleExport}
            className="p-2 text-slate-500 hover:text-brand-teal hover:bg-brand-teal/10 rounded-full transition-colors cursor-pointer"
            title="Export Audit Log"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Timestamp (UTC)</th>
              <th className="px-4 py-3 whitespace-nowrap">Action</th>
              <th className="px-4 py-3 whitespace-nowrap">Actor / Role</th>
              <th className="px-4 py-3 whitespace-nowrap">Resource</th>
              <th className="px-4 py-3">Anonymized Event Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredLogs.slice(0, 25).map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-mono text-slate-600">
                      {new Date(log.timestampUtc).toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={clsx(
                        "w-2 h-2 rounded-full shrink-0",
                        log.status === "Success" ? "bg-emerald-500" : "bg-amber-500"
                      )}
                    />
                    <span className="font-semibold">{log.action}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>{log.actorName}</span>
                    <span className="text-[10px] text-slate-400">({log.actorRole})</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-semibold">
                    {log.resourceType} • {log.resourceId}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{log.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
