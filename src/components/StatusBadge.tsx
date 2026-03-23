import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Planned: "bg-secondary text-secondary-foreground",
  "In Progress": "bg-primary/10 text-primary border-primary/20",
  Released: "bg-success/10 text-success border-success/20",
  Completed: "bg-muted text-muted-foreground",
  Todo: "bg-secondary text-secondary-foreground",
  Doing: "bg-primary/10 text-primary border-primary/20",
  Done: "bg-success/10 text-success border-success/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", statusStyles[status] || "")}>
      {status}
    </Badge>
  );
}
