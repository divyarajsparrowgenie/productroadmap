import type { TimeUnit, ZoomLevel } from "@/hooks/useRoadmap";

interface Props {
  timeUnits: TimeUnit[];
  totalMs: number;
  minDate: Date;
  zoom: ZoomLevel;
}

const UNIT_MIN_WIDTH: Record<ZoomLevel, number> = {
  week: 120,
  month: 80,
  quarter: 200,
  year: 300,
};

export default function GanttTimeHeader({ timeUnits, totalMs, minDate, zoom }: Props) {
  return (
    <div className="flex border-b bg-muted/50 sticky top-0 z-10">
      {/* Label column */}
      <div className="w-48 shrink-0 border-r px-3 py-2 text-xs font-semibold text-muted-foreground">
        Feature / Version
      </div>
      {/* Timeline header */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="flex"
          style={{ minWidth: Math.max(600, timeUnits.length * UNIT_MIN_WIDTH[zoom]) }}
        >
          {timeUnits.map((unit, i) => {
            const widthPct = ((unit.end.getTime() - unit.start.getTime()) / totalMs) * 100;
            return (
              <div
                key={i}
                className="border-r text-xs text-muted-foreground px-1 py-2 truncate text-center shrink-0"
                style={{ width: `${widthPct}%`, minWidth: UNIT_MIN_WIDTH[zoom] }}
              >
                {unit.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
