"use client";

import { LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AccessDeniedScreen({ email, onSignOut }: { email: string | null; onSignOut: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center">
          <div className="rounded-full border border-destructive/30 bg-destructive/10 p-3 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">초대되지 않은 계정입니다</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              이 대시보드는 초대된 멤버만 접근할 수 있습니다.
              <br />
              관리자에게 아래 계정의 초대를 요청해주세요.
            </p>
          </div>
          {email && (
            <div className="w-full rounded-lg border bg-background px-4 py-3 text-sm font-medium">{email}</div>
          )}
          <Button variant="outline" onClick={onSignOut} className="w-full">
            <LogOut className="h-4 w-4" />
            다른 계정으로 로그인
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
