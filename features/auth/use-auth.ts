"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase/client";

export type AuthState = {
  user: User | null;
  loading: boolean;
  signInError: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  // 서버와 브라우저의 최초 렌더가 항상 같도록 Firebase 상태는 effect에서 확인한다.
  const [loading, setLoading] = useState(true);
  const [signInError, setSignInError] = useState("");

  useEffect(() => {
    if (!auth) {
      const timeout = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(timeout);
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async () => {
    if (!auth) return;
    setSignInError("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      const code = (error as { code?: string }).code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      if (code === "auth/popup-blocked") {
        setSignInError("팝업이 차단되었습니다. 브라우저의 팝업 차단을 해제한 뒤 다시 시도해주세요.");
        return;
      }
      setSignInError(`로그인에 실패했습니다: ${(error as Error).message}`);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
  }, []);

  return useMemo(
    () => ({ user, loading, signInError, signIn, signOut }),
    [user, loading, signInError, signIn, signOut],
  );
}
