import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export type SearchResult = {
  id: string;
  type: "feature" | "version" | "task";
  title: string;
  subtitle?: string;
  url: string;
};

export function useGlobalSearch(query: string) {
  const debouncedQuery = useDebouncedValue(query, 300);
  return useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [] as SearchResult[];
      const q = `%${debouncedQuery.trim()}%`;

      const [featuresRes, versionsRes, tasksRes] = await Promise.all([
        supabase.from("features").select("id, title").ilike("title", q).limit(5),
        supabase.from("versions").select("id, version_name, feature_id, features(title)").ilike("version_name", q).limit(5),
        supabase.from("tasks").select("id, title, version_id, versions(version_name, feature_id, features(title))").ilike("title", q).limit(5),
      ]);

      const results: SearchResult[] = [];

      for (const f of featuresRes.data ?? []) {
        results.push({ id: f.id, type: "feature", title: f.title, url: `/features/${f.id}` });
      }

      for (const v of versionsRes.data ?? []) {
        const feat = (v as any).features;
        results.push({
          id: v.id,
          type: "version",
          title: v.version_name,
          subtitle: feat?.title,
          url: `/features/${v.feature_id}`,
        });
      }

      for (const t of tasksRes.data ?? []) {
        const ver = (t as any).versions;
        const feat = ver?.features;
        results.push({
          id: t.id,
          type: "task",
          title: t.title,
          subtitle: `${feat?.title ?? ""} → ${ver?.version_name ?? ""}`,
          url: `/features/${ver?.feature_id ?? ""}`,
        });
      }

      return results;
    },
    enabled: debouncedQuery.trim().length > 1,
    staleTime: 10_000,
  });
}
