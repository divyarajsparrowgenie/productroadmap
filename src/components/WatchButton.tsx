import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsWatching, useWatchTask, useUnwatchTask } from "@/hooks/useWatchers";
import { cn } from "@/lib/utils";

export default function WatchButton({ taskId }: { taskId: string }) {
  const { data: watching } = useIsWatching(taskId);
  const watch = useWatchTask();
  const unwatch = useUnwatchTask();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", watching && "text-yellow-500")}
      title={watching ? "Unwatch" : "Watch"}
      onClick={() => watching ? unwatch.mutate(taskId) : watch.mutate(taskId)}
    >
      <Star className={cn("h-3.5 w-3.5", watching && "fill-yellow-500")} />
    </Button>
  );
}
