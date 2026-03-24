import { useState } from "react";
import { ChevronRight, ChevronDown, Flag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import GanttBar from "./GanttBar";
import MilestoneMarker from "./MilestoneMarker";
import { useCreateMilestone, useDeleteMilestone } from "@/hooks/useMilestones";
import type { FeatureGroup, ZoomLevel } from "@/hooks/useRoadmap";

interface Props {
  group: FeatureGroup;
  totalMs: number;
  minDate: Date;
  containerWidth: number;
  zoom: ZoomLevel;
  onContextMenu?: (e: React.MouseEvent, versionId: string) => void;
}

export default function GanttSwimlane({ group, totalMs, minDate, containerWidth, zoom, onContextMenu }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mDate, setMDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mColor, setMColor] = useState("#f97316");

  const createMilestone = useCreateMilestone();
  const deleteMilestone = useDeleteMilestone();

  const handleAddMilestone = async () => {
    if (!mTitle || !mDate) return;
    await createMilestone.mutateAsync({ feature_id: group.feature.id, title: mTitle, date: mDate, color: mColor });
    setMTitle("");
    setMDate(format(new Date(), "yyyy-MM-dd"));
    setShowAddMilestone(false);
  };

  return (
    <>
      {/* Feature header row */}
      <div className="flex border-b hover:bg-muted/20 group/row">
        {/* Label */}
        <div className="w-48 shrink-0 border-r flex items-center gap-1 px-2 py-1">
          <button
            className="p-0.5 rounded hover:bg-muted text-muted-foreground"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          <span className="text-xs font-semibold truncate flex-1" title={group.feature.title}>
            {group.feature.title}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="opacity-0 group-hover/row:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground"
                onClick={() => setShowAddMilestone(true)}
              >
                <Flag className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Add milestone</TooltipContent>
          </Tooltip>
        </div>
        {/* Summary bar */}
        <div className="flex-1 relative" style={{ height: 32 }}>
          {group.summaryStart && group.summaryEnd && (
            <div
              className="absolute top-1.5 bottom-1.5 rounded opacity-30"
              style={{
                left: `${group.summaryLeftPct}%`,
                width: `${group.summaryWidthPct}%`,
                backgroundColor: group.feature.color ?? "#6366f1",
                minWidth: 4,
              }}
            />
          )}
          {/* Milestones on feature row */}
          {group.milestones.map((m) => (
            <div key={m.id} className="group/ms">
              <MilestoneMarker milestone={m} />
              <button
                className="absolute opacity-0 group-hover/ms:opacity-100 z-20"
                style={{ left: `${m.leftPct}%`, top: 2 }}
                onClick={() => deleteMilestone.mutate(m.id)}
              >
                <Trash2 className="h-2.5 w-2.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Version rows */}
      {expanded &&
        group.versions.map((bar) => (
          <div key={bar.versionId} className="flex border-b hover:bg-muted/10">
            {/* Indented label */}
            <div className="w-48 shrink-0 border-r flex items-center px-6 py-0.5">
              <span className="text-xs text-muted-foreground truncate" title={bar.label}>
                {bar.label}
              </span>
            </div>
            {/* Bar row */}
            <div className="flex-1 relative" style={{ height: 28 }}>
              <GanttBar
                bar={bar}
                totalMs={totalMs}
                minDate={minDate}
                containerWidth={containerWidth}
                zoom={zoom}
                onContextMenu={onContextMenu}
              />
            </div>
          </div>
        ))}

      {/* Add Milestone dialog */}
      <Dialog open={showAddMilestone} onOpenChange={setShowAddMilestone}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Milestone to "{group.feature.title}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="e.g. Beta Launch" />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Label>Color</Label>
              <input type="color" value={mColor} onChange={(e) => setMColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMilestone(false)}>Cancel</Button>
            <Button onClick={handleAddMilestone} disabled={!mTitle || createMilestone.isPending}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
