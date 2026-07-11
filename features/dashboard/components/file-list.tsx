"use client";

import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UploadedFile } from "@/types/dashboard";
import { EmptyState } from "@/features/dashboard/components/layout";
import { DeleteConfirm } from "@/features/dashboard/components/delete-confirm";

export function FileList({
  files,
  empty,
  onDelete,
  compact,
}: {
  files: UploadedFile[];
  empty: string;
  onDelete: (file: UploadedFile) => Promise<void>;
  compact?: boolean;
}) {
  if (!files.length) return empty ? <EmptyState>{empty}</EmptyState> : null;
  return (
    <div className={compact ? "mt-3 flex flex-wrap gap-2" : "divide-y"}>
      {files.map((file) => (
        <div key={file.id} className={compact ? "flex items-center gap-2 rounded-md border bg-card px-3 py-2" : "flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"}>
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{file.name}</div>
              <div className="text-xs text-muted-foreground">{new Date(file.uploadedAt).toLocaleDateString("ko-KR")} · {(file.type || "file").toUpperCase()}</div>
            </div>
          </div>
          <div className="flex shrink-0 justify-end gap-2">
            <Button asChild size="sm">
              <a href={file.url} target="_blank" rel="noreferrer">
                <Download className="h-3.5 w-3.5" />
                보기
              </a>
            </Button>
            <DeleteConfirm title="파일 삭제" onConfirm={() => onDelete(file)} />
          </div>
        </div>
      ))}
    </div>
  );
}
