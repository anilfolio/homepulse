"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  PhoneOff,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { Role } from "@/types/rbac";

const WAVE_1_ROLES: { role: Role; label: string; route: string; tag: string }[] = [
  { role: "ADMIN", label: "Admin", route: "/dashboard", tag: "Control Tower" },
  { role: "SCHEDULER", label: "Scheduler", route: "/scheduler", tag: "Dispatch" },
  { role: "CAREGIVER", label: "Caregiver", route: "/caregiver", tag: "Point of Care" },
  { role: "BILLING_FINANCE_STAFF", label: "Billing / EVV", route: "/billing/workspace", tag: "Revenue" },
  { role: "FAMILY", label: "Family Portal", route: "/portal/visits", tag: "Transparency" },
  { role: "CLIENT", label: "Client Portal", route: "/portal", tag: "Self-Service" },
];

const WAVE_2_ROLES: { role: Role; label: string; route: string; tag: string }[] = [
  { role: "PARTNER", label: "Partner", route: "/partner", tag: "B2B Referral" },
  { role: "INTAKE_COORDINATOR", label: "Intake", route: "/intake/dashboard", tag: "Triage & Admit" },
  { role: "CLINICAL_SUPERVISOR_RN", label: "Clinical RN", route: "/clinical", tag: "RN Oversight" },
  { role: "QA_COMPLIANCE_OFFICER", label: "QA Compliance", route: "/compliance", tag: "Survey & Risk" },
];

const WAVE_3_ROLES: { role: Role; label: string; route: string; tag: string }[] = [
  { role: "HR", label: "HR & Recruiting", route: "/hr/dashboard", tag: "Talent & Creds" },
  { role: "TRAINER", label: "Trainer LMS", route: "/training-admin", tag: "Courses & Quiz" },
  { role: "FIELD_SUPERVISOR", label: "Field Sup", route: "/field-supervisor", tag: "Field Visits" },
];

const ALL_DEMO_ROLES = [...WAVE_1_ROLES, ...WAVE_2_ROLES, ...WAVE_3_ROLES];

export function DemoStudioMenu() {
  const router = useRouter();
  const { currentUser, switchRole } = useAuth();
  const {
    state,
    autoFillAllUnfilled,
    triggerCallOff,
    simulateOutOfRadiusException,
    simulateUrgentHospitalReferral,
    simulateCaregiverFallIncident,
    simulateHrCandidateHire,
    simulateFieldFindingEscalation,
    resetDemoData,
  } = useAgencyStore();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleRoleSwitch = (role: Role, route: string, label: string) => {
    switchRole(role);
    setIsOpen(false);
    toast.success(`Switched persona to ${label}`);
    router.push(route);
  };

  const handleSimulateCallOff = () => {
    const scheduledVisit = state.visits.find((v) => v.status === "Scheduled");
    if (!scheduledVisit) {
      toast.info("No scheduled visit available for call-off simulation.");
      return;
    }
    triggerCallOff(scheduledVisit.id, "Simulated sudden transit delay");
    setIsOpen(false);
    toast.warning("Call-off triggered & Top-3 backfill offers dispatched to Scheduler.");
  };

  const handleSimulateGeofence = () => {
    simulateOutOfRadiusException();
    setIsOpen(false);
    toast.warning("Simulated >100m GPS exception — visit flagged & billing held.");
  };

  const handleAutoFill = () => {
    const filled = autoFillAllUnfilled();
    setIsOpen(false);
    if (filled > 0) {
      toast.success(`Auto-assigned ${filled} open shift(s) using Smart Dispatch.`);
    } else {
      toast.info("All shifts are already covered.");
    }
  };

  const handleSimulateUrgentReferral = () => {
    simulateUrgentHospitalReferral();
    setIsOpen(false);
    toast.warning("Urgent 24h Mercy General discharge referral sent to Intake Pipeline.");
  };

  const handleSimulateFallIncident = () => {
    simulateCaregiverFallIncident();
    setIsOpen(false);
    toast.warning("Fall incident filed — Clinical Escalation & RN Reassessment triggered.");
  };

  const handleSimulateHrHire = () => {
    simulateHrCandidateHire();
    setIsOpen(false);
    toast.success("HR candidate onboarded & added to Scheduler Dispatch roster!");
  };

  const handleSimulateFieldFinding = () => {
    simulateFieldFindingEscalation();
    setIsOpen(false);
    toast.warning("Urgent field evaluation finding escalated to Clinical RN!");
  };

  const handleReset = () => {
    resetDemoData();
    setIsOpen(false);
    toast.success("Prototype demo data reset to baseline.");
  };

  const activeRoleLabel =
    ALL_DEMO_ROLES.find((r) => r.role === currentUser?.role)?.label ||
    currentUser?.role ||
    "ADMIN";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#141D3C] text-white border border-[#2A3B75] hover:bg-[#1E2B58] transition-colors shadow-xs cursor-pointer"
        title="HomePulse Demo Studio & Persona Switcher"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#57EAB6]" />
        <span className="hidden sm:inline">Demo:</span>
        <span className="text-[#57EAB6]">{activeRoleLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 bg-white rounded-2xl shadow-[0_12px_40px_rgba(20,29,60,0.18)] border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-3 bg-[#141D3C] text-white flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#57EAB6]">
                HomePulse Demo Studio
              </p>
              <p className="text-[11px] text-slate-300">
                All 13 personas + live automation
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="p-3 space-y-3 max-h-[75vh] overflow-y-auto">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
                Wave 1 — Core Ops &amp; Portals
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {WAVE_1_ROLES.map((item) => {
                  const isActive = currentUser?.role === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleRoleSwitch(item.role, item.route, item.label)}
                      className={`text-left px-2.5 py-2 rounded-xl border text-xs transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#6C88FF]/10 border-[#6C88FF] text-[#141D3C] font-bold"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-medium"
                      }`}
                    >
                      <div className="truncate">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.tag}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
                Wave 2 — Intake, Clinical &amp; QA
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {WAVE_2_ROLES.map((item) => {
                  const isActive = currentUser?.role === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleRoleSwitch(item.role, item.route, item.label)}
                      className={`text-left px-2.5 py-2 rounded-xl border text-xs transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#6C88FF]/10 border-[#6C88FF] text-[#141D3C] font-bold"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-medium"
                      }`}
                    >
                      <div className="truncate">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.tag}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
                Wave 3 — HR, Training &amp; Field
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {WAVE_3_ROLES.map((item) => {
                  const isActive = currentUser?.role === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleRoleSwitch(item.role, item.route, item.label)}
                      className={`text-left px-2.5 py-2 rounded-xl border text-xs transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#6C88FF]/10 border-[#6C88FF] text-[#141D3C] font-bold"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-medium"
                      }`}
                    >
                      <div className="truncate">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.tag}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
                Live Scenario Triggers
              </p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    Auto-Fill All Open Shifts
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={handleSimulateCallOff}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <PhoneOff className="w-3.5 h-3.5 text-amber-600" />
                    Simulate Caregiver Call-Off
                  </span>
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                </button>

                <button
                  type="button"
                  onClick={handleSimulateGeofence}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Simulate &gt;100m GPS Exception
                  </span>
                  <span className="text-[10px] font-bold">EVV Hold</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateUrgentReferral}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    Simulate Urgent Hospital Referral
                  </span>
                  <span className="text-[10px] font-bold">Intake</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateFallIncident}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                    Simulate Fall / RN Escalation
                  </span>
                  <span className="text-[10px] font-bold">Clinical/QA</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateHrHire}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-3.5 h-3.5 text-teal-600" />
                    Simulate HR Caregiver Hire
                  </span>
                  <span className="text-[10px] font-bold">Dispatch</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateFieldFinding}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ClipboardCheck className="w-3.5 h-3.5 text-sky-600" />
                    Simulate Field Finding Escalation
                  </span>
                  <span className="text-[10px] font-bold">Field → RN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
