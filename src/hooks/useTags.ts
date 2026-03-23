import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export type Tag = {
  id: string;
  name: string;
  color: string;
  user_id: string | null;
  created_at: string;
};

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*").order("name");
      if (error) throw error;
      return data as Tag[];
    },
  });
}

export function useFeatureTags(featureId: string) {
  return useQuery({
    queryKey: ["feature-tags", featureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_tags")
        .select("tag_id, tags(*)")
        .eq("feature_id", featureId);
      if (error) throw error;
      return (data ?? []).map((row: any) => row.tags as Tag);
    },
    enabled: !!featureId,
  });
}

export function useAllFeatureTags() {
  return useQuery({
    queryKey: ["all-feature-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_tags")
        .select("feature_id, tag_id, tags(id, name, color)");
      if (error) throw error;
      return data as { feature_id: string; tag_id: string; tags: Tag }[];
    },
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from("tags")
        .insert({ ...input, user_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      qc.invalidateQueries({ queryKey: ["all-feature-tags"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetFeatureTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ featureId, tagIds }: { featureId: string; tagIds: string[] }) => {
      // Delete existing tags for this feature
      await supabase.from("feature_tags").delete().eq("feature_id", featureId);
      // Insert new tags
      if (tagIds.length > 0) {
        const { error } = await supabase
          .from("feature_tags")
          .insert(tagIds.map((tag_id) => ({ feature_id: featureId, tag_id })));
        if (error) throw error;
      }
    },
    onSuccess: (_data, { featureId }) => {
      qc.invalidateQueries({ queryKey: ["feature-tags", featureId] });
      qc.invalidateQueries({ queryKey: ["all-feature-tags"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
