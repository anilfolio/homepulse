"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileSignature,
  RefreshCw,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { forecastAuthorizationBurn } from "@/lib/engine/predictiveOpsEngine";
import { AgencyClient } from "@/types/agency";

export function AuthorizationWorkspace() {
  const { state, createClientAuthorization, requestAuthorizationRenewal } = useAgencyStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CRITICAL" | "WATCH" | "ACTIVE">("ALL");
  const [isNewAuthModalOpen, setIsNewAuthModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<AgencyClient | null>(null);

  const [newClientId, setNewClientId] = useState<string>(state.clients[0]?.id ?? "");
  const [newAuthNumber, setNewAuthNumber] = useState("AUTH-2026-991");
  const [newAdditionalUnits, setNewAdditionalUnits] = useState(120);
  const [newExpiresInDays, setNewExpiresInDays] = useState(90);

  const burnMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof forecastAuthorizationBurn>[number]>();
    forecastAuthorizationBurn(state).forEach((f) => map.set(f.clientId, f));
    return map;
  }, [state]);

  const filteredClients = useMemo(() => {
    return state.clients.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.payer.toLowerCase().includes(q) ||
        c.authNumber.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      const forecast = burnMap.get(c.id);
      if (statusFilter === "CRITICAL") return forecast?.urgency === "Critical";
      if (statusFilter === "WATCH") return forecast?.urgency === "Watch";
      if (statusFilter === "ACTIVE") return forecast?.urgency === "Healthy";
      return true;
    });
  }, [burnMap, searchTerm, state.clients, statusFilter]);

  const handleCreateAuth = () => {
    const targetId = newClientId || state.clients[0]?.id;
    if (!targetId || !newAuthNumber.trim()) {
      toast.error("Please select a client and enter an authorization number.");
      return;
    }
    createClientAuthorization({
      clientId: targetId,
      authNumber: newAuthNumber.trim(),
      additionalUnits: Math.max(10, Number(newAdditionalUnits) || 80),
      expiresInDays: Math.max(7, Number(newExpiresInDays) || 60),
    });
    setIsNewAuthModalOpen(false);
    toast.success("Authorization added & blocked claims re-evaluated automatically.");
  };

  return (
    <div className="bg-white backdrop-blur-xl rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden flex flex-col h-full">
      {/* Header and Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-teal" />
            Live Payor Authorization Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Connected to Client Census, EVV unit burn, and Pre-Billing Scrub Gate.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search clients or auth #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | "CRITICAL" | "WATCH" | "ACTIVE")
            }
            className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="CRITICAL">Critical (&le;7d)</option>
            <option value="WATCH">Watch (&le;14d)</option>
            <option value="ACTIVE">Healthy</option>
          </select>
          <button
            type="button"
            onClick={() => setIsNewAuthModalOpen(true)}
            className="bg-brand-teal hover:bg-brand-teal/90 text-white px-3 py-2 rounded-xl text-sm font-medium shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add / Extend Auth
          </button>
        </div>
      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Client & Payer
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Service & Code
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Burn Forecast
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Units Consumed
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredClients.map((client) => {
              const consumed = Math.max(
                0,
                client.authorizedUnitsTotal - client.authorizedUnitsRemaining
              );
              const unitPercentage =
                client.authorizedUnitsTotal > 0
                  ? Math.round((consumed / client.authorizedUnitsTotal) * 100)
                  : 100;
              const forecast = burnMap.get(client.id);
              const isOverLimit = client.authorizedUnitsRemaining <= 0;

              return (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-sm text-slate-900">{client.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {client.payer} • {client.authNumber}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-sm text-slate-700">{client.serviceName}</div>
                    <span className="inline-block mt-1 text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase">
                      {client.serviceCode}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Expires in {client.authExpiresInDays}d
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Est. depletion: ~{forecast?.estimatedDaysToDepletion ?? client.authExpiresInDays}d
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 min-w-[160px]">
                    <div className="flex items-center justify-between text-xs font-medium mb-1">
                      <span className={isOverLimit ? "text-rose-600 font-semibold" : "text-slate-600"}>
                        {consumed} / {client.authorizedUnitsTotal}
                      </span>
                      <span className={isOverLimit ? "text-rose-600" : "text-slate-500"}>
                        {unitPercentage}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          "h-full rounded-full transition-all duration-500",
                          unitPercentage < 75
                            ? "bg-brand-teal"
                            : unitPercentage < 90
                            ? "bg-amber-400"
                            : "bg-rose-500"
                        )}
                        style={{ width: `${Math.min(unitPercentage, 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div
                      className={clsx(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        forecast?.urgency === "Critical"
                          ? "bg-rose-100 text-rose-700"
                          : forecast?.urgency === "Watch"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-teal-100 text-brand-teal"
                      )}
                    >
                      {forecast?.urgency === "Healthy" ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      {forecast?.urgency ?? "Healthy"}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          requestAuthorizationRenewal(client.id);
                          toast.success(`278 renewal submitted for ${client.name}.`);
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-brand-teal hover:text-brand-teal rounded-lg cursor-pointer inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Renew
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedClient(client)}
                        className="p-2 text-slate-500 hover:text-brand-teal hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
                        title="Inspect Authorization"
                      >
                        <FileSignature className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New / Extend Auth Modal */}
      <Modal
        isOpen={isNewAuthModalOpen}
        onClose={() => setIsNewAuthModalOpen(false)}
        title="Add or Extend Client Authorization"
        description="Updates live client units and clears auth-blocked claims"
        icon={
          <div className="p-2 bg-brand-teal/10 rounded-xl">
            <Plus className="w-5 h-5 text-brand-teal" />
          </div>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsNewAuthModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateAuth}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal/90 rounded-xl cursor-pointer"
            >
              Save Authorization
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Client</label>
            <select
              value={newClientId}
              onChange={(e) => setNewClientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              {state.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.payer} — {c.authorizedUnitsRemaining} units left)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Authorization Number
            </label>
            <input
              type="text"
              value={newAuthNumber}
              onChange={(e) => setNewAuthNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Additional Units
              </label>
              <input
                type="number"
                value={newAdditionalUnits}
                onChange={(e) => setNewAdditionalUnits(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Window (Days)
              </label>
              <input
                type="number"
                value={newExpiresInDays}
                onChange={(e) => setNewExpiresInDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={Boolean(selectedClient)}
        onClose={() => setSelectedClient(null)}
        title="Authorization Detail"
        description={selectedClient ? `${selectedClient.authNumber} • ${selectedClient.payer}` : ""}
        icon={
          <div className="p-2 bg-blue-100 rounded-xl">
            <FileSignature className="w-5 h-5 text-blue-600" />
          </div>
        }
        footer={
          <button
            type="button"
            onClick={() => setSelectedClient(null)}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-teal rounded-xl cursor-pointer"
          >
            Done
          </button>
        }
      >
        {selectedClient && (
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-semibold text-slate-900">{selectedClient.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {selectedClient.serviceName} ({selectedClient.serviceCode}) • ${selectedClient.hourlyBillRate}/hr
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">Units Remaining</div>
                <div className="text-lg font-bold text-slate-900">
                  {selectedClient.authorizedUnitsRemaining} / {selectedClient.authorizedUnitsTotal}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500">Days Until Expiry</div>
                <div className="text-lg font-bold text-slate-900">
                  {selectedClient.authExpiresInDays} days
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
