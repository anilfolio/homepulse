"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarToggleButton } from "@/components/layout/SidebarToggleButton";
import { DemoStudioMenu } from "@/components/layout/DemoStudioMenu";
import { NotificationsCenter } from "@/components/layout/NotificationsCenter";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function PartnerTopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const { state } = useAgencyStore();

  const getPageTitle = () => {
    if (pathname.startsWith("/partner/submit")) return "Submit Referral";
    if (pathname.startsWith("/partner/referrals")) return "My Referrals";
    if (pathname.startsWith("/partner/analytics")) return "Analytics";
    if (pathname.startsWith("/partner/messages")) return "Messages";
    if (pathname.startsWith("/partner/settings")) return "Account Settings";
    return `Welcome back, ${state.partnerOrg.name}`;
  };

  return (
    <header className="h-16 sm:h-20 px-3 sm:px-6 flex items-center justify-between bg-page-bg/90 backdrop-blur-md sticky top-0 z-30 transition-all duration-300 border-b border-slate-200/50">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <SidebarToggleButton onMobileMenuClick={onMenuClick} />
        <h1 suppressHydrationWarning className="text-base sm:text-xl font-bold text-text-primary truncate max-w-[190px] xs:max-w-[250px] sm:max-w-none">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <DemoStudioMenu />
        <NotificationsCenter />
      </div>
    </header>
  );
}
