"use client";

import React from "react";
import Link from "next/link";
import { X, Link as LinkIcon, Phone, Globe, ShieldCheck } from "lucide-react";
import { AgencyConversation } from "@/types/agency";

interface DetailsPaneProps {
  conversation: AgencyConversation | null;
  onClose: () => void;
  isOpen: boolean;
}

export function DetailsPane({ conversation, onClose, isOpen }: DetailsPaneProps) {
  if (!isOpen || !conversation) return null;

  const initials = conversation.title
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full bg-white flex flex-col h-full shrink-0">
      <div className="h-14 flex items-center justify-between px-5 border-b border-slate-200 shrink-0">
        <h3 className="font-semibold text-slate-800 text-sm">Thread Context</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-md cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 text-center border-b border-slate-100">
          <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xl border border-slate-200">
            {initials}
          </div>
          <h2 className="font-semibold text-base text-slate-900">{conversation.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{conversation.participantRole}</p>
        </div>

        <div className="p-5 space-y-3 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 text-slate-600">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>{conversation.phoneMasked} (PHI Masked)</span>
          </div>
          {conversation.preferredLanguage && (
            <div className="flex items-center gap-2.5 text-slate-600">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>Preferred Language: {conversation.preferredLanguage}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>HIPAA Encrypted &amp; Audit-Logged</span>
          </div>
        </div>

        {conversation.linkedRecord && (
          <div className="p-5">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Linked Agency Record
            </h4>
            <Link
              href={conversation.linkedRecord.route}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-brand-teal/40 hover:bg-brand-teal/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                <LinkIcon className="w-4 h-4 text-brand-teal" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  {conversation.linkedRecord.label}
                </p>
                <p className="text-[11px] text-slate-500">{conversation.linkedRecord.type}</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
