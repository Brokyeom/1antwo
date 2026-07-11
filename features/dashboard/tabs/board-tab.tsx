"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { uploadFirebaseFile, deleteFirebaseFile } from "@/hooks/use-firebase-upload";
import { newStringId } from "@/lib/utils";
import type { BoardPost, DashboardData, UploadedFile } from "@/types/dashboard";
import type { Patch } from "@/features/dashboard/types";
import { PostSection } from "@/features/dashboard/components/post-section";
import { FileList } from "@/features/dashboard/components/file-list";

export function BoardTab({ data, persist }: { data: DashboardData; persist: (patch: Patch) => Promise<void> }) {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <PostSection
      title="자유게시판"
      empty="등록된 게시물이 없습니다."
      posts={data.boardPosts}
      onCreate={async (post) => {
        const postId = post.id;
        const uploaded: UploadedFile[] = [];
        for (const file of files) {
          const id = newStringId();
          const url = await uploadFirebaseFile(`boardFiles/${postId}/${id}`, file);
          uploaded.push({ id, name: file.name, url, type: file.name.split(".").pop()?.toLowerCase(), uploadedAt: Date.now() });
        }
        await persist((current) => ({ ...current, boardPosts: [{ ...post, files: uploaded }, ...current.boardPosts] }));
        setFiles([]);
      }}
      onDelete={(id) => persist((current) => ({ ...current, boardPosts: current.boardPosts.filter((post) => post.id !== id) }))}
      extraForm={
        <div className="flex flex-wrap items-center gap-2">
          <label>
            <Button asChild variant="outline" size="sm">
              <span><Paperclip className="h-3.5 w-3.5" />{files.length ? `${files.length}개 선택됨` : "파일 첨부"}</span>
            </Button>
            <input
              className="hidden"
              type="file"
              multiple
              accept=".pdf,.md,.docx,.doc,.pptx,.xlsx,.png,.jpg,.jpeg"
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
            />
          </label>
          {files.map((file, index) => (
            <Badge key={`${file.name}-${index}`} className="bg-secondary text-foreground">
              {file.name}
              <button className="ml-2 text-muted-foreground" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} type="button">×</button>
            </Badge>
          ))}
        </div>
      }
      renderPostExtra={(post) => (
        <FileList
          compact
          empty=""
          files={(post as BoardPost).files || []}
          onDelete={async (file) => {
            try { await deleteFirebaseFile(file.url); } catch {}
            await persist((current) => ({
              ...current,
              boardPosts: current.boardPosts.map((item) =>
                item.id === post.id ? { ...item, files: (item.files || []).filter((stored) => stored.id !== file.id) } : item,
              ),
            }));
          }}
        />
      )}
    />
  );
}
