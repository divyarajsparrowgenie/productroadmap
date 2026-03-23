import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Pencil, ChevronUp, ChevronDown, MessageSquare, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import TaskComments from "@/components/TaskComments";
import AssigneeSelector from "@/components/AssigneeSelector";
import {
  useFeature, useVersions, useTasks,
  useCreateVersion, useUpdateVersion, useDeleteVersion,
  useCreateTask, useUpdateTask, useDeleteTask,
  type Version, type Task,
} from "@/hooks/useFeatures";
import { useVersionScoreHistory } from "@/hooks/useScoreHistory";
import { useTaskCommentCount } from "@/hooks/useComments";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import WatchButton from "@/components/WatchButton";
import ArchiveButton from "@/components/ArchiveButton";
import InlineEdit from "@/components/InlineEdit";
import { useArchiveVersion } from "@/hooks/useArchive";
import SprintBoard from "@/components/SprintBoard";
import CustomFieldsPanel from "@/components/CustomFieldsPanel";

const VERSION_STATUSES = ["Planned", "In Progress", "Released", "Completed"];
const TASK_STATUSES = ["Todo", "Doing", "Done"];

function TaskCommentBadge({ taskId }: { taskId: string }) {
  const { data: count = 0 } = useTaskCommentCount(taskId);
  if (count === 0) return null;
  return (
    <Badge variant="secondary" className="h-5 px-1.5 text-xs gap-1">
      <MessageSquare className="h-3 w-3" />
      {count}
    </Badge>
  );
}

function ScoreHistoryChart({ versionId }: { versionId: string }) {
  const { data: history = [] } = useVersionScoreHistory(versionId);
  if (history.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No score history yet. Edit and save the version to record a snapshot.</p>;
  }
  const chartData = history.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString(),
    score: parseFloat((h.wsjf_score ?? 0).toString()),
  }));
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, "auto"]} />
          <Tooltip formatter={(v: number) => v.toFixed(2)} />
          <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function FeatureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: feature } = useFeature(id!);
  const { data: versions = [] } = useVersions(id);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const activeVersionId = selectedVersionId || versions[0]?.id || null;
  const { data: tasks = [] } = useTasks(activeVersionId || undefined);
  const createVersion = useCreateVersion();
  const updateVersion = useUpdateVersion();
  const deleteVersion = useDeleteVersion();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Sort tasks by priority
  const sortedTasks = [...tasks].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  const [vDialogOpen, setVDialogOpen] = useState(false);
  const [vEditId, setVEditId] = useState<string | null>(null);
  const [vName, setVName] = useState("");
  const [vStatus, setVStatus] = useState("Planned");
  const [vDueDate, setVDueDate] = useState("");
  const [vBV, setVBV] = useState(5);
  const [vTC, setVTC] = useState(5);
  const [vRR, setVRR] = useState(5);
  const [vJS, setVJS] = useState(5);

  const [tDialogOpen, setTDialogOpen] = useState(false);
  const [tEditId, setTEditId] = useState<string | null>(null);
  const [tTitle, setTTitle] = useState("");
  const [tDueDate, setTDueDate] = useState("");
  const [tAssigneeId, setTAssigneeId] = useState<string | null>(null);

  const openCreateVersion = () => {
    setVEditId(null); setVName(""); setVStatus("Planned"); setVDueDate("");
    setVBV(5); setVTC(5); setVRR(5); setVJS(5); setVDialogOpen(true);
  };
  const openEditVersion = (v: Version) => {
    setVEditId(v.id); setVName(v.version_name); setVStatus(v.status);
    setVDueDate(v.due_date || ""); setVBV(v.business_value); setVTC(v.time_criticality);
    setVRR(v.risk_reduction); setVJS(v.job_size); setVDialogOpen(true);
  };
  const handleSaveVersion = () => {
    if (!vName.trim()) return;
    const payload = { version_name: vName, status: vStatus, due_date: vDueDate || null, business_value: vBV, time_criticality: vTC, risk_reduction: vRR, job_size: vJS };
    if (vEditId) updateVersion.mutate({ id: vEditId, ...payload });
    else createVersion.mutate({ feature_id: id!, ...payload });
    setVDialogOpen(false);
  };

  const openCreateTask = () => {
    setTEditId(null); setTTitle(""); setTDueDate(""); setTAssigneeId(null); setTDialogOpen(true);
  };
  const openEditTask = (t: Task) => {
    setTEditId(t.id);
    setTTitle(t.title);
    setTDueDate(t.due_date || "");
    setTAssigneeId((t as any).assignee_id ?? null);
    setTDialogOpen(true);
  };
  const handleSaveTask = () => {
    if (!tTitle.trim() || !activeVersionId) return;
    if (tEditId) {
      updateTask.mutate({ id: tEditId, title: tTitle, due_date: tDueDate || null, assignee_id: tAssigneeId } as any);
    } else {
      const maxPriority = tasks.reduce((max, t) => Math.max(max, t.priority ?? 0), 0);
      createTask.mutate({ version_id: activeVersionId, title: tTitle, due_date: tDueDate || null, priority: maxPriority + 1, assignee_id: tAssigneeId } as any);
    }
    setTDialogOpen(false);
  };

  const moveTask = (task: Task, direction: "up" | "down") => {
    const idx = sortedTasks.findIndex((t) => t.id === task.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sortedTasks.length) return;
    const other = sortedTasks[swapIdx];
    updateTask.mutate({ id: task.id, priority: other.priority ?? 0 });
    updateTask.mutate({ id: other.id, priority: task.priority ?? 0 });
  };

  const wsjfScore = vJS > 0 ? ((vBV + vTC + vRR) / vJS).toFixed(1) : "—";
  const archiveVersion = useArchiveVersion();

  if (!feature) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/features")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{feature.title}</h1>
          {feature.description && <p className="text-sm text-muted-foreground">{feature.description}</p>}
        </div>
      </div>

      {/* Versions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Versions</CardTitle>
            <Button size="sm" onClick={openCreateVersion}><Plus className="h-4 w-4 mr-1" /> Add Version</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-28">WSJF</TableHead>
                <TableHead className="w-28">Due Date</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No versions yet.</TableCell></TableRow>
              ) : versions.map((v) => (
                <TableRow
                  key={v.id}
                  className={`cursor-pointer transition-colors ${activeVersionId === v.id ? "bg-accent" : ""} ${v.status === "Completed" ? "opacity-50" : ""}`}
                  onClick={() => setSelectedVersionId(v.id)}
                >
                  <TableCell className="font-medium">{v.version_name}</TableCell>
                  <TableCell>
                    <Select value={v.status} onValueChange={(val) => updateVersion.mutate({ id: v.id, status: val })}>
                      <SelectTrigger className="h-7 text-xs w-28" onClick={(e) => e.stopPropagation()}><SelectValue /></SelectTrigger>
                      <SelectContent>{VERSION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{v.wsjf_score?.toFixed(1) ?? "—"}</TableCell>
                  <TableCell className="text-sm">{v.due_date || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditVersion(v); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteVersion.mutate(v.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      <span onClick={(e) => e.stopPropagation()}>
                        <ArchiveButton label={v.version_name} onConfirm={() => archiveVersion.mutate(v.id)} size="icon" />
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tasks */}
      {activeVersionId && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tasks — {versions.find((v) => v.id === activeVersionId)?.version_name}</CardTitle>
              <Button size="sm" onClick={openCreateTask}><Plus className="h-4 w-4 mr-1" /> Add Task</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Order</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-28">Due Date</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No tasks yet.</TableCell></TableRow>
                ) : sortedTasks.map((t, idx) => (
                  <TableRow key={t.id} className="transition-colors">
                    <TableCell>
                      <div className="flex flex-col items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === 0} onClick={() => moveTask(t, "up")}>
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === sortedTasks.length - 1} onClick={() => moveTask(t, "down")}>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <InlineEdit
                          value={t.title}
                          onSave={(v) => updateTask.mutate({ id: t.id, title: v })}
                          className="font-medium"
                        />
                        <TaskCommentBadge taskId={t.id} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={t.status} onValueChange={(val) => updateTask.mutate({ id: t.id, status: val })}>
                        <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>{TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm">{t.due_date || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <WatchButton taskId={t.id} />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditTask(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTask.mutate(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sprint Board */}
      <Card>
        <CardContent className="pt-6">
          <SprintBoard featureId={id} />
        </CardContent>
      </Card>

      {/* Version Dialog */}
      <Dialog open={vDialogOpen} onOpenChange={setVDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{vEditId ? "Edit Version" : "New Version"}</DialogTitle></DialogHeader>
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              {vEditId && <TabsTrigger value="history" className="flex-1">Score History</TabsTrigger>}
              {vEditId && <TabsTrigger value="custom" className="flex-1">Custom Fields</TabsTrigger>}
            </TabsList>
            <TabsContent value="details" className="space-y-4 mt-4">
              <div><label className="text-sm font-medium">Name</label><Input value={vName} onChange={(e) => setVName(e.target.value)} placeholder="e.g. v1.0" /></div>
              <div><label className="text-sm font-medium">Status</label>
                <Select value={vStatus} onValueChange={setVStatus}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VERSION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Due Date</label><Input type="date" value={vDueDate} onChange={(e) => setVDueDate(e.target.value)} /></div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">WSJF Score: <span className="font-mono text-primary">{wsjfScore}</span></p>
                <div className="space-y-3">
                  {[
                    { label: "Business Value", val: vBV, set: setVBV },
                    { label: "Time Criticality", val: vTC, set: setVTC },
                    { label: "Risk Reduction", val: vRR, set: setVRR },
                    { label: "Job Size", val: vJS, set: setVJS },
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1"><span>{label}</span><span className="font-mono">{val}</span></div>
                      <Slider value={[val]} onValueChange={([v]) => set(v)} min={1} max={10} step={1} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            {vEditId && (
              <TabsContent value="history" className="mt-4">
                <ScoreHistoryChart versionId={vEditId} />
              </TabsContent>
            )}
            {vEditId && (
              <TabsContent value="custom" className="mt-4">
                <CustomFieldsPanel entityId={vEditId} entityType="version" />
              </TabsContent>
            )}
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveVersion} disabled={!vName.trim()}>{vEditId ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={tDialogOpen} onOpenChange={setTDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{tEditId ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Title</label><Input value={tTitle} onChange={(e) => setTTitle(e.target.value)} placeholder="Task title" /></div>
            <div><label className="text-sm font-medium">Due Date</label><Input type="date" value={tDueDate} onChange={(e) => setTDueDate(e.target.value)} /></div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Assignee</label>
              <AssigneeSelector value={tAssigneeId} onChange={setTAssigneeId} />
            </div>
            {tEditId && (
              <>
                <div className="border-t pt-3">
                  <CustomFieldsPanel entityId={tEditId} entityType="task" />
                </div>
                <div className="border-t pt-3">
                  <TaskComments taskId={tEditId} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTask} disabled={!tTitle.trim()}>{tEditId ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
