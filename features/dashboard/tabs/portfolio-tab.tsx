"use client";

import { Fragment, FormEvent, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Edit3, Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { fmt, newNumericId, pctCalc } from "@/lib/utils";
import type { DashboardData, Stock, TradeJournalEntry } from "@/types/dashboard";
import type { NaverPriceResponse, Patch } from "@/features/dashboard/types";
import {
  chartColors,
  chartGridColor,
  chartTextColor,
  chartTooltipStyle,
  getCategoryColor,
  positiveChartColor,
} from "@/features/dashboard/lib/chart-theme";
import { formatSignedNumber, formatSignedPercent, getReturnTone } from "@/features/dashboard/lib/format";
import {
  computePortfolioStats,
  computeReturnsChart,
  computeSectorAllocation,
  mergeNaverQuotes,
} from "@/features/dashboard/lib/portfolio";
import { useMounted } from "@/features/dashboard/hooks/use-mounted";
import { EmptyState, FormGrid, PageHeader, SectionCard } from "@/features/dashboard/components/layout";
import { DeleteConfirm } from "@/features/dashboard/components/delete-confirm";
import { StatCard } from "@/features/dashboard/components/stat-card";

export function PortfolioTab({ data, persist }: { data: DashboardData; persist: (patch: Patch) => Promise<void> }) {
  const mounted = useMounted();
  const [activePortfolioSection, setActivePortfolioSection] = useState<"charts" | "journal">("charts");
  const [showAdd, setShowAdd] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [editingJournalEntry, setEditingJournalEntry] = useState<TradeJournalEntry | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(() => computePortfolioStats(data.portfolio), [data.portfolio]);

  const sectors = useMemo(() => computeSectorAllocation(data.portfolio), [data.portfolio]);

  const returnsChart = computeReturnsChart(data.returnsData);
  const returns = returnsChart.points;
  const returnsZeroOffset = returnsChart.zeroOffset;

  const addStock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const buyPrice = Number(form.get("buyPrice"));
    const currentPrice = Number(form.get("currentPrice"));
    const qty = Number(form.get("qty"));
    if (!name || !buyPrice || !currentPrice || !qty) return window.alert("필수 항목(*)을 입력해주세요.");
    await persist((current) => ({
      ...current,
      portfolio: [
        ...current.portfolio,
        {
          id: newNumericId(),
          name,
          code: String(form.get("code") || "").trim(),
          buyPrice,
          currentPrice,
          qty,
          sector: String(form.get("sector") || "").trim() || "기타",
        },
      ],
    }));
    event.currentTarget.reset();
    setShowAdd(false);
  };

  const updateStock = async (stock: Stock, form: HTMLFormElement) => {
    const values = new FormData(form);
    const buyPrice = Number(values.get("buyPrice"));
    const currentPrice = Number(values.get("currentPrice"));
    const qty = Number(values.get("qty"));
    if (!buyPrice || !currentPrice || !qty) return window.alert("값을 모두 입력해주세요.");
    await persist((current) => ({
      ...current,
      portfolio: current.portfolio.map((item) =>
        item.id === stock.id
          ? { ...item, code: String(values.get("code") || "").trim(), buyPrice, currentPrice, qty }
          : item,
      ),
    }));
    setEditingId(null);
  };

  const refreshNaverPrices = async () => {
    const targets = data.portfolio.filter((stock) => stock.code?.trim());
    if (!targets.length) return window.alert("종목코드(6자리)가 입력된 종목이 없습니다.");
    setRefreshing(true);
    try {
      const response = await fetch(`/api/naver-price?codes=${targets.map((stock) => stock.code?.trim()).join(",")}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = (await response.json()) as NaverPriceResponse;
      let updated = 0;
      await persist((current) => {
        const merged = mergeNaverQuotes(current.portfolio, json);
        updated = merged.updated;
        return { ...current, portfolio: merged.portfolio };
      });
      if (updated === 0) throw new Error("갱신된 종목 없음");
    } catch (error) {
      console.error(error);
      window.alert("현재가 갱신에 실패했습니다. 종목코드를 확인해주세요.");
    } finally {
      setRefreshing(false);
    }
  };

  const addReturn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const label = `${form.get("year")}.${form.get("month")}`;
    const value = Number(form.get("value"));
    if (Number.isNaN(value)) return window.alert("수익률을 입력해주세요.");
    if (data.returnsData.labels.includes(label)) return window.alert("이미 해당 월 데이터가 있습니다.");
    await persist((current) => ({
      ...current,
      returnsData: {
        labels: [...current.returnsData.labels, label],
        data: [...current.returnsData.data, value],
      },
    }));
    event.currentTarget.reset();
    setShowReturn(false);
  };

  const openJournalForm = (entry?: TradeJournalEntry) => {
    setEditingJournalEntry(entry || null);
    setShowJournalForm(true);
  };

  const saveJournalEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tradeDate = String(form.get("tradeDate") || "").trim();
    const stockName = String(form.get("stockName") || "").trim();
    const buyPrice = Number(form.get("buyPrice"));
    const quantity = Number(form.get("quantity"));
    const finalSellPrice = Number(form.get("finalSellPrice"));
    const buyReason = String(form.get("buyReason") || "").trim();
    const sellReason = String(form.get("sellReason") || "").trim();

    if (!tradeDate || !stockName || !buyPrice || !quantity || !finalSellPrice || !buyReason || !sellReason) {
      return window.alert("필수 항목을 모두 입력해주세요.");
    }

    const now = Date.now();
    await persist((current) => {
      if (editingJournalEntry) {
        return {
          ...current,
          tradeJournal: current.tradeJournal.map((entry) =>
            entry.id === editingJournalEntry.id
              ? {
                  ...entry,
                  tradeDate,
                  stockName,
                  buyPrice,
                  quantity,
                  finalSellPrice,
                  buyReason,
                  sellReason,
                  updatedAt: now,
                }
              : entry,
          ),
        };
      }

      return {
        ...current,
        tradeJournal: [
          {
            id: newNumericId(),
            tradeDate,
            stockName,
            buyPrice,
            quantity,
            finalSellPrice,
            buyReason,
            sellReason,
            createdAt: now,
          },
          ...current.tradeJournal,
        ],
      };
    });
    event.currentTarget.reset();
    setEditingJournalEntry(null);
    setShowJournalForm(false);
  };

  const sortedJournalEntries = [...data.tradeJournal].sort((a, b) => b.tradeDate.localeCompare(a.tradeDate) || b.createdAt - a.createdAt);

  return (
    <div className="space-y-5">
      <PageHeader
        title="포트폴리오"
        description="보유 종목, 월별 수익률, 섹터 배분을 한 화면에서 관리합니다."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={refreshNaverPrices} disabled={refreshing} className="text-muted-foreground">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              현재가 갱신
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="h-3.5 w-3.5" />
              종목 추가
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="총 평가액" value={`₩${fmt(stats.cur)}`} />
        <StatCard label="총 수익률" value={`${Number(stats.pct) > 0 ? "+" : ""}${stats.pct}%`} tone={Number(stats.pct) >= 0 ? "positive" : "negative"} />
        <StatCard label="총 수익금" value={`${stats.ret >= 0 ? "+" : ""}₩${fmt(stats.ret)}`} tone={stats.ret >= 0 ? "positive" : "negative"} />
        <StatCard label="총 투자금" value={`₩${fmt(stats.inv)}`} />
      </div>

      <SectionCard title="보유 종목 현황" description={`${data.portfolio.length}개 종목`}>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>종목명</TableHead>
                  <TableHead className="hidden sm:table-cell">코드</TableHead>
                  <TableHead className="hidden sm:table-cell">매입가</TableHead>
                  <TableHead>현재가</TableHead>
                  <TableHead className="hidden sm:table-cell">수량</TableHead>
                  <TableHead>평가액</TableHead>
                  <TableHead>수익률</TableHead>
                  <TableHead className="hidden md:table-cell">수익금</TableHead>
                  <TableHead className="hidden md:table-cell">비중</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.portfolio.map((stock, index) => {
                  const rate = Number(pctCalc(stock.buyPrice, stock.currentPrice));
                  const profit = (stock.currentPrice - stock.buyPrice) * stock.qty;
                  const evalAmt = stock.currentPrice * stock.qty;
                  const weight = stats.cur > 0 ? ((evalAmt / stats.cur) * 100).toFixed(1) : "0.0";
                  const tone = getReturnTone(profit);
                  const priceTone = getReturnTone(stock.priceChange ?? 0);
                  const categoryColor = getCategoryColor(index);
                  return (
                    <Fragment key={stock.id}>
                      <TableRow key={stock.id} className={`${tone.row} ${categoryColor.row}`}>
                        <TableCell className="font-semibold">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${categoryColor.dot}`} />
                            <span>{stock.name}</span>
                            <Badge className={`border ${categoryColor.badge}`}>{stock.sector}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">{stock.code}</TableCell>
                        <TableCell className="hidden sm:table-cell">₩{fmt(stock.buyPrice)}</TableCell>
                        <TableCell>
                          <div className={tone.strongText}>₩{fmt(stock.currentPrice)}</div>
                          {stock.priceChange != null && stock.priceChangeRate != null && (
                            <div className={`mt-1 text-xs ${priceTone.text}`}>
                              전일대비 {formatSignedNumber(stock.priceChange)} ({formatSignedPercent(stock.priceChangeRate)})
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{fmt(stock.qty)}주</TableCell>
                        <TableCell className="font-medium">₩{fmt(evalAmt)}</TableCell>
                        <TableCell className={tone.strongText}>{rate > 0 ? "+" : ""}{rate.toFixed(1)}%</TableCell>
                        <TableCell className={`hidden md:table-cell ${tone.text}`}>{profit > 0 ? "+" : ""}₩{fmt(profit)}</TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">{weight}%</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingId(editingId === stock.id ? null : stock.id)}>수정</Button>
                            <DeleteConfirm
                              title="종목 삭제"
                              onConfirm={() => persist((current) => ({ ...current, portfolio: current.portfolio.filter((item) => item.id !== stock.id) }))}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                      {editingId === stock.id && (
                        <TableRow key={`${stock.id}-edit`} className="bg-card">
                          <TableCell colSpan={10}>
                            <form
                              className="flex flex-wrap items-center gap-2"
                              onSubmit={(event) => {
                                event.preventDefault();
                                updateStock(stock, event.currentTarget);
                              }}
                            >
                              <span className="min-w-16 text-xs text-muted-foreground">{stock.name}</span>
                              <Input name="code" defaultValue={stock.code} placeholder="종목코드" className="w-32" />
                              <Input name="buyPrice" type="number" defaultValue={stock.buyPrice} className="w-28" />
                              <Input name="currentPrice" type="number" defaultValue={stock.currentPrice} className="w-28" />
                              <Input name="qty" type="number" defaultValue={stock.qty} className="w-24" />
                              <Button size="sm">저장</Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>취소</Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-3 md:hidden">
            {data.portfolio.length ? data.portfolio.map((stock, index) => {
              const evalAmt = stock.currentPrice * stock.qty;
              const profit = (stock.currentPrice - stock.buyPrice) * stock.qty;
              const weight = stats.cur > 0 ? ((evalAmt / stats.cur) * 100).toFixed(1) : "0.0";
              return (
                <StockMobileCard
                  key={stock.id}
                  stock={stock}
                  categoryColor={getCategoryColor(index)}
                  evalAmt={evalAmt}
                  profit={profit}
                  weight={weight}
                  editing={editingId === stock.id}
                  onEdit={() => setEditingId(editingId === stock.id ? null : stock.id)}
                  onCancel={() => setEditingId(null)}
                  onUpdate={(form) => updateStock(stock, form)}
                  onDelete={() => persist((current) => ({ ...current, portfolio: current.portfolio.filter((item) => item.id !== stock.id) }))}
                />
              );
            }) : <EmptyState>등록된 종목이 없습니다.</EmptyState>}
          </div>
      </SectionCard>

      <div className="flex w-full rounded-lg border bg-card p-1 sm:w-fit">
        <Button
          type="button"
          variant={activePortfolioSection === "charts" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActivePortfolioSection("charts")}
          className="flex-1 sm:flex-none"
        >
          차트
        </Button>
        <Button
          type="button"
          variant={activePortfolioSection === "journal" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActivePortfolioSection("journal")}
          className="flex-1 sm:flex-none"
        >
          매매일지
        </Button>
      </div>

      {activePortfolioSection === "charts" ? (
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <SectionCard
          title="포트폴리오 월별 수익률 추이"
          description="26.03~"
          action={
            <Button variant="outline" size="sm" onClick={() => setShowReturn(true)}>
              <Plus className="h-3.5 w-3.5" />
              월별 수익률
            </Button>
          }
        >
            <div className="h-64">
              {mounted && (
                <ResponsiveContainer width="100%" height={256} minWidth={0}>
                  <AreaChart data={returns.length ? returns : [{ label: "", value: 0 }]}>
                    <defs>
                      <linearGradient id="returnsSignedFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={positiveChartColor} stopOpacity={0.2} />
                        <stop offset={`${returnsZeroOffset}%`} stopColor={positiveChartColor} stopOpacity={0.08} />
                        <stop offset={`${returnsZeroOffset}%`} stopColor="hsl(var(--trading-down))" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="hsl(var(--trading-down))" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={chartGridColor} vertical={false} />
                    <XAxis dataKey="label" stroke={chartTextColor} fontSize={11} />
                    <YAxis stroke={chartTextColor} fontSize={11} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload as { label: string; value: number };
                        return (
                          <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground">
                            <div className="text-xs text-muted-foreground">{item.label}</div>
                            <div className={item.value >= 0 ? "text-trading-up" : "text-trading-down"}>
                              {item.value > 0 ? "+" : ""}{item.value}%
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      dataKey="value"
                      stroke={positiveChartColor}
                      fill="url(#returnsSignedFill)"
                      fillOpacity={1}
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {returns.map((item) => {
                const tone = getReturnTone(item.value);
                return (
                  <Badge key={item.label} className={`border ${tone.badge}`}>
                    {item.label}: {item.value > 0 ? "+" : ""}{item.value}%
                  </Badge>
                );
              })}
            </div>
        </SectionCard>

        <SectionCard title="섹터별 자산 배분">
            <div className="h-72">
              {mounted && (
                <ResponsiveContainer width="100%" height={288} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={sectors}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={0}
                      stroke="none"
                      strokeWidth={0}
                      isAnimationActive={false}
                    >
                      {sectors.map((entry, index) => (
                        <Cell key={entry.name} fill={chartColors[index % chartColors.length]} stroke="none" strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`₩${fmt(Number(value))}`, "평가액"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
        </SectionCard>
      </div>
      ) : (
        <SectionCard
          title="매매일지"
          description={`${data.tradeJournal.length}개 기록`}
          action={
            <Button size="sm" onClick={() => openJournalForm()}>
              <Plus className="h-3.5 w-3.5" />
              매매일지 추가
            </Button>
          }
        >
          <div className="hidden overflow-x-auto md:block">
            {sortedJournalEntries.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>매매일</TableHead>
                    <TableHead>종목명</TableHead>
                    <TableHead>매입가</TableHead>
                    <TableHead>수량</TableHead>
                    <TableHead>최종매도가</TableHead>
                    <TableHead>최종수익률</TableHead>
                    <TableHead className="min-w-48">매수 근거</TableHead>
                    <TableHead className="min-w-48">매도 근거</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedJournalEntries.map((entry) => {
                    const finalReturnRate = entry.buyPrice > 0 ? ((entry.finalSellPrice - entry.buyPrice) / entry.buyPrice) * 100 : 0;
                    const tone = getReturnTone(finalReturnRate);
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{entry.tradeDate}</TableCell>
                        <TableCell className="font-semibold">{entry.stockName}</TableCell>
                        <TableCell className="font-number tabular-nums">₩{fmt(entry.buyPrice)}</TableCell>
                        <TableCell className="font-number tabular-nums">{fmt(entry.quantity)}주</TableCell>
                        <TableCell className="font-number tabular-nums">₩{fmt(entry.finalSellPrice)}</TableCell>
                        <TableCell className={tone.strongText}>{formatSignedPercent(finalReturnRate)}</TableCell>
                        <TableCell className="max-w-64 whitespace-normal break-words text-sm text-muted-foreground">{entry.buyReason}</TableCell>
                        <TableCell className="max-w-64 whitespace-normal break-words text-sm text-muted-foreground">{entry.sellReason}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openJournalForm(entry)}>
                              <Edit3 className="h-3.5 w-3.5" />
                              수정
                            </Button>
                            <DeleteConfirm
                              title="매매일지 삭제"
                              onConfirm={() => persist((current) => ({ ...current, tradeJournal: current.tradeJournal.filter((item) => item.id !== entry.id) }))}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState>등록된 매매일지가 없습니다.</EmptyState>
            )}
          </div>
          <div className="space-y-3 md:hidden">
            {sortedJournalEntries.length ? sortedJournalEntries.map((entry) => (
              <TradeJournalMobileCard
                key={entry.id}
                entry={entry}
                onEdit={() => openJournalForm(entry)}
                onDelete={() => persist((current) => ({ ...current, tradeJournal: current.tradeJournal.filter((item) => item.id !== entry.id) }))}
              />
            )) : <EmptyState>등록된 매매일지가 없습니다.</EmptyState>}
          </div>
        </SectionCard>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>종목 추가</DialogTitle>
            <DialogDescription>종목명, 매입가, 현재가, 수량은 필수입니다.</DialogDescription>
          </DialogHeader>
          <form onSubmit={addStock} className="space-y-4">
            <FormGrid>
              <Input name="name" placeholder="종목명 *" />
              <Input name="code" placeholder="종목코드" />
              <Input name="buyPrice" type="number" placeholder="매입가 *" />
              <Input name="currentPrice" type="number" placeholder="현재가 *" />
              <Input name="qty" type="number" placeholder="수량 *" />
              <Input name="sector" placeholder="섹터" />
            </FormGrid>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
              <Button>추가</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showReturn} onOpenChange={setShowReturn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>월별 수익률 추가</DialogTitle>
            <DialogDescription>이미 등록된 월은 중복 저장되지 않습니다.</DialogDescription>
          </DialogHeader>
          <form onSubmit={addReturn} className="space-y-4">
            <FormGrid>
              <select name="year" className="h-10 rounded-md border border-input bg-background px-4 text-sm">
                <option value="26">2026</option>
                <option value="27">2027</option>
                <option value="28">2028</option>
              </select>
              <select name="month" className="h-10 rounded-md border border-input bg-background px-4 text-sm">
                {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                  <option key={month} value={String(month).padStart(2, "0")}>{month}월</option>
                ))}
              </select>
              <Input name="value" type="number" step="0.1" placeholder="수익률 (%)" className="sm:col-span-2" />
            </FormGrid>
            <DialogFooter>
              <div className="sm:mr-auto">
                <DeleteConfirm
                  title="월별 수익률 삭제"
                  description="가장 마지막 월별 수익률 데이터를 삭제합니다."
                  triggerLabel="마지막 삭제"
                  onConfirm={() =>
                  persist((current) => ({
                    ...current,
                    returnsData: {
                      labels: current.returnsData.labels.slice(0, -1),
                      data: current.returnsData.data.slice(0, -1),
                    },
                  }))
                  }
                />
              </div>
              <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
              <Button>추가</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showJournalForm}
        onOpenChange={(open) => {
          setShowJournalForm(open);
          if (!open) setEditingJournalEntry(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingJournalEntry ? "매매일지 수정" : "매매일지 추가"}</DialogTitle>
            <DialogDescription>매매일, 종목명, 가격, 수량, 매수/매도 근거를 입력합니다.</DialogDescription>
          </DialogHeader>
          <form key={editingJournalEntry?.id || "new"} onSubmit={saveJournalEntry} className="space-y-4">
            <FormGrid>
              <Input name="tradeDate" type="date" defaultValue={editingJournalEntry?.tradeDate} required />
              <Input name="stockName" placeholder="종목명 *" defaultValue={editingJournalEntry?.stockName} required />
              <Input name="buyPrice" type="number" min="0" step="1" placeholder="매입가 *" defaultValue={editingJournalEntry?.buyPrice} required />
              <Input name="quantity" type="number" min="0" step="1" placeholder="수량 *" defaultValue={editingJournalEntry?.quantity} required />
              <Input
                name="finalSellPrice"
                type="number"
                min="0"
                step="1"
                placeholder="최종매도가 *"
                defaultValue={editingJournalEntry?.finalSellPrice}
                required
                className="sm:col-span-2"
              />
            </FormGrid>
            <div className="grid gap-3">
              <Textarea name="buyReason" placeholder="매수 근거 *" defaultValue={editingJournalEntry?.buyReason} required />
              <Textarea name="sellReason" placeholder="매도 근거 *" defaultValue={editingJournalEntry?.sellReason} required />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">취소</Button></DialogClose>
              <Button>{editingJournalEntry ? "저장" : "추가"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StockMobileCard({
  stock,
  categoryColor,
  evalAmt,
  profit,
  weight,
  editing,
  onEdit,
  onCancel,
  onUpdate,
  onDelete,
}: {
  stock: Stock;
  categoryColor: ReturnType<typeof getCategoryColor>;
  evalAmt: number;
  profit: number;
  weight: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: (form: HTMLFormElement) => Promise<void>;
  onDelete: () => void | Promise<void>;
}) {
  const rate = Number(pctCalc(stock.buyPrice, stock.currentPrice));
  const tone = getReturnTone(profit);
  const priceTone = getReturnTone(stock.priceChange ?? 0);

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${categoryColor.dot}`} />
            <h3 className="truncate font-semibold">{stock.name}</h3>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className={`border ${categoryColor.badge}`}>{stock.sector}</Badge>
            {stock.code && <Badge className="border-border bg-card text-muted-foreground">{stock.code}</Badge>}
          </div>
        </div>
        <div className="text-right">
          <div className={tone.strongText}>{rate > 0 ? "+" : ""}{rate.toFixed(1)}%</div>
          <div className={`mt-1 text-xs ${tone.text}`}>{profit > 0 ? "+" : ""}₩{fmt(profit)}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">현재가</div>
          <div className="mt-1 font-number font-semibold tabular-nums">₩{fmt(stock.currentPrice)}</div>
          {stock.priceChange != null && stock.priceChangeRate != null && (
            <div className={`mt-1 text-xs ${priceTone.text}`}>
              {formatSignedNumber(stock.priceChange)} ({formatSignedPercent(stock.priceChangeRate)})
            </div>
          )}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">평가액</div>
          <div className="mt-1 font-number font-semibold tabular-nums">₩{fmt(evalAmt)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">수량</div>
          <div className="mt-1">{fmt(stock.qty)}주</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">비중</div>
          <div className="mt-1">{weight}%</div>
        </div>
      </div>

      {editing && (
        <form
          className="mt-4 grid gap-2 rounded-lg border bg-card p-3"
          onSubmit={(event) => {
            event.preventDefault();
            onUpdate(event.currentTarget);
          }}
        >
          <Input name="code" defaultValue={stock.code} placeholder="종목코드" />
          <div className="grid grid-cols-3 gap-2">
            <Input name="buyPrice" type="number" defaultValue={stock.buyPrice} />
            <Input name="currentPrice" type="number" defaultValue={stock.currentPrice} />
            <Input name="qty" type="number" defaultValue={stock.qty} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>취소</Button>
            <Button size="sm">저장</Button>
          </div>
        </form>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit3 className="h-3.5 w-3.5" />
          수정
        </Button>
        <DeleteConfirm title="종목 삭제" onConfirm={onDelete} />
      </div>
    </div>
  );
}

function TradeJournalMobileCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: TradeJournalEntry;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
}) {
  const finalReturnRate = entry.buyPrice > 0 ? ((entry.finalSellPrice - entry.buyPrice) / entry.buyPrice) * 100 : 0;
  const tone = getReturnTone(finalReturnRate);

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{entry.tradeDate}</div>
          <h3 className="mt-1 truncate font-semibold">{entry.stockName}</h3>
        </div>
        <div className={`shrink-0 text-right ${tone.strongText}`}>{formatSignedPercent(finalReturnRate)}</div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">매입가</div>
          <div className="mt-1 font-number font-semibold tabular-nums">₩{fmt(entry.buyPrice)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">수량</div>
          <div className="mt-1 font-number font-semibold tabular-nums">{fmt(entry.quantity)}주</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">최종매도가</div>
          <div className="mt-1 font-number font-semibold tabular-nums">₩{fmt(entry.finalSellPrice)}</div>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">매수 근거</div>
          <p className="mt-1 break-words leading-6">{entry.buyReason}</p>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">매도 근거</div>
          <p className="mt-1 break-words leading-6">{entry.sellReason}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit3 className="h-3.5 w-3.5" />
          수정
        </Button>
        <DeleteConfirm title="매매일지 삭제" onConfirm={onDelete} />
      </div>
    </div>
  );
}
