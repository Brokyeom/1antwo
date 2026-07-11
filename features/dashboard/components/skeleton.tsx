"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <SkeletonBlock className="h-8 w-40" />
          <SkeletonBlock className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-9 w-28" />
          <SkeletonBlock className="h-9 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="p-4">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="mt-3 h-7 w-28" />
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="mt-2 h-4 w-20" />
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 md:p-6 md:pt-0">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonBlock key={index} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card className="p-4 md:p-6">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="mt-6 h-64 w-full" />
        </Card>
        <Card className="p-4 md:p-6">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="mx-auto mt-8 h-48 w-48 rounded-full" />
        </Card>
      </div>
    </div>
  );
}

export function DataErrorPanel({ error }: { error: string }) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        <div className="rounded-full border border-destructive/30 bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">데이터를 불러오지 못했습니다</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{error}</p>
        </div>
        <div className="rounded-lg border bg-background px-4 py-3 text-left text-xs leading-6 text-muted-foreground">
          <div>`.env.local`의 `NEXT_PUBLIC_FIREBASE_DATABASE_URL` 값을 확인한 뒤 개발 서버를 재시작하세요.</div>
          <div>Realtime Database 읽기 권한과 네트워크 연결도 함께 확인해야 합니다.</div>
        </div>
      </CardContent>
    </Card>
  );
}
