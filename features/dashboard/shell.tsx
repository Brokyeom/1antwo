"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Building2, FolderOpen, LogOut, MessageSquare, Save, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { newWithin36Hours } from "@/lib/utils";
import { sanitizeBackup } from "@/lib/dashboard/validate";
import { isFirebaseDatabaseConfigured } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/use-auth";
import { AuthContext, useAuthContext } from "@/features/auth/context";
import { LoginScreen } from "@/features/auth/login-screen";
import type { TabKey } from "@/features/dashboard/types";
import { useDashboardData } from "@/features/dashboard/use-dashboard-data";
import { DashboardContext } from "@/features/dashboard/context";
import { DashboardSkeleton, DataErrorPanel } from "@/features/dashboard/components/skeleton";

function BarIcon() {
  return <span className="text-sm">▦</span>;
}

const tabItems: Array<{ key: TabKey; href: string; label: string; icon: React.ReactNode }> = [
  { key: "portfolio", href: "/", label: "포트폴리오", icon: <BarIcon /> },
  { key: "analysis", href: "/analysis", label: "기업분석", icon: <Building2 className="h-4 w-4" /> },
  { key: "presentations", href: "/presentations", label: "발표자료", icon: <FolderOpen className="h-4 w-4" /> },
  { key: "notice", href: "/notice", label: "공지사항", icon: <Bell className="h-4 w-4" /> },
  { key: "board", href: "/board", label: "자유게시판", icon: <MessageSquare className="h-4 w-4" /> },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthGate>{children}</AuthGate>
    </ToastProvider>
  );
}

// 잠긴 DB 규칙에서 인증 전 onValue 구독은 permission_denied로 리스너가 영구
// 취소되므로, 데이터 구독(ShellInner)은 반드시 로그인 이후에만 마운트한다.
function AuthGate({ children }: { children: React.ReactNode }) {
  const authState = useAuth();

  if (isFirebaseDatabaseConfigured) {
    if (authState.loading) {
      return (
        <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-8">
          <DashboardSkeleton />
        </main>
      );
    }
    if (!authState.user) {
      return <LoginScreen signIn={authState.signIn} signInError={authState.signInError} />;
    }
  }

  return (
    <AuthContext.Provider value={authState}>
      <ShellInner>{children}</ShellInner>
    </AuthContext.Provider>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const dashboard = useDashboardData();
  const { data, loading, connected, loadError, saveError, saveStatus, replaceFromBackup } = dashboard;
  const { user, signOut } = useAuthContext();
  const pathname = usePathname();
  const toast = useToast();
  const [clock, setClock] = useState<Date | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (saveError) toast(saveError, { variant: "destructive" });
  }, [saveError, toast]);

  useEffect(() => {
    const initial = window.setTimeout(() => setClock(new Date()), 0);
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);

  const newBadges = useMemo(() => {
    const analysis =
      Object.values(data.companyNotes).flat().some((item) => newWithin36Hours(item.createdAt)) ||
      Object.values(data.companyDocs).flat().some((item) => newWithin36Hours(item.uploadedAt)) ||
      Object.values(data.reports).flat().some((item) => newWithin36Hours(item.uploadedAt));
    return {
      analysis,
      presentations: data.presentations.some((item) => newWithin36Hours(item.uploadedAt)),
      notice: data.announcements.some((item) => newWithin36Hours(item.createdAt)),
      board: data.boardPosts.some((item) => newWithin36Hours(item.createdAt)),
    };
  }, [data]);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `잃않투-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file?: File) => {
    if (!file) return;
    try {
      const sanitized = sanitizeBackup(JSON.parse(await file.text()));
      if (!sanitized) {
        toast("백업 파일에서 복원 가능한 데이터를 찾지 못했습니다.", { variant: "destructive" });
        return;
      }
      await replaceFromBackup(sanitized);
      toast("복원 완료! 모든 사용자에게 동기화됩니다.");
    } catch {
      toast("잘못된 파일 형식입니다.", { variant: "destructive" });
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  const content = loading ? <DashboardSkeleton /> : loadError ? <DataErrorPanel error={loadError} /> : children;

  return (
    <DashboardContext.Provider value={dashboard}>
      <main className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="border-b bg-card">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-3 py-3 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="text-xl font-extrabold">
              <span className="text-primary">잃않투</span> Dashboard
            </Link>
            <Badge className={connected ? "hidden bg-accent text-primary sm:inline-flex" : "hidden bg-destructive/10 text-destructive sm:inline-flex"}>
              {connected ? "● 실시간 동기화 중" : "● 오프라인"}
            </Badge>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="outline" size="sm" onClick={exportData} disabled={loading || Boolean(loadError)}>
              <Save className="h-3.5 w-3.5" />
              백업
            </Button>
            <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} disabled={loading || Boolean(loadError)}>
              <Upload className="h-3.5 w-3.5" />
              복원
            </Button>
            <input ref={importRef} className="hidden" type="file" accept=".json" onChange={(event) => importData(event.target.files?.[0])} />
            <span className="min-w-16 text-xs text-primary">{saveStatus}</span>
            {user && (
              <>
                <span className="max-w-40 truncate text-xs text-muted-foreground" title={user.email || undefined}>
                  {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-3.5 w-3.5" />
                  로그아웃
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden text-muted-foreground sm:inline">
              {clock ? `${clock.getFullYear()}.${String(clock.getMonth() + 1).padStart(2, "0")}.${String(clock.getDate()).padStart(2, "0")}` : "0000.00.00"}
            </span>
            <span className="font-mono font-semibold">
              {clock
                ? `${String(clock.getHours()).padStart(2, "0")}:${String(clock.getMinutes()).padStart(2, "0")}:${String(clock.getSeconds()).padStart(2, "0")}`
                : "00:00:00"}
            </span>
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary " />
          </div>
          </div>
        </header>

        <nav className="hidden border-b bg-card md:block">
          <div className="mx-auto flex max-w-[1440px] overflow-x-auto px-8">
            {tabItems.map((item) => {
            const hasNew = item.key !== "portfolio" && newBadges[item.key];
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`relative flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors ${
                  active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
                {hasNew && <span className="h-2 w-2 animate-pulse rounded-full bg-destructive " />}
              </Link>
            );
            })}
          </div>
        </nav>

        <div className="mx-auto w-full max-w-[1440px] px-3 pb-24 pt-4 md:px-8 md:py-6">{content}</div>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:hidden">
          <div className="grid grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]">
            {tabItems.map((item) => {
              const hasNew = item.key !== "portfolio" && newBadges[item.key];
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.icon}
                  <span className="max-w-full truncate">{item.label}</span>
                  {hasNew && <span className="absolute right-4 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />}
                </Link>
              );
            })}
          </div>
        </nav>

        <footer className="mt-auto hidden border-t px-4 py-4 text-center text-xs text-muted-foreground md:block">
          잃않투 Dashboard · Firebase 실시간 동기화 · 모든 변경사항이 공유됩니다
        </footer>
      </main>
    </DashboardContext.Provider>
  );
}
