"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationsCenter } from "./NotificationsCenter";
import { SidebarToggleButton } from "./SidebarToggleButton";
import { DemoStudioMenu } from "./DemoStudioMenu";

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();

  return (
    <header className="h-16 sm:h-20 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 bg-page-bg/90 backdrop-blur-md sticky top-0 z-30 transition-all duration-300 border-b border-slate-200/50">
      {/* Left: Sidebar Toggle + Left-Aligned Searchbox */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
        <SidebarToggleButton onMobileMenuClick={onMenuClick} />
        <div className="flex-1 min-w-0 max-w-[480px] z-40">
          <GlobalSearch />
        </div>
      </div>

      {/* Right: Executive Context Badge + Notifications */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {pathname.startsWith("/admin") && (
          <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#141D3C] text-[#57EAB6] border border-[#2A3B75]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#57EAB6] animate-pulse" />
            Executive Ops
          </span>
        )}
        <DemoStudioMenu />
        <NotificationsCenter />
      </div>
    </header>
  );
}
