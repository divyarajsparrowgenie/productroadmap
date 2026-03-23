import JiraSetup from "@/components/JiraSetup";
import JiraSyncPanel from "@/components/JiraSyncPanel";
import { useJiraConnection } from "@/hooks/useJira";

export default function JiraIntegration() {
  const { data: conn } = useJiraConnection();

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jira Integration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bidirectional sync between WSJF Focus Tracker and Jira. Projects → Features, Epics → Versions, Stories → Tasks.
        </p>
      </div>

      <JiraSetup />

      {conn && <JiraSyncPanel />}
    </div>
  );
}
