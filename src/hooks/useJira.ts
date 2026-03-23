import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type JiraConnection = {
  id: string;
  user_id: string;
  base_url: string;
  email: string;
  api_token: string;
  project_key: string | null;
  last_sync_at: string | null;
  created_at: string;
};

async function callJiraProxy(method: string, path: string, body?: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/jira-proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ method, path, body }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Jira request failed");
  }
  return res.json();
}

export function useJiraConnection() {
  return useQuery({
    queryKey: ["jira-connection"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jira_connections").select("*").maybeSingle();
      if (error) throw error;
      return data as JiraConnection | null;
    },
  });
}

export function useSaveJiraConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { base_url: string; email: string; api_token: string; project_key?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("jira_connections").upsert({
        user_id: user.id, ...input,
      }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jira-connection"] });
      toast.success("Jira connection saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteJiraConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("jira_connections").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jira-connection"] });
      toast.success("Jira disconnected");
    },
  });
}

export function useJiraProjects() {
  const { data: conn } = useJiraConnection();
  return useQuery({
    queryKey: ["jira-projects"],
    queryFn: async () => {
      const data = await callJiraProxy("GET", "project/search?maxResults=50");
      return (data.values ?? []) as { id: string; key: string; name: string }[];
    },
    enabled: !!conn,
  });
}

export function useJiraImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectKey }: { projectKey: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Fetch epics for this project
      const epicData = await callJiraProxy("GET", `search?jql=project=${projectKey} AND issuetype=Epic&maxResults=50&fields=summary,description,duedate,status`);
      const epics: any[] = epicData.issues ?? [];

      // 2. Create/find Feature for the project
      let featureId: string;
      const { data: existingFeature } = await supabase
        .from("features")
        .select("id")
        .eq("title", projectKey)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingFeature) {
        featureId = existingFeature.id;
      } else {
        const { data: newFeature, error } = await supabase
          .from("features")
          .insert({ title: projectKey, description: `Imported from Jira project ${projectKey}`, user_id: user.id })
          .select("id")
          .single();
        if (error) throw error;
        featureId = newFeature.id;
      }

      let importedVersions = 0;
      let importedTasks = 0;

      // 3. For each epic, create a Version
      for (const epic of epics) {
        let versionId: string;
        const { data: existingVersion } = await supabase
          .from("versions")
          .select("id")
          .eq("jira_epic_key", epic.key)
          .maybeSingle();

        if (existingVersion) {
          versionId = existingVersion.id;
          await supabase.from("versions").update({
            version_name: epic.fields.summary,
            due_date: epic.fields.duedate || null,
            status: mapJiraStatusToVersion(epic.fields.status?.name),
          }).eq("id", versionId);
        } else {
          const { data: newVersion, error } = await supabase
            .from("versions")
            .insert({
              feature_id: featureId,
              version_name: epic.fields.summary,
              jira_epic_key: epic.key,
              due_date: epic.fields.duedate || null,
              status: mapJiraStatusToVersion(epic.fields.status?.name),
              business_value: 5,
              time_criticality: 5,
              risk_reduction: 5,
              job_size: 5,
            })
            .select("id")
            .single();
          if (error) throw error;
          versionId = newVersion.id;
          importedVersions++;
        }

        // 4. Fetch stories for this epic
        const storyData = await callJiraProxy("GET", `search?jql="Epic Link"=${epic.key} OR parent=${epic.key}&maxResults=100&fields=summary,status,duedate,priority`);
        const stories: any[] = storyData.issues ?? [];

        for (const story of stories) {
          const { data: existingTask } = await supabase
            .from("tasks")
            .select("id")
            .eq("jira_issue_key", story.key)
            .maybeSingle();

          if (existingTask) {
            await supabase.from("tasks").update({
              title: story.fields.summary,
              status: mapJiraStatusToTask(story.fields.status?.name),
              due_date: story.fields.duedate || null,
            }).eq("id", existingTask.id);
          } else {
            const maxPriority = await supabase.from("tasks").select("priority").eq("version_id", versionId).order("priority", { ascending: false }).limit(1);
            const nextPriority = ((maxPriority.data?.[0] as any)?.priority ?? 0) + 1;
            await supabase.from("tasks").insert({
              version_id: versionId,
              title: story.fields.summary,
              jira_issue_key: story.key,
              status: mapJiraStatusToTask(story.fields.status?.name),
              due_date: story.fields.duedate || null,
              priority: nextPriority,
            });
            importedTasks++;
          }
        }
      }

      qc.invalidateQueries({ queryKey: ["features"] });
      qc.invalidateQueries({ queryKey: ["versions"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["all-tasks"] });

      return { importedVersions, importedTasks };
    },
    onSuccess: ({ importedVersions, importedTasks }) => {
      toast.success(`Imported ${importedVersions} epics, ${importedTasks} stories from Jira`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useJiraPushTask() {
  return useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: { status?: string; title?: string; due_date?: string | null } }) => {
      const { data: task } = await supabase.from("tasks").select("jira_issue_key").eq("id", taskId).single();
      if (!task?.jira_issue_key) return;

      if (updates.status) {
        // Get available transitions
        const transitions = await callJiraProxy("GET", `issue/${task.jira_issue_key}/transitions`);
        const target = mapTaskStatusToJira(updates.status);
        const transition = transitions.transitions?.find((t: any) =>
          t.name.toLowerCase().includes(target.toLowerCase()) ||
          t.to?.name?.toLowerCase().includes(target.toLowerCase())
        );
        if (transition) {
          await callJiraProxy("POST", `issue/${task.jira_issue_key}/transitions`, {
            transition: { id: transition.id },
          });
        }
      }

      if (updates.title || updates.due_date !== undefined) {
        const body: any = { fields: {} };
        if (updates.title) body.fields.summary = updates.title;
        if (updates.due_date !== undefined) body.fields.duedate = updates.due_date || null;
        await callJiraProxy("PUT", `issue/${task.jira_issue_key}`, body);
      }
    },
    onError: (e: Error) => toast.error(`Jira sync failed: ${e.message}`),
  });
}

export function useJiraCreateIssue() {
  return useMutation({
    mutationFn: async ({ taskId, versionId }: { taskId: string; versionId: string }) => {
      const { data: task } = await supabase.from("tasks").select("*").eq("id", taskId).single();
      const { data: version } = await supabase.from("versions").select("jira_epic_key, feature_id").eq("id", versionId).single();
      if (!task || !version?.jira_epic_key) return;

      const { data: conn } = await supabase.from("jira_connections").select("project_key").maybeSingle();
      if (!conn?.project_key) return;

      const body = {
        fields: {
          project: { key: conn.project_key },
          summary: task.title,
          issuetype: { name: "Story" },
          duedate: task.due_date || undefined,
          parent: { key: version.jira_epic_key },
        },
      };

      const result = await callJiraProxy("POST", "issue", body);
      if (result.key) {
        await supabase.from("tasks").update({ jira_issue_key: result.key }).eq("id", taskId);
      }
      return result.key;
    },
    onError: (e: Error) => toast.error(`Failed to create Jira issue: ${e.message}`),
  });
}

// ---- Status mappers ----
function mapJiraStatusToTask(jiraStatus?: string): string {
  const s = (jiraStatus || "").toLowerCase();
  if (s.includes("done") || s.includes("closed") || s.includes("resolved")) return "Done";
  if (s.includes("progress") || s.includes("review")) return "Doing";
  return "Todo";
}

function mapJiraStatusToVersion(jiraStatus?: string): string {
  const s = (jiraStatus || "").toLowerCase();
  if (s.includes("done") || s.includes("closed")) return "Completed";
  if (s.includes("progress")) return "In Progress";
  if (s.includes("released")) return "Released";
  return "Planned";
}

function mapTaskStatusToJira(status: string): string {
  if (status === "Done") return "Done";
  if (status === "Doing") return "In Progress";
  return "To Do";
}
