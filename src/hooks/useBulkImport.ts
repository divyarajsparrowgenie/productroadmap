import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export type FeatureRow = { title: string; description?: string };

export type FeatureVersionRow = {
  feature_title: string;
  feature_description?: string;
  version_name: string;
  status?: string;
  due_date?: string;
  business_value?: number;
  time_criticality?: number;
  risk_reduction?: number;
  job_size?: number;
};

export type TaskRow = {
  feature_title: string;
  version_name: string;
  task_title: string;
  status?: string;
  due_date?: string;
  priority?: number;
};

export function useBulkImportFeatures() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (rows: FeatureRow[]) => {
      const { error } = await supabase.from("features").insert(
        rows.map((r) => ({ title: r.title, description: r.description || null, user_id: user?.id }))
      );
      if (error) throw error;
    },
    onSuccess: (_, rows) => {
      qc.invalidateQueries({ queryKey: ["features"] });
      toast.success(`Imported ${rows.length} feature(s)`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkImportFeaturesWithVersions() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (rows: FeatureVersionRow[]) => {
      // Group by feature title
      const featureMap = new Map<string, string>();
      const uniqueFeatures = [...new Map(rows.map((r) => [r.feature_title, r])).values()];

      // Upsert features (insert, ignore conflicts on title using select)
      for (const f of uniqueFeatures) {
        // Try to find existing
        const { data: existing } = await supabase
          .from("features")
          .select("id")
          .eq("title", f.feature_title)
          .maybeSingle();
        if (existing) {
          featureMap.set(f.feature_title, existing.id);
        } else {
          const { data, error } = await supabase
            .from("features")
            .insert({ title: f.feature_title, description: f.feature_description || null, user_id: user?.id })
            .select("id")
            .single();
          if (error) throw error;
          featureMap.set(f.feature_title, data.id);
        }
      }

      // Insert versions
      const versions = rows.map((r) => ({
        feature_id: featureMap.get(r.feature_title)!,
        version_name: r.version_name,
        status: r.status || "Planned",
        due_date: r.due_date || null,
        business_value: r.business_value ?? 1,
        time_criticality: r.time_criticality ?? 1,
        risk_reduction: r.risk_reduction ?? 1,
        job_size: r.job_size ?? 1,
      }));

      const { error } = await supabase.from("versions").insert(versions);
      if (error) throw error;
    },
    onSuccess: (_, rows) => {
      qc.invalidateQueries({ queryKey: ["features"] });
      qc.invalidateQueries({ queryKey: ["versions"] });
      qc.invalidateQueries({ queryKey: ["versions-with-features"] });
      toast.success(`Imported ${rows.length} version(s)`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkImportTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: TaskRow[]) => {
      // Look up each version by (feature_title, version_name)
      const tasks = [];
      for (const r of rows) {
        const { data: feature } = await supabase
          .from("features")
          .select("id")
          .eq("title", r.feature_title)
          .maybeSingle();
        if (!feature) throw new Error(`Feature not found: "${r.feature_title}"`);

        const { data: version } = await supabase
          .from("versions")
          .select("id")
          .eq("feature_id", feature.id)
          .eq("version_name", r.version_name)
          .maybeSingle();
        if (!version) throw new Error(`Version not found: "${r.version_name}" in "${r.feature_title}"`);

        tasks.push({
          version_id: version.id,
          title: r.task_title,
          status: r.status || "Todo",
          due_date: r.due_date || null,
          priority: r.priority ?? 0,
        });
      }

      const { error } = await supabase.from("tasks").insert(tasks);
      if (error) throw error;
    },
    onSuccess: (_, rows) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["all-tasks"] });
      toast.success(`Imported ${rows.length} task(s)`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- CSV Parser ----
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export const CSV_TEMPLATES = {
  features: `title,description\n"My Feature","Optional description"\n"Another Feature",""`,
  featuresVersions: `feature_title,feature_description,version_name,status,due_date,business_value,time_criticality,risk_reduction,job_size\n"My Feature","Desc","v1.0","Planned","2026-06-01",8,7,6,3\n"My Feature","Desc","v2.0","Planned","",5,5,5,2`,
  tasks: `feature_title,version_name,task_title,status,due_date,priority\n"My Feature","v1.0","Build login page","Todo","2026-05-01",1\n"My Feature","v1.0","Write tests","Todo","",2`,
};
