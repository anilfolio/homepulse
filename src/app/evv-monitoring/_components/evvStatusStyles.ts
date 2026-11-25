import React from "react";
import { MapPin, PhoneCall, Cpu, PenLine } from "lucide-react";
import { EVVComplianceStatus, EVVMethod, VisitStatus } from "../types";

export const visitStatusStyles: Record<VisitStatus, string> = {
  Completed: "bg-slate-100 text-slate-700 border-slate-200/80",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  Incomplete: "bg-red-50 text-red-700 border-red-200",
  "Not Started": "bg-slate-50 text-slate-500 border-slate-200",
};

export const complianceStyles: Record<
  EVVComplianceStatus,
  { pill: string; dot: string }
> = {
  Verified: {
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  Exception: {
    pill: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  Resolved: {
    pill: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
};

export const methodConfig: Record<
  EVVMethod,
  { icon: React.ComponentType<{ className?: string }>; style: string }
> = {
  GPS: { icon: MapPin, style: "bg-blue-50 text-blue-700 border-blue-200" },
  IVR: { icon: PhoneCall, style: "bg-purple-50 text-purple-700 border-purple-200" },
  Fixed: { icon: Cpu, style: "bg-slate-100 text-slate-700 border-slate-200" },
  Manual: { icon: PenLine, style: "bg-amber-50 text-amber-800 border-amber-200" },
};

/**
 * Returns semantic pill and dot classes for aggregator, billing, and payroll statuses.
 */
export function getProcessingBadgeStyle(status: string): {
  pill: string;
  dot: string;
} {
  switch (status) {
    case "Accepted":
    case "Cleared":
    case "Billed":
    case "Approved":
    case "Processed":
      return {
        pill: "bg-emerald-50/90 text-emerald-700 border-emerald-200/80",
        dot: "bg-emerald-500",
      };
    case "Submitted":
      return {
        pill: "bg-blue-50/90 text-blue-700 border-blue-200/80",
        dot: "bg-blue-500",
      };
    case "Rejected":
    case "Hold":
      return {
        pill: "bg-red-50/90 text-red-700 border-red-200/80",
        dot: "bg-red-500",
      };
    default:
      return {
        pill: "bg-slate-100/90 text-slate-600 border-slate-200/80",
        dot: "bg-slate-400",
      };
  }
}

/**
 * Extracts up to two uppercase initials from a full name.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
