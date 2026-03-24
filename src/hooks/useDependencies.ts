import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type VersionDependency = {
  id: string;
  source_id: string;
  target_id: string;
  dependency_type: string;
  created_at: string;
};

export function useVersionDependencies() {
  return useQuery({
    queryKey: ["version-dependencies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("version_dependencies").select("*");
      if (error) throw error;
      return data as VersionDependency[];
    },
  });
}

export function useCreateDependency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { source_id: string; target_id: string; dependency_type?: string }) => {
      const { error } = await supabase.from("version_dependencies").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["version-dependencies"] });
      toast.success("Dependency added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDependency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("version_dependencies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["version-dependencies"] });
      toast.success("Dependency removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
