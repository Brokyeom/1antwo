"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-normal md:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 md:justify-end">{actions}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex-col items-start justify-between gap-3 space-y-0 p-4 sm:flex-row md:p-6">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">{action}</div>}
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">{children}</CardContent>
    </Card>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">{children}</div>;
}

export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}
