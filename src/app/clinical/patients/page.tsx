"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  LayoutGrid,
  List,
  X,
  HeartPulse,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { NewPatientModal } from "@/components/patients/NewPatientModal";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

type FilterStatus = "ALL" | "Active" | "High Risk" | "Auth Watch" | "Medicare/Medicaid";

export default function ClinicalPatientsPage() {
  const router = useRouter();
  const { state } = useAgencyStore();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  const filteredClients = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return state.clients.filter((client) => {
      const matchesSearch =
        !query ||
        client.name.toLowerCase().includes(query) ||
        client.mrn.toLowerCase().includes(query) ||
        client.serviceName.toLowerCase().includes(query) ||
        client.payer.toLowerCase().includes(query);

      let matchesFilter = true;
      if (activeFilter === "High Risk") matchesFilter = client.fallRiskLevel === "High";
      else if (activeFilter === "Auth Watch") matchesFilter = client.authorizedUnitsRemaining <= 16;
      else if (activeFilter === "Medicare/Medicaid") {
        matchesFilter = client.payer === "Medicare" || client.payer === "Medicaid";
      }

      return matchesSearch && matchesFilter;
    });
  }, [state.clients, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    const total = state.clients.length;
    const highRiskCount = state.clients.filter((c) => c.fallRiskLevel === "High").length;
    const authWatchCount = state.clients.filter((c) => c.authorizedUnitsRemaining <= 16).length;
    const govPayerCount = state.clients.filter(
      (c) => c.payer === "Medicare" || c.payer === "Medicaid"
    ).length;

    return [
      {
        id: "ALL" as FilterStatus,
        title: "Total Active Clients",
        count: total,
        subtitle: "Synced live with Census & Intake",
        icon: Users,
        badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
        activeBorder: "border-slate-400 ring-2 ring-slate-400/20",
      },
      {
        id: "High Risk" as FilterStatus,
        title: "High Fall Risk",
        count: highRiskCount,
        subtitle: "Requires priority RN oversight",
        icon: AlertTriangle,
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
        activeBorder: "border-rose-500 ring-2 ring-rose-500/20",
      },
      {
        id: "Auth Watch" as FilterStatus,
        title: "Auth Burn Watch",
        count: authWatchCount,
        subtitle: "<= 16 authorized units remaining",
        icon: ShieldAlert,
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
        activeBorder: "border-amber-500 ring-2 ring-amber-500/20",
      },
      {
        id: "Medicare/Medicaid" as FilterStatus,
        title: "Gov. Payer Census",
        count: govPayerCount,
        subtitle: "Medicare / Medicaid plans",
        icon: HeartPulse,
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        activeBorder: "border-emerald-500 ring-2 ring-emerald-500/20",
      },
    ];
  }, [state.clients]);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            Clinical Patients Directory
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
              {filteredClients.length} active
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live clinical roster linked to 360 Patient Hubs, Care Plans, and EVV Authorizations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewPatientModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-brand-teal hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-[0_6px_20px_rgba(13,148,136,0.25)] transition-all active:scale-95 whitespace-nowrap self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Intake Patient</span>
        </button>
      </div>

      {/* KPI Filter Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          const isActive = activeFilter === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setActiveFilter(item.id)}
              className={`group cursor-pointer bg-white rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] relative overflow-hidden ${
                isActive ? item.activeBorder : "border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors truncate">
                  {item.title}
                </span>
                <div className={`p-2 rounded-xl border ${item.badgeBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-semibold text-slate-900 tracking-tight">
                  {item.count}
                </span>
                {isActive && (
                  <span className="text-[10px] font-semibold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-full">
                    Active Filter
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">{item.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Search & Toolbar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, MRN, payer, or care service..."
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200/90 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-white text-brand-teal shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <List className="w-4 h-4" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-white text-brand-teal shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
          <p className="text-sm text-slate-500">No clients matched your filter criteria.</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 sm:px-6 py-3">Client Details</th>
                  <th className="px-4 py-3">Payer</th>
                  <th className="px-4 py-3">Fall Risk</th>
                  <th className="px-4 py-3">Service & Care Plan</th>
                  <th className="px-4 py-3">Auth Remaining</th>
                  <th className="px-4 sm:px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/patients/${client.id}`)}
                  >
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          alt={client.name}
                          fallback={client.name.substring(0, 2).toUpperCase()}
                          size="md"
                        />
                        <div>
                          <div className="font-medium text-slate-900 group-hover:text-brand-teal transition-colors">
                            {client.name}
                          </div>
                          <div className="text-slate-500 text-xs mt-0.5">
                            {client.mrn} • {client.cityStateZip}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{client.payer}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          client.fallRiskLevel === "Low"
                            ? "success"
                            : client.fallRiskLevel === "Medium"
                              ? "warning"
                              : "error"
                        }
                      >
                        {client.fallRiskLevel} Risk
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{client.serviceName}</div>
                      <div className="text-xs text-slate-400">
                        {client.carePlanVersion ? `Care Plan ${client.carePlanVersion}` : "Standard Plan"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                      {client.authorizedUnitsRemaining}/{client.authorizedUnitsTotal} units
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/patients/${client.id}`);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal hover:text-emerald-700 bg-brand-teal/10 hover:bg-brand-teal/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        360 Chart <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="block sm:hidden divide-y divide-slate-100">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => router.push(`/patients/${client.id}`)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{client.name}</h4>
                  <p className="text-xs text-slate-500">
                    {client.payer} • {client.fallRiskLevel} Risk • {client.authorizedUnitsRemaining}u left
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredClients.map((client, idx) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
            >
              <Link href={`/patients/${client.id}`} className="block h-full group">
                <Card className="bg-white rounded-2xl p-4 border border-slate-200/90 hover:-translate-y-1 hover:border-brand-teal/50 transition-all h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar
                        alt={client.name}
                        fallback={client.name.substring(0, 2).toUpperCase()}
                        size="lg"
                      />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 group-hover:text-brand-teal truncate">
                          {client.name}
                        </h3>
                        <p className="text-xs text-slate-500">{client.mrn}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Payer</span>
                        <span className="font-semibold text-slate-800">{client.payer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Fall Risk</span>
                        <span className="font-semibold text-slate-800">{client.fallRiskLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Auth Left</span>
                        <span className="font-semibold text-slate-800">
                          {client.authorizedUnitsRemaining} units
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-brand-teal text-xs font-semibold">
                    <span>Open 360 Chart</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
      />
    </div>
  );
}
