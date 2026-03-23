import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useIsWatching(taskId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["watching", taskId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("task_watchers")
        .select("task_id")
        .eq("task_id", taskId)
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!taskId,
  });
}

export function useTaskWatcherIds(taskId: string) {
  return useQuery({
    queryKey: ["task-watchers", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_watchers")
        .select("user_id")
        .eq("task_id", taskId);
      if (error) throw error;
      return (data ?? []).map((r) => r.user_id as string);
    },
    enabled: !!taskId,
  });
}

export function useWatchTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!user) return;
      const { error } = await supabase.from("task_watchers").insert({ task_id: taskId, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: (_data, taskId) => {
      qc.invalidateQueries({ queryKey: ["watching", taskId] });
      qc.invalidateQueries({ queryKey: ["task-watchers", taskId] });
    },
  });
}

export function useUnwatchTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!user) return;
      const { error } = await supabase.from("task_watchers")
        .delete().eq("task_id", taskId).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: (_data, taskId) => {
      qc.invalidateQueries({ queryKey: ["watching", taskId] });
      qc.invalidateQueries({ queryKey: ["task-watchers", taskId] });
    },
  });
}
