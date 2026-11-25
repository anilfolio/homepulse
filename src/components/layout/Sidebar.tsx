"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Activity,
  HeartHandshake,
  Receipt,
  ShieldAlert,
  CheckSquare,
  Award,
  GraduationCap,
  BarChart3,
  Inbox,
  MessageSquare,
  Settings,
  ShieldCheck,
  ChevronDown,
  LogOut,
  User,
  PanelLeftClose,
  FileText,
  UserPlus,
  MapPin,
  ListTodo,
  Repeat,
  List,
  Clock,
  Sparkles,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";
import { useAuth } from "@/hooks/useAuth";
import { HomePulseLogo } from "@/components/brand/HomePulseLogo";
import { SidebarTooltip, type SidebarTooltipData } from "@/components/layout/SidebarTooltip";

interface NavItem {
  name: string;
  icon: LucideIcon;
  id: string;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const getNavGroups = (role?: string): NavGroup[] => {
  if (role === "CLIENT") {
    return [
      {
        label: "",
        items: [
          { name: "Overview", icon: LayoutDashboard, id: "overview" },
          { name: "My Schedule", icon: CalendarDays, id: "scheduling" },
          { name: "My Care Plan", icon: HeartHandshake, id: "care-plan" },
          { name: "My Visits", icon: CalendarDays, id: "visits" },
          { name: "My Billing", icon: Receipt, id: "billing" },
          { name: "Messages", icon: MessageSquare, id: "messages" },
          { name: "My Documents", icon: FileText, id: "documents" },
        ],
      },
    ];
  }

  if (role === "FAMILY") {
    return [
      {
        label: "",
        items: [
          { name: "Overview", icon: LayoutDashboard, id: "overview" },
          { name: "Scheduling", icon: CalendarDays, id: "scheduling" },
          { name: "Care Plan", icon: HeartHandshake, id: "care-plan" },
          { name: "Visit History", icon: CalendarDays, id: "visits" },
          { name: "Billing & Payments", icon: Receipt, id: "billing" },
          { name: "Messages", icon: MessageSquare, id: "messages" },
          { name: "Documents", icon: FileText, id: "documents" },
        ],
      },
    ];
  }

  if (role === "CAREGIVER") {
    return [
      {
        label: "Caregiver Navigation",
        items: [
          { name: "Today", icon: LayoutDashboard, id: "today" },
          { name: "Schedule", icon: CalendarDays, id: "schedule" },
          { name: "Messages", icon: MessageSquare, id: "messages", badge: 1 },
          { name: "Training", icon: GraduationCap, id: "training", badge: 1 },
          { name: "Incident Report", icon: ShieldAlert, id: "incidents" },
          { name: "Daily Assessment", icon: CheckSquare, id: "assessments" },
          { name: "Profile", icon: User, id: "profile" },
        ],
      },
    ];
  }

  if (role === "HR") {
    return [
      {
        label: "HR & People Operations",
        items: [
          { name: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
          { name: "Recruiting", icon: UserPlus, id: "recruiting" },
          { name: "Caregivers", icon: HeartHandshake, id: "caregivers" },
          { name: "Training", icon: GraduationCap, id: "training" },
          { name: "Payroll", icon: Receipt, id: "payroll" },
          { name: "Messages", icon: MessageSquare, id: "messages" },
        ],
      },
    ];
  }

  if (role === "SCHEDULER") {
    return [
      {
        label: "Workspace",
        items: [
          { name: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
        ],
      },
      {
        label: "Scheduling & Shifts",
        items: [
          { name: "Scheduled Shifts", icon: ListTodo, id: "scheduled-shifts" },
          { name: "Recurring Patterns", icon: Repeat, id: "recurring-patterns" },
        ],
      },
      {
        label: "Route Planner & Dispatch",
        items: [
          { name: "Route Planner", icon: MapPin, id: "route-optimizer" },
          { name: "Visit List", icon: List, id: "visit-list" },
        ],
      },
      {
        label: "Caregiver Directory",
        items: [
          { name: "Caregiver Roster", icon: HeartHandshake, id: "caregivers" },
          { name: "Availability & Time-Off", icon: Clock, id: "availability" },
        ],
      },
      {
        label: "Patients & Census",
        items: [
          { name: "Patient List & Care Plans", icon: Users, id: "patients" },
        ],
      },
      {
        label: "Communications",
        items: [
          { name: "Messages", icon: MessageSquare, id: "messages" },
        ],
      },
    ];
  }

  if (role === "INTAKE_COORDINATOR") {
    return [
      {
        label: "",
        items: [
          { name: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
          { name: "Referral & Intake", icon: Inbox, id: "referrals" },
          { name: "Patients", icon: Users, id: "patients" },
          { name: "Reports", icon: BarChart3, id: "reports" },
        ],
      },
    ];
  }

  if (role === "BILLING_FINANCE_STAFF") {
    return [
      {
        label: "",
        items: [
          { name: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
          { name: "Billing & Claims", icon: Receipt, id: "billing-workspace" },
          { name: "Authorizations", icon: ShieldCheck, id: "authorizations" },
          { name: "Payroll", icon: Receipt, id: "payroll" },
          { name: "Reports (Financial)", icon: BarChart3, id: "reports" },
          { name: "Messages", icon: MessageSquare, id: "messages" },
        ],
      },
    ];
  }

  if (role === "CLINICAL_SUPERVISOR_RN") {
    return [
      {
        label: "",
        items: [
          { name: "Clinical Dashboard", icon: LayoutDashboard, id: "dashboard" },
          { name: "Patients", icon: Users, id: "patients" },
          { name: "Assessments & Care Plan", icon: CheckSquare, id: "assessments" },
          { name: "QA (Audits)", icon: Award, id: "qa" },
          { name: "Incident Reports", icon: ShieldAlert, id: "incidents" },
          { name: "Messages", icon: MessageSquare, id: "messages" },
        ],
      },
    ];
  }

  if (role === "QA_COMPLIANCE_OFFICER") {
    return [
      {
        label: "",
        items: [
          { name: "Compliance Dashboard", icon: LayoutDashboard, id: "dashboard" },
          { name: "Compliance Tracking", icon: CheckSquare, id: "compliance" },
          { name: "Quality Assurance", icon: Award, id: "qa" },
          { name: "Incident Reports", icon: ShieldAlert, id: "incidents" },
          { name: "Reports (Compliance)", icon: BarChart3, id: "reports" },
          { name: "Messages", icon: MessageSquare, id: "messages" },
        ],
      },
    ];
  }

  if (role === "FIELD_SUPERVISOR") {
    return [
      {
        label: "",
        items: [
          { name: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
          { name: "Supervisory Visits", icon: CheckSquare, id: "visits" },
          { name: "Incident Reports", icon: ShieldAlert, id: "incidents" },
          { name: "Caregivers", icon: Users, id: "caregivers" },
          { name: "Messages", icon: MessageSquare, id: "messages" },
        ],
      },
    ];
  }

  if (role === "TRAINER") {
    return [
      {
        label: "Training Center",
        items: [
          { name: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
          { name: "Course Builder", icon: GraduationCap, id: "course-builder" },
          { name: "Quiz Management", icon: CheckSquare, id: "quizzes" },
          { name: "Course Library", icon: Inbox, id: "courses" },
          { name: "Compliance Tracking", icon: ShieldCheck, id: "compliance" },
          { name: "Messages", icon: MessageSquare, id: "messages" },
        ],
      },
    ];
  }


  // Default ADMIN / other roles
  return [
    {
      label: "",
      items: [
        { name: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
        { name: "Command Center", icon: Activity, id: "command-center" },
        { name: "User Management", icon: ShieldCheck, id: "users" },
        { name: "Patients", icon: Users, id: "patients" },
        { name: "Scheduling", icon: CalendarDays, id: "scheduling" },
        { name: "Caregivers & HR", icon: HeartHandshake, id: "caregivers" },
        { name: "Billing & Claims", icon: Receipt, id: "billing-admin" },
      ],
    },
    {
      label: "COMPLIANCE & QUALITY",
      items: [
        { name: "Incident & Risk", icon: ShieldAlert, id: "incidents" },
        { name: "Compliance Tracking", icon: CheckSquare, id: "compliance" },
        { name: "EVV & Visits", icon: Activity, id: "evv-monitoring" },
        { name: "Quality Assurance", icon: Award, id: "qa" },
      ],
    },
    {
      label: "TALENT & GROWTH",
      items: [
        { name: "Training (LMS)", icon: GraduationCap, id: "training" },
        { name: "Referrals & Intake", icon: Inbox, id: "referrals" },
        { name: "Communications", icon: MessageSquare, id: "communications" },
        { name: "Reports & BI", icon: BarChart3, id: "reports" },
        { name: "Payroll", icon: Receipt, id: "payroll" },
        { name: "UI Styleguide", icon: Sparkles, id: "styleguide" },
      ],
    },
  ];
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { isCollapsed, hasMounted } = useSidebarCollapse();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tooltip, setTooltip] = useState<SidebarTooltipData | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const showMiniTooltip = useCallback(
    (el: HTMLElement, label: string, options?: { badge?: number; description?: string }) => {
      if (hasMounted && !isCollapsed) return;
      if (typeof window !== "undefined" && window.innerWidth < 768) return;
      const rect = el.getBoundingClientRect();
      setTooltip({
        label,
        badge: options?.badge,
        description: options?.description,
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
      });
    },
    [hasMounted, isCollapsed]
  );

  const hideMiniTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  // Close drawer / profile popover on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isProfileOpen) setIsProfileOpen(false);
        if (isOpen && onClose) onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, isProfileOpen, onClose]);

  // Close profile menu when clicking outside
  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  // Close mobile drawer when crossing into md+ docked sidebar mode
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, onClose]);

  // Lock body scroll only on mobile drawer open
  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && window.innerWidth < 768) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const safeUser = hasMounted ? currentUser : null;

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    router.push("/login");
  };

  const activeItem = React.useMemo(() => {
    // portal
    if (pathname?.startsWith("/portal/visits")) return "visits";
    if (pathname?.startsWith("/portal/schedule")) return "scheduling";
    if (pathname?.startsWith("/portal/messages")) return "messages";
    if (pathname?.startsWith("/portal/billing")) return "billing";
    if (pathname?.startsWith("/portal/documents")) return "documents";
    if (pathname?.startsWith("/portal/care-plan")) return "care-plan";
    if (pathname === "/portal" || pathname?.startsWith("/portal")) return "overview";

    // caregiver
    if (pathname === "/caregiver/schedule" || pathname?.startsWith("/caregiver/schedule")) return "schedule";
    if (pathname === "/caregiver/messages" || pathname?.startsWith("/caregiver/messages")) return "messages";
    if (pathname === "/caregiver/training" || pathname?.startsWith("/caregiver/training")) return "training";
    if (pathname === "/caregiver/profile" || pathname?.startsWith("/caregiver/profile")) return "profile";
    if (pathname?.startsWith("/caregiver/incidents")) return "incidents";
    if (pathname?.startsWith("/caregiver/assessments")) return "assessments";
    if (pathname === "/caregiver" || pathname?.startsWith("/caregiver")) return "today";

    // hr
    if (pathname?.startsWith("/hr/recruiting")) return "recruiting";
    if (pathname?.startsWith("/hr/caregivers")) return "caregivers";
    if (pathname?.startsWith("/hr/training")) return "training";
    if (pathname?.startsWith("/hr/payroll")) return "payroll";
    if (pathname?.startsWith("/hr/messages")) return "messages";
    if (pathname?.startsWith("/hr/dashboard") || pathname === "/hr") return "dashboard";

    // scheduler
    if (pathname?.startsWith("/scheduler/shifts") && !pathname?.startsWith("/scheduler/shifts/recurring")) return "scheduled-shifts";
    if (pathname?.startsWith("/scheduler/shifts/recurring")) return "recurring-patterns";
    if (pathname?.startsWith("/scheduler/dispatch/optimizer")) return "route-optimizer";
    if (pathname?.startsWith("/scheduler/dispatch/visits")) return "visit-list";
    if (pathname?.startsWith("/scheduler/caregivers/availability")) return "availability";
    if (pathname?.startsWith("/scheduler/caregivers")) return "caregivers";
    if (pathname?.startsWith("/scheduler/patients/list")) return "patients";
    if (pathname?.startsWith("/scheduler/messages")) return "messages";
    if (pathname === "/scheduler" || pathname === "/scheduler/") return "dashboard";

    // trainer
    if (pathname?.startsWith("/training-admin/courses/builder")) return "course-builder";
    if (pathname?.startsWith("/training-admin/courses")) return "courses";
    if (pathname?.startsWith("/training-admin/quizzes")) return "quizzes";
    if (pathname?.startsWith("/training-admin/compliance")) return "compliance";
    if (pathname?.startsWith("/training-admin/messages")) return "messages";
    if (pathname === "/training-admin" || pathname?.startsWith("/training-admin")) return "dashboard";

    if (pathname?.startsWith("/users")) return "users";
    if (pathname?.startsWith("/training")) return "training";
    if (pathname?.startsWith("/billing/workspace") || pathname === "/billing/workspace") return "billing-workspace";
    if (pathname?.startsWith("/billing/authorizations")) return "authorizations";
    if (pathname?.startsWith("/billing/payroll")) return "payroll";
    if (pathname?.startsWith("/billing/reports")) return "reports";
    if (pathname?.startsWith("/billing/messages")) return "messages";
    if (pathname?.startsWith("/clinical/messages")) return "messages";
    if (pathname?.startsWith("/compliance/messages")) return "messages";
    if (pathname?.startsWith("/field-supervisor/messages")) return "messages";
    if (pathname?.startsWith("/clinical/patients")) return "patients";
    if (pathname?.startsWith("/clinical/assessments")) return "assessments";
    if (pathname?.startsWith("/clinical/qa")) return "qa";
    if (pathname?.startsWith("/compliance/qa")) return "qa";
    if (pathname?.startsWith("/clinical/incidents")) return "incidents";
    if (pathname?.startsWith("/compliance/incidents")) return "incidents";
    if (pathname?.startsWith("/compliance/tracking") || (pathname === "/compliance" && safeUser?.role !== "QA_COMPLIANCE_OFFICER")) return "compliance";
    if (pathname?.startsWith("/billing") && !pathname?.startsWith("/billing/workspace") && safeUser?.role === "ADMIN") return "billing-admin";
    if (pathname?.startsWith("/billing") && !pathname?.startsWith("/billing/workspace") && safeUser?.role !== "ADMIN") return "dashboard";
    if (pathname?.startsWith("/scheduling") || pathname?.startsWith("/intake/scheduling")) return "scheduling";
    if (pathname?.startsWith("/patients") || pathname?.startsWith("/intake/patients")) return "patients";
    if (pathname?.startsWith("/evv-monitoring")) return "evv-monitoring";
    if (pathname?.startsWith("/quality-assurance")) return "qa";
    if (pathname?.startsWith("/styleguide")) return "styleguide";
    if (pathname?.startsWith("/field-supervisor/visits")) return "visits";
    if (pathname?.startsWith("/field-supervisor/caregivers")) return "caregivers";
    if (pathname?.startsWith("/incidents")) return "incidents";
    if (pathname?.startsWith("/field-supervisor/incidents")) return "incidents";
    if (pathname?.startsWith("/referrals") || pathname?.startsWith("/intake/referrals")) return "referrals";
    if (pathname?.startsWith("/communications") || pathname?.startsWith("/intake/communications")) return "communications";
    if (pathname?.startsWith("/compliance/reports")) return "reports";
    if (pathname?.startsWith("/intake/reports")) return "reports";
    if (pathname?.startsWith("/reports") && !pathname?.startsWith("/compliance/reports") && !pathname?.startsWith("/intake/reports")) return "reports";
    if (pathname?.startsWith("/payroll")) return "payroll";
    if (pathname?.startsWith("/clinical/settings") || pathname?.startsWith("/field-supervisor/settings") || pathname?.startsWith("/billing/settings") || pathname?.startsWith("/intake/settings") || pathname?.startsWith("/compliance/settings") || pathname?.startsWith("/settings")) return "settings";
    if (pathname?.startsWith("/admin/command-center")) return "command-center";
    if (pathname === "/dashboard" || pathname === "/" || pathname?.startsWith("/intake/dashboard") || pathname === "/clinical" || pathname === "/compliance" || pathname === "/field-supervisor" || pathname === "/training-admin") return "dashboard";
    return "dashboard";
  }, [pathname, safeUser?.role]);

  const collapsedWordmarkClass = !hasMounted
    ? "md:opacity-0 md:max-w-0 md:ml-0 md:pointer-events-none min-[1400px]:opacity-100 min-[1400px]:max-w-[180px] min-[1400px]:ml-3 min-[1400px]:pointer-events-auto"
    : isCollapsed
      ? "md:opacity-0 md:max-w-0 md:ml-0 md:pointer-events-none"
      : "md:opacity-100 md:max-w-[180px] md:ml-3";

  const collapsedNavTextClass = !hasMounted
    ? "md:opacity-0 md:max-w-0 md:ml-0 md:pointer-events-none min-[1400px]:opacity-100 min-[1400px]:max-w-[175px] min-[1400px]:ml-2.5 min-[1400px]:pointer-events-auto"
    : isCollapsed
      ? "md:opacity-0 md:max-w-0 md:ml-0 md:pointer-events-none"
      : "md:opacity-100 md:max-w-[175px] md:ml-2.5";

  const collapsedGroupLabelClass = !hasMounted
    ? "md:opacity-0 md:max-h-0 md:mb-0 min-[1400px]:opacity-100 min-[1400px]:max-h-6 min-[1400px]:mb-2"
    : isCollapsed
      ? "md:opacity-0 md:max-h-0 md:mb-0"
      : "md:opacity-100 md:max-h-6 md:mb-2";

  const collapsedDividerClass = !hasMounted
    ? "hidden md:block min-[1400px]:hidden h-px bg-slate-800/90 my-2 mx-2"
    : isCollapsed
      ? "hidden md:block h-px bg-slate-800/90 my-2 mx-2"
      : "hidden";

  const isDesktopMini = hasMounted && isCollapsed;
  const hipaaTitle =
    safeUser?.role === "CAREGIVER"
      ? "EVV & HIPAA Compliant"
      : safeUser?.role === "SCHEDULER"
        ? "HIPAA Protected"
        : "HIPAA Compliant";
  const hipaaDescription =
    safeUser?.role === "SCHEDULER"
      ? "Role-scoped scheduler view."
      : "256-bit AES encryption & audit trail.";

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={clsx(
          "bg-sidebar-bg text-white flex flex-col h-screen fixed top-0 left-0 z-50 select-none will-change-[width,transform]",
          "transition-[width,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "md:translate-x-0 md:sticky md:top-0 shadow-[4px_0_28px_rgba(0,0,0,0.28)] md:shadow-[2px_0_16px_rgba(20,29,60,0.08)]",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "w-[260px] max-w-[min(260px,85vw)] md:max-w-[260px]",
          !hasMounted
            ? "md:w-[76px] min-[1400px]:w-[260px]"
            : isCollapsed
              ? "md:w-[76px]"
              : "md:w-[260px]"
        )}
      >
        {/* Header / Logo Area */}
        <div className="flex items-center h-16 sm:h-20 border-b border-sidebar-active/40 relative px-5 shrink-0">
          <Link
            href={safeUser?.role === "CLIENT" || safeUser?.role === "FAMILY" ? "/portal" : safeUser?.role === "CAREGIVER" ? "/caregiver" : safeUser?.role === "HR" ? "/hr/dashboard" : safeUser?.role === "SCHEDULER" ? "/scheduler" : safeUser?.role === "QA_COMPLIANCE_OFFICER" ? "/compliance" : safeUser?.role === "INTAKE_COORDINATOR" ? "/intake/dashboard" : safeUser?.role === "BILLING_FINANCE_STAFF" ? "/billing" : safeUser?.role === "CLINICAL_SUPERVISOR_RN" ? "/clinical" : safeUser?.role === "FIELD_SUPERVISOR" ? "/field-supervisor" : safeUser?.role === "TRAINER" ? "/training-admin" : "/dashboard"}
            onClick={() => {
              if (onClose) onClose();
            }}
            className="flex items-center overflow-hidden group min-w-0"
          >
            <div className="shrink-0">
              <HomePulseLogo variant="icon-only" size={36} animated />
            </div>
            <div
              className={clsx(
                "flex flex-col overflow-hidden whitespace-nowrap ml-3 pr-2 transition-[opacity,max-width,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                collapsedWordmarkClass
              )}
            >
              <div className="flex items-center tracking-tight text-base font-bold text-white leading-tight">
                <span>Home</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6C88FF] to-[#57EAB6]">Pulse</span>
              </div>
              {safeUser?.role === "CAREGIVER" && (
                <span className="text-[10px] font-medium uppercase tracking-wider text-brand-teal flex items-center gap-1 mt-0.5">
                  <HeartHandshake className="w-3 h-3 inline shrink-0" /> Caregiver Portal
                </span>
              )}
              {safeUser?.role === "HR" && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-teal mt-0.5">
                  HR Portal
                </span>
              )}
              {safeUser?.role === "SCHEDULER" && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-teal mt-0.5">
                  Dispatch Portal
                </span>
              )}
              {safeUser?.role === "ADMIN" && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-teal mt-0.5">
                  Agency Admin
                </span>
              )}
              {!safeUser?.role && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-teal mt-0.5">
                  Enterprise Platform
                </span>
              )}
            </div>
          </Link>

          {/* Mobile Close Button - visible only on < md drawer */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden ml-auto p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Close navigation"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          onScroll={hideMiniTooltip}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/80"
        >
          {getNavGroups(safeUser?.role).map((group, index) => (
            <div key={index}>
              {group.label ? (
                <>
                  <div
                    className={clsx(
                      "px-3 text-[11px] font-semibold text-text-secondary tracking-wider uppercase truncate whitespace-nowrap overflow-hidden transition-[opacity,max-height,margin] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] mb-2",
                      collapsedGroupLabelClass
                    )}
                  >
                    {group.label}
                  </div>
                  <div className={collapsedDividerClass} />
                </>
              ) : null}

              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeItem === item.id;
                  const Icon = item.icon;
                  const badgeCount = item.badge ?? 0;

                  let href = "#";
                  if (item.id === "dashboard") href = safeUser?.role === "QA_COMPLIANCE_OFFICER" ? "/compliance" : safeUser?.role === "INTAKE_COORDINATOR" ? "/intake/dashboard" : safeUser?.role === "BILLING_FINANCE_STAFF" ? "/billing" : safeUser?.role === "CLINICAL_SUPERVISOR_RN" ? "/clinical" : safeUser?.role === "FIELD_SUPERVISOR" ? "/field-supervisor" : safeUser?.role === "TRAINER" ? "/training-admin" : safeUser?.role === "HR" ? "/hr/dashboard" : safeUser?.role === "SCHEDULER" ? "/scheduler" : "/dashboard";
                  if (item.id === "command-center") href = "/admin/command-center";
                  if (item.id === "users") href = "/users";
                  if (item.id === "training") href = safeUser?.role === "CAREGIVER" ? "/caregiver/training" : safeUser?.role === "HR" ? "/hr/training" : "/training";
                  if (item.id === "billing-admin") href = "/billing/workspace";
                  if (item.id === "billing-workspace") href = "/billing/workspace";
                  if (item.id === "authorizations") href = "/billing/authorizations";
                  if (item.id === "payroll") href = safeUser?.role === "HR" ? "/hr/payroll" : safeUser?.role === "BILLING_FINANCE_STAFF" ? "/billing/payroll" : "/payroll";
                  if (item.id === "reports") href = safeUser?.role === "BILLING_FINANCE_STAFF" ? "/billing/reports" : safeUser?.role === "QA_COMPLIANCE_OFFICER" ? "/compliance/reports" : safeUser?.role === "INTAKE_COORDINATOR" ? "/intake/reports" : "/reports";
                  if (item.id === "messages") href = safeUser?.role === "CLIENT" || safeUser?.role === "FAMILY" ? "/portal/messages" : safeUser?.role === "CAREGIVER" ? "/caregiver/messages" : safeUser?.role === "HR" ? "/hr/messages" : safeUser?.role === "SCHEDULER" ? "/scheduler/messages" : safeUser?.role === "QA_COMPLIANCE_OFFICER" ? "/compliance/messages" : safeUser?.role === "CLINICAL_SUPERVISOR_RN" ? "/clinical/messages" : safeUser?.role === "FIELD_SUPERVISOR" ? "/field-supervisor/messages" : safeUser?.role === "TRAINER" ? "/training-admin/messages" : "/billing/messages";
                  if (item.id === "scheduling") href = safeUser?.role === "CLIENT" || safeUser?.role === "FAMILY" ? "/portal/schedule" : safeUser?.role === "INTAKE_COORDINATOR" ? "/intake/scheduling" : "/scheduling";
                  if (item.id === "patients") href = safeUser?.role === "SCHEDULER" ? "/scheduler/patients/list" : safeUser?.role === "INTAKE_COORDINATOR" ? "/intake/patients" : safeUser?.role === "CLINICAL_SUPERVISOR_RN" ? "/clinical/patients" : "/patients";
                  if (item.id === "caregivers") href = safeUser?.role === "HR" ? "/hr/caregivers" : safeUser?.role === "SCHEDULER" ? "/scheduler/caregivers" : safeUser?.role === "FIELD_SUPERVISOR" ? "/field-supervisor/caregivers" : "/caregivers";
                  if (item.id === "evv-monitoring") href = "/evv-monitoring";
                  if (item.id === "qa") href = safeUser?.role === "QA_COMPLIANCE_OFFICER" ? "/compliance/qa" : safeUser?.role === "CLINICAL_SUPERVISOR_RN" ? "/clinical/qa" : "/quality-assurance";
                  if (item.id === "visits") href = safeUser?.role === "CLIENT" || safeUser?.role === "FAMILY" ? "/portal/visits" : "/field-supervisor/visits";
                  if (item.id === "incidents") href = safeUser?.role === "CAREGIVER" ? "/caregiver/incidents" : safeUser?.role === "QA_COMPLIANCE_OFFICER" ? "/compliance/incidents" : safeUser?.role === "CLINICAL_SUPERVISOR_RN" ? "/clinical/incidents" : safeUser?.role === "FIELD_SUPERVISOR" ? "/field-supervisor/incidents" : "/incidents";
                  if (item.id === "assessments") href = safeUser?.role === "CAREGIVER" ? "/caregiver/assessments" : "/clinical/assessments";
                  if (item.id === "compliance") href = safeUser?.role === "QA_COMPLIANCE_OFFICER" ? "/compliance/tracking" : safeUser?.role === "TRAINER" ? "/training-admin/compliance" : "/compliance";
                  if (item.id === "referrals") href = safeUser?.role === "INTAKE_COORDINATOR" ? "/intake/referrals" : "/referrals";
                  if (item.id === "communications") href = safeUser?.role === "INTAKE_COORDINATOR" ? "/intake/communications" : "/communications";
                  if (item.id === "settings") href = safeUser?.role === "QA_COMPLIANCE_OFFICER" ? "/compliance/settings" : safeUser?.role === "INTAKE_COORDINATOR" ? "/intake/settings" : safeUser?.role === "BILLING_FINANCE_STAFF" ? "/billing/settings" : safeUser?.role === "CLINICAL_SUPERVISOR_RN" ? "/clinical/settings" : safeUser?.role === "FIELD_SUPERVISOR" ? "/field-supervisor/settings" : safeUser?.role === "TRAINER" ? "/training-admin/settings" : "/settings";
                  if (item.id === "overview") href = "/portal";
                  if (item.id === "care-plan") href = "/portal/care-plan";
                  if (item.id === "billing") href = "/portal/billing";
                  if (item.id === "documents") href = "/portal/documents";
                  if (item.id === "today") href = "/caregiver";
                  if (item.id === "schedule") href = "/caregiver/schedule";
                  if (item.id === "profile") href = "/caregiver/profile";
                  if (item.id === "recruiting") href = "/hr/recruiting";
                  if (item.id === "scheduled-shifts") href = "/scheduler/shifts/list";
                  if (item.id === "recurring-patterns") href = "/scheduler/shifts/recurring";
                  if (item.id === "route-optimizer") href = "/scheduler/dispatch/optimizer";
                  if (item.id === "visit-list") href = "/scheduler/dispatch/visits";
                  if (item.id === "availability") href = "/scheduler/caregivers/availability";
                  if (item.id === "course-builder") href = "/training-admin/courses/builder";
                  if (item.id === "courses") href = "/training-admin/courses";
                  if (item.id === "quizzes") href = "/training-admin/quizzes";
                  if (item.id === "styleguide") href = "/styleguide";

                  return (
                    <li key={item.id} className="relative group">
                      {isActive && (
                        <motion.div
                          layoutId="active-nav"
                          className="absolute inset-0 bg-brand-teal rounded-xl shadow-md shadow-brand-teal/20"
                          initial={false}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                        />
                      )}

                      <Link
                        href={href}
                        onClick={() => {
                          hideMiniTooltip();
                          if (onClose) onClose();
                        }}
                        onMouseEnter={(e) =>
                          showMiniTooltip(e.currentTarget, item.name, {
                            badge: badgeCount > 0 ? badgeCount : undefined,
                          })
                        }
                        onMouseLeave={hideMiniTooltip}
                        onFocus={(e) =>
                          showMiniTooltip(e.currentTarget, item.name, {
                            badge: badgeCount > 0 ? badgeCount : undefined,
                          })
                        }
                        onBlur={hideMiniTooltip}
                        className={clsx(
                          "relative flex items-center rounded-xl text-sm font-medium transition-colors z-10 pl-[17px] pr-3 py-3 md:py-2.5",
                          isActive ? "text-white font-semibold" : "text-slate-300 hover:text-white hover:bg-sidebar-active/60"
                        )}
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        <span
                          className={clsx(
                            "truncate whitespace-nowrap ml-2.5 transition-[opacity,max-width,margin] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                            collapsedNavTextClass
                          )}
                        >
                          {item.name}
                        </span>

                        {badgeCount > 0 && (
                          <>
                            <span
                              className={clsx(
                                "ml-auto shrink-0 flex items-center justify-center font-bold rounded-full px-2 py-0.5 text-xs transition-opacity duration-200",
                                isDesktopMini && "md:hidden",
                                !hasMounted && "md:hidden min-[1400px]:flex",
                                isActive
                                  ? "bg-white text-brand-teal"
                                  : "bg-brand-teal/20 text-brand-teal border border-brand-teal/30"
                              )}
                            >
                              {badgeCount}
                            </span>
                            {(isDesktopMini || !hasMounted) && (
                              <span
                                className={clsx(
                                  "hidden items-center justify-center font-bold rounded-full absolute top-1 right-1.5 w-4 h-4 text-[9px] bg-brand-teal text-white ring-2 ring-sidebar-bg",
                                  !hasMounted ? "md:flex min-[1400px]:hidden" : "md:flex"
                                )}
                              >
                                {badgeCount}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* HIPAA Card */}
        {safeUser?.role !== "CLIENT" && safeUser?.role !== "FAMILY" && (
          <div className="px-3 mb-2.5 relative shrink-0">
            <div
              onMouseEnter={(e) =>
                showMiniTooltip(e.currentTarget, hipaaTitle, {
                  description:
                    safeUser?.role === "SCHEDULER"
                      ? "Role-scoped scheduler view."
                      : "Data encrypted in transit and at rest.",
                })
              }
              onMouseLeave={hideMiniTooltip}
              className={clsx(
                "bg-[#0e354a] rounded-xl border border-sidebar-active/70 flex items-start overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                !hasMounted
                  ? "p-3.5 md:p-3 md:justify-center min-[1400px]:p-3.5 min-[1400px]:justify-start"
                  : isCollapsed
                    ? "p-3.5 md:p-3 md:justify-center cursor-pointer hover:bg-sidebar-active/50"
                    : "p-3.5"
              )}
            >
              <div className="relative shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-brand-teal" />
                {(isDesktopMini || !hasMounted) && (
                  <span
                    className={clsx(
                      "hidden absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-sidebar-bg",
                      !hasMounted ? "md:block min-[1400px]:hidden" : "md:block"
                    )}
                  />
                )}
              </div>
              <div
                className={clsx(
                  "min-w-0 ml-3 overflow-hidden transition-[opacity,max-width,margin] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  collapsedWordmarkClass
                )}
              >
                <div className="text-xs font-semibold text-white truncate">
                  {hipaaTitle}
                </div>
                <div className="text-[11px] text-slate-300/80 mt-0.5 leading-snug">
                  {hipaaDescription}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div
          ref={profileRef}
          className="p-3 border-t border-sidebar-active/60 relative shrink-0 pb-[max(12px,env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            onMouseEnter={(e) =>
              showMiniTooltip(e.currentTarget, safeUser?.name || "Agency Executive")
            }
            onMouseLeave={hideMiniTooltip}
            className="flex items-center w-full hover:bg-sidebar-active p-2 rounded-xl transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-slate-600 shrink-0 overflow-hidden flex items-center justify-center ring-2 ring-brand-teal/40">
              <User className="w-4.5 h-4.5 text-slate-300" />
            </div>
            <div
              className={clsx(
                "flex items-center flex-1 overflow-hidden min-w-0 ml-3 transition-[opacity,max-width,margin] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                collapsedWordmarkClass
              )}
            >
              <div className="flex-1 overflow-hidden min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {safeUser?.name || "Agency Executive"}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {safeUser?.role === "CLIENT" ? "Patient" : safeUser?.role === "FAMILY" ? "Family Member" : safeUser?.role === "CAREGIVER" ? "Caregiver (Field Staff)" : safeUser?.role === "SCHEDULER" ? "Scheduler / Dispatcher" : safeUser?.role === "HR" ? "HR Recruiter" : safeUser?.role === "TRAINER" ? "Trainer / LMS Admin" : safeUser?.role || "ADMIN"}
                </div>
              </div>
              <ChevronDown
                className={clsx(
                  "w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200",
                  isProfileOpen && "rotate-180"
                )}
              />
            </div>
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={clsx(
                  "absolute bg-slate-800 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 p-1.5",
                  isCollapsed
                    ? "md:left-full md:ml-4 md:bottom-3 md:w-52 bottom-[calc(100%-6px)] left-3 right-3 mb-2"
                    : "bottom-[calc(100%-6px)] left-3 right-3 mb-2"
                )}
              >
                <div className="flex flex-col gap-1">
                  <Link
                    href="/styleguide"
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-sidebar-active rounded-xl transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Sparkles className="w-4 h-4 text-[#57EAB6]" />
                    UI Styleguide
                  </Link>
                  <Link
                    href={safeUser?.role === "QA_COMPLIANCE_OFFICER" ? "/compliance/settings" : safeUser?.role === "INTAKE_COORDINATOR" ? "/intake/settings" : safeUser?.role === "BILLING_FINANCE_STAFF" ? "/billing/settings" : safeUser?.role === "CLINICAL_SUPERVISOR_RN" ? "/clinical/settings" : safeUser?.role === "FIELD_SUPERVISOR" ? "/field-supervisor/settings" : safeUser?.role === "TRAINER" ? "/training-admin/settings" : "/settings"}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-sidebar-active rounded-xl transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Settings
                  </Link>
                  <div className="h-px w-full bg-sidebar-active/60 my-0.5" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      <SidebarTooltip tooltip={isDesktopMini ? tooltip : null} />
    </>
  );
}
