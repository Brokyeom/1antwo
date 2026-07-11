"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFirebaseFile, deleteFirebaseFile } from "@/hooks/use-firebase-upload";
import type { DashboardData } from "@/types/dashboard";
import type { Patch } from "@/features/dashboard/types";
import { SectionCard } from "@/features/dashboard/components/layout";
import { FileList } from "@/features/dashboard/components/file-list";

export function PresentationsTab({ data, persist }: { data: DashboardData; persist: (patch: Patch) => Promise<void> }) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.name.match(/\.(pdf|pptx|ppt)$/i)) return window.alert("PDF 또는 PPTX 파일만 업로드 가능합니다.");
    if (file.size > 50 * 1024 * 1024) return window.alert("50MB 이하 파일만 업로드 가능합니다.");
    setUploading(true);
    try {
      const id = Date.now().toString();
      const ext = file.name.split(".").pop()?.toLowerCase() || "file";
      const url = await uploadFirebaseFile(`presentations/${id}`, file);
      await persist((current) => ({
        ...current,
        presentations: [...current.presentations, { id, name: file.name, url, uploadedAt: Date.now(), type: ext === "pdf" ? "pdf" : "pptx" }],
      }));
    } catch (error) {
      window.alert(`업로드 실패: ${(error as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SectionCard
      title="발표자료"
      description={`${data.presentations.length}건`}
      action={
        <label>
          <Button asChild size="sm">
            <span><Upload className="h-3.5 w-3.5" />{uploading ? "업로드 중..." : "파일 업로드"}</span>
          </Button>
          <input className="hidden" type="file" accept=".pdf,.pptx,.ppt" onChange={(event) => upload(event.target.files?.[0])} />
        </label>
      }
    >
        <FileList
          empty="업로드된 발표자료가 없습니다."
          files={[...data.presentations].reverse()}
          onDelete={async (file) => {
            try { await deleteFirebaseFile(file.url); } catch {}
            await persist((current) => ({ ...current, presentations: current.presentations.filter((item) => item.id !== file.id) }));
          }}
        />
    </SectionCard>
  );
}
