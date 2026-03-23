import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ScoreHistoryEntry = {
  id: string;
  version_id: string;
  business_value: number;
  time_criticality: number;
  risk_reduction: number;
  job_size: number;
  wsjf_score: number | null;
  recorded_at: string;
};

export function useVersionScoreHistory(versionId: string) {
  return useQuery({
    queryKey: ["score-history", versionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("version_score_history")
        .select("*")
        .eq("version_id", versionId)
        .order("recorded_at", { ascending: true });
      if (error) throw error;
      return data as ScoreHistoryEntry[];
    },
    enabled: !!versionId,
  });
}
