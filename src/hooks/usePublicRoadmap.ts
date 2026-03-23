import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function usePublicRoadmapToken() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["public-roadmap-token"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("public_roadmap_tokens")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; user_id: string; token: string; created_at: string } | null;
    },
    enabled: !!user,
  });
}

export function useCreatePublicToken() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("public_roadmap_tokens")
        .insert({ user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-roadmap-token"] });
      toast.success("Public roadmap link created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRevokePublicToken() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("public_roadmap_tokens")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-roadmap-token"] });
      toast.success("Public link revoked");
    },
  });
}

export function usePublicRoadmapData(token: string) {
  return useQuery({
    queryKey: ["public-roadmap-data", token],
    queryFn: async () => {
      // Find the token
      const { data: tokenRow, error: tokenErr } = await supabase
        .from("public_roadmap_tokens")
        .select("user_id")
        .eq("token", token)
        .maybeSingle();
      if (tokenErr || !tokenRow) throw new Error("Invalid or expired token");

      const userId = tokenRow.user_id;

      // Fetch features for this user
      const { data: features, error: fe } = await supabase
        .from("features")
        .select("*")
        .eq("user_id", userId)
        .is("archived_at", null);
      if (fe) throw fe;

      const featureIds = (features ?? []).map((f: any) => f.id);

      // Fetch versions for these features
      const { data: versions, error: ve } = await supabase
        .from("versions")
        .select("*")
        .in("feature_id", featureIds.length ? featureIds : ["00000000-0000-0000-0000-000000000000"])
        .is("archived_at", null);
      if (ve) throw ve;

      return { features: features ?? [], versions: versions ?? [] };
    },
    enabled: !!token,
  });
}
