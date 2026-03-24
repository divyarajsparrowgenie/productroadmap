import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Milestone = {
  id: string;
  feature_id: string;
  title: string;
  date: string;
  color: string | null;
  created_at: string;
};

export function useMilestones(featureId?: string) {
  return useQuery({
    queryKey: ["milestones", featureId],
    queryFn: async () => {
      let query = supabase.from("milestones").select("*").order("date", { ascending: true });
      if (featureId) query = query.eq("feature_id", featureId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Milestone[];
    },
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { feature_id: string; title: string; date: string; color?: string }) => {
      const { error } = await supabase.from("milestones").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["milestones"] });
      toast.success("Milestone added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; title?: string; date?: string; color?: string }) => {
      const { error } = await supabase.from("milestones").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["milestones"] });
      toast.success("Milestone updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("milestones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["milestones"] });
      toast.success("Milestone deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
