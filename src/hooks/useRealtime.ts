import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        qc.invalidateQueries({ queryKey: ["tasks"] });
        qc.invalidateQueries({ queryKey: ["all-tasks"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "versions" }, () => {
        qc.invalidateQueries({ queryKey: ["versions"] });
        qc.invalidateQueries({ queryKey: ["all-versions"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "features" }, () => {
        qc.invalidateQueries({ queryKey: ["features"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
