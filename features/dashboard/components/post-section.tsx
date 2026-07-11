"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { newStringId, newWithin36Hours } from "@/lib/utils";
import type { TextPost } from "@/types/dashboard";
import { EmptyState, FormGrid, SectionCard } from "@/features/dashboard/components/layout";
import { DeleteConfirm } from "@/features/dashboard/components/delete-confirm";

export function PostSection({
  title,
  empty,
  posts,
  onCreate,
  onDelete,
  extraForm,
  renderPostExtra,
  requireContent,
}: {
  title: string;
  empty: string;
  posts: TextPost[];
  onCreate: (post: TextPost) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  extraForm?: React.ReactNode;
  renderPostExtra?: (post: TextPost) => React.ReactNode;
  requireContent?: boolean;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const author = String(form.get("author") || "").trim();
    const titleValue = String(form.get("title") || "").trim();
    const content = String(form.get("content") || "").trim();
    if (!author) return toast("작성자를 입력해주세요.", { variant: "destructive" });
    if (!titleValue) return toast("제목을 입력해주세요.", { variant: "destructive" });
    if (requireContent && !content) return toast("내용을 입력해주세요.", { variant: "destructive" });
    await onCreate({ id: newStringId(), author, title: titleValue, content, createdAt: Date.now() });
    event.currentTarget.reset();
    setOpen(false);
  };

  return (
    <>
    <SectionCard
      title={title}
      description={`${posts.length}건`}
      action={
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          글쓰기
        </Button>
      }
    >
        {posts.length === 0 ? (
          <EmptyState>{empty}</EmptyState>
        ) : (
          <div className="divide-y">
            {posts.map((post, index) => {
              const isOpen = expanded[post.id];
              return (
                <article key={post.id} className="py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{String(posts.length - index).padStart(3, "0")}</span>
                        <h3 className="min-w-0 break-words font-semibold">{post.title}</h3>
                        {newWithin36Hours(post.createdAt) && <Badge className="bg-destructive/10 text-destructive">NEW</Badge>}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">작성자 {post.author} · {new Date(post.createdAt).toLocaleString("ko-KR")}</div>
                    </div>
                    <div className="flex shrink-0 justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setExpanded((current) => ({ ...current, [post.id]: !isOpen }))}>
                        {isOpen ? "접기" : "더보기"}
                      </Button>
                      <DeleteConfirm title="글 삭제" onConfirm={() => onDelete(post.id)} />
                    </div>
                  </div>
                  {isOpen && (
                    <div className="mt-3 rounded-lg border bg-background p-3 text-sm leading-7 text-foreground">
                      <div className="whitespace-pre-wrap">{post.content}</div>
                      {renderPostExtra?.(post)}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
    </SectionCard>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title} 글쓰기</DialogTitle>
          <DialogDescription>작성자와 제목을 입력해 게시합니다.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FormGrid>
            <Input name="author" placeholder="작성자 *" />
            <Input name="title" placeholder="제목 *" />
          </FormGrid>
          <Textarea name="content" placeholder="내용을 입력하세요..." />
          {extraForm}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
            <Button>등록</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
