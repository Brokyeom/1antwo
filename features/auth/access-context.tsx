"use client";

import { createContext, useContext } from "react";

type AccessContextValue = {
  canEdit: boolean;
  isAdmin: boolean;
  loading: boolean;
};

export const AccessContext = createContext<AccessContextValue | null>(null);

export function useAccessContext() {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error("useAccessContext must be used inside AccessContext.Provider.");
  }
  return context;
}
