import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type ProfileData = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  wsjf_bv_weight: number;
  wsjf_tc_weight: number;
  wsjf_rr_weight: number;
};

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bvWeight, setBvWeight] = useState(1);
  const [tcWeight, setTcWeight] = useState(1);
  const [rrWeight, setRrWeight] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setProfile(data as ProfileData);
        setDisplayName(data.display_name ?? "");
        setBvWeight(data.wsjf_bv_weight ?? 1);
        setTcWeight(data.wsjf_tc_weight ?? 1);
        setRrWeight(data.wsjf_rr_weight ?? 1);
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName.trim() || null,
      wsjf_bv_weight: bvWeight,
      wsjf_tc_weight: tcWeight,
      wsjf_rr_weight: rrWeight,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Personal Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Email</label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Display Name</label>
            <Input
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">WSJF Weights</CardTitle>
          <p className="text-xs text-muted-foreground">
            Customize how each factor is weighted in the WSJF formula: (BV×w + TC×w + RR×w) / JS
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { label: "Business Value", value: bvWeight, onChange: setBvWeight },
            { label: "Time Criticality", value: tcWeight, onChange: setTcWeight },
            { label: "Risk Reduction", value: rrWeight, onChange: setRrWeight },
          ].map(({ label, value, onChange }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-2">
                <span>{label}</span>
                <span className="font-mono text-primary">{value.toFixed(1)}×</span>
              </div>
              <Slider
                min={0.1}
                max={3}
                step={0.1}
                value={[value]}
                onValueChange={([v]) => onChange(v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Profile"}
      </Button>
    </div>
  );
}
