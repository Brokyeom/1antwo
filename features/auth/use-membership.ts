"use client";

import { onValue, ref as dbRef } from "firebase/database";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase/client";
import { emailToKey } from "@/lib/dashboard/email-key";

type MembershipState = {
  email: string | null;
  isAdmin: boolean;
  isMember: boolean;
  adminSettled: boolean;
  memberSettled: boolean;
};

const EMPTY_MEMBERSHIP: MembershipState = {
  email: null,
  isAdmin: false,
  isMember: false,
  adminSettled: false,
  memberSettled: false,
};

// 로그인 사용자는 규칙상 본인의 /admins/{key}, /members/{key}만 읽을 수 있다.
export function useMembership(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase() || null;
  const [state, setState] = useState<MembershipState>(EMPTY_MEMBERSHIP);

  useEffect(() => {
    if (!db || !normalizedEmail) return;

    const emailKey = emailToKey(normalizedEmail);
    const update = (patch: Partial<MembershipState>) => {
      setState((current) => ({
        ...(current.email === normalizedEmail
          ? current
          : { ...EMPTY_MEMBERSHIP, email: normalizedEmail }),
        ...patch,
      }));
    };

    const unsubscribeAdmin = onValue(
      dbRef(db, `admins/${emailKey}`),
      (snapshot) => update({ isAdmin: snapshot.val() === true, adminSettled: true }),
      () => update({ isAdmin: false, adminSettled: true }),
    );
    const unsubscribeMember = onValue(
      dbRef(db, `members/${emailKey}`),
      (snapshot) => update({ isMember: snapshot.exists(), memberSettled: true }),
      () => update({ isMember: false, memberSettled: true }),
    );

    return () => {
      unsubscribeAdmin();
      unsubscribeMember();
    };
  }, [normalizedEmail]);

  return useMemo(() => {
    if (!normalizedEmail || !db) {
      return { isAdmin: false, isMember: false, canEdit: false, loading: false };
    }
    if (state.email !== normalizedEmail) {
      return { isAdmin: false, isMember: false, canEdit: false, loading: true };
    }

    const loading = !state.adminSettled || !state.memberSettled;
    return {
      isAdmin: state.isAdmin,
      isMember: state.isMember,
      canEdit: !loading && (state.isAdmin || state.isMember),
      loading,
    };
  }, [normalizedEmail, state]);
}
