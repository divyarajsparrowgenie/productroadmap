import { useMemo } from "react";
import { Map as MapIcon } from "lucide-react";
import { useAllVersionsWithFeatures } from "@/hooks/useFeatures";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STATUS_COLORS: Record<string, string> = {
  Planned: "bg-slate-400",
  "In Progress": "bg-blue-500",
  Released: "bg-purple-500",
  Completed: "bg-green-500",
};

const STATUS_BADGE_VARIANTS: Record<string, "secondary" | "default" | "outline"> = {
  Planned: "secondary",
  "In Progress": "default",
  Released: "outline",
  Completed: "outline",
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export default function Roadmap() {
  const { data: versionsWithFeatures = [] } = useAllVersionsWithFeatures();

  // Filter versions with due_date
  const versionsWithDates = versionsWithFeatures.filter((v) => v.due_date);
  const versionsNoDates = versionsWithFeatures.filter((v) => !v.due_date);

  // Compute timeline range
  const { minDate, maxDate, months } = useMemo(() => {
    if (versionsWithDates.length === 0) {
      const now = new Date();
      const min = addMonths(now, -1);
      const max = addMonths(now, 5);
      const months: Date[] = [];
      const cur = new Date(min.getFullYear(), min.getMonth(), 1);
      while (cur <= max) {
        months.push(new Date(cur));
        cur.setMonth(cur.getMonth() + 1);
      }
      return { minDate: min, maxDate: max, months };
    }

    const dates = versionsWithDates.map((v) => new Date(v.due_date!));
    const min = addMonths(new Date(Math.min(...dates.map((d) => d.getTime()))), -1);
    const max = addMonths(new Date(Math.max(...dates.map((d) => d.getTime()))), 1);

    const months: Date[] = [];
    const cur = new Date(min.getFullYear(), min.getMonth(), 1);
    while (cur <= max) {
      months.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
    return { minDate: min, maxDate: max, months };
  }, [versionsWithDates]);

  const totalMs = maxDate.getTime() - minDate.getTime();

  // Group by feature
  const featureGroups = useMemo(() => {
    const map = new Map<string, { featureTitle: string; versions: typeof versionsWithFeatures }>();
    for (const v of versionsWithDates) {
      const fid = v.feature_id;
      const title = v.feature?.title ?? "Unknown";
      if (!map.has(fid)) map.set(fid, { featureTitle: title, versions: [] });
      map.get(fid)!.versions.push(v);
    }
    return [...map.values()];
  }, [versionsWithDates]);

  const getBarStyle = (dueDate: string) => {
    const date = new Date(dueDate);
    const offset = ((date.getTime() - minDate.getTime()) / totalMs) * 100;
    const width = Math.max(4, (1 / months.length) * 100);
    return { left: `${Math.max(0, Math.min(96, offset))}%`, width: `${width}%` };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MapIcon className="h-6 w-6" /> Roadmap
        </h1>
        <p className="text-sm text-muted-foreground">Version timeline by due date</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs">
            <div className={`h-3 w-3 rounded-full ${color}`} />
            <span>{status}</span>
          </div>
        ))}
      </div>

      {featureGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No versions with due dates. Add due dates to versions to see the roadmap.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            {/* Month headers */}
            <div className="flex mb-2" style={{ minWidth: `${Math.max(600, months.length * 80)}px` }}>
              <div className="w-40 flex-shrink-0" />
              <div className="flex-1 relative flex">
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="text-xs text-muted-foreground text-center border-l border-border"
                    style={{ width: `${100 / months.length}%` }}
                  >
                    {formatMonth(m)}
                  </div>
                ))}
                {/* Today marker */}
                {(() => {
                  const todayOffset = ((Date.now() - minDate.getTime()) / totalMs) * 100;
                  if (todayOffset < 0 || todayOffset > 100) return null;
                  return (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-destructive opacity-60"
                      style={{ left: `${todayOffset}%` }}
                    />
                  );
                })()}
              </div>
            </div>

            {/* Feature rows */}
            <div className="space-y-3" style={{ minWidth: `${Math.max(600, months.length * 80)}px` }}>
              {featureGroups.map(({ featureTitle, versions }) => (
                <div key={featureTitle} className="flex items-center gap-2">
                  <div className="w-40 flex-shrink-0">
                    <p className="text-sm font-medium truncate" title={featureTitle}>{featureTitle}</p>
                  </div>
                  <div className="flex-1 relative h-8 bg-muted/30 rounded">
                    {/* Month grid lines */}
                    {months.map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 w-px bg-border"
                        style={{ left: `${(i / months.length) * 100}%` }}
                      />
                    ))}
                    {versions.map((v) => (
                      <Tooltip key={v.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={`absolute top-1 bottom-1 rounded cursor-default ${STATUS_COLORS[v.status] ?? "bg-slate-400"} opacity-80 hover:opacity-100 transition-opacity flex items-center px-2 overflow-hidden`}
                            style={getBarStyle(v.due_date!)}
                          >
                            <span className="text-white text-xs font-medium truncate">{v.version_name}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">{v.version_name}</p>
                            <p>Status: {v.status}</p>
                            <p>Due: {v.due_date}</p>
                            <p>WSJF: {v.wsjf_score?.toFixed(1) ?? "—"}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Versions without dates */}
      {versionsNoDates.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Versions without due dates ({versionsNoDates.length})</h2>
          <div className="flex flex-wrap gap-2">
            {versionsNoDates.map((v) => (
              <div key={v.id} className="flex items-center gap-1.5 text-xs border rounded-md px-2 py-1">
                <span className="text-muted-foreground">{v.feature?.title}</span>
                <span>/</span>
                <span>{v.version_name}</span>
                <Badge variant={STATUS_BADGE_VARIANTS[v.status] ?? "secondary"} className="text-xs h-4 px-1">
                  {v.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
