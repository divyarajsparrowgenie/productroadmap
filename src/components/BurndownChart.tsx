import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type Task = {
  id: string;
  status: string;
  completed_at?: string | null;
  created_at: string;
};

interface Props {
  tasks: Task[];
  startDate: string;
  endDate: string;
}

export default function BurndownChart({ tasks, startDate, endDate }: Props) {
  const data = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: { date: string; remaining: number; ideal: number }[] = [];
    const total = tasks.length;

    let d = new Date(start);
    let dayIndex = 0;
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));

    while (d <= end) {
      const dateStr = d.toISOString().slice(0, 10);
      const completed = tasks.filter(
        (t) => t.completed_at && t.completed_at.slice(0, 10) <= dateStr
      ).length;
      days.push({
        date: dateStr.slice(5), // MM-DD
        remaining: total - completed,
        ideal: Math.max(0, total - Math.round((total * dayIndex) / totalDays)),
      });
      d = new Date(d.getTime() + 86400000);
      dayIndex++;
    }
    return days;
  }, [tasks, startDate, endDate]);

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215,16%,47%)" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(215,16%,47%)" }} />
        <Tooltip />
        <Line type="monotone" dataKey="remaining" stroke="hsl(216,70%,45%)" strokeWidth={2} dot={false} name="Remaining" />
        <Line type="monotone" dataKey="ideal" stroke="hsl(215,16%,70%)" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Ideal" />
      </LineChart>
    </ResponsiveContainer>
  );
}
