"use client";

import React, { useState } from "react";
import { Building2, Users, Bell, Sliders } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { OrgTeamManagement } from "@/components/partner/settings/OrgTeamManagement";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export default function PartnerSettingsPage() {
  const [activeTab, setActiveTab] = useState("org-profile");

  const tabs = [
    {
      id: "org-profile",
      label: "Organization Profile",
      icon: Building2,
      desc: "Manage your organization details",
    },
    {
      id: "team-management",
      label: "Team Management",
      icon: Users,
      desc: "Manage staff and permissions",
    },
    {
      id: "notifications",
      label: "Notifications & Alerts",
      icon: Bell,
      desc: "Alerts and email preferences",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-brand-teal text-xs font-semibold uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" /> Account Settings
          </div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight mt-0.5">
            Settings &amp; Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your organization&apos;s profile, team members, and notification preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white p-1 lg:p-4 rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.04)] flex flex-row lg:flex-col gap-1 lg:gap-2 self-start w-full relative">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 lg:flex-none lg:w-full min-w-0 text-center lg:text-left p-1.5 lg:p-3 rounded-xl transition-all flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-start gap-1 lg:gap-3 cursor-pointer relative overflow-hidden ${
                  isActive
                    ? "bg-brand-teal text-white shadow-[0_6px_24px_rgba(14,163,131,0.25)] font-semibold"
                    : "bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabSettings"
                    className="absolute inset-0 bg-brand-teal"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-start gap-1 lg:gap-3 w-full">
                  <Icon
                    className={`w-5 h-5 shrink-0 lg:mt-0.5 ${
                      isActive ? "text-white" : "text-slate-400"
                    }`}
                  />
                  <div className="hidden lg:block w-full text-left">
                    <div className="text-sm font-semibold leading-tight">{t.label}</div>
                    <div
                      className={`text-[11px] font-normal mt-0.5 ${
                        isActive ? "text-teal-100" : "text-slate-400"
                      }`}
                    >
                      {t.desc}
                    </div>
                  </div>
                  <span className="lg:hidden text-[10px] sm:text-[11px] font-medium whitespace-nowrap truncate w-full text-center">
                    {t.label.split(" ")[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              {activeTab === "org-profile" && <OrgProfileTab />}
              {activeTab === "team-management" && (
                <div className="h-full">
                  <OrgTeamManagement />
                </div>
              )}
              {activeTab === "notifications" && <NotificationsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function OrgProfileTab() {
  const { state, updatePartnerOrgProfile } = useAgencyStore();
  const [name, setName] = useState(state.partnerOrg.name);
  const [primaryContact, setPrimaryContact] = useState(state.partnerOrg.primaryContact);
  const [primaryEmail, setPrimaryEmail] = useState(state.partnerOrg.primaryEmail);
  const [address, setAddress] = useState(state.partnerOrg.address);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePartnerOrgProfile({
      name: name.trim() || state.partnerOrg.name,
      primaryContact: primaryContact.trim() || state.partnerOrg.primaryContact,
      primaryEmail: primaryEmail.trim() || state.partnerOrg.primaryEmail,
      address: address.trim() || state.partnerOrg.address,
    });
    toast.success("Partner organization profile saved & synced across Portal.");
  };

  return (
    <form
      onSubmit={handleSave}
      className="bg-white backdrop-blur-xl rounded-2xl px-4 py-4 border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] h-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <Building2 className="w-5 h-5 text-slate-500" />
        </div>
        <h3 className="font-semibold text-slate-800 text-base">Organization Profile</h3>
      </div>
      <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Organization Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border-slate-200 focus:border-brand-teal focus:ring-brand-teal text-sm py-2 px-3 border outline-none text-slate-700"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Primary Contact
          </label>
          <input
            type="text"
            value={primaryContact}
            onChange={(e) => setPrimaryContact(e.target.value)}
            className="w-full rounded-xl border-slate-200 focus:border-brand-teal focus:ring-brand-teal text-sm py-2 px-3 border outline-none text-slate-700"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Contact Email
          </label>
          <input
            type="email"
            value={primaryEmail}
            onChange={(e) => setPrimaryEmail(e.target.value)}
            className="w-full rounded-xl border-slate-200 focus:border-brand-teal focus:ring-brand-teal text-sm py-2 px-3 border outline-none text-slate-700"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border-slate-200 focus:border-brand-teal focus:ring-brand-teal text-sm py-2 px-3 border outline-none resize-none text-slate-700"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full py-2.5 bg-brand-teal text-white hover:bg-brand-teal/90 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            Save Profile Changes
          </button>
        </div>
      </div>
    </form>
  );
}

function NotificationsTab() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Bell className="w-5 h-5 text-amber-500" />
        </div>
        <h3 className="font-semibold text-slate-800 text-base">Notifications</h3>
      </div>
      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            defaultChecked
            onChange={(e) =>
              toast.success(
                e.target.checked ? "Status Updates enabled" : "Status Updates disabled"
              )
            }
            className="mt-1 rounded text-brand-teal focus:ring-brand-teal border-slate-300 w-4 h-4 cursor-pointer"
          />
          <div>
            <div className="text-sm font-medium text-slate-700">Status Updates</div>
            <div className="text-xs text-slate-500">
              Receive real-time alerts when Intake updates referral status
            </div>
          </div>
        </label>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            defaultChecked
            onChange={(e) =>
              toast.success(
                e.target.checked
                  ? "New Messages notifications enabled"
                  : "New Messages notifications disabled"
              )
            }
            className="mt-1 rounded text-brand-teal focus:ring-brand-teal border-slate-300 w-4 h-4 cursor-pointer"
          />
          <div>
            <div className="text-sm font-medium text-slate-700">New Messages</div>
            <div className="text-xs text-slate-500">
              Receive alerts when HomePulse Intake or RN sends a message
            </div>
          </div>
        </label>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            onChange={(e) =>
              toast.success(
                e.target.checked ? "Monthly Summary enabled" : "Monthly Summary disabled"
              )
            }
            className="mt-1 rounded text-brand-teal focus:ring-brand-teal border-slate-300 w-4 h-4 cursor-pointer"
          />
          <div>
            <div className="text-sm font-medium text-slate-700">Monthly Summary</div>
            <div className="text-xs text-slate-500">
              Receive a monthly report of referral conversion performance
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
