import { useState } from "react";
import { Map as MapIcon } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import ExportRoadmapButton from "@/components/ExportRoadmapButton";
import GanttToolbar from "@/components/gantt/GanttToolbar";
import GanttCanvas from "@/components/gantt/GanttCanvas";
import { useRoadmap, type ZoomLevel } from "@/hooks/useRoadmap";
import { Skeleton } from "@/components/ui/skeleton";

export default function Roadmap() {
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const { featureGroups, timeUnits, minDate, maxDate, totalMs, dependencies, isLoading } = useRoadmap(zoom);

  // Versions that have no dates — show below
  const noDatesVersions = featureGroups
    .flatMap((g) =>
      g.feature ? [] : []  // already filtered in hook; get from raw data if needed
    );

  return (
    <TooltipProvider>
      <div className="flex flex-col flex-1 min-h-0">
        {/* Page header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Roadmap</h1>
            <Badge variant="secondary" className="ml-1">
              {featureGroups.length} feature{featureGroups.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <ExportRoadmapButton />
        </div>

        {/* Toolbar */}
        <GanttToolbar zoom={zoom} onZoomChange={setZoom} />

        {/* Gantt body */}
        <div id="roadmap-export-target" className="flex flex-col flex-1 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : featureGroups.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 p-12">
              <MapIcon className="h-12 w-12 opacity-20" />
              <p className="text-lg font-medium">No versions with dates yet</p>
              <p className="text-sm">Add due dates to your versions to see them on the roadmap.</p>
            </div>
          ) : (
            <GanttCanvas
              featureGroups={featureGroups}
              timeUnits={timeUnits}
              minDate={minDate}
              maxDate={maxDate}
              totalMs={totalMs}
              dependencies={dependencies}
              zoom={zoom}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
