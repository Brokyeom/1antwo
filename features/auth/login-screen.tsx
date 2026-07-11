"use client";

import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMounted } from "@/features/dashboard/hooks/use-mounted";

// 카카오톡/네이버/라인 등의 인앱 웹뷰는 Google OAuth를 차단한다(disallowed_useragent).
const IN_APP_BROWSER_PATTERN = /KAKAOTALK|NAVER\(inapp|Line\/|Instagram|FBAN|FBAV/i;

export function LoginScreen({ signIn, signInError }: { signIn: () => Promise<void>; signInError: string }) {
  const mounted = useMounted();
  const isInAppBrowser = mounted && IN_APP_BROWSER_PATTERN.test(navigator.userAgent);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-6 px-6 py-12 text-center">
          <div>
            <h1 className="text-2xl font-extrabold">
              <span className="text-primary">잃않투</span> Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">스터디 멤버 전용 공간입니다. Google 계정으로 로그인해주세요.</p>
          </div>

          {isInAppBrowser ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">
              카카오톡/네이버 등 앱 내 브라우저에서는 Google 로그인이 차단됩니다.
              <br />
              Safari 또는 Chrome 등 외부 브라우저에서 열어주세요.
            </div>
          ) : (
            <Button onClick={signIn} className="w-full">
              <LogIn className="h-4 w-4" />
              Google 계정으로 로그인
            </Button>
          )}

          {signInError && <p className="text-sm leading-6 text-destructive">{signInError}</p>}

          <p className="text-xs leading-5 text-muted-foreground">
            로그인 후에도 데이터가 보이지 않으면 관리자에게 멤버 등록(이메일 허용목록)을 요청해주세요.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
