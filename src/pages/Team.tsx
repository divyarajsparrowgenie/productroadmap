import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Mail, BarChart2, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

type ProfileWithCount = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  wsjf_bv_weight: number | null;
  wsjf_tc_weight: number | null;
  wsjf_rr_weight: number | null;
  updated_at: string | null;
  feature_count: number;
  email: string | null;
};

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

function AvatarCircle({ name, email, avatarUrl }: { name: string | null; email: string | null; avatarUrl: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name ?? "user"} className="w-12 h-12 rounded-full object-cover" />;
  }
  return (
    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
      {getInitials(name, email)}
    </div>
  );
}

export default function Team() {
  const { user } = useAuth();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["team-profiles"],
    queryFn: async () => {
      // Fetch profiles
      const { data: profilesData, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .order("updated_at", { ascending: false, nullsFirst: true });
      if (pErr) throw pErr;

      // Fetch feature counts per user
      const { data: features, error: fErr } = await supabase
        .from("features")
        .select("user_id");
      if (fErr) throw fErr;

      const countMap: Record<string, number> = {};
      for (const f of features ?? []) {
        if (f.user_id) countMap[f.user_id] = (countMap[f.user_id] ?? 0) + 1;
      }

      // Fetch emails from auth (only available for current user via auth.getUser)
      const { data: { user: authUser } } = await supabase.auth.getUser();

      return (profilesData ?? []).map((p: any) => ({
        ...p,
        feature_count: countMap[p.id] ?? 0,
        email: p.id === authUser?.id ? authUser?.email ?? null : null,
      })) as ProfileWithCount[];
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">Team</h1>
        {profiles && (
          <Badge variant="secondary">{profiles.length} member{profiles.length !== 1 ? "s" : ""}</Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(profiles ?? []).map((profile) => (
            <Card key={profile.id} className={profile.id === user?.id ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AvatarCircle name={profile.display_name} email={profile.email} avatarUrl={profile.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">
                        {profile.display_name ?? "Unnamed User"}
                      </p>
                      {profile.id === user?.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    {profile.email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                        <Mail className="h-3 w-3 shrink-0" /> {profile.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BarChart2 className="h-3.5 w-3.5" />
                    {profile.feature_count} feature{profile.feature_count !== 1 ? "s" : ""}
                  </span>
                  {profile.updated_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(profile.updated_at), "MMM d, yyyy")}
                    </span>
                  )}
                </div>

                {/* WSJF weights */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: "BV", value: profile.wsjf_bv_weight },
                    { label: "TC", value: profile.wsjf_tc_weight },
                    { label: "RR", value: profile.wsjf_rr_weight },
                  ].map(({ label, value }) => (
                    <span key={label} className="text-xs bg-muted px-2 py-0.5 rounded">
                      {label}: <span className="font-medium">{value?.toFixed(1) ?? "1.0"}x</span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!profiles || profiles.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No team members found.</p>
        </div>
      )}
    </div>
  );
}
