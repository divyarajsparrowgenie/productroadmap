import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import type { MilestoneItem } from "@/hooks/useRoadmap";

interface Props {
  milestone: MilestoneItem;
}

export default function MilestoneMarker({ milestone }: Props) {
  const color = milestone.color ?? "#f97316";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="absolute z-10 cursor-pointer hover:scale-125 transition-transform"
          style={{
            left: `${milestone.leftPct}%`,
            top: "50%",
            transform: "translateX(-50%) translateY(-50%) rotate(45deg)",
            width: 12,
            height: 12,
            backgroundColor: color,
            border: `2px solid ${color}`,
          }}
        />
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs font-medium">{milestone.title}</div>
        <div className="text-xs text-muted-foreground">{format(milestone.date, "MMM d, yyyy")}</div>
      </TooltipContent>
    </Tooltip>
  );
}
