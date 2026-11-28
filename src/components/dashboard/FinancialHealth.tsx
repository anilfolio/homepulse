"use client";

import React from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

const PAYER_COLORS: Record<string, string> = {
  Medicare: "#6C88FF",
  Medicaid: "#57EAB6",
  "Private Pay": "#8B5CF6",
  Commercial: "#F59E0B",
};

export function FinancialHealth() {
  const { state } = useAgencyStore();

  const totalVolume = state.claims.reduce((s, c) => s + c.amount, 0);
  const draftAmount = state.claims
    .filter((c) => c.status === "Draft")
    .reduce((s, c) => s + c.amount, 0);
  const deniedAmount = state.claims
    .filter((c) => c.status === "Denied")
    .reduce((s, c) => s + c.amount, 0);

  const byPayer = (["Medicare", "Medicaid", "Private Pay", "Commercial"] as const).map((payer) => {
    const sum = state.claims
      .filter((c) => c.payer === payer)
      .reduce((s, c) => s + c.amount, 0);
    const pct = totalVolume > 0 ? Math.round((sum / totalVolume) * 100) : 25;
    return { name: payer, value: Math.max(1, pct), color: PAYER_COLORS[payer] };
  });

  return (
    <Card className="flex flex-col h-full bg-white backdrop-blur-xl rounded-2xl p-4 border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:border-brand-teal/60 transition-all duration-300 relative overflow-hidden">
      <CardHeader
        title="Financial Health"
        action={
          <Link href="/billing">
            <span className="text-brand-teal text-sm font-medium hover:underline cursor-pointer">
              Details →
            </span>
          </Link>
        }
      />

      <div className="flex gap-4 mb-6">
        <div className="relative w-[160px] h-[160px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={byPayer}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {byPayer.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-text-secondary">Claims Vol</span>
            <span className="font-bold text-text-primary">${totalVolume.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-2 text-xs">
          {byPayer.map((item) => (
            <div key={item.name} className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-text-secondary">{item.name}</span>
              </div>
              <span className="font-medium">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-50 border border-border-subtle rounded-xl p-3">
          <div className="text-xs text-text-secondary mb-1">Draft / Unbilled</div>
          <div className="font-semibold text-lg">${draftAmount.toLocaleString()}</div>
        </div>
        <div className="bg-slate-50 border border-border-subtle rounded-xl p-3">
          <div className="text-xs text-text-secondary mb-1">Denied Claims</div>
          <div className="font-semibold text-lg text-accent-red">${deniedAmount.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-text-secondary font-medium">Private Pay Invoices ({state.invoices.length})</span>
        </div>
        <div className="w-full h-3 flex rounded-full overflow-hidden">
          <div className="bg-brand-teal w-[60%]" title="0-30 Days: 60%" />
          <div className="bg-accent-amber w-[25%]" title="31-60 Days: 25%" />
          <div className="bg-accent-orange w-[10%]" title="61-90 Days: 10%" />
          <div className="bg-accent-red w-[5%]" title="90+ Days: 5%" />
        </div>
        <div className="flex justify-between text-[10px] text-text-secondary mt-1.5">
          <span>0-30 Days</span>
          <span>90+</span>
        </div>
      </div>
    </Card>
  );
}
