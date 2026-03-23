import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ActivityEntry = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export function useActivityLog(limit = 50) {
  return useQuery({
    queryKey: ["activity-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as ActivityEntry[];
    },
  });
}

export function useLogActivity() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (entry: {
      action: string;
      entity_type: string;
      entity_id?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user) return;
      await supabase.from("activity_log").insert({
        user_id: user.id,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id ?? null,
        metadata: entry.metadata ?? null,
      });
    },
  });
}
