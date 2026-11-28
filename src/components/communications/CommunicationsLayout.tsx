"use client";

import React, { useMemo, useState } from "react";
import { ConversationListPane } from "./ConversationListPane";
import { ActiveThreadPane } from "./ActiveThreadPane";
import { DetailsPane } from "./DetailsPane";
import {
  Inbox,
  Users,
  Heart,
  Users2,
  Shield,
  Megaphone,
  Search,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { AgencyConversationCategory } from "@/types/agency";

export type FilterType = "All" | "Unread";

export function CommunicationsLayout({
  initialCategory = "All",
}: {
  initialCategory?: AgencyConversationCategory | "All";
}) {
  const { currentUser } = useAuth();
  const { state, markConversationRead } = useAgencyStore();

  const [activeCategory, setActiveCategory] = useState<AgencyConversationCategory | "All">(
    initialCategory
  );
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    state.conversations[0]?.id ?? null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "thread" | "details">("list");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const activeConversation = useMemo(
    () => state.conversations.find((c) => c.id === activeConversationId) ?? null,
    [state.conversations, activeConversationId]
  );

  const handleSelectCategory = (category: AgencyConversationCategory | "All") => {
    setActiveCategory(category);
    setActiveFilter("All");
    setIsCreatingNew(false);
    setMobileView("list");
    setIsMobileSidebarOpen(false);
  };

  const handleSelectFilter = (filter: FilterType) => {
    setActiveFilter(filter);
    setActiveCategory("All");
    setIsCreatingNew(false);
    setMobileView("list");
    setIsMobileSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    markConversationRead(id);
    setIsCreatingNew(false);
    setMobileView("thread");
  };

  const handleStartNew = () => {
    setIsCreatingNew(true);
    setActiveConversationId(null);
    setMobileView("thread");
  };

  let categories: { id: AgencyConversationCategory; icon: React.ReactNode }[] = [
    { id: "Clients", icon: <Users className="w-4 h-4" /> },
    { id: "Family Members", icon: <Heart className="w-4 h-4" /> },
    { id: "Staff & Caregivers", icon: <Users2 className="w-4 h-4" /> },
    { id: "Care Team Channels", icon: <Shield className="w-4 h-4" /> },
    { id: "Announcements", icon: <Megaphone className="w-4 h-4" /> },
  ];

  if (currentUser?.role === "INTAKE_COORDINATOR") {
    categories = categories.filter((c) =>
      ["Clients", "Family Members", "Announcements"].includes(c.id)
    );
  } else if (
    currentUser?.role === "BILLING_FINANCE_STAFF" ||
    currentUser?.role === "FIELD_SUPERVISOR"
  ) {
    categories = categories.filter((c) =>
      ["Staff & Caregivers", "Care Team Channels", "Announcements"].includes(c.id)
    );
  } else if (currentUser?.role === "PARTNER") {
    categories = categories.filter((c) => ["Clients", "Announcements"].includes(c.id));
  }

  const totalUnread = state.conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex h-full overflow-hidden bg-white/50 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-[0_6px_32px_rgba(0,0,0,0.04)] relative">
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 xl:hidden backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Left Category Rail */}
      <div
        className={clsx(
          "bg-slate-50/80 backdrop-blur-3xl border-r border-slate-200/50 flex flex-col shrink-0 transition-transform duration-300 z-50",
          "w-[260px] fixed inset-y-0 left-0 h-full xl:relative xl:h-auto xl:translate-x-0",
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full xl:translate-x-0"
        )}
      >
        <div className="p-4 h-full overflow-y-auto space-y-5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            />
          </div>

          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Inbox
            </p>
            <button
              type="button"
              onClick={() => handleSelectFilter("All")}
              className={clsx(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer",
                activeCategory === "All" && activeFilter === "All"
                  ? "bg-brand-teal/10 text-brand-teal"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <span className="flex items-center gap-2">
                <Inbox className="w-4 h-4" /> All Threads
              </span>
              <span className="text-[11px] font-bold">{state.conversations.length}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectFilter("Unread")}
              className={clsx(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer",
                activeFilter === "Unread"
                  ? "bg-brand-teal/10 text-brand-teal"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <span className="flex items-center gap-2">
                <Inbox className="w-4 h-4" /> Unread
              </span>
              {totalUnread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-brand-teal text-white text-[10px] font-bold">
                  {totalUnread}
                </span>
              )}
            </button>
          </div>

          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Channels
            </p>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer",
                  activeCategory === cat.id
                    ? "bg-brand-teal/10 text-brand-teal"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {cat.icon}
                <span className="truncate">{cat.id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation List */}
      <div
        className={clsx(
          "h-full flex-col shrink-0",
          mobileView === "list" ? "flex w-full sm:w-[320px]" : "hidden lg:flex lg:w-[320px]"
        )}
      >
        <ConversationListPane
          conversations={state.conversations}
          activeCategory={activeCategory}
          activeFilter={activeFilter}
          searchQuery={searchQuery}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          onStartNew={handleStartNew}
        />
      </div>

      {/* Active Thread */}
      <div
        className={clsx(
          "flex-1 h-full min-w-0 flex-col",
          mobileView === "thread" ? "flex" : "hidden lg:flex"
        )}
      >
        <ActiveThreadPane
          conversation={activeConversation}
          isCreatingNew={isCreatingNew}
          showDetails={showDetails}
          onToggleDetails={() => {
            setShowDetails((prev) => !prev);
            if (!showDetails) setMobileView("details");
          }}
          onBack={() => setMobileView("list")}
          onCreatedConversation={(newId) => {
            setActiveConversationId(newId);
            setIsCreatingNew(false);
            setMobileView("thread");
          }}
        />
      </div>

      {/* Details Pane */}
      {showDetails && activeConversation && (
        <div
          className={clsx(
            "h-full border-l border-slate-200 bg-white shrink-0",
            mobileView === "details" ? "flex w-full lg:w-[300px]" : "hidden lg:flex lg:w-[300px]"
          )}
        >
          <DetailsPane
            conversation={activeConversation}
            isOpen={showDetails}
            onClose={() => {
              setShowDetails(false);
              setMobileView("thread");
            }}
          />
        </div>
      )}
    </div>
  );
}
