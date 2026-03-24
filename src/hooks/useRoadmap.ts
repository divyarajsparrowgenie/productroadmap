import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  subDays, addDays,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  startOfYear, endOfYear,
  format, addWeeks, addMonths, addYears,
} from "date-fns";
import type { Feature, Version } from "./useFeatures";

export type ZoomLevel = "week" | "month" | "quarter" | "year";

export type TimeUnit = {
  label: string;
  start: Date;
  end: Date;
};

export type GanttBar = {
  versionId: string;
  featureId: string;
  label: string;
  startDate: Date;
  endDate: Date;
  status: string;
  progress: number;
  color: string;
  leftPct: number;
  widthPct: number;
};

export type MilestoneItem = {
  id: string;
  featureId: string;
  title: string;
  date: Date;
  color: string | null;
  leftPct: number;
};

export type DependencyItem = {
  id: string;
  sourceId: string;
  targetId: string;
  dependencyType: string;
};

export type FeatureGroup = {
  feature: Feature;
  versions: GanttBar[];
  summaryStart: Date | null;
  summaryEnd: Date | null;
  summaryLeftPct: number;
  summaryWidthPct: number;
  milestones: MilestoneItem[];
};

export const STATUS_COLORS_HEX: Record<string, string> = {
  Planned: "#94a3b8",
  "In Progress": "#3b82f6",
  Released: "#a855f7",
  Completed: "#22c55e",
};

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function startOfQuarter(date: Date): Date {
  const q = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), q * 3, 1);
}

function endOfQuarter(date: Date): Date {
  const q = Math.floor(date.getMonth() / 3);
  const nextQStart = new Date(date.getFullYear(), (q + 1) * 3, 1);
  return new Date(nextQStart.getTime() - 1);
}

function eachWeeksInInterval(start: Date, end: Date): Date[] {
  const weeks: Date[] = [];
  let cur = startOfWeek(start, { weekStartsOn: 1 });
  while (cur <= end) {
    weeks.push(new Date(cur));
    cur = addWeeks(cur, 1);
  }
  return weeks;
}

function eachMonthsInInterval(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  let cur = startOfMonth(start);
  while (cur <= end) {
    months.push(new Date(cur));
    cur = addMonths(cur, 1);
  }
  return months;
}

function eachQuartersInInterval(start: Date, end: Date): Date[] {
  const quarters: Date[] = [];
  let cur = startOfQuarter(start);
  while (cur <= end) {
    quarters.push(new Date(cur));
    const nextQ = new Date(cur.getFullYear(), cur.getMonth() + 3, 1);
    cur = nextQ;
  }
  return quarters;
}

function eachYearsInInterval(start: Date, end: Date): Date[] {
  const years: Date[] = [];
  let cur = startOfYear(start);
  while (cur <= end) {
    years.push(new Date(cur));
    cur = addYears(cur, 1);
  }
  return years;
}

function computeTimeUnits(zoom: ZoomLevel, minDate: Date, maxDate: Date): TimeUnit[] {
  switch (zoom) {
    case "week": {
      const weeks = eachWeeksInInterval(minDate, maxDate);
      return weeks.map((w) => ({
        label: `W${format(w, "ww")} ${format(w, "MMM d")}`,
        start: startOfWeek(w, { weekStartsOn: 1 }),
        end: endOfWeek(w, { weekStartsOn: 1 }),
      }));
    }
    case "month": {
      const months = eachMonthsInInterval(minDate, maxDate);
      return months.map((m) => ({
        label: format(m, "MMM yyyy"),
        start: startOfMonth(m),
        end: endOfMonth(m),
      }));
    }
    case "quarter": {
      const quarters = eachQuartersInInterval(minDate, maxDate);
      return quarters.map((q) => ({
        label: `Q${Math.floor(q.getMonth() / 3) + 1} ${q.getFullYear()}`,
        start: startOfQuarter(q),
        end: endOfQuarter(q),
      }));
    }
    case "year": {
      const years = eachYearsInInterval(minDate, maxDate);
      return years.map((y) => ({
        label: format(y, "yyyy"),
        start: startOfYear(y),
        end: endOfYear(y),
      }));
    }
  }
}

export function useRoadmap(zoom: ZoomLevel) {
  const versionsQuery = useQuery({
    queryKey: ["versions-with-features"],
    queryFn: async () => {
      const { data: versions, error: vErr } = await supabase
        .from("versions")
        .select("*")
        .order("wsjf_score", { ascending: false, nullsFirst: false });
      if (vErr) throw vErr;
      const { data: features, error: fErr } = await supabase.from("features").select("*");
      if (fErr) throw fErr;
      return { versions: versions as Version[], features: features as Feature[] };
    },
  });

  const tasksQuery = useQuery({
    queryKey: ["roadmap-task-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("version_id, status");
      if (error) throw error;
      const map: Record<string, { total: number; done: number }> = {};
      for (const t of data ?? []) {
        if (!map[t.version_id]) map[t.version_id] = { total: 0, done: 0 };
        map[t.version_id].total++;
        if (t.status === "Done") map[t.version_id].done++;
      }
      return map;
    },
  });

  const milestonesQuery = useQuery({
    queryKey: ["milestones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("milestones").select("*").order("date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const depsQuery = useQuery({
    queryKey: ["version-dependencies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("version_dependencies").select("*");
      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        id: d.id,
        sourceId: d.source_id,
        targetId: d.target_id,
        dependencyType: d.dependency_type,
      })) as DependencyItem[];
    },
  });

  const isLoading = versionsQuery.isLoading || tasksQuery.isLoading;

  const { featureGroups, timeUnits, minDate, maxDate, totalMs } = (() => {
    if (!versionsQuery.data) {
      return {
        featureGroups: [],
        timeUnits: [],
        minDate: new Date(),
        maxDate: new Date(),
        totalMs: 1,
      };
    }

    const { versions, features } = versionsQuery.data;
    const taskCountMap = tasksQuery.data ?? {};
    const milestones = milestonesQuery.data ?? [];

    const allDates: Date[] = [];
    for (const v of versions) {
      if (v.due_date) allDates.push(new Date(v.due_date));
      if ((v as any).start_date) allDates.push(new Date((v as any).start_date));
    }
    for (const m of milestones) {
      if (m.date) allDates.push(new Date(m.date));
    }

    const now = new Date();
    if (allDates.length === 0) allDates.push(now);

    const rawMin = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const rawMax = new Date(Math.max(...allDates.map((d) => d.getTime())));

    const pad = zoom === "week" ? 14 : zoom === "month" ? 30 : 60;
    const minDate = subDays(rawMin, pad);
    const maxDate = addDays(rawMax, pad);
    const totalMs = Math.max(maxDate.getTime() - minDate.getTime(), 1);

    const timeUnits = computeTimeUnits(zoom, minDate, maxDate);

    function toPct(date: Date) {
      return clamp(((date.getTime() - minDate.getTime()) / totalMs) * 100, 0, 100);
    }

    const featureMap = new Map(features.map((f) => [f.id, f]));
    const groupMap = new Map<string, GanttBar[]>();

    for (const v of versions) {
      if ((v as any).archived_at) continue;
      if (!v.due_date && !(v as any).start_date) continue;

      const endDate = v.due_date
        ? new Date(v.due_date)
        : addDays(new Date((v as any).start_date), 14);
      const startDate = (v as any).start_date
        ? new Date((v as any).start_date)
        : subDays(endDate, 14);

      const leftPct = toPct(startDate);
      const rightPct = toPct(endDate);
      const widthPct = Math.max(rightPct - leftPct, 0.5);

      const counts = taskCountMap[v.id] ?? { total: 0, done: 0 };
      const progress = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

      const feature = featureMap.get(v.feature_id);
      const color = (feature as any)?.color ?? STATUS_COLORS_HEX[v.status] ?? "#6366f1";

      const bar: GanttBar = {
        versionId: v.id,
        featureId: v.feature_id,
        label: v.version_name,
        startDate,
        endDate,
        status: v.status,
        progress,
        color,
        leftPct,
        widthPct,
      };

      if (!groupMap.has(v.feature_id)) groupMap.set(v.feature_id, []);
      groupMap.get(v.feature_id)!.push(bar);
    }

    const featureGroups: FeatureGroup[] = features
      .filter((f) => !(f as any).archived_at && groupMap.has(f.id))
      .map((f) => {
        const bars = groupMap.get(f.id) ?? [];
        const featureMilestones = milestones
          .filter((m: any) => m.feature_id === f.id)
          .map((m: any) => ({
            id: m.id,
            featureId: m.feature_id,
            title: m.title,
            date: new Date(m.date),
            color: m.color,
            leftPct: toPct(new Date(m.date)),
          }));

        let summaryStart: Date | null = null;
        let summaryEnd: Date | null = null;
        for (const b of bars) {
          if (!summaryStart || b.startDate < summaryStart) summaryStart = b.startDate;
          if (!summaryEnd || b.endDate > summaryEnd) summaryEnd = b.endDate;
        }

        const summaryLeftPct = summaryStart ? toPct(summaryStart) : 0;
        const summaryRightPct = summaryEnd ? toPct(summaryEnd) : 0;
        const summaryWidthPct = Math.max(summaryRightPct - summaryLeftPct, 0.5);

        return {
          feature: f,
          versions: bars,
          summaryStart,
          summaryEnd,
          summaryLeftPct,
          summaryWidthPct,
          milestones: featureMilestones,
        };
      });

    return { featureGroups, timeUnits, minDate, maxDate, totalMs };
  })();

  return {
    featureGroups,
    timeUnits,
    minDate,
    maxDate,
    totalMs,
    dependencies: (depsQuery.data ?? []) as DependencyItem[],
    isLoading,
  };
}
