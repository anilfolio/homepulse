"use client";

import React, { useMemo, useState } from "react";
import { Header } from "@/components/scheduling/Header";
import { FilterBar } from "@/components/scheduling/FilterBar";
import { UrgencyStrip } from "@/components/scheduling/UrgencyStrip";
import { CalendarView } from "@/components/scheduling/CalendarView";
import { ShiftModal } from "@/components/scheduling/ShiftModal";
import { CreateShiftModal } from "@/components/scheduling/CreateShiftModal";
import { toast } from "sonner";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";
import {
  mapAgencyCaregiversToScheduling,
  mapAgencyVisitsToShifts,
} from "@/lib/scheduling/agencyShiftAdapter";
import type { Shift } from "@/lib/scheduling/mockData";

export default function ScheduledShiftsCalendarPage() {
  const { state, assignShift, triggerCallOff, createShift } = useAgencyStore();
  const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month">("Day");
  const [activeFilter, setActiveFilter] = useState("All Shifts");

  const [caregiverFilter, setCaregiverFilter] = useState("");
  const [patientFilter, setPatientFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const shifts = useMemo(
    () => mapAgencyVisitsToShifts(state.visits, state.clients, state.caregivers),
    [state.visits, state.clients, state.caregivers]
  );

  const schedulingCaregivers = useMemo(
    () => mapAgencyCaregiversToScheduling(state.caregivers),
    [state.caregivers]
  );

  const openShiftsCount = shifts.filter(
    (s) => s.status === "Unfilled" || s.status === "Call-Off"
  ).length;

  const handleAssignCaregiver = (shiftId: string, caregiverId: string) => {
    assignShift(shiftId, caregiverId);
    toast.success("Caregiver assigned & synced across Caregiver & EVV portals.");
  };

  const handleCallOff = (shiftId: string) => {
    triggerCallOff(shiftId, "Calendar call-off");
    toast.warning("Call-off triggered — backfill offers dispatched.");
  };

  const handleCreateShift = (newShift: Shift) => {
    const client =
      state.clients.find((c) =>
        c.name.toLowerCase().includes(newShift.patientName.toLowerCase())
      ) ?? state.clients[0];
    if (!client) return;

    createShift({
      clientId: client.id,
      caregiverId: null,
      scheduledStart: "10:00 AM",
      scheduledEnd: "02:00 PM",
      scheduledHours: 4,
      requiredSkills: newShift.requiredSkills,
      region: newShift.region,
    });
    toast.success(`Shift created for ${client.name}.`);
  };

  const selectedShift = shifts.find((s) => s.id === selectedShiftId) || null;
  const suggestedCaregivers = [...schedulingCaregivers]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  const filteredShifts = shifts.filter((s) => {
    if (activeFilter === "Call-Offs") {
      if (s.status !== "Call-Off") return false;
    } else if (activeFilter !== "All Shifts") {
      if (s.status !== activeFilter) return false;
    }

    if (caregiverFilter && s.assignedCaregiverName !== caregiverFilter) return false;
    if (patientFilter && s.patientName !== patientFilter) return false;
    if (regionFilter && s.region !== regionFilter) return false;

    return true;
  });

  const uniqueCaregivers = Array.from(
    new Set(shifts.map((s) => s.assignedCaregiverName).filter(Boolean))
  ) as string[];
  const uniquePatients = Array.from(
    new Set(shifts.map((s) => s.patientName).filter(Boolean))
  );
  const uniqueRegions = Array.from(new Set(shifts.map((s) => s.region).filter(Boolean)));

  return (
    <div className="w-full animate-in fade-in duration-500">
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        openShiftsCount={openShiftsCount}
        onCreateShift={() => setIsCreateModalOpen(true)}
      />

      <UrgencyStrip />

      <FilterBar
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        caregiverFilter={caregiverFilter}
        setCaregiverFilter={setCaregiverFilter}
        patientFilter={patientFilter}
        setPatientFilter={setPatientFilter}
        regionFilter={regionFilter}
        setRegionFilter={setRegionFilter}
        uniqueCaregivers={uniqueCaregivers}
        uniquePatients={uniquePatients}
        uniqueRegions={uniqueRegions}
      />

      <div className="mt-4">
        <CalendarView
          viewMode={viewMode}
          shifts={filteredShifts}
          caregivers={schedulingCaregivers}
          onShiftClick={(shift) => setSelectedShiftId(shift.id)}
        />
      </div>

      <ShiftModal
        shift={selectedShift}
        isOpen={!!selectedShift}
        onClose={() => setSelectedShiftId(null)}
        suggestedCaregivers={suggestedCaregivers}
        onAssignCaregiver={handleAssignCaregiver}
        onCallOff={handleCallOff}
      />

      <CreateShiftModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateShift}
      />
    </div>
  );
}
