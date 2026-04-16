import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Download } from "lucide-react";
import { useJiraConnection, useJiraProjects, useJiraImport } from "@/hooks/useJira";
import { formatDistanceToNow } from "date-fns";

export default function JiraSyncPanel() {
  const { data: conn } = useJiraConnection();
  const { data: projects = [], isError: projectsError, error: projectsErr } = useJiraProjects();
  const importMutation = useJiraImport();
  const [selectedProject, setSelectedProject] = useState<string>("");

  if (!conn) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Jira Sync
          {conn.last_sync_at && (
            <Badge variant="secondary" className="text-xs font-normal">
              Last sync: {formatDistanceToNow(new Date(conn.last_sync_at), { addSuffix: true })}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {projectsError && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            Failed to load Jira projects: {(projectsErr as Error)?.message ?? "Unknown error"}
          </div>
        )}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Import from project</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select Jira project…" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.key}>{p.name} ({p.key})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => selectedProject && importMutation.mutate({ projectKey: selectedProject })}
            disabled={!selectedProject || importMutation.isPending}
          >
            <Download className="h-4 w-4 mr-1" />
            {importMutation.isPending ? "Importing…" : "Import"}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-2">Mapping</p>
          <div className="grid grid-cols-3 gap-1 text-xs">
            <span className="text-muted-foreground">Jira Project</span><span>→</span><span>Feature</span>
            <span className="text-muted-foreground">Jira Epic</span><span>→</span><span>Version</span>
            <span className="text-muted-foreground">Jira Story</span><span>→</span><span>Task</span>
          </div>
          <p className="text-xs mt-2">Status changes sync back to Jira automatically when you update a task.</p>
        </div>
      </CardContent>
    </Card>
  );
}
