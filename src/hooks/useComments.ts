import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export type TaskComment = {
  id: string;
  task_id: string;
  content: string;
  user_id: string | null;
  created_at: string;
};

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TaskComment[];
    },
    enabled: !!taskId,
  });
}

export function useTaskCommentCount(taskId: string) {
  return useQuery({
    queryKey: ["task-comment-count", taskId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("task_comments")
        .select("id", { count: "exact", head: true })
        .eq("task_id", taskId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!taskId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const { data, error } = await supabase
        .from("task_comments")
        .insert({ task_id: taskId, content, user_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["task-comments", taskId] });
      qc.invalidateQueries({ queryKey: ["task-comment-count", taskId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase.from("task_comments").delete().eq("id", id);
      if (error) throw error;
      return { taskId };
    },
    onSuccess: (_data, { taskId }) => {
      qc.invalidateQueries({ queryKey: ["task-comments", taskId] });
      qc.invalidateQueries({ queryKey: ["task-comment-count", taskId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
