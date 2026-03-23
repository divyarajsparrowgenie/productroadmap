import { useState, useMemo } from "react";
import { KanbanSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllTasks, useAllVersionsWithFeatures, useUpdateTask } from "@/hooks/useFeatures";
import type { Task } from "@/hooks/useFeatures";

const COLUMNS: { status: string; color: string }[] = [
  { status: "Todo", color: "bg-slate-100 dark:bg-slate-800" },
  { status: "Doing", color: "bg-blue-50 dark:bg-blue-950" },
  { status: "Done", color: "bg-green-50 dark:bg-green-950" },
];

const STATUS_CYCLE: Record<string, string> = {
  Todo: "Doing",
  Doing: "Done",
  Done: "Todo",
};

const STATUS_COLORS: Record<string, string> = {
  Todo: "secondary",
  Doing: "default",
  Done: "outline",
};

export default function Kanban() {
  const { data: tasks = [] } = useAllTasks();
  const { data: versionsWithFeatures = [] } = useAllVersionsWithFeatures();
  const updateTask = useUpdateTask();

  const [filterFeature, setFilterFeature] = useState<string>("all");
  const [filterVersion, setFilterVersion] = useState<string>("all");

  // Build lookup maps
  const versionMap = useMemo(() => {
    return new Map(versionsWithFeatures.map((v) => [v.id, v]));
  }, [versionsWithFeatures]);

  const features = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; title: string }[] = [];
    for (const v of versionsWithFeatures) {
      if (v.feature && !seen.has(v.feature.id)) {
        seen.add(v.feature.id);
        result.push({ id: v.feature.id, title: v.feature.title });
      }
    }
    return result;
  }, [versionsWithFeatures]);

  const filteredVersions = useMemo(() => {
    if (filterFeature === "all") return versionsWithFeatures;
    return versionsWithFeatures.filter((v) => v.feature?.id === filterFeature);
  }, [versionsWithFeatures, filterFeature]);

  const availableVersions = filteredVersions;

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterVersion !== "all" && t.version_id !== filterVersion) return false;
      if (filterFeature !== "all") {
        const v = versionMap.get(t.version_id);
        if (!v || v.feature?.id !== filterFeature) return false;
      }
      return true;
    });
  }, [tasks, filterFeature, filterVersion, versionMap]);

  const cycleStatus = (task: Task) => {
    updateTask.mutate({ id: task.id, status: STATUS_CYCLE[task.status] });
  };

  const tasksByStatus = (status: string) =>
    filteredTasks.filter((t) => t.status === status).sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <KanbanSquare className="h-6 w-6" /> Kanban Board
          </h1>
          <p className="text-sm text-muted-foreground">{filteredTasks.length} task(s)</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterFeature} onValueChange={(v) => { setFilterFeature(v); setFilterVersion("all"); }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Features" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Features</SelectItem>
              {features.map((f) => <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterVersion} onValueChange={setFilterVersion}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Versions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Versions</SelectItem>
              {availableVersions.map((v) => <SelectItem key={v.id} value={v.id}>{v.version_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(({ status, color }) => {
          const colTasks = tasksByStatus(status);
          return (
            <div key={status} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <h2 className="font-semibold text-sm">{status}</h2>
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">{colTasks.length}</Badge>
              </div>
              <div className={`rounded-lg p-2 space-y-2 min-h-[200px] ${color}`}>
                {colTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
                )}
                {colTasks.map((task) => {
                  const version = versionMap.get(task.version_id);
                  return (
                    <Card
                      key={task.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => cycleStatus(task)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <p className="text-sm font-medium leading-snug">{task.title}</p>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex flex-col gap-0.5">
                            {version?.feature && (
                              <span className="text-xs text-muted-foreground">{version.feature.title}</span>
                            )}
                            {version && (
                              <span className="text-xs text-muted-foreground font-mono">{version.version_name}</span>
                            )}
                          </div>
                          {task.due_date && (
                            <span className={`text-xs ${new Date(task.due_date) < new Date() && task.status !== "Done" ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                              {task.due_date}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground italic">Click to advance status</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
