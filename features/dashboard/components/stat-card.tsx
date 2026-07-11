"use client";

import { Card } from "@/components/ui/card";

export function StatCard({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  const toneClass = tone === "positive" ? "text-trading-up" : tone === "negative" ? "text-trading-down" : "";

  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-number text-xl font-bold tabular-nums ${toneClass}`}>{value}</div>
    </Card>
  );
}
