import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { useUpdateTask } from "@/hooks/useFeatures";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  status: string;
  due_date?: string | null;
  version_id: string;
};

const STATUSES = ["Todo", "Doing", "Done"] as const;
type Status = typeof STATUSES[number];

const COLUMN_COLORS: Record<Status, string> = {
  Todo: "border-t-muted-foreground/30",
  Doing: "border-t-blue-500",
  Done: "border-t-green-500",
};

function TaskCard({ task, isDragging }: { task: Task; isDragging?: boolean }) {
  return (
    <Card className={cn("cursor-grab active:cursor-grabbing shadow-sm", isDragging && "opacity-50")}>
      <CardContent className="p-3 flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{task.title}</p>
          {task.due_date && (
            <p className="text-xs text-muted-foreground mt-0.5">Due {task.due_date}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}

function DroppableColumn({ status, tasks }: { status: Status; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 min-h-32 rounded-lg border-t-4 bg-muted/30 p-3 transition-colors",
        COLUMN_COLORS[status],
        isOver && "bg-muted/60"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold">{status}</span>
        <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <SortableTaskCard key={task.id} task={task} />
        ))}
      </SortableContext>
    </div>
  );
}

interface Props {
  tasks: Task[];
}

export default function DndKanban({ tasks }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const updateTask = useUpdateTask();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {} as Record<Status, Task[]>);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveTask((e.active.data.current as any)?.task ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const task = (active.data.current as any)?.task as Task;
    const newStatus = STATUSES.includes(over.id as Status)
      ? (over.id as Status)
      : tasks.find((t) => t.id === over.id)?.status as Status;

    if (task && newStatus && newStatus !== task.status) {
      updateTask.mutate({ id: task.id, status: newStatus });
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUSES.map((status) => (
          <DroppableColumn key={status} status={status} tasks={tasksByStatus[status]} />
        ))}
      </div>
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} />}
      </DragOverlay>
    </DndContext>
  );
}
