"use client";

import React from "react";
import { AlertCircle, Search, Edit } from "lucide-react";
import clsx from "clsx";
import { FilterType } from "./CommunicationsLayout";
import { AgencyConversation, AgencyConversationCategory } from "@/types/agency";

interface ConversationListPaneProps {
  conversations: AgencyConversation[];
  activeCategory: AgencyConversationCategory | "All";
  activeFilter: FilterType;
  searchQuery: string;
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onOpenSidebar?: () => void;
  onStartNew?: () => void;
}

export function ConversationListPane({
  conversations,
  activeCategory,
  activeFilter,
  searchQuery,
  activeConversationId,
  onSelectConversation,
  onOpenSidebar,
  onStartNew,
}: ConversationListPaneProps) {
  const filteredConversations = conversations.filter((c) => {
    if (activeCategory !== "All" && c.categoryId !== activeCategory) return false;
    if (activeFilter === "Unread" && c.unreadCount === 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const lastContent = c.messages[c.messages.length - 1]?.content ?? "";
      const match =
        c.title.toLowerCase().includes(q) ||
        c.participantRole.toLowerCase().includes(q) ||
        lastContent.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#fcfdfd] border-r border-slate-200/50 w-full shrink-0">
      <div className="px-4 py-3 bg-[#fcfdfd]/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onOpenSidebar && (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="xl:hidden p-2 -ml-2 text-slate-500 hover:text-brand-teal hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
          <h2 className="text-[16px] font-semibold text-slate-800">
            {activeCategory !== "All"
              ? activeCategory
              : activeFilter === "Unread"
              ? "Unread Threads"
              : "Unified Inbox"}
          </h2>
        </div>
        {onStartNew && (
          <button
            type="button"
            onClick={onStartNew}
            className="p-2 text-brand-teal hover:bg-brand-teal/10 rounded-full transition-colors cursor-pointer"
            title="New Unified Thread"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Search className="w-5 h-5 opacity-50" />
            </div>
            <p className="text-sm font-medium">No conversations found.</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeConversationId === conv.id;
            const lastMsg = conv.messages[conv.messages.length - 1];

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className={clsx(
                  "w-full text-left p-3.5 rounded-xl transition-all duration-200 relative border cursor-pointer",
                  isActive
                    ? "bg-white border-brand-teal/30 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-white hover:border-slate-200/70"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-slate-900 truncate">
                        {conv.title}
                      </span>
                      {conv.isUrgent && (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{conv.participantRole}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="text-[10px] text-slate-400">
                      {lastMsg?.timestampLabel ?? ""}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-brand-teal text-white text-[10px] font-bold">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                {lastMsg && (
                  <p className="text-xs text-slate-600 truncate mt-2">
                    {lastMsg.isInternalNote ? "[Internal] " : ""}
                    {lastMsg.content}
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
