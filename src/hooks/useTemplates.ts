import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type VersionTemplate = {
  id: string;
  user_id: string;
  name: string;
  data: {
    version_name: string;
    status: string;
    business_value: number;
    time_criticality: number;
    risk_reduction: number;
    job_size: number;
    tasks: { title: string }[];
  };
  created_at: string;
};

export function useVersionTemplates() {
  return useQuery({
    queryKey: ["version-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("version_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VersionTemplate[];
    },
  });
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { name: string; data: VersionTemplate["data"] }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("version_templates").insert({
        user_id: user.id,
        name: input.name,
        data: input.data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["version-templates"] });
      toast.success("Template saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("version_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["version-templates"] });
      toast.success("Template deleted");
    },
  });
}
