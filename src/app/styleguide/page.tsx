"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Copy,
  Check,
  LayoutDashboard,
  Layers,
  Palette,
  Type,
  Maximize2,
  Box,
  ShieldCheck,
  ArrowRight,
  Activity,
  HeartHandshake,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  MapPin,
  ChevronRight,
  Sliders,
  Eye,
  FileText,
  Building2,
  Lock,
  Phone,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { HomePulseLogo, LogoConcept, LogoVariant, LogoTheme, LogoSize } from "@/components/brand/HomePulseLogo";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";

export default function StyleguidePage() {
  const [activeSection, setActiveSection] = useState<"logo" | "colors" | "typography" | "layouts" | "components" | "compliance">("layouts");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Logo Interactive State
  const [logoConcept, setLogoConcept] = useState<LogoConcept>("home-pulse");
  const [logoVariant, setLogoVariant] = useState<LogoVariant>("horizontal");
  const [logoTheme, setLogoTheme] = useState<LogoTheme>("dark");
  const [logoSize, setLogoSize] = useState<LogoSize>("lg");
  const [showLogoSubtitle, setShowLogoSubtitle] = useState<boolean>(true);

  // Layout Demo State
  const [activeLayoutPattern, setActiveLayoutPattern] = useState<"70-30-split" | "kpi-grid" | "master-detail">("70-30-split");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(text);
    toast.success(`Copied ${label} (${text}) to clipboard!`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const COLOR_PALETTES = [
    {
      group: "Primary Brand Tokens",
      colors: [
        { name: "Navy Deep Space", hex: "#141D3C", desc: "Dark surface, primary text & sidebar canvas", textColor: "text-white" },
        { name: "Active Navy", hex: "#1E2B58", desc: "Active states, telemetry container borders", textColor: "text-white" },
        { name: "Electric Periwinkle", hex: "#6C88FF", desc: "Brand primary, active buttons & accent links", textColor: "text-white" },
        { name: "Vital Mint", hex: "#57EAB6", desc: "Health status, GPS EVV verification, peak pulse", textColor: "text-slate-900" },
        { name: "Page Canvas", hex: "#F4F6FC", desc: "App background canvas for glare-free reading", textColor: "text-slate-900", border: true },
        { name: "Pure Surface", hex: "#FFFFFF", desc: "Cards, modals, elevated surfaces & sheets", textColor: "text-slate-900", border: true },
      ],
    },
    {
      group: "Clinical & Status Semantic Tokens",
      colors: [
        { name: "Success Mint", hex: "#36D49D", desc: "Normal vitals, verified visits, completed shifts", textColor: "text-slate-900" },
        { name: "Informational Blue", hex: "#5371F3", desc: "Assigned visits, dispatch notices, LMS alerts", textColor: "text-white" },
        { name: "Warning Amber", hex: "#F59E0B", desc: "Expiring CPR/CNA, recertification pending", textColor: "text-slate-900" },
        { name: "Critical Coral", hex: "#EF4444", desc: "Fall incidents, missed clock-ins, restricted QA", textColor: "text-white" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FC] text-[#141D3C]">
      {/* Top Banner Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HomePulseLogo variant="horizontal" size="md" showSubtitle={true} subtitleText="Design System v2.0" theme="light" />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <Sparkles className="w-3 h-3 text-[#57EAB6]" /> Styleguide
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto py-2 border-t border-slate-100 hide-scrollbar">
          {[
            { id: "layouts", label: "Better Layouts", icon: Layers },
            { id: "logo", label: "Brand & Logo", icon: Box },
            { id: "colors", label: "Color Tokens", icon: Palette },
            { id: "typography", label: "Typography Scale", icon: Type },
            { id: "components", label: "Component Library", icon: Sliders },
            { id: "compliance", label: "HIPAA & Accessibility", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#141D3C] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* ========================================================================= */}
        {/* SECTION 1: BETTER LAYOUTS (Interactive Architectural Demos) */}
        {/* ========================================================================= */}
        {activeSection === "layouts" && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-brand-primary text-xs font-bold uppercase tracking-wider mb-1">
                    <Layers className="w-4 h-4" /> Layout Architecture
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Better Layout Architectural Patterns
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                    Standardized layouts engineered for high-density clinical clarity, telemetry monitoring, and zero visual clutter.
                  </p>
                </div>

                {/* Pattern Switcher Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setActiveLayoutPattern("70-30-split")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeLayoutPattern === "70-30-split"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    70/30 Command Split
                  </button>
                  <button
                    onClick={() => setActiveLayoutPattern("kpi-grid")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeLayoutPattern === "kpi-grid"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    KPI Metric Grid
                  </button>
                  <button
                    onClick={() => setActiveLayoutPattern("master-detail")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeLayoutPattern === "master-detail"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Master-Detail Pane
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE PATTERN 1: 70/30 Command Split */}
            {activeLayoutPattern === "70-30-split" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                  <span>Interactive Preview: <strong>70% Primary Operations Queue</strong> + <strong>30% Contextual Telemetry Rail</strong></span>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                    Live Operational Demo
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left Column (70% - 8 Cols) */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* 3 Inline KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                        <div className="text-xs text-slate-500 font-medium">Active Visits Today</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">42 <span className="text-xs font-normal text-slate-500">of 45</span></div>
                        <div className="text-[11px] text-emerald-600 font-semibold mt-1">93.3% On Schedule</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                        <div className="text-xs text-slate-500 font-medium">EVV Verified GPS</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">99.4%</div>
                        <div className="text-[11px] text-brand-primary font-semibold mt-1">0 Geofence Violations</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                        <div className="text-xs text-slate-500 font-medium">Critical Condition Flags</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">1 Open</div>
                        <div className="text-[11px] text-amber-600 font-semibold mt-1">RN Review Required</div>
                      </div>
                    </div>

                    {/* Operational Table Container */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-brand-primary" />
                          <h3 className="font-semibold text-sm text-slate-900">Active Field Visit Queue</h3>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">Live Feed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                            <Filter className="w-3 h-3" /> Filter
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                              <th className="py-2.5 px-4">Patient / Caregiver</th>
                              <th className="py-2.5 px-4">Scheduled Window</th>
                              <th className="py-2.5 px-4">EVV Status</th>
                              <th className="py-2.5 px-4">Vitals Status</th>
                              <th className="py-2.5 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            <tr className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-900">Eleanor Vance</div>
                                <div className="text-[11px] text-slate-500">Caregiver: Maria Santos, CNA</div>
                              </td>
                              <td className="py-3 px-4 text-slate-600">08:00 AM – 12:00 PM</td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> In Home (GPS Verified)
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-emerald-600 font-semibold">BP 120/80 • HR 72</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button className="text-xs text-brand-primary font-semibold hover:underline">View Chart</button>
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-900">Robert Jenkins</div>
                                <div className="text-[11px] text-slate-500">Caregiver: David O'Connor, HHA</div>
                              </td>
                              <td className="py-3 px-4 text-slate-600">10:30 AM – 02:30 PM</td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <Clock className="w-3 h-3" /> En Route (ETA 8m)
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-slate-400">Awaiting Log</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button className="text-xs text-brand-primary font-semibold hover:underline">View Chart</button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Context Rail (30% - 4 Cols) */}
                  <div className="lg:col-span-4 space-y-4">
                    {/* Live Telemetry Card */}
                    <div className="bg-[#141D3C] text-white rounded-2xl p-5 border border-[#2A3B75] shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#57EAB6] animate-pulse" />
                          <h4 className="font-semibold text-xs tracking-wider uppercase text-slate-300">Live Telemetry Hub</h4>
                        </div>
                        <span className="text-[10px] font-mono text-[#57EAB6] bg-[#1E2B58] px-2 py-0.5 rounded">99.99% Up</span>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 bg-[#1E2B58]/60 rounded-xl border border-[#2A3B75]/50">
                          <div className="text-xs text-[#A8B7DC]">Active EVV Geofence Signals</div>
                          <div className="text-lg font-bold text-white mt-0.5">38 Verified Points</div>
                          <div className="text-[10px] text-[#57EAB6] mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Accuracy within 4.2 meters
                          </div>
                        </div>

                        <div className="p-3 bg-[#1E2B58]/60 rounded-xl border border-[#2A3B75]/50">
                          <div className="text-xs text-[#A8B7DC]">State Reporting Compliance</div>
                          <div className="text-lg font-bold text-white mt-0.5">100% Survey Ready</div>
                          <div className="text-[10px] text-slate-300 mt-1">Zero unscoped state reportable events</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#2A3B75]/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400">HIPAA Session Encrypted</span>
                        <Lock className="w-3.5 h-3.5 text-[#57EAB6]" />
                      </div>
                    </div>

                    {/* Quick Dispatch Action Widget */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                      <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500 mb-3">Quick Field Actions</h4>
                      <div className="space-y-2">
                        <button className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors border border-slate-100">
                          <span>Dispatch Urgent Visit</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors border border-slate-100">
                          <span>Broadcast Shift Availability</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* LIVE PATTERN 2: Responsive KPI Grid */}
            {activeLayoutPattern === "kpi-grid" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="text-xs font-medium text-slate-500">
                  Preview: <strong>4-Column Standardized Metric Grid</strong> with dynamic status pills and micro-interactions.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: "Monthly Claims", value: "$342,850", trend: "+8.4%", icon: FileText, color: "text-brand-primary", bg: "bg-brand-primary/10" },
                    { title: "Active Patients", value: "128", trend: "+12 New", icon: Users, color: "text-[#57EAB6]", bg: "bg-emerald-500/10" },
                    { title: "Caregivers Clocked-In", value: "46 / 50", trend: "92% Attendance", icon: CheckCircle2, color: "text-brand-primary", bg: "bg-brand-primary/10" },
                    { title: "Recertification Due", value: "3", trend: "Action Req.", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-brand-primary/40 transition-all group cursor-default"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.title}</span>
                        <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <card.icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{card.value}</span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {card.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* LIVE PATTERN 3: Master-Detail Split Pane */}
            {activeLayoutPattern === "master-detail" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="text-xs font-medium text-slate-500">
                  Preview: <strong>Master-Detail Split Pane</strong> (40% List on Left, 60% Detail Viewer on Right).
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left Master List (40% - 5 cols) */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Incoming Referrals</span>
                      <span className="text-xs font-semibold text-brand-primary">4 Unreviewed</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {[
                        { name: "Margaret Sullivan", mrn: "MRN-84920", age: "78yo F", status: "Urgent", active: true },
                        { name: "Arthur Pendelton", mrn: "MRN-33102", age: "82yo M", status: "Standard", active: false },
                        { name: "Clara Higgins", mrn: "MRN-55921", age: "69yo F", status: "Standard", active: false },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className={`p-3.5 cursor-pointer transition-colors ${
                            item.active ? "bg-brand-primary/5 border-l-4 border-brand-primary" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-900">{item.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.status === "Urgent" ? "bg-red-50 text-red-600 border border-red-200" : "bg-slate-100 text-slate-600"
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{item.mrn} • {item.age} • Post-Op Rehab</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Detail Inspection Pane (60% - 7 cols) */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-base text-slate-900">Margaret Sullivan</h3>
                        <p className="text-xs text-slate-500">Referred by St. Jude Memorial Hospital • Admitted 2h ago</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Pending Clinical RN Assessment
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-500 block">Primary Diagnosis</span>
                        <strong className="text-slate-800 text-sm">Post Total Hip Arthroplasty</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-500 block">Requested Service</span>
                        <strong className="text-slate-800 text-sm">Skilled Nursing + PT (3x/wk)</strong>
                      </div>
                    </div>

                    <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900">
                      <strong>Nurse Intake Note:</strong> Client requires assistance with ambulation, weight-bearing as tolerated. Family caregiver requested afternoon visits.
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Reject</button>
                      <button className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-brand-primary text-white shadow-xs hover:bg-[#5371F3]">
                        Accept & Schedule RN Intake
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: BRAND & LOGO EXPLORER */}
        {/* ========================================================================= */}
        {activeSection === "logo" && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-brand-primary text-xs font-bold uppercase tracking-wider mb-1">
                <Box className="w-4 h-4" /> Brand Identity Standards
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                HomePulse Vector Logo System
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Scalable, high-precision SVG component supporting 3 concept variants, multiple layouts, light/dark themes, and micro-animations.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Controls Panel (4 Cols) */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-semibold text-sm text-slate-900 border-b border-slate-100 pb-2">Component Controls</h3>

                {/* Concept Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Concept Variant</label>
                  <div className="space-y-1">
                    {[
                      { id: "home-pulse", label: "Official HD Brand Mark (Shield + Pulse)" },
                      { id: "app-icon", label: "Favicon & App Icon Squircle" },
                    ].map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setLogoConcept(c.id as any)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          logoConcept === c.id ? "bg-[#141D3C] text-white" : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variant Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Layout Variant</label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                    {(["horizontal", "icon-only", "stacked"] as LogoVariant[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => setLogoVariant(v)}
                        className={`py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                          logoVariant === v ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Size</label>
                  <div className="grid grid-cols-5 gap-1 bg-slate-100 p-1 rounded-xl">
                    {(["xs", "sm", "md", "lg", "xl"] as LogoSize[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setLogoSize(s)}
                        className={`py-1 text-xs font-semibold rounded-lg uppercase transition-all ${
                          logoSize === s ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtitle Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Show Subtitle</span>
                  <input
                    type="checkbox"
                    checked={showLogoSubtitle}
                    onChange={(e) => setShowLogoSubtitle(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* Live Canvas Area (8 Cols) */}
              <div className="lg:col-span-8 space-y-4">
                {/* Dark Theme Canvas */}
                <div className="bg-[#141D3C] rounded-2xl p-10 border border-[#2A3B75] flex flex-col items-center justify-center min-h-[220px] relative">
                  <span className="absolute top-3 left-4 text-[10px] font-mono uppercase tracking-wider text-[#A8B7DC]">
                    Dark Canvas (#141D3C)
                  </span>
                  <HomePulseLogo
                    concept={logoConcept}
                    variant={logoVariant}
                    theme="dark"
                    size={logoSize}
                    showSubtitle={showLogoSubtitle}
                    animated
                  />
                </div>

                {/* Light Theme Canvas */}
                <div className="bg-white rounded-2xl p-10 border border-slate-200 flex flex-col items-center justify-center min-h-[220px] relative shadow-xs">
                  <span className="absolute top-3 left-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Light Canvas (#FFFFFF)
                  </span>
                  <HomePulseLogo
                    concept={logoConcept}
                    variant={logoVariant}
                    theme="light"
                    size={logoSize}
                    showSubtitle={showLogoSubtitle}
                    animated
                  />
                </div>

                {/* Code Usage Box */}
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto relative">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `<HomePulseLogo concept="${logoConcept}" variant="${logoVariant}" size="${logoSize}" showSubtitle={${showLogoSubtitle}} />`,
                        "React Code"
                      )
                    }
                    className="absolute top-3 right-3 text-slate-400 hover:text-white flex items-center gap-1 text-[11px] bg-slate-800 px-2 py-1 rounded"
                  >
                    <Copy className="w-3 h-3" /> Copy JSX
                  </button>
                  <pre>{`<HomePulseLogo
  concept="${logoConcept}"
  variant="${logoVariant}"
  size="${logoSize}"
  showSubtitle={${showLogoSubtitle}}
  animated
/>`}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: COLOR TOKENS */}
        {/* ========================================================================= */}
        {activeSection === "colors" && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-brand-primary text-xs font-bold uppercase tracking-wider mb-1">
                <Palette className="w-4 h-4" /> Color Palette & Tokens
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Color Architecture & Semantic Roles
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Click any color swatch to instantly copy its HEX code to your clipboard.
              </p>
            </div>

            {COLOR_PALETTES.map((group, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">{group.group}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.colors.map((c) => (
                    <div
                      key={c.name}
                      onClick={() => copyToClipboard(c.hex, c.name)}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-brand-primary/50 transition-all cursor-pointer group"
                    >
                      <div
                        className="h-24 p-4 flex flex-col justify-between transition-transform group-hover:scale-[1.02]"
                        style={{ backgroundColor: c.hex }}
                      >
                        <span className={`text-xs font-mono font-bold ${c.textColor}`}>
                          {copiedColor === c.hex ? "✓ COPIED" : c.hex}
                        </span>
                        <span className={`text-[11px] font-semibold opacity-80 ${c.textColor}`}>
                          Click to copy
                        </span>
                      </div>
                      <div className="p-3.5">
                        <strong className="text-xs font-bold text-slate-900 block">{c.name}</strong>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{c.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: TYPOGRAPHY SCALE */}
        {/* ========================================================================= */}
        {activeSection === "typography" && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-brand-primary text-xs font-bold uppercase tracking-wider mb-1">
                <Type className="w-4 h-4" /> Typography System
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Inter Typeface Hierarchy
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Engineered with tight tracking and balanced line-heights for optimal legibility across mobile point-of-care and high-density dispatch screens.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-8 divide-y divide-slate-100">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Display Hero • 48px Bold</span>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                  HomePulse Healthcare
                </h1>
              </div>

              <div className="pt-6">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Page Title • 24px Bold</span>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Clinical Assessments & Care Plans
                </h2>
              </div>

              <div className="pt-6">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Section Header • 18px Semibold</span>
                <h3 className="text-lg font-semibold text-slate-900">
                  Caregiver Credentials & State Licensing
                </h3>
              </div>

              <div className="pt-6">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Card Header / Metric • 28px ExtraBold</span>
                <div className="text-3xl font-extrabold text-slate-900">
                  99.85% Compliance Score
                </div>
              </div>

              <div className="pt-6">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Body Primary • 14px Regular</span>
                <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
                  Care plan was reviewed with client and authorized representative on October 24, 2026. All ADL/IADL assistance goals have been met with zero reported safety incidents during supervisory visits.
                </p>
              </div>

              <div className="pt-6">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Micro Label / Metadata • 11px Bold Uppercase</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary">
                  HIPAA-Protected Medical Telemetry • GPS EVV Active
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: COMPONENT LIBRARY */}
        {/* ========================================================================= */}
        {activeSection === "components" && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-brand-primary text-xs font-bold uppercase tracking-wider mb-1">
                <Sliders className="w-4 h-4" /> Component Library
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Reusable UI Primitives
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Ready-to-use buttons, status badges, interactive cards, and form inputs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buttons Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Button Variants</h3>
                <div className="flex flex-wrap gap-2.5">
                  <button className="bg-gradient-to-r from-[#6C88FF] to-[#5371F3] hover:from-[#5A77FF] hover:to-[#4362E6] text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-[#6C88FF]/25 active:scale-95 transition-all">
                    Primary Gradient
                  </button>
                  <button className="bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs border border-slate-200 active:scale-95 transition-all">
                    Secondary Neutral
                  </button>
                  <button className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold px-3 py-2 rounded-xl text-xs transition-colors">
                    Ghost Action
                  </button>
                  <button className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold px-3 py-2 rounded-xl text-xs transition-all">
                    Destructive Action
                  </button>
                </div>
              </div>

              {/* Badges Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Status Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">EVV Verified (GPS)</Badge>
                  <Badge variant="brand">RN Supervised</Badge>
                  <Badge variant="warning">CPR Due in 14d</Badge>
                  <Badge variant="error">Fall Alert Flagged</Badge>
                  <Badge variant="info">Upcoming Shift</Badge>
                  <Badge variant="neutral">Draft Record</Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 6: HIPAA & ACCESSIBILITY */}
        {/* ========================================================================= */}
        {activeSection === "compliance" && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-brand-primary text-xs font-bold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" /> Regulatory Standards
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                HIPAA, COPPA & WCAG 2.1 AA Compliance
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Mandatory rules for healthcare data privacy, sensitive PHI rendering, and mobile clinical accessibility.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">PHI Masking Standard</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Medical Record Numbers and SSNs must default to masked presentation (<code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">•••-••-1294</code>) with an intentional click-to-reveal toggle.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">44px Touch Targets</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Caregiver mobile clock-in, vitals entry, and signature pads require minimum <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">44px x 44px</code> touch boundaries to prevent clinical charting mis-clicks.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">8.5:1 Contrast Ratio</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Body text in Deep Navy on Canvas exceeds WCAG 2.1 AAA contrast guidelines (7:1 standard), ensuring legibility in bright sunlight during home visits.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
