"use client";

import React, { useState, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  Users,
  Pill,
  Clock,
  ShieldCheck,
  HeartPulse,
  FileText,
  TrendingUp,
  Receipt,
  CalendarDays,
  X,
} from "lucide-react";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { INITIAL_AGENCY_CLIENTS } from "@/lib/store/agencySeedData";
import { mockPatients } from "@/lib/patients/mockData";
import { initialVisits as initialEvvVisits } from "@/app/evv-monitoring/mockData";

const placeholders = [
  "Search clients, caregivers, shifts...",
  "Search claims, authorizations, EVV...",
  "Search referrals, incidents, courses...",
  "Press Ctrl+K / Cmd+K anywhere...",
];

const categoryChips = [
  { label: "Clients", icon: Users, color: "bg-accent-blue/10 text-accent-blue" },
  { label: "Caregivers", icon: HeartPulse, color: "bg-brand-teal/10 text-brand-teal" },
  { label: "EVV & Visits", icon: CalendarDays, color: "bg-accent-orange/10 text-accent-orange" },
  { label: "Billing", icon: Receipt, color: "bg-accent-purple/10 text-accent-purple" },
  { label: "Compliance", icon: ShieldCheck, color: "bg-accent-green/10 text-accent-green" },
  { label: "Referrals", icon: FileText, color: "bg-slate-100 text-slate-600" },
];

const trendingKeywords = ["Eleanor", "Maria", "EVV", "Medicaid", "Dementia"];

interface SearchHit {
  id: string;
  title: string;
  matchedIn: string;
  icon: typeof Users;
  color: string;
  path: string;
}

export function GlobalSearch() {
  const router = useRouter();
  const { state } = useAgencyStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fadePlaceholder, setFadePlaceholder] = useState(true);
  const [showInitialAnimation, setShowInitialAnimation] = useState(true);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const closeSearch = () => {
    setIsOpen(false);
    setQuery("");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (showInitialAnimation) return;
    const interval = setInterval(() => {
      setFadePlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((current) => (current + 1) % placeholders.length);
        setFadePlaceholder(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, [showInitialAnimation]);

  useEffect(() => {
    const timer = setTimeout(() => setShowInitialAnimation(false), 1600);
    return () => clearTimeout(timer);
  }, []);

  const liveResults = useMemo<SearchHit[]>(() => {
    const raw = query.trim().toLowerCase();
    if (!raw) return [];

    const categoryMatch = /^category:([^\s]+)\s*(.*)$/.exec(raw);
    const catFilter = categoryMatch ? categoryMatch[1] : null;
    const term = categoryMatch ? categoryMatch[2].trim() : raw;

    const hits: SearchHit[] = [];

    if (!catFilter || catFilter.includes("client")) {
      state.clients.forEach((c) => {
        if (
          !term ||
          c.name.toLowerCase().includes(term) ||
          c.payer.toLowerCase().includes(term) ||
          c.authNumber.toLowerCase().includes(term) ||
          c.serviceName.toLowerCase().includes(term)
        ) {
          const isStaticPatientRoute =
            Boolean(mockPatients[c.id]) ||
            INITIAL_AGENCY_CLIENTS.some((seed) => seed.id === c.id);
          hits.push({
            id: `client-${c.id}`,
            title: `${c.name} (${c.payer})`,
            matchedIn: `Client Chart • ${c.authNumber} • ${c.authorizedUnitsRemaining} units left`,
            icon: Users,
            color: "text-accent-blue",
            path: isStaticPatientRoute ? `/patients/${c.id}` : `/patients`,
          });
        }
      });
    }

    if (!catFilter || catFilter.includes("caregiver")) {
      state.caregivers.forEach((cg) => {
        if (
          !term ||
          cg.name.toLowerCase().includes(term) ||
          cg.roleTitle.toLowerCase().includes(term) ||
          cg.skills.some((s) => s.toLowerCase().includes(term))
        ) {
          hits.push({
            id: `cg-${cg.id}`,
            title: `${cg.name} — ${cg.roleTitle}`,
            matchedIn: `Caregiver • ${cg.weeklyHoursScheduled}/${cg.maxWeeklyHours}h • Rating ${cg.rating}`,
            icon: HeartPulse,
            color: "text-brand-teal",
            path: `/scheduler`,
          });
        }
      });
    }

    if (!catFilter || catFilter.includes("evv") || catFilter.includes("visit")) {
      state.visits.forEach((v) => {
        const client = state.clients.find((c) => c.id === v.clientId);
        if (
          !term ||
          v.evvId.toLowerCase().includes(term) ||
          v.status.toLowerCase().includes(term) ||
          v.evvCompliance.toLowerCase().includes(term) ||
          (client?.name.toLowerCase().includes(term) ?? false)
        ) {
          const isStaticEvvRoute = initialEvvVisits.some((ev) => ev.id === v.evvId);
          hits.push({
            id: `visit-${v.id}`,
            title: `${v.evvId} • ${client?.name ?? "Visit"} (${v.status})`,
            matchedIn: `EVV: ${v.evvCompliance} • ${v.scheduledStart}–${v.scheduledEnd}`,
            icon: Clock,
            color: "text-accent-orange",
            path: isStaticEvvRoute ? `/evv-monitoring/${v.evvId}` : `/evv-monitoring`,
          });
        }
      });
    }

    if (!catFilter || catFilter.includes("billing")) {
      state.claims.forEach((cl) => {
        if (
          !term ||
          cl.id.toLowerCase().includes(term) ||
          cl.patientName.toLowerCase().includes(term) ||
          cl.payer.toLowerCase().includes(term) ||
          cl.status.toLowerCase().includes(term)
        ) {
          hits.push({
            id: `claim-${cl.id}`,
            title: `Claim ${cl.id} — ${cl.patientName} ($${cl.amount})`,
            matchedIn: `Billing • ${cl.status} • Scrub: ${cl.scrubStatus}`,
            icon: Receipt,
            color: "text-accent-purple",
            path: `/billing/workspace`,
          });
        }
      });
    }

    if (!catFilter || catFilter.includes("referral")) {
      state.referrals.forEach((r) => {
        if (
          !term ||
          r.clientName.toLowerCase().includes(term) ||
          r.stage.toLowerCase().includes(term) ||
          (r.sourceDetails?.toLowerCase().includes(term) ?? false)
        ) {
          hits.push({
            id: `ref-${r.id}`,
            title: `Referral: ${r.clientName} (${r.stage})`,
            matchedIn: `Intake • ${r.sourceDetails ?? r.source}`,
            icon: FileText,
            color: "text-slate-600",
            path: `/intake/referrals`,
          });
        }
      });
    }

    if (!catFilter || catFilter.includes("compliance")) {
      state.incidents.forEach((inc) => {
        const personName =
          inc.linkedVisit?.patientName ||
          inc.peopleInvolved.find((p) => p.role === "Patient")?.name ||
          inc.location;
        if (
          !term ||
          personName.toLowerCase().includes(term) ||
          inc.type.toLowerCase().includes(term) ||
          inc.severity.toLowerCase().includes(term)
        ) {
          hits.push({
            id: `inc-${inc.id}`,
            title: `Incident ${inc.id}: ${inc.type} (${inc.severity})`,
            matchedIn: `Compliance • ${personName}`,
            icon: ShieldCheck,
            color: "text-accent-green",
            path: `/compliance`,
          });
        }
      });
    }

    if (!catFilter) {
      state.lmsCourses.forEach((course) => {
        if (!term || course.title.toLowerCase().includes(term)) {
          hits.push({
            id: `course-${course.id}`,
            title: `LMS Course: ${course.title}`,
            matchedIn: `Training • ${course.category} • ${course.ceUnits} CEU`,
            icon: Pill,
            color: "text-brand-teal",
            path: `/caregiver/training`,
          });
        }
      });
    }

    return hits.slice(0, 12);
  }, [query, state]);

  const highlightMatch = (text: string, search: string) => {
    const clean = search.replace(/^category:[^\s]+\s*/i, "").trim();
    if (!clean) return text;
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === clean.toLowerCase() ? (
            <span
              key={i}
              className="bg-brand-teal/20 text-brand-teal font-medium rounded px-0.5"
            >
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <>
      <div
        className="relative flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 bg-white border border-border-subtle rounded-full transition-all duration-300 shadow-[0_4px_20px_rgba(20,29,60,0.05)] hover:shadow-[0_6px_24px_rgba(108,136,255,0.12)] hover:border-brand-primary/40 cursor-text w-full h-10 group"
        onClick={() => setIsOpen(true)}
      >
        <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 text-slate-400 group-hover:text-brand-teal transition-colors" />

        <div className="flex-1 min-w-0 flex items-center h-full text-xs sm:text-sm text-slate-400 overflow-hidden whitespace-nowrap pointer-events-none">
          {showInitialAnimation ? (
            <div className="flex items-center gap-2 animate-[slideRight_1.5s_ease-out_forwards]">
              <Users className="w-4 h-4 text-accent-blue opacity-50 shrink-0" />
              <Pill className="w-4 h-4 text-accent-purple opacity-50 shrink-0" />
              <FileText className="w-4 h-4 text-accent-green opacity-50 shrink-0" />
              <span className="truncate">Unified Agency Search...</span>
            </div>
          ) : (
            <span
              className={`truncate transition-opacity duration-300 ${
                fadePlaceholder ? "opacity-100" : "opacity-0"
              }`}
            >
              {placeholders[placeholderIndex]}
            </span>
          )}
        </div>

        <div className="hidden sm:flex items-center pointer-events-none gap-1.5 shrink-0">
          <div className="hidden md:flex items-center gap-1 bg-brand-teal/10 text-brand-teal text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Unified</span>
          </div>
          <div className="flex items-center gap-0.5 text-xs text-slate-400 font-medium px-1.5 py-0.5 bg-slate-100 rounded-full border border-slate-200">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {mounted &&
        isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-start justify-center sm:pt-[10vh] sm:px-6">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={closeSearch}
            />

            <div className="relative w-full h-full sm:h-auto sm:max-w-3xl bg-white sm:rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col animate-in fade-in sm:zoom-in-95 duration-200">
              <div className="flex items-center border-b border-border-subtle px-4 py-3">
                <Search className="w-5 h-5 text-brand-teal mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search live clients, caregivers, EVV visits, claims, referrals, incidents..."
                  className="flex-1 bg-transparent text-sm sm:text-base text-text-primary placeholder:text-slate-400 focus:outline-none h-10 min-w-0"
                />
                <button
                  type="button"
                  onClick={closeSearch}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors ml-2 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col flex-1 sm:flex-none sm:max-h-[60vh] overflow-y-auto">
                {query.length === 0 ? (
                  <div className="p-5">
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Search Scope
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {categoryChips.map((chip) => {
                          const Icon = chip.icon;
                          return (
                            <button
                              key={chip.label}
                              type="button"
                              onClick={() => {
                                setQuery(`category:${chip.label.toLowerCase()} `);
                                inputRef.current?.focus();
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-transparent hover:border-current text-xs font-medium transition-transform hover:scale-105 cursor-pointer ${chip.color}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {chip.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Quick Queries
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {trendingKeywords.map((keyword) => (
                          <button
                            key={keyword}
                            type="button"
                            onClick={() => setQuery(keyword)}
                            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-border-subtle rounded-full text-xs text-slate-600 cursor-pointer"
                          >
                            {keyword}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3">
                    <div className="px-3 py-2 text-xs font-medium text-slate-400">
                      {liveResults.length} live result(s) for &quot;{query}&quot;
                    </div>
                    <div className="flex flex-col gap-2">
                      {liveResults.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-500">
                          No matching records in Agency Store.
                        </div>
                      ) : (
                        liveResults.map((result) => {
                          const Icon = result.icon;
                          return (
                            <button
                              key={result.id}
                              type="button"
                              onClick={() => {
                                closeSearch();
                                router.push(result.path);
                              }}
                              className="w-full text-left p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all flex items-start gap-3 group cursor-pointer"
                            >
                              <div
                                className={`mt-0.5 p-2 rounded-lg bg-white border border-slate-200 ${result.color}`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-teal">
                                  {highlightMatch(result.title, query)}
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                  {result.matchedIn}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border-subtle bg-slate-50 p-3 px-4 flex items-center justify-between text-[11px] text-slate-500">
                <span>Live Cross-Module Agency Store Search</span>
                <span>Press Esc to close</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
