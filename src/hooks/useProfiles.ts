import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("display_name");
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useProfile(id: string | null) {
  return useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!id,
  });
}
