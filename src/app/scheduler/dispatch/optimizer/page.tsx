"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaregiverDeck } from "@/components/tracker/CaregiverDeck";
import { LiveMap } from "@/components/tracker/LiveMap";
import { VisitQueue } from "@/components/tracker/VisitQueue";
import { RouteComparisonModal } from "@/components/tracker/RouteComparisonModal";
import { ProposedPathModal } from "@/components/tracker/ProposedPathModal";
import { VisitDetailsDrawer } from "@/components/dispatch/VisitDetailsDrawer";
import { ContactCaregiverModal } from "@/components/dispatch/ContactCaregiverModal";
import { AlertTriangle, RefreshCw, Users, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import {
  mapAgencyToTrackerCaregivers,
  mapAgencyToTrackerVisits,
} from "@/lib/scheduling/agencyTrackerAdapter";

export default function DispatchOptimizerPage() {
  const { state, assignShift, autoFillAllUnfilled } = useAgencyStore();

  const caregivers = useMemo(
    () => mapAgencyToTrackerCaregivers(state.caregivers, state.visits, state.clients),
    [state.caregivers, state.visits, state.clients]
  );
  const visits = useMemo(
    () => mapAgencyToTrackerVisits(state.visits, state.clients),
    [state.visits, state.clients]
  );

  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [hoveredCaregiverId, setHoveredCaregiverId] = useState<string | null>(null);
  const [draggedCaregiverId, setDraggedCaregiverId] = useState<string | null>(null);
  const [dragOverVisitId, setDragOverVisitId] = useState<string | null>(null);
  const [showAICard, setShowAICard] = useState(true);
  const [showDelayBanner, setShowDelayBanner] = useState(true);
  const [comparingVisitId, setComparingVisitId] = useState<string | null>(null);
  const [showProposedPathModal, setShowProposedPathModal] = useState(false);
  const [isContactingCaregiver, setIsContactingCaregiver] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const activeCaregiverId = draggedCaregiverId || hoveredCaregiverId;
  const activeCaregiver = caregivers.find((c) => c.id === activeCaregiverId);

  const assignedCaregiverIds = new Set(
    visits
      .filter((v) => v.status === "Assigned" || v.status === "In Progress")
      .map((v) => v.caregiverId)
      .filter(Boolean) as string[]
  );

  const handleSelectCaregiver = (id: string | null) => {
    setSelectedCaregiverId(id);
    if (id) {
      const visit = visits.find((v) => v.id === selectedVisitId);
      if (visit && visit.caregiverId !== id) {
        setSelectedVisitId(null);
      }
    }
  };

  const handleSelectVisit = (id: string | null) => {
    setSelectedVisitId(id);
    if (id) {
      const visit = visits.find((v) => v.id === id);
      if (visit && visit.caregiverId) {
        setSelectedCaregiverId(visit.caregiverId);
      }
    }
  };

  const handleAssignCaregiver = (caregiverId: string, visitId: string) => {
    const caregiver = caregivers.find((c) => c.id === caregiverId);
    const visit = visits.find((v) => v.id === visitId);
    if (caregiver && visit) {
      assignShift(visitId, caregiverId);
      toast.success(`${caregiver.name} assigned to ${visit.patientName} (synced live).`);
    }
  };

  const handleReOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const filled = autoFillAllUnfilled();
      setIsOptimizing(false);
      toast.success(
        filled > 0
          ? `AI Route Optimizer filled ${filled} open shift(s) without overtime.`
          : "All active routes are already balanced."
      );
    }, 600);
  };

  const handleSavePlan = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Dispatch route plan synchronized to Caregiver & EVV portals.");
    }, 400);
  };

  const openCount = visits.filter((v) => v.status === "Unassigned").length;

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] min-h-[700px] w-full overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] font-sans relative">
      <div className="flex flex-wrap items-center justify-between px-6 py-3 bg-white shrink-0 z-20 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          LIVE ROUTE OPTIMIZER:
          <span className="flex items-center gap-1 text-slate-700">
            <Users className="w-4 h-4 text-brand-teal" />{" "}
            {caregivers.filter((c) => c.status === "Active").length} Active Staff
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            {openCount} Open Visit(s)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReOptimize}
            className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            {isOptimizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>⚡</span>}
            AI Auto-Optimize &amp; Fill
          </button>
          <button
            type="button"
            onClick={handleSavePlan}
            disabled={isSaving}
            className="flex items-center gap-2 border border-brand-teal px-3 py-2 rounded-lg text-xs font-semibold text-brand-teal hover:bg-brand-teal hover:text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{" "}
            {isSaving ? "Saving..." : "Sync Plan"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative p-4 gap-4 bg-white">
        <div className="flex flex-col flex-1 gap-4 min-w-0">
          <div className="flex-[3] rounded-2xl overflow-hidden border border-slate-200 relative min-h-0">
            <LiveMap
              caregivers={caregivers}
              visits={visits}
              selectedCaregiverId={selectedCaregiverId}
              selectedVisitId={selectedVisitId}
              onSelectCaregiver={handleSelectCaregiver}
              onSelectVisit={handleSelectVisit}
              activeCaregiverId={activeCaregiverId}
              dragOverVisitId={dragOverVisitId}
            />
            <AnimatePresence>
              {showDelayBanner && openCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 bg-rose-600/95 backdrop-blur-md text-white px-4 py-2 rounded-lg z-40 flex items-center gap-3 text-xs font-semibold border border-rose-500"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {openCount} unassigned visit(s) require immediate caregiver dispatch.
                  <button
                    type="button"
                    onClick={() => setShowDelayBanner(false)}
                    className="p-1 hover:bg-rose-700 rounded-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {showAICard && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0f172a]/90 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl z-40 flex flex-col gap-3 max-w-[480px] w-full"
                >
                  <div className="text-xs font-medium text-slate-200 leading-snug">
                    <strong className="text-white">Smart Dispatch Engine:</strong> Drag a caregiver
                    from the deck onto any unassigned visit, or click Auto-Optimize to score skill +
                    proximity + overtime protection.
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowProposedPathModal(true)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded cursor-pointer"
                    >
                      View Proposed Path
                    </button>
                    <button
                      type="button"
                      onClick={handleReOptimize}
                      className="px-3 py-1.5 text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500 hover:text-slate-900 rounded cursor-pointer"
                    >
                      ⚡ Auto-Optimize
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="shrink-0 rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
            <CaregiverDeck
              caregivers={caregivers}
              visits={visits}
              assignedCaregiverIds={assignedCaregiverIds}
              selectedCaregiverId={selectedCaregiverId}
              onSelectCaregiver={handleSelectCaregiver}
              onHoverCaregiver={setHoveredCaregiverId}
              onDragCaregiver={setDraggedCaregiverId}
              onAssign={handleAssignCaregiver}
            />
          </div>
        </div>

        <div className="w-[340px] shrink-0 h-full flex flex-col">
          <VisitQueue
            visits={visits}
            selectedVisitId={selectedVisitId}
            onSelectVisit={handleSelectVisit}
            onAssign={handleAssignCaregiver}
            activeCaregiver={activeCaregiver}
            onDragOverVisit={setDragOverVisitId}
            onCompareRoutes={setComparingVisitId}
            caregivers={caregivers}
            className="w-full h-full"
          />
        </div>
      </div>

      <VisitDetailsDrawer
        isOpen={!!selectedVisitId}
        onClose={() => setSelectedVisitId(null)}
        visit={visits.find((v) => v.id === selectedVisitId) || null}
        onEdit={() => toast.info("Use Shift Board or Dispatch Visits to edit shift details.")}
        onContact={() => setIsContactingCaregiver(true)}
      />

      <RouteComparisonModal
        isOpen={!!comparingVisitId}
        onClose={() => setComparingVisitId(null)}
        visit={visits.find((v) => v.id === comparingVisitId) || null}
        caregivers={caregivers}
        onAssign={handleAssignCaregiver}
      />

      <ContactCaregiverModal
        isOpen={isContactingCaregiver}
        onClose={() => setIsContactingCaregiver(false)}
        visit={visits.find((v) => v.id === selectedVisitId) || null}
        onSend={() => {
          setIsContactingCaregiver(false);
          toast.success("Message sent to caregiver.");
        }}
      />

      <ProposedPathModal
        isOpen={showProposedPathModal}
        onClose={() => setShowProposedPathModal(false)}
        onApply={() => {
          setShowProposedPathModal(false);
          setShowAICard(false);
          handleReOptimize();
        }}
      />
    </div>
  );
}
