"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  ArrowRight,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Plus,
  UserPlus,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { INITIAL_AGENCY_CLIENTS } from "@/lib/store/agencySeedData";

type FilterStatus =
  | "ALL"
  | "New Referral"
  | "Auth Pending"
  | "Assessment Scheduled"
  | "Admitted"
  | "On Hold";

interface UnifiedIntakePatientRow {
  id: string;
  name: string;
  subtitle: string;
  intakeStatus: Exclude<FilterStatus, "ALL">;
  payer: string;
  diagnosisOrService: string;
  missingDocs: string[];
  targetRoute: string;
}

export default function IntakePatientsPage() {
  const router = useRouter();
  const { state } = useAgencyStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [payerFilter, setPayerFilter] = useState("All Payers");
  const [isIntakeDropdownOpen, setIsIntakeDropdownOpen] = useState(false);

  const allRosterRows = useMemo<UnifiedIntakePatientRow[]>(() => {
    const admittedIds = new Set(
      state.referrals.map((r) => r.admittedClientId).filter(Boolean) as string[]
    );

    const referralRows: UnifiedIntakePatientRow[] = state.referrals.map((r) => {
      let intakeStatus: UnifiedIntakePatientRow["intakeStatus"] = "New Referral";
      if (r.partnerStatus === "Not a Fit" || r.partnerStatus === "Referred Elsewhere") {
        intakeStatus = "On Hold";
      } else if (r.stage === "Admitted" || r.stage === "Converted") {
        intakeStatus = "Admitted";
      } else if (r.stage === "Initial Assessment Scheduled") {
        intakeStatus = "Assessment Scheduled";
      } else if (r.stage === "Insurance Verification" || r.authorizationStatus === "Pending") {
        intakeStatus = "Auth Pending";
      }

      const missingDocs = r.documents
        .filter((d) => d.status === "Missing")
        .map((d) => d.name);

      const isStaticClientRoute =
        Boolean(r.admittedClientId) &&
        INITIAL_AGENCY_CLIENTS.some((seed) => seed.id === r.admittedClientId);

      return {
        id: r.id,
        name: r.clientName,
        subtitle: `${r.source} • ${r.sourceDetails || "Direct"}`,
        intakeStatus,
        payer: r.insurance?.payer ?? "Pending Verification",
        diagnosisOrService: r.serviceRequested || r.diagnosis || "Personal & Home Care",
        missingDocs,
        targetRoute: isStaticClientRoute
          ? `/patients/${r.admittedClientId}`
          : `/intake/referrals`,
      };
    });

    const extraClients: UnifiedIntakePatientRow[] = state.clients
      .filter((c) => !admittedIds.has(c.id))
      .map((c) => {
        const isStaticRoute = INITIAL_AGENCY_CLIENTS.some((seed) => seed.id === c.id);
        return {
          id: c.id,
          name: c.name,
          subtitle: `MRN ${c.mrn} • ${c.cityStateZip}`,
          intakeStatus: "Admitted",
          payer: c.payer,
          diagnosisOrService: `${c.serviceName} (${c.serviceCode})`,
          missingDocs: [],
          targetRoute: isStaticRoute ? `/patients/${c.id}` : `/patients`,
        };
      });

    return [...referralRows, ...extraClients];
  }, [state.referrals, state.clients]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allRosterRows.filter((row) => {
      if (activeFilter !== "ALL" && row.intakeStatus !== activeFilter) return false;
      if (
        payerFilter !== "All Payers" &&
        !row.payer.toLowerCase().includes(payerFilter.toLowerCase())
      ) {
        return false;
      }
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.diagnosisOrService.toLowerCase().includes(q) ||
        row.payer.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
      );
    });
  }, [allRosterRows, searchQuery, activeFilter, payerFilter]);

  const stats = useMemo(
    () => [
      {
        id: "ALL" as FilterStatus,
        title: "Total Intakes",
        count: allRosterRows.length,
        subtitle: "Live referrals + active clients",
        icon: Users,
        badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
      },
      {
        id: "New Referral" as FilterStatus,
        title: "New Referrals",
        count: allRosterRows.filter((r) => r.intakeStatus === "New Referral").length,
        subtitle: "Awaiting triage",
        icon: UserPlus,
        badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        id: "Auth Pending" as FilterStatus,
        title: "Auth Pending",
        count: allRosterRows.filter((r) => r.intakeStatus === "Auth Pending").length,
        subtitle: "Eligibility / prior auth",
        icon: AlertTriangle,
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      },
      {
        id: "Admitted" as FilterStatus,
        title: "Admitted",
        count: allRosterRows.filter((r) => r.intakeStatus === "Admitted").length,
        subtitle: "Active in Clinical & Dispatch",
        icon: CheckCircle2,
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      {
        id: "On Hold" as FilterStatus,
        title: "Non-Admit / Hold",
        count: allRosterRows.filter((r) => r.intakeStatus === "On Hold").length,
        subtitle: "Referred out / declined",
        icon: Building2,
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
      },
    ],
    [allRosterRows]
  );

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            Intake &amp; Pre-Admit Roster
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
              {filteredRows.length} shown
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified pre-admission queue &amp; active client census synchronized with Partner Portal and Clinical RN.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsIntakeDropdownOpen((v) => !v)}
            className="inline-flex items-center gap-2 bg-brand-teal hover:bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Intake
          </button>
          <AnimatePresence>
            {isIntakeDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-[60] py-1 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => {
                    router.push("/intake/inquiries/new");
                    setIsIntakeDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-teal cursor-pointer"
                >
                  New Inquiry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push("/intake/referrals/new");
                    setIsIntakeDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-teal cursor-pointer"
                >
                  New Referral
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map((item) => {
          const Icon = item.icon;
          const isActive = activeFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveFilter(item.id)}
              className={`text-left cursor-pointer bg-white rounded-2xl p-3.5 border transition-all shadow-2xs ${
                isActive
                  ? "border-brand-teal ring-2 ring-brand-teal/20"
                  : "border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-600 truncate">{item.title}</span>
                <div className={`p-2 rounded-xl border ${item.badgeBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{item.count}</div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">{item.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Search & Payer Toolbar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, service, payer, or ID..."
            className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={payerFilter}
            onChange={(e) => setPayerFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer"
          >
            <option>All Payers</option>
            <option>Medicare</option>
            <option>Medicaid</option>
            <option>Commercial</option>
            <option>Private Pay</option>
          </select>
        </div>
      </div>

      {/* Unified Table */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Patient / Lead</th>
                <th className="px-4 py-3">Intake Status</th>
                <th className="px-4 py-3">Payer</th>
                <th className="px-4 py-3">Missing Docs</th>
                <th className="px-4 py-3">Service / Care Need</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No matching intake patients found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(row.targetRoute)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          alt={row.name}
                          fallback={row.name.substring(0, 2).toUpperCase()}
                          size="md"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{row.name}</div>
                          <div className="text-[11px] text-slate-500">{row.subtitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          row.intakeStatus === "Admitted"
                            ? "success"
                            : row.intakeStatus === "On Hold"
                            ? "error"
                            : "warning"
                        }
                      >
                        {row.intakeStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{row.payer}</td>
                    <td className="px-4 py-3">
                      {row.missingDocs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {row.missingDocs.map((doc) => (
                            <span
                              key={doc}
                              className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold"
                            >
                              Missing: {doc}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="success">Complete</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[220px] truncate">{row.diagnosisOrService}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={row.targetRoute}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal bg-brand-teal/10 hover:bg-brand-teal/20 px-3 py-1.5 rounded-full"
                      >
                        Open <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
