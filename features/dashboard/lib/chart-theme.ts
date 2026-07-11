const categoryColors = [
  {
    dot: "bg-chart-1",
    badge: "border-chart-1/30 bg-chart-1/10 text-chart-1",
    row: "hover:bg-chart-1/5",
    chart: "hsl(var(--chart-1))",
  },
  {
    dot: "bg-chart-2",
    badge: "border-chart-2/30 bg-chart-2/10 text-chart-2",
    row: "hover:bg-chart-2/5",
    chart: "hsl(var(--chart-2))",
  },
  {
    dot: "bg-chart-3",
    badge: "border-chart-3/30 bg-chart-3/10 text-chart-3",
    row: "hover:bg-chart-3/5",
    chart: "hsl(var(--chart-3))",
  },
  {
    dot: "bg-chart-4",
    badge: "border-chart-4/30 bg-chart-4/10 text-chart-4",
    row: "hover:bg-chart-4/5",
    chart: "hsl(var(--chart-4))",
  },
  {
    dot: "bg-chart-5",
    badge: "border-chart-5/30 bg-chart-5/10 text-chart-5",
    row: "hover:bg-chart-5/5",
    chart: "hsl(var(--chart-5))",
  },
  {
    dot: "bg-primary",
    badge: "border-primary/30 bg-primary/10 text-primary",
    row: "hover:bg-primary/5",
    chart: "hsl(var(--primary))",
  },
  {
    dot: "bg-muted-foreground",
    badge: "border-muted-foreground/30 bg-muted/60 text-muted-foreground",
    row: "hover:bg-muted/40",
    chart: "hsl(var(--muted-foreground))",
  },
];

export const chartColors = categoryColors.map((color) => color.chart);
export const positiveChartColor = "hsl(var(--trading-up))";
export const revenueChartColor = "hsl(var(--chart-5))";
export const operatingProfitChartColor = "hsl(var(--trading-up))";
export const netProfitChartColor = "hsl(var(--chart-4))";
export const marginChartColor = "hsl(var(--primary))";
export const chartGridColor = "hsl(var(--border))";
export const chartTextColor = "hsl(var(--muted-foreground))";
export const chartTooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--popover-foreground))",
};

export function getCategoryColor(index: number) {
  return categoryColors[index % categoryColors.length];
}
