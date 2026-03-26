import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

async function logActivity(userId: string | undefined, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) {
  if (!userId) return;
  await supabase.from("activity_log").insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId ?? null, metadata: metadata ?? null });
}

export type Feature = {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  archived_at: string | null;
  created_at: string;
};

export type Version = {
  id: string;
  feature_id: string;
  version_name: string;
  status: string;
  start_date: string | null;
  due_date: string | null;
  business_value: number;
  time_criticality: number;
  risk_reduction: number;
  job_size: number;
  wsjf_score: number | null;
  archived_at: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  version_id: string;
  title: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  priority: number;
};

export function useFeatures() {
  return useQuery({
    queryKey: ["features"],
    queryFn: async () => {
      const { data, error } = await supabase.from("features").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data as Feature[];
    },
  });
}

export function useFeature(id: string) {
  return useQuery({
    queryKey: ["features", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("features").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Feature;
    },
    enabled: !!id,
  });
}

export function useVersions(featureId?: string) {
  return useQuery({
    queryKey: ["versions", featureId],
    queryFn: async () => {
      let query = supabase.from("versions").select("*").order("wsjf_score", { ascending: false, nullsFirst: false });
      if (featureId) query = query.eq("feature_id", featureId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Version[];
    },
  });
}

export function useTasks(versionId?: string) {
  return useQuery({
    queryKey: ["tasks", versionId],
    queryFn: async () => {
      let query = supabase.from("tasks").select("*").order("created_at", { ascending: true });
      if (versionId) query = query.eq("version_id", versionId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
  });
}

export function useAllVersionsWithFeatures() {
  return useQuery({
    queryKey: ["versions-with-features"],
    queryFn: async () => {
      const { data: versions, error: vErr } = await supabase
        .from("versions")
        .select("*")
        .order("wsjf_score", { ascending: false, nullsFirst: false });
      if (vErr) throw vErr;

      const { data: features, error: fErr } = await supabase.from("features").select("*");
      if (fErr) throw fErr;

      const featureMap = new Map((features ?? []).map((f: Feature) => [f.id, f]));
      return (versions ?? []).map((v: Version) => ({
        ...v,
        feature: featureMap.get(v.feature_id),
      }));
    },
  });
}

export function useAllTasks() {
  return useQuery({
    queryKey: ["all-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
  });
}

export function useCreateFeature() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { title: string; description?: string }) => {
      const { data, error } = await supabase
        .from("features")
        .insert({ ...input, user_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      await logActivity(user?.id, "created_feature", "feature", (data as any).id, { title: input.title });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["features"] });
      qc.invalidateQueries({ queryKey: ["activity-log"] });
      toast.success("Feature created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; title?: string; description?: string; color?: string | null }) => {
      const { error } = await supabase.from("features").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["features"] });
      toast.success("Feature updated");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("features").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["features"] });
      toast.success("Feature deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useCreateVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      feature_id: string;
      version_name: string;
      status?: string;
      start_date?: string | null;
      due_date?: string | null;
      business_value?: number;
      time_criticality?: number;
      risk_reduction?: number;
      job_size?: number;
    }) => {
      const { data, error } = await supabase.from("versions").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["versions"] });
      qc.invalidateQueries({ queryKey: ["versions-with-features"] });
      qc.invalidateQueries({ queryKey: ["roadmap-versions-features"] });
      toast.success("Version created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      id: string;
      version_name?: string;
      status?: string;
      start_date?: string | null;
      due_date?: string | null;
      business_value?: number;
      time_criticality?: number;
      risk_reduction?: number;
      job_size?: number;
    }) => {
      const { error } = await supabase.from("versions").update(input).eq("id", id);
      if (error) throw error;
      // Record score snapshot if WSJF inputs changed
      if (
        input.business_value !== undefined ||
        input.time_criticality !== undefined ||
        input.risk_reduction !== undefined ||
        input.job_size !== undefined
      ) {
        // Fetch the current version to get all score fields
        const { data: v } = await supabase.from("versions").select("business_value,time_criticality,risk_reduction,job_size,wsjf_score").eq("id", id).single();
        if (v) {
          await supabase.from("version_score_history").insert({
            version_id: id,
            business_value: v.business_value,
            time_criticality: v.time_criticality,
            risk_reduction: v.risk_reduction,
            job_size: v.job_size,
            wsjf_score: v.wsjf_score,
          });
        }
      }
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["versions"] });
      qc.invalidateQueries({ queryKey: ["versions-with-features"] });
      qc.invalidateQueries({ queryKey: ["roadmap-versions-features"] });
      qc.invalidateQueries({ queryKey: ["score-history", id] });
      toast.success("Version updated");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("versions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["versions"] });
      qc.invalidateQueries({ queryKey: ["versions-with-features"] });
      qc.invalidateQueries({ queryKey: ["roadmap-versions-features"] });
      toast.success("Version deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { version_id: string; title: string; status?: string; due_date?: string | null; priority?: number }) => {
      const { data, error } = await supabase.from("tasks").insert(input).select().single();
      if (error) throw error;
      await logActivity(user?.id, "created_task", "task", (data as any).id, { title: input.title });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["all-tasks"] });
      qc.invalidateQueries({ queryKey: ["activity-log"] });
      toast.success("Task created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      id: string;
      title?: string;
      status?: string;
      due_date?: string | null;
      completed_at?: string | null;
      priority?: number;
      [key: string]: unknown;
    }) => {
      // Fetch current status for logging
      let prevStatus: string | undefined;
      if (input.status) {
        const { data: curr } = await supabase.from("tasks").select("status").eq("id", id).single();
        prevStatus = curr?.status;
      }
      // Auto-set completed_at when status changes to Done
      if (input.status === "Done" && !input.completed_at) {
        input.completed_at = new Date().toISOString();
      }
      if (input.status && input.status !== "Done") {
        input.completed_at = null;
      }
      const { error } = await supabase.from("tasks").update(input).eq("id", id);
      if (error) throw error;
      if (input.status && prevStatus !== input.status) {
        await logActivity(user?.id, "updated_status", "task", id, { from: prevStatus, to: input.status });
      } else if (input.title) {
        await logActivity(user?.id, "updated_task", "task", id, { title: input.title });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["all-tasks"] });
      qc.invalidateQueries({ queryKey: ["activity-log"] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["all-tasks"] });
      toast.success("Task deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}
