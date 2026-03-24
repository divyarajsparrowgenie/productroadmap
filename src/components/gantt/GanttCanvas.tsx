import { useRef, useEffect, useState, useCallback } from "react";
import GanttTimeHeader from "./GanttTimeHeader";
import GanttTodayLine from "./GanttTodayLine";
import GanttSwimlane from "./GanttSwimlane";
import DependencyArrows, { type RowPosition } from "./DependencyArrows";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateDependency } from "@/hooks/useDependencies";
import type { FeatureGroup, TimeUnit, DependencyItem, ZoomLevel } from "@/hooks/useRoadmap";

const ROW_HEIGHTS = { feature: 32, version: 28 };
const ZOOM_UNIT_WIDTH: Record<ZoomLevel, number> = {
  week: 120,
  month: 80,
  quarter: 200,
  year: 300,
};

interface Props {
  featureGroups: FeatureGroup[];
  timeUnits: TimeUnit[];
  minDate: Date;
  maxDate: Date;
  totalMs: number;
  dependencies: DependencyItem[];
  zoom: ZoomLevel;
}

export default function GanttCanvas({ featureGroups, timeUnits, minDate, maxDate, totalMs, dependencies, zoom }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; versionId: string } | null>(null);
  const [depTarget, setDepTarget] = useState<string>("");
  const [depType, setDepType] = useState<string>("blocks");

  const createDep = useCreateDependency();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width - 192)); // subtract label col
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width - 192);
    return () => ro.disconnect();
  }, []);

  // Compute row Y positions for dependency arrows
  const rowPositions = new Map<string, RowPosition>();
  let currentY = 0;
  for (const group of featureGroups) {
    currentY += ROW_HEIGHTS.feature;
    for (const bar of group.versions) {
      const leftPx = (bar.leftPct / 100) * containerWidth;
      const rightPx = leftPx + (bar.widthPct / 100) * containerWidth;
      rowPositions.set(bar.versionId, { y: currentY + ROW_HEIGHTS.version / 2, leftPx, rightPx });
      currentY += ROW_HEIGHTS.version;
    }
  }

  const minCanvasWidth = Math.max(600, timeUnits.length * ZOOM_UNIT_WIDTH[zoom]);

  const allVersions = featureGroups.flatMap((g) => g.versions);

  const handleContextMenu = useCallback((e: React.MouseEvent, versionId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, versionId });
  }, []);

  const handleAddDep = async () => {
    if (!contextMenu || !depTarget) return;
    await createDep.mutateAsync({ source_id: contextMenu.versionId, target_id: depTarget, dependency_type: depType });
    setContextMenu(null);
    setDepTarget("");
  };

  return (
    <>
      <div ref={containerRef} className="flex-1 overflow-auto relative">
        <div style={{ minWidth: minCanvasWidth + 192 }}>
          <GanttTimeHeader timeUnits={timeUnits} totalMs={totalMs} minDate={minDate} zoom={zoom} />

          {/* Canvas body */}
          <div className="relative">
            {/* Grid columns */}
            <div className="absolute inset-0 flex pointer-events-none">
              <div className="w-48 shrink-0 border-r" />
              <div className="flex-1 flex" style={{ minWidth: minCanvasWidth }}>
                {timeUnits.map((unit, i) => {
                  const widthPct = ((unit.end.getTime() - unit.start.getTime()) / totalMs) * 100;
                  return (
                    <div
                      key={i}
                      className="border-r border-border/30 shrink-0"
                      style={{ width: `${widthPct}%`, minWidth: ZOOM_UNIT_WIDTH[zoom] }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Today line (over timeline portion) */}
            <div className="absolute inset-y-0" style={{ left: 192, right: 0 }}>
              <GanttTodayLine minDate={minDate} totalMs={totalMs} />
              <DependencyArrows
                dependencies={dependencies}
                rowPositions={rowPositions}
                containerWidth={containerWidth}
              />
            </div>

            {/* Swimlanes */}
            {featureGroups.map((group) => (
              <GanttSwimlane
                key={group.feature.id}
                group={group}
                totalMs={totalMs}
                minDate={minDate}
                containerWidth={containerWidth}
                zoom={zoom}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dependency context menu dialog */}
      {contextMenu && (
        <Dialog open onOpenChange={() => setContextMenu(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Dependency</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">This version</label>
                <Select value={depType} onValueChange={setDepType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blocks">blocks →</SelectItem>
                    <SelectItem value="is_blocked_by">is blocked by ←</SelectItem>
                    <SelectItem value="relates_to">relates to ↔</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Target version</label>
                <Select value={depTarget} onValueChange={setDepTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select version..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allVersions
                      .filter((v) => v.versionId !== contextMenu.versionId)
                      .map((v) => (
                        <SelectItem key={v.versionId} value={v.versionId}>
                          {v.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setContextMenu(null)}>Cancel</Button>
              <Button onClick={handleAddDep} disabled={!depTarget || createDep.isPending}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
