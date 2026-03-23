import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Sprint = {
  id: string;
  feature_id: string | null;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export function useSprints(featureId?: string) {
  return useQuery({
    queryKey: ["sprints", featureId],
    queryFn: async () => {
      let q = supabase.from("sprints").select("*").order("start_date", { ascending: true });
      if (featureId) q = q.eq("feature_id", featureId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Sprint[];
    },
  });
}

export function useAllSprints() {
  return useQuery({
    queryKey: ["sprints"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sprints").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return data as Sprint[];
    },
  });
}

export function useSprintTasks(sprintId: string) {
  return useQuery({
    queryKey: ["sprint-tasks", sprintId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sprint_tasks")
        .select("task_id, tasks(*)")
        .eq("sprint_id", sprintId);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.tasks);
    },
    enabled: !!sprintId,
  });
}

export function useCreateSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { feature_id?: string; name: string; goal?: string; start_date?: string; end_date?: string }) => {
      const { data, error } = await supabase.from("sprints").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sprints"] });
      toast.success("Sprint created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; goal?: string; start_date?: string; end_date?: string }) => {
      const { error } = await supabase.from("sprints").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sprints"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sprints").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sprints"] });
      toast.success("Sprint deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddTaskToSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sprintId, taskId }: { sprintId: string; taskId: string }) => {
      const { error } = await supabase.from("sprint_tasks").insert({ sprint_id: sprintId, task_id: taskId });
      if (error) throw error;
    },
    onSuccess: (_d, { sprintId }) => qc.invalidateQueries({ queryKey: ["sprint-tasks", sprintId] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveTaskFromSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sprintId, taskId }: { sprintId: string; taskId: string }) => {
      const { error } = await supabase.from("sprint_tasks").delete().eq("sprint_id", sprintId).eq("task_id", taskId);
      if (error) throw error;
    },
    onSuccess: (_d, { sprintId }) => qc.invalidateQueries({ queryKey: ["sprint-tasks", sprintId] }),
  });
}
