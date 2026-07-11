"use client";

import { createContext, useContext } from "react";
import type { AuthState } from "@/features/auth/use-auth";

export const AuthContext = createContext<AuthState | null>(null);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used inside AuthContext.Provider.");
  }
  return context;
}
