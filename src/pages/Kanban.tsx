import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFeatures, useVersions, useAllTasks, useAllVersionsWithFeatures } from "@/hooks/useFeatures";
import DndKanban from "@/components/DndKanban";
import { SkeletonCard } from "@/components/SkeletonCard";

export default function Kanban() {
  const { data: features = [] } = useFeatures();
  const { data: versionsWithFeatures = [] } = useAllVersionsWithFeatures();
  const { data: allTasks = [], isLoading: tasksLoading } = useAllTasks();

  const [featureFilter, setFeatureFilter] = useState<string>("all");
  const [versionFilter, setVersionFilter] = useState<string>("all");

  const filteredVersions = useMemo(
    () => featureFilter === "all" ? versionsWithFeatures : versionsWithFeatures.filter((v) => v.feature?.id === featureFilter),
    [versionsWithFeatures, featureFilter]
  );

  const filteredTasks = useMemo(() => {
    let tasks = allTasks;
    if (versionFilter !== "all") {
      tasks = tasks.filter((t) => t.version_id === versionFilter);
    } else if (featureFilter !== "all") {
      const vIds = new Set(filteredVersions.map((v) => v.id));
      tasks = tasks.filter((t) => vIds.has(t.version_id));
    }
    return tasks;
  }, [allTasks, versionFilter, featureFilter, filteredVersions]);

  if (tasksLoading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <SkeletonCard key={i} rows={4} />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
        <div className="flex gap-2">
          <Select value={featureFilter} onValueChange={(v) => { setFeatureFilter(v); setVersionFilter("all"); }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All features" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All features</SelectItem>
              {features.map((f) => <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={versionFilter} onValueChange={setVersionFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All versions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All versions</SelectItem>
              {filteredVersions.map((v) => <SelectItem key={v.id} value={v.id}>{v.version_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DndKanban tasks={filteredTasks} />
    </div>
  );
}
