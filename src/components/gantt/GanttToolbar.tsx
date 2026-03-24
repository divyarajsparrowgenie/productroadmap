import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut } from "lucide-react";
import type { ZoomLevel } from "@/hooks/useRoadmap";
import { STATUS_COLORS_HEX } from "@/hooks/useRoadmap";

interface Props {
  zoom: ZoomLevel;
  onZoomChange: (zoom: ZoomLevel) => void;
  extraActions?: React.ReactNode;
}

const ZOOM_LABELS: Record<ZoomLevel, string> = {
  week: "Week",
  month: "Month",
  quarter: "Quarter",
  year: "Year",
};

export default function GanttToolbar({ zoom, onZoomChange, extraActions }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-muted/30 flex-wrap">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <ZoomIn className="h-4 w-4" /> Zoom
        </span>
        <ToggleGroup
          type="single"
          value={zoom}
          onValueChange={(v) => v && onZoomChange(v as ZoomLevel)}
          className="border rounded-md"
        >
          {(Object.keys(ZOOM_LABELS) as ZoomLevel[]).map((z) => (
            <ToggleGroupItem key={z} value={z} className="text-xs px-3 h-7">
              {ZOOM_LABELS[z]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Legend */}
        {Object.entries(STATUS_COLORS_HEX).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: color }} />
            {status}
          </span>
        ))}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="w-3 h-3 rotate-45 inline-block border-2 border-orange-400 bg-orange-400" />
          Milestone
        </span>
        {extraActions}
      </div>
    </div>
  );
}
