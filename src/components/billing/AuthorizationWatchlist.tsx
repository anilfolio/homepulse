"use client";

import React, { useMemo, useState } from "react";
import { ShieldCheck, AlertTriangle, CalendarDays, RefreshCw, CheckCircle2, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { forecastAuthorizationBurn } from "@/lib/engine/predictiveOpsEngine";

export function AuthorizationWatchlist() {
  const { state, requestAuthorizationRenewal } = useAgencyStore();
  const [requestedIds, setRequestedIds] = useState<string[]>([]);

  const forecasts = useMemo(() => {
    return forecastAuthorizationBurn(state).filter(
      (f) => f.urgency !== "Healthy" || state.clients.find((c) => c.id === f.clientId && c.authExpiresInDays <= 30)
    );
  }, [state]);

  const handleRenew = (clientId: string, clientName: string) => {
    requestAuthorizationRenewal(clientId);
    setRequestedIds((prev) => [...prev, clientId]);
    toast.success(`278 Prior Auth renewal packet queued for ${clientName}.`);
  };

  const actionNeededCount = forecasts.filter((f) => !requestedIds.includes(f.clientId)).length;

  return (
    <div className="bg-white backdrop-blur-xl rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:border-brand-teal/60 transition-all duration-300 relative overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Predictive Authorization Watchlist
          </h2>
          <p className="text-xs text-slate-500">
            AI burn-rate forecast based on live scheduled weekly visit velocity.
          </p>
        </div>
        <div className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" />
          {actionNeededCount} Action Needed
        </div>
      </div>

      <div className="divide-y divide-slate-200 flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {forecasts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              All active client authorizations have healthy unit buffers.
            </div>
          ) : (
            forecasts.map((item) => {
              const client = state.clients.find((c) => c.id === item.clientId);
              if (!client) return null;
              const unitsConsumed = Math.max(
                0,
                client.authorizedUnitsTotal - client.authorizedUnitsRemaining
              );
              const unitPercentage =
                client.authorizedUnitsTotal > 0
                  ? Math.round((unitsConsumed / client.authorizedUnitsTotal) * 100)
                  : 100;
              const isCriticallyLow = item.urgency === "Critical";
              const isRequested = requestedIds.includes(item.clientId);

              return (
                <motion.div
                  key={item.clientId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex-1 flex gap-3">
                      <div
                        className={clsx(
                          "p-2 rounded-lg shrink-0 h-fit",
                          isCriticallyLow
                            ? "bg-rose-100 text-rose-600"
                            : "bg-amber-100 text-amber-600"
                        )}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-xs text-slate-900">{item.clientName}</h3>
                          <span className="text-xs font-medium text-slate-500">
                            {item.payer} • {item.authNumber}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                              <CalendarDays className="w-3 h-3" />
                              Window: {client.authExpiresInDays}d
                            </div>
                            <div
                              className={clsx(
                                "text-xs font-semibold flex items-center gap-1",
                                isCriticallyLow ? "text-rose-600" : "text-amber-600"
                              )}
                            >
                              <TrendingDown className="w-3 h-3" />
                              Depletes in ~{item.estimatedDaysToDepletion}d ({item.projectedWeeklyBurn} u/wk)
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
                              <span>{item.unitsRemaining} units left</span>
                              <span>{unitPercentage}% used</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={clsx(
                                  "h-full rounded-full",
                                  unitPercentage >= 85 ? "bg-rose-500" : "bg-amber-500"
                                )}
                                style={{ width: `${Math.min(unitPercentage, 100)}%` }}
                              />
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 text-right">
                              ${item.revenueAtRisk.toLocaleString()} covered buffer
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center justify-end">
                      {isRequested ? (
                        <div className="flex items-center gap-1 text-brand-teal font-medium bg-teal-50 px-3 py-1.5 rounded-xl text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          278 Sent
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRenew(item.clientId, item.clientName)}
                          className="flex items-center justify-center gap-1 bg-white border border-slate-200 hover:border-brand-teal hover:text-brand-teal text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Initiate Renewal
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
