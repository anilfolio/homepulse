"use client";

import React, { useState, useEffect } from "react";
import { Users, UserPlus, MoreVertical, ShieldAlert, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function OrgTeamManagement() {
  const {
    state,
    addPartnerTeamMember,
    updatePartnerTeamMemberRole,
    removePartnerTeamMember,
  } = useAgencyStore();
  const members = state.partnerTeamMembers;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Discharge Coordinator");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        (e.target as Element).closest(".dropdown-trigger") ||
        (e.target as Element).closest(".dropdown-menu")
      ) {
        return;
      }
      setOpenDropdownId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    addPartnerTeamMember({
      name: newName,
      email: newEmail,
      role: newRole,
    });
    toast.success(`${newName} added to ${state.partnerOrg.name} team.`);
    setNewName("");
    setNewEmail("");
    setNewRole("Discharge Coordinator");
    setIsAddModalOpen(false);
  };

  return (
    <>
      <div className="bg-white backdrop-blur-xl rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.06)] relative h-full flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Team Access Management</h3>
              <p className="text-xs text-slate-500">
                Manage who can submit &amp; track referrals for {state.partnerOrg.name}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-brand-teal text-white hover:bg-brand-teal/90 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>
        <div className="bg-blue-50/50 px-4 py-2.5 border-b border-slate-100 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-slate-800">Organization-wide Visibility</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Active team members appear in Referral Submission &amp; History filters across the Partner Portal.
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-x-auto pb-10">
          <table className="w-full text-left border-collapse min-w-[540px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Member</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Role</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                        {member.name
                          .split(" ", 2)
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{member.name}</div>
                        <div className="text-[10px] text-slate-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={member.role}
                      onChange={(e) => {
                        updatePartnerTeamMemberRole(member.id, e.target.value);
                        toast.success(`Updated role for ${member.name}.`);
                      }}
                      className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                    >
                      <option value="Director of Discharge Planning">
                        Director of Discharge Planning
                      </option>
                      <option value="Discharge Coordinator">Discharge Coordinator</option>
                      <option value="Social Worker">Social Worker</option>
                      <option value="Case Manager">Case Manager</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenDropdownId(openDropdownId === member.id ? null : member.id)
                        }
                        className="dropdown-trigger p-1.5 rounded-lg text-slate-400 hover:text-brand-teal hover:bg-teal-50 cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4 pointer-events-none" />
                      </button>
                      <AnimatePresence>
                        {openDropdownId === member.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                            className="dropdown-menu absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-[100]"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (members.length <= 1) {
                                  toast.error("At least one active partner user is required.");
                                } else {
                                  removePartnerTeamMember(member.id);
                                  toast.success(`Removed ${member.name}.`);
                                }
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-brand-teal" />
                  Add Team Member
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddMember} className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Dr. Priya Nair"
                    className="w-full rounded-xl border-slate-200 text-sm py-2.5 px-3 border outline-none text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="p.nair@mercygeneral.org"
                    className="w-full rounded-xl border-slate-200 text-sm py-2.5 px-3 border outline-none text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full rounded-xl border-slate-200 text-sm py-2.5 px-3 border outline-none text-slate-700 bg-white"
                  >
                    <option value="Discharge Coordinator">Discharge Coordinator</option>
                    <option value="Director of Discharge Planning">
                      Director of Discharge Planning
                    </option>
                    <option value="Social Worker">Social Worker</option>
                    <option value="Case Manager">Case Manager</option>
                  </select>
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl text-sm font-medium cursor-pointer"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
