"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Clock, ShieldAlert, CheckCircle2, Info } from "lucide-react";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function NotificationsCenter() {
  const router = useRouter();
  const { state, markNotificationRead, markAllNotificationsRead } = useAgencyStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  const getIconMeta = (type: "alert" | "warning" | "info" | "success") => {
    if (type === "alert") return { Icon: ShieldAlert, color: "text-red-500", bg: "bg-red-100" };
    if (type === "warning") return { Icon: Clock, color: "text-amber-500", bg: "bg-amber-100" };
    if (type === "success") return { Icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" };
    return { Icon: Info, color: "text-blue-500", bg: "bg-blue-100" };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-white border border-border-subtle text-slate-500 hover:bg-slate-50 transition-colors shadow-[0_6px_32px_rgba(0,0,0,0.06)] cursor-pointer"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-accent-red rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <span className="text-xs font-medium text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-full">
                {unreadCount} New
              </span>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
            {state.notifications.slice(0, 8).map((notif) => {
              const { Icon, color, bg } = getIconMeta(notif.type);
              return (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => {
                    markNotificationRead(notif.id);
                    setIsOpen(false);
                    router.push(notif.route);
                  }}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 group ${
                    notif.read ? "opacity-70" : "bg-blue-50/20"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5 gap-2">
                      <h4 className="text-sm font-medium text-slate-900 group-hover:text-brand-teal transition-colors truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                        {notif.timeLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{notif.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
