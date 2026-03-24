import { useRef, useState, useCallback } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { useUpdateVersion } from "@/hooks/useFeatures";
import type { GanttBar as GanttBarType, ZoomLevel } from "@/hooks/useRoadmap";

interface Props {
  bar: GanttBarType;
  totalMs: number;
  minDate: Date;
  containerWidth: number;
  zoom: ZoomLevel;
  onContextMenu?: (e: React.MouseEvent, versionId: string) => void;
}

// Snap unit in ms per zoom level
const SNAP_MS: Record<ZoomLevel, number> = {
  week: 24 * 60 * 60 * 1000,          // snap to day
  month: 7 * 24 * 60 * 60 * 1000,     // snap to week
  quarter: 7 * 24 * 60 * 60 * 1000,   // snap to week
  year: 30 * 24 * 60 * 60 * 1000,     // snap to ~month
};

function snapDate(date: Date, snapMs: number): Date {
  return new Date(Math.round(date.getTime() / snapMs) * snapMs);
}

export default function GanttBar({ bar, totalMs, minDate, containerWidth, zoom, onContextMenu }: Props) {
  const updateVersion = useUpdateVersion();
  const [dragOffsetPct, setDragOffsetPct] = useState<number | null>(null);
  const [resizeRightPct, setResizeRightPct] = useState<number | null>(null);
  const [resizeLeftPct, setResizeLeftPct] = useState<number | null>(null);

  const isDragging = dragOffsetPct !== null;
  const isResizingRight = resizeRightPct !== null;
  const isResizingLeft = resizeLeftPct !== null;

  const displayLeft = isResizingLeft
    ? resizeLeftPct!
    : isDragging
    ? bar.leftPct + dragOffsetPct!
    : bar.leftPct;

  const displayWidth = isResizingRight
    ? resizeRightPct!
    : isResizingLeft
    ? bar.widthPct + (bar.leftPct - resizeLeftPct!)
    : isDragging
    ? bar.widthPct
    : bar.widthPct;

  // Move drag
  const handleMoveDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (containerWidth === 0) return;
      const startX = e.clientX;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const onMove = (me: PointerEvent) => {
        const dx = me.clientX - startX;
        setDragOffsetPct((dx / containerWidth) * 100);
      };
      const onUp = (ue: PointerEvent) => {
        const dx = ue.clientX - startX;
        const msDelta = (dx / containerWidth) * totalMs;
        const snap = SNAP_MS[zoom];
        const newStart = snapDate(new Date(bar.startDate.getTime() + msDelta), snap);
        const newEnd = snapDate(new Date(bar.endDate.getTime() + msDelta), snap);
        updateVersion.mutate({
          id: bar.versionId,
          start_date: format(newStart, "yyyy-MM-dd"),
          due_date: format(newEnd, "yyyy-MM-dd"),
        });
        setDragOffsetPct(null);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [bar, containerWidth, totalMs, zoom, updateVersion]
  );

  // Resize right (due_date)
  const handleResizeRightDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (containerWidth === 0) return;
      const startX = e.clientX;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const onMove = (me: PointerEvent) => {
        const dx = me.clientX - startX;
        const newWidthPct = Math.max(0.5, bar.widthPct + (dx / containerWidth) * 100);
        setResizeRightPct(newWidthPct);
      };
      const onUp = (ue: PointerEvent) => {
        const dx = ue.clientX - startX;
        const msDelta = (dx / containerWidth) * totalMs;
        const snap = SNAP_MS[zoom];
        const newEnd = snapDate(new Date(bar.endDate.getTime() + msDelta), snap);
        if (newEnd > bar.startDate) {
          updateVersion.mutate({ id: bar.versionId, due_date: format(newEnd, "yyyy-MM-dd") });
        }
        setResizeRightPct(null);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [bar, containerWidth, totalMs, zoom, updateVersion]
  );

  // Resize left (start_date)
  const handleResizeLeftDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (containerWidth === 0) return;
      const startX = e.clientX;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const onMove = (me: PointerEvent) => {
        const dx = me.clientX - startX;
        const newLeft = bar.leftPct + (dx / containerWidth) * 100;
        setResizeLeftPct(Math.max(0, newLeft));
      };
      const onUp = (ue: PointerEvent) => {
        const dx = ue.clientX - startX;
        const msDelta = (dx / containerWidth) * totalMs;
        const snap = SNAP_MS[zoom];
        const newStart = snapDate(new Date(bar.startDate.getTime() + msDelta), snap);
        if (newStart < bar.endDate) {
          updateVersion.mutate({ id: bar.versionId, start_date: format(newStart, "yyyy-MM-dd") });
        }
        setResizeLeftPct(null);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [bar, containerWidth, totalMs, zoom, updateVersion]
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="absolute top-1 bottom-1 rounded flex items-center group select-none"
          style={{
            left: `${displayLeft}%`,
            width: `${displayWidth}%`,
            backgroundColor: bar.color,
            opacity: isDragging || isResizingRight || isResizingLeft ? 0.75 : 1,
            cursor: isDragging ? "grabbing" : "grab",
            minWidth: 4,
          }}
          onPointerDown={handleMoveDown}
          onContextMenu={(e) => onContextMenu?.(e, bar.versionId)}
        >
          {/* Progress fill */}
          {bar.progress > 0 && (
            <div
              className="absolute inset-y-0 left-0 rounded-l bg-white/25 pointer-events-none"
              style={{ width: `${bar.progress}%` }}
            />
          )}

          {/* Left resize handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/30 rounded-l z-10"
            onPointerDown={handleResizeLeftDown}
            style={{ cursor: "ew-resize" }}
          />

          {/* Label */}
          <span className="px-2 text-xs font-medium text-white truncate pointer-events-none flex-1">
            {bar.label}
          </span>

          {/* Progress % badge */}
          {bar.progress > 0 && (
            <span className="px-1 text-[10px] text-white/80 pointer-events-none shrink-0">
              {bar.progress}%
            </span>
          )}

          {/* Right resize handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/30 rounded-r z-10"
            onPointerDown={handleResizeRightDown}
            style={{ cursor: "ew-resize" }}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs font-medium">{bar.label}</div>
        <div className="text-xs text-muted-foreground">
          {format(bar.startDate, "MMM d")} → {format(bar.endDate, "MMM d, yyyy")}
        </div>
        <div className="text-xs text-muted-foreground">Status: {bar.status}</div>
        {bar.progress > 0 && (
          <div className="text-xs text-muted-foreground">{bar.progress}% complete</div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
