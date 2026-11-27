"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { IncidentsHeader } from "./IncidentsHeader";
import { IncidentsKpiStrip } from "./IncidentsKpiStrip";
import { IncidentTypeChart } from "./IncidentTypeChart";
import { IncidentQueue } from "./IncidentQueue";
import { TrendsPanel } from "./TrendsPanel";
import { IncidentDetailPanel } from "./IncidentDetailPanel";
import { ReportIncidentForm } from "./ReportIncidentForm";
import { Incident } from "@/types/incidents";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyStore } from "@/lib/store/AgencyStoreContext";

export function IncidentsPage() {
  const { state } = useAgencyStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const { currentUser } = useAuth();

  // QA_COMPLIANCE_OFFICER & ADMIN see every incident (including Restricted) agency-wide, unscoped.
  // CLINICAL_SUPERVISOR_RN sees clinical incidents (Fall, Med Error, Emergency, Hospital Transfer).
  const incidents =
    currentUser?.role === "CLINICAL_SUPERVISOR_RN"
      ? state.incidents.filter(
          (inc) =>
            inc.type === "Fall" ||
            inc.type === "Medication Error" ||
            inc.type === "Emergency" ||
            inc.type === "Hospital Transfer" ||
            inc.isRestricted
        )
      : state.incidents;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full space-y-4"
      >
        <IncidentsHeader onReportIncident={() => setIsReportFormOpen(true)} />

        <motion.div variants={itemVariants}>
          <IncidentsKpiStrip />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-auto lg:h-full">
          {/* Left Column: Charts */}
          <div className="flex flex-col gap-4 lg:col-span-1 h-full">
            <IncidentTypeChart
              onSelectCategory={(category) => setSelectedCategory(category === selectedCategory ? null : category)}
            />
            <TrendsPanel />
          </div>

          {/* Right Column: Queue */}
          <div className="lg:col-span-2 h-full min-h-[500px]">
            <IncidentQueue
              incidents={incidents}
              selectedCategory={selectedCategory}
              onRowClick={setSelectedIncident}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Modals & Panels */}
      <AnimatePresence>
        {selectedIncident && (
          <IncidentDetailPanel
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
          />
        )}
      </AnimatePresence>

      <ReportIncidentForm
        isOpen={isReportFormOpen}
        onClose={() => setIsReportFormOpen(false)}
      />
    </>
  );
}
