import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePublicRoadmapToken, useCreatePublicToken, useRevokePublicToken } from "@/hooks/usePublicRoadmap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Globe, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { data: tokenRow } = usePublicRoadmapToken();
  const createToken = useCreatePublicToken();
  const revokeToken = useRevokePublicToken();

  const publicUrl = tokenRow
    ? `${window.location.origin}/public/roadmap/${tokenRow.token}`
    : null;

  const copyUrl = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm">Theme</span>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" />Public Roadmap</CardTitle>
          <CardDescription>Share a read-only view of your roadmap without requiring login.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {publicUrl ? (
            <>
              <div className="flex gap-2">
                <Input value={publicUrl} readOnly className="text-xs font-mono" />
                <Button variant="outline" size="icon" onClick={copyUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => revokeToken.mutate()}
                disabled={revokeToken.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />Revoke Link
              </Button>
            </>
          ) : (
            <Button onClick={() => createToken.mutate()} disabled={createToken.isPending}>
              <Globe className="h-4 w-4 mr-1" />
              {createToken.isPending ? "Creating…" : "Create Public Link"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
