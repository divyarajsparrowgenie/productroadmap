import { useParams } from "react-router-dom";
import { useMemo } from "react";
import { usePublicRoadmapData } from "@/hooks/usePublicRoadmap";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, string> = {
  Planned: "bg-slate-400",
  "In Progress": "bg-blue-500",
  Completed: "bg-green-500",
  Released: "bg-purple-500",
};

export default function PublicRoadmap() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = usePublicRoadmapData(token ?? "");

  const grouped = useMemo(() => {
    if (!data) return [];
    return data.features.map((f: any) => ({
      feature: f,
      versions: data.versions.filter((v: any) => v.feature_id === f.id),
    }));
  }, [data]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Loading roadmap…</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl font-semibold text-destructive mb-2">Invalid or expired link</p>
        <p className="text-muted-foreground">This roadmap link is no longer valid.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-bold">Product Roadmap</h1>
        <p className="text-sm text-muted-foreground">Read-only public view</p>
      </header>

      <main className="p-6 space-y-8">
        {grouped.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No roadmap items published yet.</p>
        ) : (
          grouped.map(({ feature, versions }) => (
            <div key={feature.id}>
              <h2 className="text-lg font-semibold mb-3">{feature.title}</h2>
              {feature.description && (
                <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {versions.map((v: any) => (
                  <div
                    key={v.id}
                    className={`rounded-lg border-l-4 p-4 bg-card ${STATUS_COLORS[v.status] ? `border-l-[${STATUS_COLORS[v.status]}]` : "border-l-muted"}`}
                    style={{ borderLeftColor: v.status === "In Progress" ? "hsl(216,70%,45%)" : v.status === "Completed" ? "hsl(142,71%,45%)" : v.status === "Released" ? "hsl(270,50%,60%)" : "hsl(215,16%,70%)" }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-sm">{v.version_name}</p>
                      <StatusBadge status={v.status} />
                    </div>
                    {v.due_date && (
                      <p className="text-xs text-muted-foreground">Due {v.due_date}</p>
                    )}
                    {v.wsjf_score != null && (
                      <Badge variant="outline" className="text-xs mt-2">WSJF {v.wsjf_score.toFixed(1)}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
