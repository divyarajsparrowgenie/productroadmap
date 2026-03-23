import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type FieldType = "text" | "number" | "date" | "url" | "select" | "checkbox";
export type EntityType = "feature" | "version" | "task";

export type CustomFieldDef = {
  id: string;
  user_id: string;
  name: string;
  field_type: FieldType;
  entity_type: EntityType;
  options: string[] | null;
  created_at: string;
};

export type CustomFieldValue = {
  id: string;
  field_def_id: string;
  entity_id: string;
  value: string | null;
  created_at: string;
};

// ── Definitions ──────────────────────────────────────────────

export function useCustomFieldDefs(entityType?: EntityType) {
  return useQuery({
    queryKey: ["custom-field-defs", entityType],
    queryFn: async () => {
      let q = supabase.from("custom_field_defs").select("*").order("created_at");
      if (entityType) q = q.eq("entity_type", entityType);
      const { data, error } = await q;
      if (error) throw error;
      return data as CustomFieldDef[];
    },
  });
}

export function useCreateCustomFieldDef() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      field_type: FieldType;
      entity_type: EntityType;
      options?: string[];
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("custom_field_defs")
        .insert({
          user_id: user.id,
          name: input.name,
          field_type: input.field_type,
          entity_type: input.entity_type,
          options: input.options?.length ? input.options : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-field-defs"] });
      toast.success("Custom field created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCustomFieldDef() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; options?: string[] }) => {
      const { error } = await supabase.from("custom_field_defs").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-field-defs"] });
      toast.success("Field updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCustomFieldDef() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_field_defs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-field-defs"] });
      qc.invalidateQueries({ queryKey: ["custom-field-values"] });
      toast.success("Field deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Values ────────────────────────────────────────────────────

export function useCustomFieldValues(entityId: string) {
  return useQuery({
    queryKey: ["custom-field-values", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_field_values")
        .select("*")
        .eq("entity_id", entityId);
      if (error) throw error;
      return data as CustomFieldValue[];
    },
    enabled: !!entityId,
  });
}

export function useSetCustomFieldValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fieldDefId,
      entityId,
      value,
    }: {
      fieldDefId: string;
      entityId: string;
      value: string | null;
    }) => {
      if (value === null || value === "") {
        // Delete the value if cleared
        await supabase
          .from("custom_field_values")
          .delete()
          .eq("field_def_id", fieldDefId)
          .eq("entity_id", entityId);
      } else {
        const { error } = await supabase.from("custom_field_values").upsert(
          { field_def_id: fieldDefId, entity_id: entityId, value },
          { onConflict: "field_def_id,entity_id" }
        );
        if (error) throw error;
      }
    },
    onSuccess: (_d, { entityId }) => {
      qc.invalidateQueries({ queryKey: ["custom-field-values", entityId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
