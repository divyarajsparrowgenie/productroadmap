import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useJiraConnection, useSaveJiraConfig, useDeleteJiraConfig, callJiraProxy } from "@/hooks/useJira";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Trash2, Wifi } from "lucide-react";
import { toast } from "sonner";

export default function JiraSetup() {
  const { data: conn, isLoading } = useJiraConnection();
  const save = useSaveJiraConfig();
  const remove = useDeleteJiraConfig();

  const [baseUrl, setBaseUrl] = useState("");
  const [email, setEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [projectKey, setProjectKey] = useState("");

  useEffect(() => {
    if (conn) {
      setBaseUrl(conn.base_url);
      setEmail(conn.email);
      setProjectKey(conn.project_key ?? "");
    }
  }, [conn]);

  const [testing, setTesting] = useState(false);

  const handleSave = () => {
    save.mutate({ base_url: baseUrl.trim(), email: email.trim(), api_token: apiToken, project_key: projectKey.trim() || undefined });
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const me = await callJiraProxy("GET", "myself");
      toast.success(`Connected! Logged in as ${me.emailAddress ?? me.displayName ?? "Jira user"}`);
    } catch (e: any) {
      toast.error(`Connection failed: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Jira Connection
          {conn && <Badge variant="outline" className="text-green-600 border-green-600 gap-1"><CheckCircle className="h-3 w-3" />Connected</Badge>}
        </CardTitle>
        <CardDescription>Connect to your Jira instance to import epics/stories and sync status bidirectionally.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Jira Base URL</label>
            <Input placeholder="https://yourco.atlassian.net" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <Input placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">API Token</label>
            <Input
              type="password"
              placeholder={conn ? "••••••••••••" : "Paste API token"}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-0.5">Generate at: id.atlassian.com/manage-profile/security/api-tokens</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default Project Key (optional)</label>
            <Input placeholder="e.g. MYPROJ" value={projectKey} onChange={(e) => setProjectKey(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleSave} disabled={save.isPending || !baseUrl || !email}>
            {save.isPending ? "Saving…" : conn ? "Update Connection" : "Connect Jira"}
          </Button>
          {conn && (
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              <Wifi className="h-4 w-4 mr-1" />
              {testing ? "Testing…" : "Test Connection"}
            </Button>
          )}
          {conn && (
            <Button variant="destructive" size="sm" onClick={() => remove.mutate()}>
              <Trash2 className="h-4 w-4 mr-1" />Disconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
