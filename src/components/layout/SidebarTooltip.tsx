"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SidebarTooltipData {
  label: string;
  description?: string;
  badge?: number;
  top: number;
  left: number;
}

interface SidebarTooltipProps {
  tooltip: SidebarTooltipData | null;
}

export function SidebarTooltip({ tooltip }: SidebarTooltipProps) {
  return (
    <AnimatePresence>
      {tooltip && (
        <motion.div
          key={tooltip.label}
          initial={{ opacity: 0, x: -6, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -4, scale: 0.96 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          style={{ top: tooltip.top, left: tooltip.left }}
          className="hidden md:flex fixed -translate-y-1/2 z-[60] pointer-events-none items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/95 backdrop-blur-md text-white shadow-[0_12px_32px_rgba(15,23,42,0.45)] border border-slate-700/80 max-w-[240px]"
          role="tooltip"
        >
          <span
            aria-hidden="true"
            className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-slate-900/95 border-l border-b border-slate-700/80"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold whitespace-nowrap">
              <span>{tooltip.label}</span>
              {tooltip.badge !== undefined && tooltip.badge > 0 && (
                <span className="bg-brand-teal text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                  {tooltip.badge}
                </span>
              )}
            </div>
            {tooltip.description && (
              <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                {tooltip.description}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
