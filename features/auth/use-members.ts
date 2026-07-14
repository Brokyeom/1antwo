"use client";

import { onValue, ref as dbRef, remove, set } from "firebase/database";
import { useCallback, useEffect, useMemo, useState } from "react";
import { db, membersRef } from "@/lib/firebase/client";
import { emailToKey, isValidEmail } from "@/lib/dashboard/email-key";

export type Member = {
  key: string;
  email: string;
  invitedBy?: string;
  invitedAt?: number;
};

type MemberRecord = {
  email?: string;
  invitedBy?: string;
  invitedAt?: number;
};

export type InviteResult = { ok: true } | { ok: false; error: string };

// admin 전용: /members 목록 구독 + 초대(추가)/삭제. DB 규칙이 admin만 read/write를 허용한다.
export function useMembers(inviterEmail: string | null | undefined) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(Boolean(membersRef));

  useEffect(() => {
    if (!membersRef) return;
    return onValue(
      membersRef,
      (snapshot) => {
        const value = (snapshot.val() as Record<string, MemberRecord> | null) || {};
        const list = Object.entries(value)
          .map(([key, record]) => ({
            key,
            email: record?.email || key.replaceAll(",", "."),
            invitedBy: record?.invitedBy,
            invitedAt: record?.invitedAt,
          }))
          .sort((a, b) => (b.invitedAt || 0) - (a.invitedAt || 0));
        setMembers(list);
        setLoading(false);
      },
      () => {
        setMembers([]);
        setLoading(false);
      },
    );
  }, []);

  const inviteMember = useCallback(
    async (rawEmail: string): Promise<InviteResult> => {
      if (!db) return { ok: false, error: "Firebase가 설정되지 않았습니다." };
      const email = rawEmail.trim().toLowerCase();
      if (!isValidEmail(email)) return { ok: false, error: "올바른 이메일 형식이 아닙니다." };
      const key = emailToKey(email);
      if (members.some((member) => member.key === key)) {
        return { ok: false, error: "이미 초대된 멤버입니다." };
      }
      try {
        await set(dbRef(db, `members/${key}`), {
          email,
          invitedBy: inviterEmail || "",
          invitedAt: Date.now(),
        });
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "초대에 실패했습니다." };
      }
    },
    [members, inviterEmail],
  );

  const removeMember = useCallback(async (key: string): Promise<InviteResult> => {
    if (!db) return { ok: false, error: "Firebase가 설정되지 않았습니다." };
    try {
      await remove(dbRef(db, `members/${key}`));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "삭제에 실패했습니다." };
    }
  }, []);

  return useMemo(
    () => ({ members, loading, inviteMember, removeMember }),
    [members, loading, inviteMember, removeMember],
  );
}
