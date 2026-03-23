import { useState } from "react";
import { Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useFeatures, useVersions, useAllTasks } from "@/hooks/useFeatures";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExportScope = "features" | "full";
type ExportFormat = "csv" | "json";

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSVRow(values: (string | number | null | undefined)[]): string {
  return values
    .map((v) => {
      const s = v == null ? "" : String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    })
    .join(",");
}

export default function ExportDialog({ open, onOpenChange }: Props) {
  const [scope, setScope] = useState<ExportScope>("full");
  const [format, setFormat] = useState<ExportFormat>("csv");

  const { data: features = [] } = useFeatures();
  const { data: versions = [] } = useVersions();
  const { data: tasks = [] } = useAllTasks();

  const handleExport = () => {
    if (scope === "features") {
      if (format === "csv") {
        const header = toCSVRow(["id", "title", "description", "created_at"]);
        const rows = features.map((f) => toCSVRow([f.id, f.title, f.description, f.created_at]));
        downloadFile("features.csv", [header, ...rows].join("\n"), "text/csv");
      } else {
        downloadFile("features.json", JSON.stringify(features, null, 2), "application/json");
      }
    } else {
      // Full export: features + versions + tasks
      if (format === "json") {
        const featureMap = new Map(features.map((f) => [f.id, f]));
        const versionMap = new Map(versions.map((v) => [v.id, v]));
        const result = features.map((f) => ({
          ...f,
          versions: versions
            .filter((v) => v.feature_id === f.id)
            .map((v) => ({
              ...v,
              tasks: tasks.filter((t) => t.version_id === v.id),
            })),
        }));
        downloadFile("wsjf-export.json", JSON.stringify(result, null, 2), "application/json");
        return;
      }

      // Flat CSV with all columns
      const header = toCSVRow([
        "feature_id", "feature_title", "feature_description",
        "version_id", "version_name", "version_status", "due_date",
        "business_value", "time_criticality", "risk_reduction", "job_size", "wsjf_score",
        "task_id", "task_title", "task_status", "task_due_date", "task_priority", "completed_at",
      ]);

      const rows: string[] = [];
      for (const f of features) {
        const fVersions = versions.filter((v) => v.feature_id === f.id);
        if (fVersions.length === 0) {
          rows.push(toCSVRow([f.id, f.title, f.description, "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]));
          continue;
        }
        for (const v of fVersions) {
          const vTasks = tasks.filter((t) => t.version_id === v.id);
          if (vTasks.length === 0) {
            rows.push(toCSVRow([f.id, f.title, f.description, v.id, v.version_name, v.status, v.due_date, v.business_value, v.time_criticality, v.risk_reduction, v.job_size, v.wsjf_score, "", "", "", "", "", ""]));
            continue;
          }
          for (const t of vTasks) {
            rows.push(toCSVRow([f.id, f.title, f.description, v.id, v.version_name, v.status, v.due_date, v.business_value, v.time_criticality, v.risk_reduction, v.job_size, v.wsjf_score, t.id, t.title, t.status, t.due_date, t.priority, t.completed_at]));
          }
        }
      }

      downloadFile("wsjf-export.csv", [header, ...rows].join("\n"), "text/csv");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>What to export</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as ExportScope)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full export (Features + Versions + Tasks)</SelectItem>
                <SelectItem value="features">Features only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="json">JSON (.json)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            {scope === "full"
              ? `${features.length} feature(s), ${versions.length} version(s), ${tasks.length} task(s)`
              : `${features.length} feature(s)`}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={features.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
