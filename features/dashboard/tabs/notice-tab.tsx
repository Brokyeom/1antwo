"use client";

import type { DashboardData } from "@/types/dashboard";
import type { Patch } from "@/features/dashboard/types";
import { PostSection } from "@/features/dashboard/components/post-section";

export function NoticeTab({ data, persist }: { data: DashboardData; persist: (patch: Patch) => Promise<void> }) {
  return (
    <PostSection
      title="공지사항"
      empty="등록된 공지사항이 없습니다."
      posts={data.announcements}
      onCreate={(post) => persist((current) => ({ ...current, announcements: [post, ...current.announcements] }))}
      onDelete={(id) => persist((current) => ({ ...current, announcements: current.announcements.filter((post) => post.id !== id) }))}
      requireContent
    />
  );
}
