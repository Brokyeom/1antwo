"use client";

import { createContext, useContext } from "react";
import type { useDashboardData } from "@/features/dashboard/use-dashboard-data";

export type DashboardContextValue = ReturnType<typeof useDashboardData>;

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used inside DashboardShell.");
  }
  return context;
}
