import { useState, useRef } from "react";
import { Upload, Download, FileText, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  parseCSV,
  CSV_TEMPLATES,
  useBulkImportFeatures,
  useBulkImportFeaturesWithVersions,
  useBulkImportTasks,
  type FeatureRow,
  type FeatureVersionRow,
  type TaskRow,
} from "@/hooks/useBulkImport";

type TabType = "features" | "featuresVersions" | "tasks";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkImportDialog({ open, onOpenChange }: Props) {
  const [tab, setTab] = useState<TabType>("features");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const importFeatures = useBulkImportFeatures();
  const importFeaturesVersions = useBulkImportFeaturesWithVersions();
  const importTasks = useBulkImportTasks();

  const isLoading = importFeatures.isPending || importFeaturesVersions.isPending || importTasks.isPending;

  const tabLabels: Record<TabType, string> = {
    features: "Features",
    featuresVersions: "Features + Versions",
    tasks: "Tasks",
  };

  const templateFiles: Record<TabType, { name: string; content: string }> = {
    features: { name: "features-template.csv", content: CSV_TEMPLATES.features },
    featuresVersions: { name: "features-versions-template.csv", content: CSV_TEMPLATES.featuresVersions },
    tasks: { name: "tasks-template.csv", content: CSV_TEMPLATES.tasks },
  };

  const requiredColumns: Record<TabType, string[]> = {
    features: ["title"],
    featuresVersions: ["feature_title", "version_name"],
    tasks: ["feature_title", "version_name", "task_title"],
  };

  const handleTabChange = (t: string) => {
    setTab(t as TabType);
    setRows([]);
    setFileName("");
    setError("");
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError("No data rows found in file.");
        setRows([]);
        return;
      }
      const required = requiredColumns[tab];
      const headers = Object.keys(parsed[0]);
      const missing = required.filter((c) => !headers.includes(c));
      if (missing.length > 0) {
        setError(`Missing required columns: ${missing.join(", ")}`);
        setRows([]);
        return;
      }
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    try {
      if (tab === "features") {
        const data: FeatureRow[] = rows.map((r) => ({ title: r.title, description: r.description }));
        await importFeatures.mutateAsync(data);
      } else if (tab === "featuresVersions") {
        const data: FeatureVersionRow[] = rows.map((r) => ({
          feature_title: r.feature_title,
          feature_description: r.feature_description,
          version_name: r.version_name,
          status: r.status || undefined,
          due_date: r.due_date || undefined,
          business_value: r.business_value ? parseInt(r.business_value) : undefined,
          time_criticality: r.time_criticality ? parseInt(r.time_criticality) : undefined,
          risk_reduction: r.risk_reduction ? parseInt(r.risk_reduction) : undefined,
          job_size: r.job_size ? parseInt(r.job_size) : undefined,
        }));
        await importFeaturesVersions.mutateAsync(data);
      } else {
        const data: TaskRow[] = rows.map((r) => ({
          feature_title: r.feature_title,
          version_name: r.version_name,
          task_title: r.task_title,
          status: r.status || undefined,
          due_date: r.due_date || undefined,
          priority: r.priority ? parseInt(r.priority) : undefined,
        }));
        await importTasks.mutateAsync(data);
      }
      setRows([]);
      setFileName("");
      onOpenChange(false);
    } catch {
      // error handled by mutation's onError
    }
  };

  const previewCols = rows.length > 0 ? Object.keys(rows[0]) : [];
  const previewRows = rows.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bulk Import CSV</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            {(Object.keys(tabLabels) as TabType[]).map((t) => (
              <TabsTrigger key={t} value={t} className="flex-1">
                {tabLabels[t]}
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(tabLabels) as TabType[]).map((t) => (
            <TabsContent key={t} value={t} className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Required columns:{" "}
                  {requiredColumns[t].map((c) => (
                    <Badge key={c} variant="secondary" className="mr-1 font-mono text-xs">
                      {c}
                    </Badge>
                  ))}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCSV(templateFiles[t].name, templateFiles[t].content)}
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> Download Template
                </Button>
              </div>

              {/* Drop zone */}
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = "";
                  }}
                />
                {fileName ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{fileName}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRows([]);
                        setFileName("");
                        setError("");
                      }}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop a CSV file here, or <span className="text-primary underline">browse</span>
                    </p>
                  </>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {/* Preview */}
              {rows.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Preview — {rows.length} row(s) found, showing first {Math.min(5, rows.length)}
                  </p>
                  <div className="rounded border overflow-auto max-h-48">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {previewCols.map((c) => (
                            <TableHead key={c} className="text-xs whitespace-nowrap">
                              {c}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewRows.map((row, i) => (
                          <TableRow key={i}>
                            {previewCols.map((c) => (
                              <TableCell key={c} className="text-xs max-w-[150px] truncate">
                                {row[c] || <span className="text-muted-foreground italic">empty</span>}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={rows.length === 0 || isLoading}>
            {isLoading ? "Importing..." : `Import ${rows.length > 0 ? rows.length + " row(s)" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
