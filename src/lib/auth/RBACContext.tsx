"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Role } from "@/types/rbac";
import { useRBAC } from "@/lib/rbac/rbacStore";
import { SEED_USERS } from "@/lib/rbac/seedData";

interface AuthContextType {
  currentUser: User | null;
  login: (role: Role) => void;
  switchRole: (role: Role) => void;
  logout: () => void;
  isLoading: boolean;
}

const ROLE_TO_SEED_ID: Record<Role, string> = {
  ADMIN: "super_admin",
  SCHEDULER: "scheduler_dispatcher",
  HR: "hr_mgr_recruiter",
  CAREGIVER: "caregiver_field",
  CLIENT: "portal_client",
  FAMILY: "portal_family",
  INTAKE_COORDINATOR: "care_intake_coord",
  BILLING_FINANCE_STAFF: "billing_finance_staff",
  CLINICAL_SUPERVISOR_RN: "clinical_supervisor_rn",
  QA_COMPLIANCE_OFFICER: "qa_compliance_officer",
  FIELD_SUPERVISOR: "field_supervisor",
  PARTNER: "portal_referral_source",
  TRAINER: "trainer_lms_admin",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { users } = useRBAC();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>("ADMIN");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      const storedUserId =
        localStorage.getItem("homepulse_mock_user_id") ||
        localStorage.getItem("homeliocare_mock_user_id");
      const storedRole = (localStorage.getItem("homepulse_mock_user_role") ||
        localStorage.getItem("homeliocare_mock_user_role")) as Role | null;
      if (storedUserId) {
        setCurrentUserId(storedUserId);
      }
      if (storedRole && storedRole in ROLE_TO_SEED_ID) {
        setCurrentRole(storedRole);
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const login = (role: Role) => {
    const targetRoleId = ROLE_TO_SEED_ID[role] || "super_admin";
    let matchingUser = users.find((u) => u.role_id === targetRoleId);
    if (!matchingUser) {
      matchingUser = SEED_USERS.find((u) => u.role_id === targetRoleId);
    }

    if (matchingUser) {
      setCurrentUserId(matchingUser.id);
      setCurrentRole(role);
      localStorage.setItem("homepulse_mock_user_id", matchingUser.id);
      localStorage.setItem("homepulse_mock_user_role", role);
    }
  };

  const switchRole = (role: Role) => {
    login(role);
  };

  const logout = () => {
    setCurrentUserId(null);
    setCurrentRole("ADMIN");
    localStorage.removeItem("homepulse_mock_user_id");
    localStorage.removeItem("homepulse_mock_user_role");
    localStorage.removeItem("homeliocare_mock_user_id");
    localStorage.removeItem("homeliocare_mock_user_role");
  };

  let matchedUser = users.find((u) => u.id === currentUserId);
  if (!matchedUser && currentUserId) {
    matchedUser = SEED_USERS.find((u) => u.id === currentUserId);
  }

  const currentUser: User | null = matchedUser
    ? {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: currentRole,
        role_id: matchedUser.role_id,
        avatarUrl: "",
      }
    : null;

  return (
    <AuthContext.Provider
      value={{ currentUser, login, switchRole, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
