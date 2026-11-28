"use client";

import React, { useMemo, useState } from "react";
import { IconRail } from "@/components/tracker/IconRail";
import { CaregiverRoster } from "@/components/tracker/CaregiverRoster";
import { LiveMap } from "@/components/tracker/LiveMap";
import { VisitQueue } from "@/components/tracker/VisitQueue";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import {
  mapAgencyToTrackerCaregivers,
  mapAgencyToTrackerVisits,
} from "@/lib/scheduling/agencyTrackerAdapter";

export default function SchedulerTrackerPage() {
  const { state, assignShift } = useAgencyStore();

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
  const [hoveredCaregiverId, setHoveredCaregiverId] = useState<string | null>(null);
  const [draggedCaregiverId, setDraggedCaregiverId] = useState<string | null>(null);
  const [dragOverVisitId, setDragOverVisitId] = useState<string | null>(null);

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
      toast.success(`${caregiver.name} assigned to ${visit.patientName} (live tracker sync).`);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-page-bg font-sans relative">
      <IconRail />

      <CaregiverRoster
        caregivers={caregivers}
        assignedCaregiverIds={assignedCaregiverIds}
        selectedCaregiverId={selectedCaregiverId}
        onSelectCaregiver={handleSelectCaregiver}
        onHoverCaregiver={setHoveredCaregiverId}
        onDragCaregiver={setDraggedCaregiverId}
      />

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

      <VisitQueue
        visits={visits}
        selectedVisitId={selectedVisitId}
        onSelectVisit={handleSelectVisit}
        onAssign={handleAssignCaregiver}
        activeCaregiver={activeCaregiver}
        onDragOverVisit={setDragOverVisitId}
        caregivers={caregivers}
      />
    </div>
  );
}
