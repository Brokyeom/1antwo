"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus, Search, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { uploadFirebaseFile, deleteFirebaseFile } from "@/hooks/use-firebase-upload";
import { fmt, newWithin36Hours } from "@/lib/utils";
import type { DashboardData, PerformanceRecord, TextPost, UploadedFile } from "@/types/dashboard";
import type { Patch } from "@/features/dashboard/types";
import {
  chartGridColor,
  chartTextColor,
  chartTooltipStyle,
  marginChartColor,
  netProfitChartColor,
  operatingProfitChartColor,
  revenueChartColor,
} from "@/features/dashboard/lib/chart-theme";
import { getReturnTone } from "@/features/dashboard/lib/format";
import { removePerformance, upsertPerformance } from "@/features/dashboard/lib/performance";
import { useMounted } from "@/features/dashboard/hooks/use-mounted";
import { EmptyState, FormGrid, PageHeader, SectionCard } from "@/features/dashboard/components/layout";
import { DeleteConfirm } from "@/features/dashboard/components/delete-confirm";
import { FileList } from "@/features/dashboard/components/file-list";

export function AnalysisTab({ data, persist }: { data: DashboardData; persist: (patch: Patch) => Promise<void> }) {
  const names = Object.keys(data.financials);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = names.filter((name) => !query || name.toLowerCase().includes(query.toLowerCase()));

  const addCompany = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") || "").trim();
    if (!name) return window.alert("기업명을 입력해주세요.");
    if (data.financials[name]) return window.alert("이미 존재하는 기업입니다.");
    await persist((current) => ({
      ...current,
      financials: { ...current.financials, [name]: { per: 0, pbr: 0, roe: 0, debt: 0, rev: [], op: [], years: [], desc: "" } },
    }));
    setShowAdd(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="기업분석" description="기업별 분석자료, 리포트, 실적 데이터를 관리합니다." />
      <SectionCard title="기업 목록" description={`${filtered.length}개 기업`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="기업명 검색..." className="pl-9" />
            </div>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="h-3.5 w-3.5" />
              기업 추가
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((name) => {
              const hasNew =
                (data.companyNotes[name] || []).some((item) => newWithin36Hours(item.createdAt)) ||
                (data.companyDocs[name] || []).some((item) => newWithin36Hours(item.uploadedAt)) ||
                (data.reports[name] || []).some((item) => newWithin36Hours(item.uploadedAt));
              return (
                <Link
                  key={name}
                  href={`/analysis/${encodeURIComponent(name)}`}
                  className="rounded-lg border bg-background p-4 text-left transition-colors hover:border-input hover:bg-secondary"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate font-bold">{name}</div>
                    {hasNew && <Badge className="bg-destructive/10 text-destructive">NEW</Badge>}
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div>분석자료 {(data.companyDocs[name] || []).length}건</div>
                    <div>리포트 {(data.reports[name] || []).length}건</div>
                  </div>
                </Link>
              );
            })}
          </div>
      </SectionCard>
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기업 추가</DialogTitle>
            <DialogDescription>기업 상세 화면과 기본 실적 저장 공간을 생성합니다.</DialogDescription>
          </DialogHeader>
          <form onSubmit={addCompany} className="space-y-4">
            <Input name="name" placeholder="기업명 *" />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
              <Button>추가</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CompanyPanel({ name, data, persist }: { name: string; data: DashboardData; persist: (patch: Patch) => Promise<void> }) {
  const docs = data.companyDocs[name] || [];
  const notes = data.companyNotes[name] || [];
  const reports = data.reports[name] || [];
  const annual = data.annualData[name] || [];
  const quarterly = data.quarterlyData[name] || [];

  return (
    <div className="space-y-5">
      <Card className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{name}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{data.financials[name]?.desc}</p>
          </div>
          <DeleteConfirm
            title="기업 삭제"
            description={`"${name}" 기업과 연결된 화면 데이터를 삭제합니다.`}
            onConfirm={() =>
              persist((current) => {
                const financials = { ...current.financials };
                delete financials[name];
                return { ...current, financials };
              })
            }
          />
        </div>
      </Card>
      <CompanyDocs name={name} docs={docs} notes={notes} persist={persist} />
      <CompanyReports name={name} reports={reports} data={data} persist={persist} />
      <PerformancePanel title="최근 5개년 실적" labelKey="year" records={annual} onAdd={(record) => persist((current) => upsertPerformance(current, "annualData", name, record, 5, "year"))} onDelete={(id) => persist((current) => removePerformance(current, "annualData", name, id))} />
      <PerformancePanel title="최근 8개 분기 실적" labelKey="quarter" records={quarterly} onAdd={(record) => persist((current) => upsertPerformance(current, "quarterlyData", name, record, 8, "quarter"))} onDelete={(id) => persist((current) => removePerformance(current, "quarterlyData", name, id))} />
    </div>
  );
}

function CompanyDocs({ name, docs, notes, persist }: { name: string; docs: UploadedFile[]; notes: TextPost[]; persist: (patch: Patch) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.name.match(/\.(pdf|md|docx|doc)$/i)) return window.alert("PDF, MD, Word 파일만 업로드 가능합니다.");
    if (file.size > 30 * 1024 * 1024) return window.alert("30MB 이하 파일만 업로드 가능합니다.");
    const id = Date.now().toString();
    const url = await uploadFirebaseFile(`companyDocs/${name}/${id}`, file);
    await persist((current) => ({
      ...current,
      companyDocs: { ...current.companyDocs, [name]: [...(current.companyDocs[name] || []), { id, name: file.name, url, uploadedAt: Date.now(), type: file.name.split(".").pop()?.toLowerCase() }] },
    }));
  };

  const addNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const author = String(form.get("author") || "").trim();
    const title = String(form.get("title") || "").trim();
    const content = String(form.get("content") || "").trim();
    if (!author || !title || !content) return window.alert("작성자, 제목, 내용을 모두 입력해주세요.");
    await persist((current) => ({
      ...current,
      companyNotes: { ...current.companyNotes, [name]: [{ id: Date.now().toString(), author, title, content, createdAt: Date.now() }, ...(current.companyNotes[name] || [])] },
    }));
    event.currentTarget.reset();
    setOpen(false);
  };

  return (
    <>
    <SectionCard
      title="기업분석 자료"
      description={`글 ${notes.length} · 파일 ${docs.length}`}
      action={
        <>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" />글쓰기</Button>
          <label>
            <Button asChild size="sm"><span><Upload className="h-3.5 w-3.5" />파일 업로드</span></Button>
            <input className="hidden" type="file" accept=".pdf,.md,.docx,.doc" onChange={(event) => upload(event.target.files?.[0])} />
          </label>
        </>
      }
    >
        <FileList
          files={docs}
          empty="업로드된 파일이 없습니다."
          onDelete={async (file) => {
            try { await deleteFirebaseFile(file.url); } catch {}
            await persist((current) => ({ ...current, companyDocs: { ...current.companyDocs, [name]: (current.companyDocs[name] || []).filter((item) => item.id !== file.id) } }));
          }}
        />
        <div className="mt-4 divide-y border-t">
          {notes.length ? notes.map((note) => (
            <article key={note.id} className="py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold">{note.title}</h3>
                  <div className="mt-1 text-xs text-muted-foreground">작성자 {note.author} · {new Date(note.createdAt).toLocaleString("ko-KR")}</div>
                </div>
                <DeleteConfirm title="글 삭제" onConfirm={() => persist((current) => ({ ...current, companyNotes: { ...current.companyNotes, [name]: (current.companyNotes[name] || []).filter((item) => item.id !== note.id) } }))} />
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-lg border bg-background p-3 text-sm leading-7 text-foreground">{note.content}</p>
            </article>
          )) : <div className="py-6 text-center text-sm text-muted-foreground">작성된 글이 없습니다.</div>}
        </div>
    </SectionCard>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>기업 노트 작성</DialogTitle>
          <DialogDescription>{name} 분석 노트를 작성합니다.</DialogDescription>
        </DialogHeader>
        <form onSubmit={addNote} className="space-y-4">
          <FormGrid>
            <Input name="author" placeholder="작성자 *" />
            <Input name="title" placeholder="제목 *" />
          </FormGrid>
          <Textarea name="content" placeholder="내용을 입력하세요..." />
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

function CompanyReports({ name, reports, data, persist }: { name: string; reports: UploadedFile[]; data: DashboardData; persist: (patch: Patch) => Promise<void> }) {
  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.name.match(/\.pdf$/i)) return window.alert("PDF 파일만 업로드 가능합니다.");
    if (file.size > 20 * 1024 * 1024) return window.alert("20MB 이하 파일만 업로드 가능합니다.");
    const id = Date.now().toString();
    const url = await uploadFirebaseFile(`reports/${name}/${id}`, file);
    await persist((current) => ({
      ...current,
      reports: { ...current.reports, [name]: [...(current.reports[name] || []), { id, name: file.name, url, uploadedAt: Date.now(), type: "pdf" }] },
    }));
  };

  return (
    <SectionCard
      title="애널리스트 리포트"
      description={`${reports.length}건`}
      action={
        <label>
          <Button asChild size="sm"><span><Upload className="h-3.5 w-3.5" />리포트 업로드</span></Button>
          <input className="hidden" type="file" accept=".pdf" onChange={(event) => upload(event.target.files?.[0])} />
        </label>
      }
    >
        <FileList
          files={reports}
          empty="업로드된 리포트가 없습니다."
          onDelete={async (file) => {
            try { await deleteFirebaseFile(file.url); } catch {}
            await persist((current) => ({ ...current, reports: { ...current.reports, [name]: (current.reports[name] || []).filter((item) => item.id !== file.id) } }));
          }}
        />
        {reports.map((report) => (
          <ReportComments key={report.id} report={report} company={name} comments={data.reportComments[report.id] || []} persist={persist} />
        ))}
    </SectionCard>
  );
}

function ReportComments({ report, company, comments, persist }: { report: UploadedFile; company: string; comments: DashboardData["reportComments"][string]; persist: (patch: Patch) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const author = String(form.get("author") || "").trim();
    const content = String(form.get("content") || "").trim();
    if (!author || !content) return window.alert("작성자와 코멘트를 입력해주세요.");
    await persist((current) => ({ ...current, reportComments: { ...current.reportComments, [report.id]: [...(current.reportComments[report.id] || []), { id: Date.now().toString(), author, content, createdAt: Date.now() }] } }));
    event.currentTarget.reset();
  };
  return (
    <div className="border-t py-3">
      <Button variant="outline" size="sm" onClick={() => setOpen((value) => !value)}>코멘트 {comments.length}</Button>
      {open && (
        <div className="mt-3 rounded-lg bg-background p-3">
          <div className="space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="flex justify-between gap-3 border-b pb-2">
                <div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
                  <div className="mt-1 text-xs text-muted-foreground">작성자 {comment.author} · {new Date(comment.createdAt).toLocaleString("ko-KR")} · {company}</div>
                </div>
                <DeleteConfirm title="코멘트 삭제" onConfirm={() => persist((current) => ({ ...current, reportComments: { ...current.reportComments, [report.id]: (current.reportComments[report.id] || []).filter((item) => item.id !== comment.id) } }))} />
              </div>
            ))}
          </div>
          <form onSubmit={submit} className="mt-3 space-y-2">
            <Input name="author" placeholder="작성자 *" className="w-36" />
            <Textarea name="content" placeholder="코멘트를 입력하세요..." className="min-h-20" />
            <Button size="sm">등록</Button>
          </form>
        </div>
      )}
    </div>
  );
}

function PerformancePanel({
  title,
  labelKey,
  records,
  onAdd,
  onDelete,
}: {
  title: string;
  labelKey: "year" | "quarter";
  records: PerformanceRecord[];
  onAdd: (record: PerformanceRecord) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const chartData = records.map((record) => ({
    label: record[labelKey],
    revenue: record.revenue || 0,
    opProfit: record.opProfit || 0,
    netProfit: record.netProfit || 0,
    margin: record.revenue > 0 ? Number(((record.opProfit / record.revenue) * 100).toFixed(1)) : 0,
  }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const label = String(form.get("label") || "").trim();
    const revenue = Number(form.get("revenue"));
    const opProfit = Number(form.get("opProfit"));
    const netProfit = Number(form.get("netProfit"));
    if (!label || Number.isNaN(revenue) || Number.isNaN(opProfit) || Number.isNaN(netProfit)) return window.alert("모든 수치를 입력해주세요.");
    await onAdd({ id: Date.now().toString(), [labelKey]: label, revenue, opProfit, netProfit });
    event.currentTarget.reset();
    setOpen(false);
  };

  return (
    <>
    <SectionCard
      title={title}
      description="단위: 억원"
      action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" />실적 추가</Button>}
    >
        {records.length ? (
          <>
            <div className="mb-4 h-64">
              {mounted && (
                <ResponsiveContainer width="100%" height={256} minWidth={0}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid stroke={chartGridColor} vertical={false} />
                    <XAxis dataKey="label" stroke={chartTextColor} fontSize={11} />
                    <YAxis yAxisId="left" stroke={chartTextColor} fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" stroke={marginChartColor} fontSize={11} tickFormatter={(value) => `${value}%`} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" name="매출액" fill={revenueChartColor} fillOpacity={0.68} animationEasing="linear" animationDuration={450} />
                    <Bar yAxisId="left" dataKey="opProfit" name="영업이익" fill={operatingProfitChartColor} fillOpacity={0.68} animationEasing="linear" animationDuration={450} />
                    <Bar yAxisId="left" dataKey="netProfit" name="순이익" fill={netProfitChartColor} fillOpacity={0.68} animationEasing="linear" animationDuration={450} />
                    <Line yAxisId="right" dataKey="margin" name="영업이익률(%)" stroke={marginChartColor} strokeWidth={2} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{labelKey === "year" ? "연도" : "분기"}</TableHead>
                    <TableHead>매출액</TableHead>
                    <TableHead>영업이익</TableHead>
                    <TableHead>순이익</TableHead>
                    <TableHead>영업이익률</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => {
                    const operatingTone = getReturnTone(record.opProfit);
                    const netTone = getReturnTone(record.netProfit);
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-semibold">{record[labelKey]}</TableCell>
                        <TableCell>{fmt(record.revenue)}</TableCell>
                        <TableCell className={operatingTone.text}>{fmt(record.opProfit)}</TableCell>
                        <TableCell className={netTone.text}>{fmt(record.netProfit)}</TableCell>
                        <TableCell className={operatingTone.strongText}>{record.revenue > 0 ? ((record.opProfit / record.revenue) * 100).toFixed(1) : "-"}%</TableCell>
                        <TableCell><DeleteConfirm title="실적 데이터 삭제" onConfirm={() => onDelete(record.id)} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-3 md:hidden">
              {records.map((record) => (
                <PerformanceMobileCard key={record.id} record={record} labelKey={labelKey} onDelete={() => onDelete(record.id)} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState>입력된 실적 데이터가 없습니다.</EmptyState>
        )}
    </SectionCard>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title} 입력</DialogTitle>
          <DialogDescription>매출액, 영업이익, 순이익을 억원 단위로 입력합니다.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FormGrid>
            <Input name="label" placeholder={labelKey === "year" ? "연도 (예: 2024)" : "분기 (예: 24Q1)"} />
            <Input name="revenue" type="number" placeholder="매출액" />
            <Input name="opProfit" type="number" placeholder="영업이익" />
            <Input name="netProfit" type="number" placeholder="순이익" />
          </FormGrid>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
            <Button>추가</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}

function PerformanceMobileCard({
  record,
  labelKey,
  onDelete,
}: {
  record: PerformanceRecord;
  labelKey: "year" | "quarter";
  onDelete: () => void | Promise<void>;
}) {
  const operatingTone = getReturnTone(record.opProfit);
  const netTone = getReturnTone(record.netProfit);
  const margin = record.revenue > 0 ? ((record.opProfit / record.revenue) * 100).toFixed(1) : "-";

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{record[labelKey]}</h3>
        <DeleteConfirm title="실적 데이터 삭제" onConfirm={onDelete} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">매출액</div>
          <div className="mt-1 font-number font-semibold tabular-nums">{fmt(record.revenue)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">영업이익률</div>
          <div className={`mt-1 ${operatingTone.strongText}`}>{margin}%</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">영업이익</div>
          <div className={`mt-1 ${operatingTone.text}`}>{fmt(record.opProfit)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">순이익</div>
          <div className={`mt-1 ${netTone.text}`}>{fmt(record.netProfit)}</div>
        </div>
      </div>
    </div>
  );
}
