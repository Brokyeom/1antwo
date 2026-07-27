"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useAccessContext } from "@/features/auth/access-context";
import { useDashboard } from "@/features/dashboard/context";
import { PortfolioTab } from "@/features/dashboard/tabs/portfolio-tab";
import { PresentationsTab } from "@/features/dashboard/tabs/presentations-tab";
import { NoticeTab } from "@/features/dashboard/tabs/notice-tab";
import { BoardTab } from "@/features/dashboard/tabs/board-tab";
import { AnalysisTab, CompanyPanel } from "@/features/dashboard/tabs/analysis-tab";

export function PortfolioPage() {
  const { data, persist } = useDashboard();
  const { canEdit } = useAccessContext();
  return <PortfolioTab data={data} persist={persist} canEdit={canEdit} />;
}

export function PresentationsPage() {
  const { data, persist } = useDashboard();
  const { canEdit } = useAccessContext();
  return <PresentationsTab data={data} persist={persist} canEdit={canEdit} />;
}

export function NoticePage() {
  const { data, persist } = useDashboard();
  const { canEdit } = useAccessContext();
  return <NoticeTab data={data} persist={persist} canEdit={canEdit} />;
}

export function BoardPage() {
  const { data, persist } = useDashboard();
  const { canEdit } = useAccessContext();
  return <BoardTab data={data} persist={persist} canEdit={canEdit} />;
}

export function AnalysisPage() {
  const { data, persist } = useDashboard();
  const { canEdit } = useAccessContext();
  return <AnalysisTab data={data} persist={persist} canEdit={canEdit} />;
}

export function AnalysisCompanyPage({ company }: { company: string }) {
  const { data, persist } = useDashboard();
  const { canEdit } = useAccessContext();
  const name = decodeURIComponent(company);

  if (!data.financials[name]) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <CardTitle>기업을 찾을 수 없습니다</CardTitle>
          <p className="text-sm text-muted-foreground">기업 목록에서 다시 선택해주세요.</p>
          <Button asChild>
            <Link href="/analysis">기업 목록으로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <CompanyPanel name={name} data={data} persist={persist} canEdit={canEdit} />;
}
