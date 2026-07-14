"use client";

import { onValue, ref as dbRef } from "firebase/database";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase/client";
import { emailToKey } from "@/lib/dashboard/email-key";

// 로그인 사용자가 admin인지 확인한다. DB 규칙상 본인의 /admins/{key}만 읽을 수 있다.
// (일반 멤버 자격은 대시보드 구독 성공 여부로 판단하므로 여기서 다루지 않는다.)
export function useMembership(email: string | null | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(Boolean(email && db));

  useEffect(() => {
    if (!db || !email) return;
    const adminRef = dbRef(db, `admins/${emailToKey(email)}`);
    return onValue(
      adminRef,
      (snapshot) => {
        setIsAdmin(snapshot.val() === true);
        setLoading(false);
      },
      () => {
        setIsAdmin(false);
        setLoading(false);
      },
    );
  }, [email]);

  return useMemo(() => ({ isAdmin, loading }), [isAdmin, loading]);
}
