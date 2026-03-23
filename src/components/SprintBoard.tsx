import { useState } from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useSprints,
  useCreateSprint,
  useDeleteSprint,
  useSprintTasks,
  useAddTaskToSprint,
  useRemoveTaskFromSprint,
  Sprint,
} from "@/hooks/useSprints";
import { useAllTasks } from "@/hooks/useFeatures";
import { StatusBadge } from "@/components/StatusBadge";

function SprintCard({ sprint, allTasks }: { sprint: Sprint; allTasks: any[] }) {
  const { data: sprintTasks = [] } = useSprintTasks(sprint.id);
  const removeTask = useRemoveTaskFromSprint();
  const addTask = useAddTaskToSprint();
  const deleteSprint = useDeleteSprint();

  const sprintTaskIds = new Set(sprintTasks.map((t: any) => t.id));
  const unassignedTasks = allTasks.filter((t) => !sprintTaskIds.has(t.id) && t.status !== "Done");

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">{sprint.name}</CardTitle>
          {(sprint.start_date || sprint.end_date) && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <CalendarDays className="h-3 w-3" />
              {sprint.start_date} → {sprint.end_date}
            </p>
          )}
          {sprint.goal && <p className="text-xs text-muted-foreground mt-0.5 italic">{sprint.goal}</p>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => deleteSprint.mutate(sprint.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          {sprintTasks.map((task: any) => (
            <div key={task.id} className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-sm">
              <span className="truncate flex-1">{task.title}</span>
              <StatusBadge status={task.status} />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => removeTask.mutate({ sprintId: sprint.id, taskId: task.id })}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        {unassignedTasks.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-1">Add task:</p>
            <select
              className="w-full text-sm rounded border bg-background px-2 py-1"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  addTask.mutate({ sprintId: sprint.id, taskId: e.target.value });
                  e.target.value = "";
                }
              }}
            >
              <option value="" disabled>Select task…</option>
              {unassignedTasks.slice(0, 20).map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        )}
        <Badge variant="secondary" className="text-xs">{sprintTasks.length} tasks</Badge>
      </CardContent>
    </Card>
  );
}

export default function SprintBoard({ featureId }: { featureId?: string }) {
  const { data: sprints = [] } = useSprints(featureId);
  const { data: allTasks = [] } = useAllTasks();
  const createSprint = useCreateSprint();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    createSprint.mutate(
      { feature_id: featureId, name: name.trim(), goal: goal || undefined, start_date: startDate || undefined, end_date: endDate || undefined },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setName(""); setGoal(""); setStartDate(""); setEndDate("");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sprints</h2>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Sprint
        </Button>
      </div>

      {sprints.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sprints yet. Create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sprints.map((s) => (
            <SprintCard key={s.id} sprint={s} allTasks={allTasks} />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Sprint</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Sprint name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Goal (optional)" value={goal} onChange={(e) => setGoal(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Start date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">End date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createSprint.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
