"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Search, Bell, Send, Paperclip, MessageSquare } from "lucide-react";
import { CaregiverLayout } from "@/components/caregiver/CaregiverLayout";
import { Avatar } from "@/components/ui/Avatar";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { toast } from "sonner";

export default function CaregiverMessagesPage() {
  const {
    state,
    sendConversationMessage,
    markConversationRead,
  } = useAgencyStore();

  const conversations = useMemo(
    () =>
      state.conversations.filter(
        (c) =>
          !c.isArchived &&
          (c.categoryId === "Staff & Caregivers" ||
            c.categoryId === "Care Team Channels" ||
            c.categoryId === "Clients" ||
            c.categoryId === "Announcements")
      ),
    [state.conversations]
  );

  const [selectedId, setSelectedId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [pushPermission, setPushPermission] = useState<"default" | "granted" | "denied">("default");
  const [showPermissionBanner, setShowPermissionBanner] = useState(true);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.participantRole.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const activeThread = useMemo(() => {
    return (
      filteredConversations.find((c) => c.id === selectedId) ||
      conversations.find((c) => c.id === selectedId) ||
      filteredConversations[0] ||
      conversations[0]
    );
  }, [filteredConversations, conversations, selectedId]);

  const handleSelectThread = (id: string) => {
    setSelectedId(id);
    markConversationRead(id);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeThread) return;

    sendConversationMessage({
      conversationId: activeThread.id,
      content: messageInput.trim(),
      channelMode: "in-app",
      isInternalNote: false,
    });
    setMessageInput("");
    toast.success("Encrypted message dispatched to Care Team Hub");
  };

  const handleRequestPushPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted" || perm === "denied" || perm === "default") {
          setPushPermission(perm);
        }
        setShowPermissionBanner(false);
      });
    } else {
      setPushPermission("denied");
      setShowPermissionBanner(false);
    }
  };

  return (
    <CaregiverLayout>
      <div className="max-w-7xl mx-auto space-y-4 h-[calc(100vh-110px)] flex flex-col">
        {/* Push Notification Banner */}
        {showPermissionBanner && pushPermission !== "granted" && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3.5 rounded-2xl shadow-sm flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-blue-200 shrink-0" />
              <span>
                <strong>Enable Browser Push Notifications</strong> to receive instant alerts from Supervisors for urgent shift changes or care plan updates.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRequestPushPermission}
                className="px-3 py-1.5 bg-white text-blue-900 font-bold rounded-xl shadow-xs hover:bg-blue-50 transition-colors"
              >
                Enable Notifications
              </button>
              <button
                type="button"
                onClick={() => setShowPermissionBanner(false)}
                className="px-2 py-1 text-blue-200 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Two-Pane HIPAA Unified Messaging */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.04)] flex-1 overflow-hidden flex">
          {/* LEFT PANE */}
          <div className="w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-gray-50/50">
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-gray-900">Caregiver Messaging</h2>
                <span className="text-xs font-semibold bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded-full">
                  HIPAA Secure
                </span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search care team threads..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {filteredConversations.map((t) => {
                const isActive = t.id === activeThread?.id;
                const lastMsg = t.messages[t.messages.length - 1];
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectThread(t.id)}
                    className={`p-4 flex items-start gap-3 cursor-pointer transition-all ${
                      isActive ? "bg-white border-l-4 border-l-brand-teal shadow-2xs" : "hover:bg-white/80"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar name={t.title} size="md" />
                      {t.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-teal text-white rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                          {t.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{t.title}</h4>
                        <span className="text-[10px] text-gray-400 font-medium shrink-0">
                          {lastMsg?.timestampLabel ?? "Active"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {t.participantRole} • {lastMsg?.content ?? t.categoryId}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANE */}
          {activeThread ? (
            <div className="flex-1 flex flex-col bg-white">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <Avatar name={activeThread.title} size="md" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{activeThread.title}</h3>
                    <p className="text-xs text-gray-500">
                      {activeThread.participantRole} • {activeThread.categoryId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeThread.linkedRecord && (
                    <Link
                      href={activeThread.linkedRecord.route}
                      className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 hover:bg-indigo-100"
                    >
                      {activeThread.linkedRecord.label}
                    </Link>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" /> Encrypted Chat
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                {activeThread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.isCurrentUser ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-gray-700">
                        {m.senderName} ({m.senderRole})
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">{m.timestampLabel}</span>
                    </div>

                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        m.isCurrentUser
                          ? "bg-brand-teal text-white rounded-tr-none"
                          : "bg-white text-gray-900 border border-slate-200 rounded-tl-none"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toast.info("Attachment encryption enabled for clinical team photos.")}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a HIPAA-compliant secure message..."
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />

                <button
                  type="submit"
                  className="px-4 py-2.5 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <MessageSquare className="w-8 h-8 opacity-40" />
              <p className="text-xs">Select a conversation thread to begin.</p>
            </div>
          )}
        </div>
      </div>
    </CaregiverLayout>
  );
}
