"use client";

import React from "react";
import Link from "next/link";
import { PlusCircle, Mailbox } from "lucide-react";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import { getStatusColor } from "@/components/partner/dashboard/PartnerRecentReferrals";
import clsx from "clsx";

interface MySubmittedReferralsListProps {
  email: string;
}

export function MySubmittedReferralsList({ email }: MySubmittedReferralsListProps) {
  const { state } = useAgencyStore();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Submitted Referrals</h1>
          <p className="text-slate-500 text-sm mt-1">
            Live status for referrals associated with{" "}
            <span className="font-medium text-slate-700">{email}</span>
          </p>
        </div>
        <Link
          href="/refer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Referral
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {state.referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Patient / Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Live Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {state.referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">
                          {referral.clientName}
                        </span>
                        <span className="text-xs text-slate-500 font-mono mt-0.5">
                          {referral.id.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(referral.dateReceived)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={clsx(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                          getStatusColor(referral.partnerStatus)
                        )}
                      >
                        {referral.partnerStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Mailbox className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No referrals found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              Submit your first referral to track real-time intake progress.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
