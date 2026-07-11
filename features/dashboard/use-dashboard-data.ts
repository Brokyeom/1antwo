"use client";

import { onValue, ref as dbRef, set, update } from "firebase/database";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dashboardRef, db, isFirebaseDatabaseConfigured } from "@/lib/firebase/client";
import { DEFAULT_DATA } from "@/lib/dashboard/default-data";
import type { DashboardData } from "@/types/dashboard";

const normalize = (data: Partial<DashboardData> | null): DashboardData => ({
  ...DEFAULT_DATA,
  ...data,
  tradeJournal: data?.tradeJournal || [],
  returnsData: data?.returnsData || { labels: [], data: [] },
  companyDocs: data?.companyDocs || {},
  companyNotes: data?.companyNotes || {},
  reports: data?.reports || {},
  reportComments: data?.reportComments || {},
  presentations: data?.presentations || [],
  announcements: data?.announcements || [],
  boardPosts: data?.boardPosts || [],
  annualData: data?.annualData || {},
  quarterlyData: data?.quarterlyData || {},
});

const PERMISSION_DENIED_MESSAGE =
  "로그인 계정이 멤버 목록에 없습니다. 관리자에게 이메일 등록을 요청해주세요.";

const isPermissionDenied = (error: Error) => /permission[_ ]denied/i.test(error.message);

export function useDashboardData() {
  const [data, setDataState] = useState<DashboardData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(isFirebaseDatabaseConfigured);
  const [connected, setConnected] = useState(false);
  const [loadError, setLoadError] = useState(
    isFirebaseDatabaseConfigured ? "" : "Firebase Realtime Database 환경 변수가 설정되지 않았습니다.",
  );
  const [saveError, setSaveError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const dataRef = useRef<DashboardData>(DEFAULT_DATA);
  const initialLoadSettledRef = useRef(!isFirebaseDatabaseConfigured);

  useEffect(() => {
    if (!dashboardRef) return;
    const activeDashboardRef = dashboardRef;
    const timeout = window.setTimeout(() => {
      if (!initialLoadSettledRef.current) {
        initialLoadSettledRef.current = true;
        setLoading(false);
        setLoadError("Firebase 데이터를 불러오지 못했습니다. 네트워크 연결과 Realtime Database URL을 확인해주세요.");
      }
    }, 10000);

    const unsubscribe = onValue(
      activeDashboardRef,
      (snapshot) => {
        const value = snapshot.val() as DashboardData | null;
        initialLoadSettledRef.current = true;
        const normalized = normalize(value || {});
        dataRef.current = normalized;
        setDataState(normalized);
        setLoading(false);
        setLoadError("");
      },
      (firebaseError) => {
        initialLoadSettledRef.current = true;
        setLoading(false);
        setLoadError(
          isPermissionDenied(firebaseError)
            ? PERMISSION_DENIED_MESSAGE
            : `Firebase 데이터를 불러오지 못했습니다: ${firebaseError.message}`,
        );
      },
    );
    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!db) return;

    return onValue(dbRef(db, ".info/connected"), (snapshot) => {
      setConnected(Boolean(snapshot.val()));
    });
  }, []);

  const persist = useCallback(async (next: DashboardData | ((current: DashboardData) => DashboardData)) => {
    const previous = dataRef.current;
    const resolved = typeof next === "function" ? next(previous) : next;
    dataRef.current = resolved;
    setDataState(resolved);

    if (!isFirebaseDatabaseConfigured || !dashboardRef) {
      setSaveError("Firebase Realtime Database 환경 변수가 설정되지 않아 저장할 수 없습니다.");
      return;
    }

    const changedKeys = Object.keys({ ...previous, ...resolved }).filter(
      (key) => key !== "updatedAt" && previous[key as keyof DashboardData] !== resolved[key as keyof DashboardData],
    ) as Array<keyof DashboardData>;
    if (!changedKeys.length) return;

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const key of changedKeys) {
      updates[key] = resolved[key];
    }

    try {
      await update(dashboardRef, updates);
      setSaveStatus("동기화됨");
      setSaveError("");
    } catch (firebaseError) {
      const message = firebaseError instanceof Error ? firebaseError.message : "알 수 없는 오류";
      setSaveError(`Firebase 저장에 실패했습니다: ${message}`);
      setSaveStatus("저장 실패");
    }
    window.setTimeout(() => setSaveStatus(""), 2000);
  }, []);

  const replaceFromBackup = useCallback(async (partial: Partial<DashboardData>) => {
    const resolved = normalize({ ...dataRef.current, ...partial });
    dataRef.current = resolved;
    setDataState(resolved);

    if (!isFirebaseDatabaseConfigured || !dashboardRef) {
      setSaveError("Firebase Realtime Database 환경 변수가 설정되지 않아 저장할 수 없습니다.");
      return;
    }

    try {
      await set(dashboardRef, { ...resolved, updatedAt: Date.now() });
      setSaveStatus("동기화됨");
      setSaveError("");
    } catch (firebaseError) {
      const message = firebaseError instanceof Error ? firebaseError.message : "알 수 없는 오류";
      setSaveError(`Firebase 저장에 실패했습니다: ${message}`);
      setSaveStatus("저장 실패");
    }
    window.setTimeout(() => setSaveStatus(""), 2000);
  }, []);

  return useMemo(
    () => ({ data, loading, connected, loadError, saveError, saveStatus, persist, replaceFromBackup }),
    [data, loading, connected, loadError, saveError, saveStatus, persist, replaceFromBackup],
  );
}
