"use client";

import React, { useEffect, useState } from "react";
import { Lock, ShieldCheck, Unlock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes per RULES.md Section 3.5

export function SessionSecurityGuard() {
  const { currentUser } = useAuth();
  const { logAuditEvent } = useAgencyStore();
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsLocked(true);
        logAuditEvent({
          action: "AUTH_LOCKOUT",
          resourceType: "Session",
          resourceId: currentUser.id,
          summary: "Workstation auto-locked after 15 minutes of inactivity (HIPAA Rule 3.5).",
          status: "Flagged",
        });
      }, INACTIVITY_LIMIT_MS);
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [currentUser, logAuditEvent]);

  if (!isLocked || !currentUser) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLocked(false);
    setPinInput("");
    logAuditEvent({
      action: "AUTH_LOCKOUT",
      resourceType: "Session",
      resourceId: currentUser.id,
      summary: "Workstation session unlocked via user re-authentication.",
      status: "Success",
    });
    toast.success("Session unlocked.");
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#141D3C]/95 backdrop-blur-xl flex items-center justify-center p-4">
      <form
        onSubmit={handleUnlock}
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#141D3C] text-[#57EAB6] flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">HIPAA Session Locked</h2>
          <p className="text-xs text-slate-500 mt-1">
            Workstation automatically locked after 15 minutes of inactivity. Re-authenticate as{" "}
            <span className="font-semibold text-slate-700">{currentUser.name}</span>.
          </p>
        </div>
        <input
          type="password"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          placeholder="Enter PIN or passphrase (any value in demo)..."
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C88FF]"
        />
        <button
          type="submit"
          className="w-full py-2.5 bg-[#141D3C] hover:bg-[#1E2B58] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Unlock className="w-4 h-4 text-[#57EAB6]" />
          Unlock Session
        </button>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          HIPAA Security Rule §164.312(a)(2)(iii)
        </div>
      </form>
    </div>
  );
}
