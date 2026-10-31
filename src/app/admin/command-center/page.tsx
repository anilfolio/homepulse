"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  MapPin, 
  DollarSign, 
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Activity,
  CheckCircle2,
  RefreshCw,
  Building2,
  Zap,
  ChevronRight,
  X,
  Radio
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

interface EscalationItem {
  id: string;
  department: string;
  priority: "CRITICAL" | "HIGH" | "ELEVATED";
  title: string;
  description: string;
  time: string;
  route: string;
  actionText: string;
}

const TOP_ESCALATIONS: EscalationItem[] = [
  {
    id: "esc-1",
    department: "Scheduling",
    priority: "CRITICAL",
    title: "Unstaffed Afternoon Shift (Call-off)",
    description: "Client PT-842 requires 14:00 clock-in. Caregiver CG-12 called out sick.",
    time: "8m ago",
    route: "/scheduler/requirements",
    actionText: "Dispatch",
  },
  {
    id: "esc-2",
    department: "Clinical",
    priority: "HIGH",
    title: "Initial RN Assessment Past 48h Window",
    description: "Client PT-911 admitted Wednesday. Supervisory nurse assignment pending.",
    time: "24m ago",
    route: "/clinical/pending-assessments",
    actionText: "Assign RN",
  },
  {
    id: "esc-3",
    department: "Billing",
    priority: "HIGH",
    title: "Commercial Denial (Missing Prior Auth)",
    description: "Claim #CLM-904 ($1,420.00) flagged. Payor auth code required.",
    time: "1h ago",
    route: "/billing/denials",
    actionText: "Scrub & Resubmit",
  },
];

export default function CommandCenterPage() {
  const router = useRouter();
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSurgeModalOpen, setIsSurgeModalOpen] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Operational Telemetry Synchronized", {
        description: "Aggregator feeds and shift queues are up to date.",
      });
    }, 500);
  };

  const handleSurge = (name: string) => {
    toast.success(`${name} Activated`, {
      description: "Automated alerts dispatched to designated clinical and field teams.",
    });
    setIsSurgeModalOpen(false);
  };

  const departmentQueues = [
    {
      id: "scheduling",
      title: "Scheduling & Dispatch",
      icon: Calendar,
      iconColor: "text-indigo-600 bg-indigo-50",
      statusText: "4 Open Shifts",
      statusType: "danger" as const,
      detail: "2 unassigned visits starting in < 4 hours",
      route: "/scheduler/requirements",
    },
    {
      id: "clinical",
      title: "Clinical Supervisory",
      icon: Stethoscope,
      iconColor: "text-teal-600 bg-teal-50",
      statusText: "2 Overdue",
      statusType: "warning" as const,
      detail: "Initial RN supervisory assessments pending",
      route: "/clinical/pending-assessments",
    },
    {
      id: "field",
      title: "Field Operations & EVV",
      icon: MapPin,
      iconColor: "text-amber-600 bg-amber-50",
      statusText: "1 GPS Variance",
      statusType: "warning" as const,
      detail: "Caregiver CG-44 clocked in 0.42 mi off perimeter",
      route: "/field-supervisor/evv-exceptions",
    },
    {
      id: "billing",
      title: "Billing & Claims Scrub",
      icon: DollarSign,
      iconColor: "text-emerald-600 bg-emerald-50",
      statusText: "$42.8k in Queue",
      statusType: "normal" as const,
      detail: "1 active denial requiring retro-authorization",
      route: "/billing/qa-scrub",
    },
    {
      id: "intake",
      title: "Intake & Census",
      icon: Users,
      iconColor: "text-blue-600 bg-blue-50",
      statusText: "3 New Referrals",
      statusType: "normal" as const,
      detail: "2 ready for admission sign-off today",
      route: "/intake/pipeline",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-8 transition-all">
      {/* ========================================================================= */}
      {/* 1. CLEAN EXECUTIVE HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Agency Command Center
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time cross-department synchronization and bottleneck resolution.
          </p>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Branch Switcher */}
          <div className="relative">
            <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-teal transition-all cursor-pointer shadow-2xs"
            >
              <option value="all">All Branches (HQ)</option>
              <option value="downtown">Downtown Health</option>
              <option value="north">North Valley Hub</option>
              <option value="west">Westside Care</option>
            </select>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Refresh data"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5 text-slate-500", isRefreshing && "animate-spin text-brand-teal")} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Surge Protocol */}
          <button
            onClick={() => setIsSurgeModalOpen(true)}
            className="px-3 py-1.5 bg-[#141D3C] hover:bg-[#1E2B58] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#57EAB6]" />
            <span>Surge Action</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STREAMLINED 4-KPI METRIC STRIP */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Visits In-Flight</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">48</span>
            <span className="text-xs text-slate-400">/ 142 Today</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
            +8.4% vs yesterday · 4 in transit
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>EVV Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">98.7%</span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">Optimal</span>
          </div>
          <span className="text-[11px] text-amber-700 font-semibold block mt-1">
            1 Late Arrival · 1 GPS Variance
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:border-rose-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Open Shifts</span>
            <Calendar className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-700 tracking-tight">4</span>
            <span className="text-xs text-rose-700 font-bold bg-rose-50 px-1.5 py-0.2 rounded">Needs Action</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            2 shifts starting within 4 hours
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Pre-Bill Clean Rate</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">96.2%</span>
            <span className="text-xs text-slate-400">$42.8k Queue</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            1 Denial to scrub · 2 Auths due
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PRIORITIZED TWO-COLUMN LAYOUT (70/30 SPLIT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: CORE WORKFLOWS & ESCALATIONS (8 COLS) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Department Workflow Queues (Unified Clean Grid) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Department Operational Queues
                </h2>
                <p className="text-xs text-slate-500">Live synchronization across agency branches.</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {departmentQueues.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => router.push(item.route)}
                    className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl px-2.5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={clsx("p-2 rounded-xl shrink-0", item.iconColor)}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-brand-teal transition-colors">
                            {item.title}
                          </h3>
                          <span
                            className={clsx(
                              "text-[10px] font-bold px-2 py-0.2 rounded-full shrink-0",
                              item.statusType === "danger"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : item.statusType === "warning"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-slate-100 text-slate-700"
                            )}
                          >
                            {item.statusText}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{item.detail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-brand-teal group-hover:translate-x-0.5 transition-transform hidden sm:inline">
                        Open &rarr;
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-teal group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Operational Escalations */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <ShieldAlert className="w-4.5 h-4.5 text-rose-600" />
                  Priority Action Escalations
                </h2>
                <p className="text-xs text-slate-500">Immediate bottlenecks requiring administrative intervention.</p>
              </div>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                3 Pending
              </span>
            </div>

            <div className="space-y-2.5">
              {TOP_ESCALATIONS.map((esc) => (
                <div
                  key={esc.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={clsx(
                          "px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase tracking-wide",
                          esc.priority === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-900"
                        )}
                      >
                        {esc.priority}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{esc.title}</span>
                      <span className="text-[11px] text-slate-400">· {esc.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{esc.description}</p>
                  </div>

                  <button
                    onClick={() => router.push(esc.route)}
                    className="self-end sm:self-center px-3 py-1.5 bg-[#141D3C] hover:bg-[#1E2B58] text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1"
                  >
                    <span>{esc.actionText}</span>
                    <ArrowRight className="w-3 h-3 text-[#57EAB6]" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CONTEXT & QUICK ACTIONS (4 COLS) */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          
          {/* Live Field Telemetry Radar */}
          <div className="bg-[#141D3C] text-white rounded-2xl p-4.5 border border-[#2A3B75] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-[#57EAB6] animate-pulse" />
                <h3 className="text-xs font-bold tracking-tight text-white uppercase">Live EVV Radar</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 rounded-full">
                Sandata Sync
              </span>
            </div>

            {/* Distribution Count */}
            <div className="grid grid-cols-3 gap-2 bg-[#0E152E] p-3 rounded-xl border border-[#2A3B75]/70 text-center mb-3">
              <div>
                <span className="text-xl font-black text-white">48</span>
                <span className="block text-[10px] text-slate-400 uppercase">On-Site</span>
              </div>
              <div>
                <span className="text-xl font-black text-[#57EAB6]">4</span>
                <span className="block text-[10px] text-slate-400 uppercase">En Route</span>
              </div>
              <div>
                <span className="text-xl font-black text-amber-400">8</span>
                <span className="block text-[10px] text-slate-400 uppercase">On-Call</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/evv-monitoring')}
              className="w-full py-2 bg-gradient-to-r from-[#6C88FF] to-[#57EAB6] text-[#0E152E] font-bold text-xs rounded-xl hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>View Live EVV Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Administrative Operations */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quick Operations
            </h3>

            <div className="space-y-1.5">
              <button
                onClick={() => router.push('/scheduler/dispatch/optimizer')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  Route Optimizer
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => router.push('/billing/qa-scrub')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Run Pre-Bill Scrub
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => router.push('/users')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Staff RBAC Audit
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Compliance Status Pill */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-semibold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> HIPAA Verified
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Zero PHI Logged</span>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. EMERGENCY SURGE PROTOCOL MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSurgeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsSurgeModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 w-full max-w-md relative z-10 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-rose-600" />
                    Surge Emergency Protocols
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Quick triggers for agency operational surges.</p>
                </div>
                <button
                  onClick={() => setIsSurgeModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleSurge("Severe Weather Alert")}
                  className="w-full p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-left transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-amber-900 block">1. Severe Weather / Hazard Alert</span>
                  <span className="text-[11px] text-amber-800">Prompt in-flight caregivers and families for safety checks.</span>
                </button>

                <button
                  onClick={() => handleSurge("1.25x Shift Incentive Surge")}
                  className="w-full p-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-left transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-indigo-900 block">2. Urgent Shift Coverage Surge (1.25x Pay)</span>
                  <span className="text-[11px] text-indigo-800">Broadcast open shifts to all qualified off-duty staff.</span>
                </button>

                <button
                  onClick={() => handleSurge("Pre-Billing Sweep")}
                  className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-left transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-emerald-900 block">3. Automated Claims QA Sweep</span>
                  <span className="text-[11px] text-emerald-800">Scrub all completed shifts for EVV signatures & auths.</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsSurgeModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
