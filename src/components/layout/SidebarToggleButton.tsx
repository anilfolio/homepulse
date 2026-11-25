"use client";

import React from "react";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import clsx from "clsx";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";

interface SidebarToggleButtonProps {
  onMobileMenuClick?: () => void;
  className?: string;
}

export function SidebarToggleButton({
  onMobileMenuClick,
  className,
}: SidebarToggleButtonProps) {
  const { isCollapsed, hasMounted, toggleCollapse } = useSidebarCollapse();
  const collapsed = hasMounted ? isCollapsed : false;

  const baseButtonClass = clsx(
    "h-10 w-10 rounded-xl bg-white/90 hover:bg-white border border-border-subtle/80 text-slate-600 hover:text-brand-teal shadow-[0_2px_10px_rgba(20,29,60,0.04)] hover:shadow-[0_4px_14px_rgba(108,136,255,0.14)] active:scale-95 transition-all duration-200 items-center justify-center shrink-0 cursor-pointer",
    className
  );

  return (
    <>
      {/* Mobile Drawer Button (< 768px) */}
      <button
        type="button"
        onClick={onMobileMenuClick}
        className={clsx(baseButtonClass, "flex md:hidden")}
        aria-label="Open Navigation Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Tablet / Laptop / Desktop Collapse Toggle (>= 768px) */}
      <button
        type="button"
        onClick={toggleCollapse}
        title={collapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
        aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        aria-expanded={!collapsed}
        className={clsx(baseButtonClass, "hidden md:flex")}
      >
        {collapsed ? (
          <PanelLeftOpen className="w-[18px] h-[18px] transition-transform duration-200" />
        ) : (
          <PanelLeftClose className="w-[18px] h-[18px] transition-transform duration-200" />
        )}
      </button>
    </>
  );
}
