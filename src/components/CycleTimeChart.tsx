import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { useActivityLog } from "@/hooks/useActivityLog";

export default function CycleTimeChart() {
  const { data: entries = [] } = useActivityLog(500);

  const data = useMemo(() => {
    // Group status transitions per task
    const taskTransitions: Record<string, { status: string; time: number }[]> = {};

    for (const e of entries) {
      if (e.action === "updated_status" && e.entity_id) {
        const meta = e.metadata as any;
        if (meta?.from && meta?.to) {
          if (!taskTransitions[e.entity_id]) taskTransitions[e.entity_id] = [];
          taskTransitions[e.entity_id].push({
            status: meta.to,
            time: new Date(e.created_at).getTime(),
          });
        }
      }
    }

    const todoToDoing: number[] = [];
    const doingToDone: number[] = [];

    for (const [, transitions] of Object.entries(taskTransitions)) {
      const sorted = transitions.sort((a, b) => a.time - b.time);
      const doingEntry = sorted.find((t) => t.status === "Doing");
      const doneEntry = sorted.find((t) => t.status === "Done");

      if (doingEntry) {
        // Find when it was in Todo before going to Doing
        const before = sorted.filter((t) => t.time < doingEntry.time);
        if (before.length > 0) {
          todoToDoing.push((doingEntry.time - before[before.length - 1].time) / 3600000);
        }
      }

      if (doneEntry && doingEntry && doneEntry.time > doingEntry.time) {
        doingToDone.push((doneEntry.time - doingEntry.time) / 3600000);
      }
    }

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return [
      { stage: "Todo → Doing", hours: parseFloat(avg(todoToDoing).toFixed(1)) },
      { stage: "Doing → Done", hours: parseFloat(avg(doingToDone).toFixed(1)) },
    ];
  }, [entries]);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barSize={40}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "hsl(215,16%,47%)" }} />
        <YAxis unit="h" tick={{ fontSize: 11, fill: "hsl(215,16%,47%)" }} />
        <Tooltip formatter={(v) => [`${v}h`, "Avg cycle time"]} />
        <Bar dataKey="hours" fill="hsl(216,70%,45%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
