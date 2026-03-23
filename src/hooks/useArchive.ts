import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useArchiveFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("features")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["features"] });
      toast.success("Feature archived");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUnarchiveFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("features")
        .update({ archived_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["features"] });
      toast.success("Feature restored");
    },
  });
}

export function useArchiveVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("versions")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["versions"] });
      toast.success("Version archived");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUnarchiveVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("versions")
        .update({ archived_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["versions"] });
      toast.success("Version restored");
    },
  });
}

export function useDuplicateFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (featureId: string) => {
      // Fetch feature
      const { data: feature, error: fe } = await supabase
        .from("features")
        .select("*")
        .eq("id", featureId)
        .single();
      if (fe || !feature) throw fe ?? new Error("Feature not found");

      // Insert copy
      const { data: newFeature, error: nfe } = await supabase
        .from("features")
        .insert({ title: `${feature.title} (copy)`, description: feature.description, user_id: feature.user_id })
        .select("id")
        .single();
      if (nfe || !newFeature) throw nfe ?? new Error("Failed to duplicate feature");

      // Fetch versions
      const { data: versions } = await supabase.from("versions").select("*").eq("feature_id", featureId);
      for (const v of versions ?? []) {
        const { data: newVersion } = await supabase
          .from("versions")
          .insert({
            feature_id: newFeature.id,
            version_name: v.version_name,
            status: v.status,
            business_value: v.business_value,
            time_criticality: v.time_criticality,
            risk_reduction: v.risk_reduction,
            job_size: v.job_size,
            due_date: v.due_date,
          })
          .select("id")
          .single();
        if (!newVersion) continue;

        // Fetch tasks for this version
        const { data: tasks } = await supabase.from("tasks").select("*").eq("version_id", v.id);
        for (const t of tasks ?? []) {
          await supabase.from("tasks").insert({
            version_id: newVersion.id,
            title: t.title,
            status: "Todo",
            priority: t.priority,
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["features"] });
      toast.success("Feature duplicated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
