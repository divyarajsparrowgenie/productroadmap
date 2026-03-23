import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";
import { useActivityLog } from "@/hooks/useActivityLog";
import { ScrollArea } from "@/components/ui/scroll-area";

const actionLabels: Record<string, string> = {
  created_feature: "created feature",
  updated_feature: "updated feature",
  deleted_feature: "deleted feature",
  created_version: "created version",
  updated_version: "updated version",
  deleted_version: "deleted version",
  created_task: "created task",
  updated_status: "updated task status",
  updated_task: "updated task",
  deleted_task: "deleted task",
  added_comment: "added a comment",
};

export default function ActivityFeed({ limit = 20 }: { limit?: number }) {
  const { data: entries = [] } = useActivityLog(limit);

  return (
    <ScrollArea className="h-64">
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
      ) : (
        <div className="space-y-3 pr-3">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 text-sm">
              <Activity className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground">
                  {actionLabels[entry.action] ?? entry.action}
                </span>
                {entry.metadata && (entry.metadata as any).title && (
                  <span className="font-medium ml-1">"{(entry.metadata as any).title}"</span>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
