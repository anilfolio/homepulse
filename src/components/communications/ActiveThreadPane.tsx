"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Send,
  Info,
  ChevronLeft,
  Shield,
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import {
  AgencyConversation,
  AgencyConversationCategory,
  AgencyMessageChannel,
} from "@/types/agency";

interface ActiveThreadPaneProps {
  conversation: AgencyConversation | null;
  onToggleDetails: () => void;
  showDetails: boolean;
  onBack?: () => void;
  isCreatingNew: boolean;
  onCreatedConversation?: (newId: string) => void;
}

export function ActiveThreadPane({
  conversation,
  onToggleDetails,
  showDetails,
  onBack,
  isCreatingNew,
  onCreatedConversation,
}: ActiveThreadPaneProps) {
  const { state, sendConversationMessage, createConversationThread } = useAgencyStore();
  const [inputValue, setInputValue] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<AgencyMessageChannel>("in-app");
  const [isInternalNote, setIsInternalNote] = useState(false);

  const [newCategory, setNewCategory] =
    useState<AgencyConversationCategory>("Care Team Channels");
  const [newTitle, setNewTitle] = useState("");
  const [newClientId, setNewClientId] = useState(state.clients[0]?.id ?? "");
  const [newMessageBody, setNewMessageBody] = useState("");

  if (isCreatingNew) {
    const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle.trim() || !newMessageBody.trim()) {
        toast.error("Please provide a subject/recipient and initial message.");
        return;
      }
      const id = createConversationThread({
        categoryId: newCategory,
        title: newTitle.trim(),
        participantRole: newCategory,
        initialMessage: newMessageBody.trim(),
        channelMode: selectedChannel,
        linkedClientId: newClientId || undefined,
      });
      setNewTitle("");
      setNewMessageBody("");
      toast.success("Unified thread created & logged to HIPAA audit trail.");
      onCreatedConversation?.(id);
    };

    return (
      <div className="flex-1 flex flex-col h-full bg-[#f8fafd] min-w-0">
        <div className="h-14 flex items-center px-4 border-b border-slate-200/60 bg-white">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="lg:hidden p-1.5 mr-2 text-slate-500 rounded-full hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <h2 className="font-semibold text-slate-900 text-base">New Care Communication</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <form
            onSubmit={handleCreate}
            className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Channel</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as AgencyConversationCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Care Team Channels">Care Team Channels</option>
                <option value="Clients">Clients</option>
                <option value="Family Members">Family Members</option>
                <option value="Staff & Caregivers">Staff &amp; Caregivers</option>
                <option value="Announcements">Announcements</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thread Title / Recipient
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Eleanor Whitfield — Medication Check"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link Client Context (Optional)
              </label>
              <select
                value={newClientId}
                onChange={(e) => setNewClientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">None</option>
                {state.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.payer})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
              <textarea
                rows={4}
                value={newMessageBody}
                onChange={(e) => setNewMessageBody(e.target.value)}
                placeholder="Write message (HIPAA encrypted)..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-brand-teal text-white font-semibold rounded-xl text-sm hover:bg-brand-teal/90 cursor-pointer"
            >
              Send &amp; Create Thread
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafd] text-slate-400 p-6 text-center">
        <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">Select a conversation thread to view messages.</p>
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendConversationMessage({
      conversationId: conversation.id,
      content: inputValue,
      channelMode: selectedChannel,
      isInternalNote,
    });
    setInputValue("");
    toast.success("Message delivered & audited.");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafd] min-w-0">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200/60 bg-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="lg:hidden p-1.5 text-slate-500 rounded-full hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900 text-sm truncate">{conversation.title}</h2>
            <p className="text-[11px] text-slate-500 truncate">{conversation.participantRole}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversation.linkedRecord && (
            <Link
              href={conversation.linkedRecord.route}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-brand-teal text-xs font-semibold border border-teal-200 hover:bg-teal-100"
            >
              <span>{conversation.linkedRecord.label}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
          <button
            type="button"
            onClick={onToggleDetails}
            className={clsx(
              "p-2 rounded-full transition-colors cursor-pointer",
              showDetails ? "bg-brand-teal/10 text-brand-teal" : "text-slate-500 hover:bg-slate-100"
            )}
            title="Thread Context & Details"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {conversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              "flex flex-col max-w-[82%]",
              msg.isCurrentUser ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">{msg.senderName}</span>
              <span>• {msg.timestampLabel}</span>
              {msg.isInternalNote && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                  <Shield className="w-2.5 h-2.5" /> Internal
                </span>
              )}
            </div>
            <div
              className={clsx(
                "px-4 py-2.5 rounded-2xl text-sm shadow-2xs border",
                msg.isInternalNote
                  ? "bg-amber-50 border-amber-200 text-slate-800"
                  : msg.isCurrentUser
                  ? "bg-[#141D3C] border-[#2A3B75] text-white"
                  : "bg-white border-slate-200 text-slate-800"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: "in-app", label: "HIPAA In-App", icon: MessageSquare },
                { id: "sms", label: "SMS", icon: Phone },
                { id: "email", label: "Email", icon: Mail },
              ] as const
            ).map((ch) => {
              const Icon = ch.icon;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChannel(ch.id)}
                  className={clsx(
                    "px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 cursor-pointer border",
                    selectedChannel === ch.id
                      ? "bg-brand-teal/10 text-brand-teal border-brand-teal/30"
                      : "bg-slate-50 text-slate-500 border-slate-200"
                  )}
                >
                  <Icon className="w-3 h-3" /> {ch.label}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 cursor-pointer">
            <input
              type="checkbox"
              checked={isInternalNote}
              onChange={(e) => setIsInternalNote(e.target.checked)}
              className="rounded text-amber-600"
            />
            Internal Care-Team Note
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              isInternalNote
                ? "Add internal care-team clinical note..."
                : `Send encrypted ${selectedChannel} message...`
            }
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-4 py-2.5 bg-brand-teal text-white rounded-xl font-semibold text-sm hover:bg-brand-teal/90 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </form>
    </div>
  );
}
