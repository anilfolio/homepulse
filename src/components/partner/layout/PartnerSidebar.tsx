"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Send,
  ListFilter,
  BarChart3,
  MessageSquare,
  Settings,
  PanelLeftClose,
  ChevronDown,
  LogOut,
  Building2,
  User,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";
import { useAuth } from "@/hooks/useAuth";
import { HomePulseLogo } from "@/components/brand/HomePulseLogo";
import { SidebarTooltip, type SidebarTooltipData } from "@/components/layout/SidebarTooltip";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

const NAV_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, id: "dashboard", href: "/partner" },
  { name: "Submit Referral", icon: Send, id: "submit", href: "/partner/submit" },
  { name: "My Referrals", icon: ListFilter, id: "referrals", href: "/partner/referrals" },
  { name: "Analytics", icon: BarChart3, id: "analytics", href: "/partner/analytics" },
  { name: "Messages", icon: MessageSquare, id: "messages", href: "/partner/messages" },
  { name: "Account Settings", icon: Settings, id: "settings", href: "/partner/settings" },
];

interface PartnerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function PartnerSidebar({ isOpen = false, onClose }: PartnerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { state } = useAgencyStore();
  const { isCollapsed, hasMounted } = useSidebarCollapse();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tooltip, setTooltip] = useState<SidebarTooltipData | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const showMiniTooltip = useCallback(
    (el: HTMLElement, label: string) => {
      if (hasMounted && !isCollapsed) return;
      if (typeof window !== "undefined" && window.innerWidth < 768) return;
      const rect = el.getBoundingClientRect();
      setTooltip({
        label,
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
      });
    },
    [hasMounted, isCollapsed]
  );

  const hideMiniTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

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

  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && window.innerWidth < 768) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    router.push("/login");
  };

  const activeItem = React.useMemo(() => {
    if (pathname === "/partner/submit") return "submit";
    if (pathname?.startsWith("/partner/referrals")) return "referrals";
    if (pathname?.startsWith("/partner/analytics")) return "analytics";
    if (pathname?.startsWith("/partner/messages")) return "messages";
    if (pathname?.startsWith("/partner/settings")) return "settings";
    if (pathname === "/partner") return "dashboard";
    return "dashboard";
  }, [pathname]);

  const activeMember = state.partnerTeamMembers[0] ?? {
    id: "tm-default",
    name: state.partnerOrg.primaryContact,
    role: "Partner Lead",
    email: state.partnerOrg.primaryEmail,
    phone: state.partnerOrg.primaryPhone,
    status: "Active" as const,
  };

  const collapsedFadeClass = !hasMounted
    ? "md:opacity-0 md:max-w-0 md:ml-0 md:pointer-events-none min-[1400px]:opacity-100 min-[1400px]:max-w-[180px] min-[1400px]:ml-3 min-[1400px]:pointer-events-auto"
    : isCollapsed
      ? "md:opacity-0 md:max-w-0 md:ml-0 md:pointer-events-none"
      : "md:opacity-100 md:max-w-[180px] md:ml-3";

  const collapsedNavTextClass = !hasMounted
    ? "md:opacity-0 md:max-w-0 md:ml-0 md:pointer-events-none min-[1400px]:opacity-100 min-[1400px]:max-w-[170px] min-[1400px]:ml-2.5 min-[1400px]:pointer-events-auto"
    : isCollapsed
      ? "md:opacity-0 md:max-w-0 md:ml-0 md:pointer-events-none"
      : "md:opacity-100 md:max-w-[170px] md:ml-2.5";

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
          <Link href="/partner" className="flex items-center overflow-hidden group min-w-0">
            <div className="shrink-0">
              <HomePulseLogo variant="icon-only" size={36} animated />
            </div>
            <div
              className={clsx(
                "flex flex-col overflow-hidden whitespace-nowrap ml-3 transition-[opacity,max-width,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                collapsedFadeClass
              )}
            >
              <div className="flex items-center tracking-tight text-base font-bold text-white leading-tight">
                <span>Home</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6C88FF] to-[#57EAB6]">Pulse</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-teal mt-0.5">
                Partner Portal
              </span>
            </div>
          </Link>

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
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/80"
        >
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeItem === item.id;
              const Icon = item.icon;

              return (
                <li key={item.id} className="relative group">
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-partner"
                      className="absolute inset-0 bg-brand-teal rounded-xl shadow-md shadow-brand-teal/20"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                    />
                  )}

                  <Link
                    href={item.href}
                    onClick={() => {
                      hideMiniTooltip();
                      if (onClose) onClose();
                    }}
                    onMouseEnter={(e) => showMiniTooltip(e.currentTarget, item.name)}
                    onMouseLeave={hideMiniTooltip}
                    onFocus={(e) => showMiniTooltip(e.currentTarget, item.name)}
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
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div
          ref={profileRef}
          className="p-3 border-t border-sidebar-active/60 relative shrink-0 pb-[max(12px,env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            onMouseEnter={(e) => showMiniTooltip(e.currentTarget, `${activeMember.name} · ${state.partnerOrg.name}`)}
            onMouseLeave={hideMiniTooltip}
            className="flex items-center w-full hover:bg-sidebar-active p-2 rounded-xl transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-slate-600 shrink-0 overflow-hidden flex items-center justify-center ring-2 ring-brand-teal/40">
              <User className="w-4.5 h-4.5 text-slate-300" />
            </div>
            <div
              className={clsx(
                "flex items-center flex-1 overflow-hidden min-w-0 ml-3 transition-[opacity,max-width,margin] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                collapsedFadeClass
              )}
            >
              <div className="flex-1 overflow-hidden min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {activeMember.name}
                </div>
                <div className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{state.partnerOrg.name}</span>
                </div>
              </div>
              <ChevronDown
                className={clsx("w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200", isProfileOpen && "rotate-180")}
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
                    href="/partner/settings"
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-sidebar-active rounded-xl transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Account Settings
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

      <SidebarTooltip tooltip={hasMounted && isCollapsed ? tooltip : null} />
    </>
  );
}
