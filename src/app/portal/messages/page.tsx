"use client";

import React, { useMemo, useState } from "react";
import { Send, ShieldCheck, Search, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { Avatar } from "@/components/ui/Avatar";

export default function PortalMessagesPage() {
  const { currentUser } = useAuth();
  const { state, sendConversationMessage, markConversationRead } = useAgencyStore();
  const isClient = currentUser?.role === "CLIENT";

  const portalConversations = useMemo(
    () =>
      state.conversations.filter(
        (c) =>
          !c.isArchived &&
          (c.categoryId === "Clients" ||
            c.categoryId === "Family Members" ||
            c.categoryId === "Care Team Channels")
      ),
    [state.conversations]
  );

  const [selectedId, setSelectedId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return portalConversations;
    return portalConversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.participantRole.toLowerCase().includes(q)
    );
  }, [portalConversations, searchQuery]);

  const activeThread =
    filtered.find((c) => c.id === selectedId) ||
    portalConversations.find((c) => c.id === selectedId) ||
    filtered[0] ||
    portalConversations[0];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    markConversationRead(id);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeThread) return;
    sendConversationMessage({
      conversationId: activeThread.id,
      content: inputValue.trim(),
      channelMode: "in-app",
      isInternalNote: false,
    });
    setInputValue("");
    toast.success("Message delivered to Agency Care Team Hub");
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            {isClient ? "My Care Team Messages" : "Messages"}
          </h1>
          <p className="text-xs text-text-secondary">
            Encrypted two-way messaging synced live with Nurses, Caregivers &amp; Schedulers.
          </p>
        </div>
        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> HIPAA Encrypted
        </span>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-border-subtle shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden flex min-h-0">
        <div className="w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/60">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search threads..."
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filtered.map((thread) => {
              const lastMsg = thread.messages[thread.messages.length - 1];
              const isActive = activeThread?.id === thread.id;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => handleSelect(thread.id)}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                    isActive ? "bg-white border-l-4 border-l-brand-teal" : "hover:bg-white"
                  }`}
                >
                  <Avatar name={thread.title} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{thread.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{lastMsg?.timestampLabel}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {lastMsg?.content ?? thread.participantRole}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {activeThread ? (
          <div className="flex-1 flex flex-col bg-white min-w-0">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={activeThread.title} size="md" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{activeThread.title}</h2>
                  <p className="text-xs text-slate-500">{activeThread.participantRole}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/40">
              {activeThread.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.isCurrentUser ? "items-end" : "items-start"}`}
                >
                  <div className="text-[11px] text-slate-500 mb-1">
                    {m.senderName} • {m.timestampLabel}
                  </div>
                  <div
                    className={`max-w-md px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      m.isCurrentUser
                        ? "bg-brand-teal text-white rounded-tr-none"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex items-center gap-2 bg-white">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Write a message to your care team..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-brand-teal hover:bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">No active threads yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
