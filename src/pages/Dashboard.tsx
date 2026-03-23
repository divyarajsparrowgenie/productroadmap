import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUp, ArrowDown, Minus, Zap, GitCompare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useAllVersionsWithFeatures, useAllTasks } from "@/hooks/useFeatures";
import { PrioritizationMatrix } from "@/components/PrioritizationMatrix";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import CycleTimeChart from "@/components/CycleTimeChart";
import ActivityFeed from "@/components/ActivityFeed";
import WsjfCompare from "@/components/WsjfCompare";

const PIE_COLORS = ["hsl(210, 25%, 93%)", "hsl(216, 70%, 45%)", "hsl(142, 71%, 45%)"];

export default function Dashboard() {
  const { data: versionsWithFeatures = [] } = useAllVersionsWithFeatures();
  const { data: allTasks = [] } = useAllTasks();
  const [compareOpen, setCompareOpen] = useState(false);

  const activeVersions = versionsWithFeatures.filter((v) => v.status !== "Completed");
  const activeVersionIds = new Set(activeVersions.map((v) => v.id));
  const activeTasks = allTasks.filter((t) => activeVersionIds.has(t.version_id));

  const rankedVersions = [...activeVersions]
    .filter((v) => v.wsjf_score != null)
    .sort((a, b) => (b.wsjf_score ?? 0) - (a.wsjf_score ?? 0));

  const statusCounts = useMemo(() => {
    const counts = { Todo: 0, Doing: 0, Done: 0 };
    activeTasks.forEach((t) => { if (t.status in counts) counts[t.status as keyof typeof counts]++; });
    return [{ name: "Todo", value: counts.Todo }, { name: "Doing", value: counts.Doing }, { name: "Done", value: counts.Done }];
  }, [activeTasks]);

  const nextBestTask = useMemo(() => {
    for (const version of rankedVersions) {
      const vTasks = allTasks.filter((t) => t.version_id === version.id && t.status !== "Done");
      if (vTasks.length > 0) {
        const sorted = [...vTasks].sort((a, b) => {
          if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
          if (a.due_date) return -1;
          if (b.due_date) return 1;
          return a.created_at.localeCompare(b.created_at);
        });
        return { task: sorted[0], version, feature: version.feature };
      }
    }
    return null;
  }, [rankedVersions, allTasks]);

  const velocity = useMemo(() => {
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const thisWeek = allTasks.filter((t) => t.completed_at && new Date(t.completed_at) >= startOfThisWeek).length;
    const lastWeek = allTasks.filter((t) => t.completed_at && new Date(t.completed_at) >= startOfLastWeek && new Date(t.completed_at) < startOfThisWeek).length;
    const trend = thisWeek > lastWeek ? "up" : thisWeek < lastWeek ? "down" : "same";

    const weeklyData: { week: string; completed: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(startOfThisWeek);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weeklyData.push({
        week: `W${weekStart.toLocaleDateString("en", { month: "short", day: "numeric" })}`,
        completed: allTasks.filter((t) => t.completed_at && new Date(t.completed_at) >= weekStart && new Date(t.completed_at) < weekEnd).length,
      });
    }
    return { thisWeek, lastWeek, trend, weeklyData };
  }, [allTasks]);

  const deadlineAlerts = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
    return {
      overdueTasks: activeTasks.filter((t) => t.due_date && new Date(t.due_date) < today && t.status !== "Done"),
      upcomingVersions: activeVersions.filter((v) => v.due_date && new Date(v.due_date) >= today && new Date(v.due_date) <= nextWeek),
    };
  }, [activeTasks, activeVersions]);

  const versionProgress = (versionId: string) => {
    const vTasks = allTasks.filter((t) => t.version_id === versionId);
    if (vTasks.length === 0) return 0;
    return Math.round((vTasks.filter((t) => t.status === "Done").length / vTasks.length) * 100);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Next Best Task */}
        <Card className="lg:col-span-2 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Next Best Task</CardTitle>
          </CardHeader>
          <CardContent>
            {nextBestTask ? (
              <div className="space-y-1">
                <p className="text-lg font-semibold">{nextBestTask.task.title}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link to={`/features/${nextBestTask.feature?.id}`} className="text-primary hover:underline">{nextBestTask.feature?.title}</Link>
                  <span>→</span><span>{nextBestTask.version.version_name}</span>
                  {nextBestTask.task.due_date && <><span>·</span><span>Due {nextBestTask.task.due_date}</span></>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">WSJF {nextBestTask.version.wsjf_score?.toFixed(1)}</Badge>
                  <StatusBadge status={nextBestTask.task.status} />
                </div>
              </div>
            ) : <p className="text-muted-foreground text-sm">All caught up! No pending tasks.</p>}
          </CardContent>
        </Card>

        {/* Velocity */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Velocity</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div><p className="text-3xl font-bold">{velocity.thisWeek}</p><p className="text-xs text-muted-foreground">this week</p></div>
              <div className="text-sm text-muted-foreground">
                <p>{velocity.lastWeek} last week</p>
                <div className="flex items-center gap-1">
                  {velocity.trend === "up" && <ArrowUp className="h-3 w-3 text-success" />}
                  {velocity.trend === "down" && <ArrowDown className="h-3 w-3 text-destructive" />}
                  {velocity.trend === "same" && <Minus className="h-3 w-3" />}
                  <span className="text-xs">{velocity.trend === "up" ? "Increasing" : velocity.trend === "down" ? "Decreasing" : "Stable"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prioritization Matrix */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Prioritization Matrix</CardTitle></CardHeader>
        <CardContent>
          {rankedVersions.length > 0 ? (
            <>
              <div className="flex gap-4 mb-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(160, 60%, 50%)" }} />First (High CoD, Low Size)</div>
                <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(195, 60%, 70%)" }} />Consider</div>
                <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(330, 50%, 65%)" }} />Last (Low CoD, High Size)</div>
              </div>
              <PrioritizationMatrix versions={rankedVersions} />
            </>
          ) : <p className="text-sm text-muted-foreground">No versions with WSJF scores yet.</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* WSJF Priority Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">WSJF Priority Ranking</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead className="w-20">WSJF</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-24">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedVersions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No versions to rank yet.</TableCell></TableRow>
                ) : rankedVersions.map((v, i) => (
                  <TableRow key={v.id} className="transition-colors">
                    <TableCell className="text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
                    <TableCell className="font-medium">{v.version_name}</TableCell>
                    <TableCell><Link to={`/features/${v.feature_id}`} className="text-primary hover:underline text-sm">{v.feature?.title}</Link></TableCell>
                    <TableCell className="font-mono text-sm">{v.wsjf_score?.toFixed(1)}</TableCell>
                    <TableCell><StatusBadge status={v.status} /></TableCell>
                    <TableCell className="text-sm">{versionProgress(v.id)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Task Distribution</CardTitle></CardHeader>
            <CardContent>
              {activeTasks.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart><Pie data={statusCounts} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45}>
                      {statusCounts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 text-sm">
                    {statusCounts.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <span className="text-muted-foreground">{s.name}</span>
                        <span className="font-medium">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p className="text-sm text-muted-foreground">No tasks yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {deadlineAlerts.overdueTasks.length === 0 && deadlineAlerts.upcomingVersions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No alerts.</p>
              ) : (
                <>
                  {deadlineAlerts.overdueTasks.map((t) => (
                    <div key={t.id} className="text-sm flex items-start gap-2">
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">OVERDUE</Badge>
                      <span>{t.title}</span>
                    </div>
                  ))}
                  {deadlineAlerts.upcomingVersions.map((v) => (
                    <div key={v.id} className="text-sm flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 border-warning text-warning">DUE SOON</Badge>
                      <span>{v.feature?.title} — {v.version_name} ({v.due_date})</span>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Velocity Chart */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Weekly Velocity</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={velocity.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="week" className="text-xs" tick={{ fill: "hsl(215, 16%, 47%)" }} />
              <YAxis className="text-xs" tick={{ fill: "hsl(215, 16%, 47%)" }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="completed" stroke="hsl(216, 70%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cycle Time</CardTitle>
          </CardHeader>
          <CardContent>
            <CycleTimeChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed limit={15} />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setCompareOpen(true)}>
          <GitCompare className="h-4 w-4 mr-1" />Compare WSJF Scores
        </Button>
      </div>

      <WsjfCompare open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  );
}
