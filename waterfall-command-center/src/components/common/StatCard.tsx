/**
 * StatCard — a single KPI tile used on the Dashboard and module headers.
 */
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  /** Optional positive/negative trend, shown as a small colored delta. */
  delta?: number;
}

export function StatCard({ label, value, hint, icon, delta }: StatCardProps) {
  return (
    <Card className="glass-panel">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {typeof delta === "number" && (
            <span className={delta >= 0 ? "text-success" : "text-destructive"}>
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
