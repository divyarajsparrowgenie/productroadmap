import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Pencil, Search, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useFeatures, useVersions, useAllTasks, useCreateFeature, useUpdateFeature, useDeleteFeature } from "@/hooks/useFeatures";
import BulkImportDialog from "@/components/BulkImportDialog";
import ExportDialog from "@/components/ExportDialog";
import TagBadge from "@/components/TagBadge";
import TagSelector from "@/components/TagSelector";
import { useAllFeatureTags, useSetFeatureTags } from "@/hooks/useTags";

export default function Features() {
  const { data: features = [] } = useFeatures();
  const { data: versions = [] } = useVersions();
  const { data: tasks = [] } = useAllTasks();
  const { data: allFeatureTags = [] } = useAllFeatureTags();
  const createFeature = useCreateFeature();
  const updateFeature = useUpdateFeature();
  const deleteFeature = useDeleteFeature();
  const setFeatureTags = useSetFeatureTags();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // Build feature->tags map
  const featureTagsMap = useMemo(() => {
    const map = new Map<string, typeof allFeatureTags>();
    for (const ft of allFeatureTags) {
      const arr = map.get(ft.feature_id) ?? [];
      arr.push(ft);
      map.set(ft.feature_id, arr);
    }
    return map;
  }, [allFeatureTags]);

  const filteredFeatures = useMemo(() => {
    if (!search.trim()) return features;
    const q = search.toLowerCase();
    return features.filter((f) => f.title.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q));
  }, [features, search]);

  const getFeatureStats = (featureId: string) => {
    const featureVersions = versions.filter((v) => v.feature_id === featureId);
    const versionIds = featureVersions.map((v) => v.id);
    const featureTasks = tasks.filter((t) => versionIds.includes(t.version_id));
    const doneTasks = featureTasks.filter((t) => t.status === "Done").length;
    const totalTasks = featureTasks.length;
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    return { versionCount: featureVersions.length, progress, doneTasks, totalTasks };
  };

  const openCreate = () => {
    setEditId(null); setTitle(""); setDescription(""); setSelectedTagIds([]); setDialogOpen(true);
  };
  const openEdit = (f: { id: string; title: string; description: string | null }) => {
    setEditId(f.id);
    setTitle(f.title);
    setDescription(f.description || "");
    const currentTags = featureTagsMap.get(f.id) ?? [];
    setSelectedTagIds(currentTags.map((t) => t.tag_id));
    setDialogOpen(true);
  };
  const handleSave = async () => {
    if (!title.trim()) return;
    let featureId = editId;
    if (editId) {
      await updateFeature.mutateAsync({ id: editId, title, description });
    } else {
      const result = await createFeature.mutateAsync({ title, description });
      featureId = (result as any).id;
    }
    if (featureId) {
      await setFeatureTags.mutateAsync({ featureId, tagIds: selectedTagIds });
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Features</h1>
          <p className="text-sm text-muted-foreground">Manage your product features</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-1" /> Import CSV
          </Button>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Feature
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search features..."
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead className="w-32">Tags</TableHead>
                <TableHead className="w-28">Versions</TableHead>
                <TableHead className="w-48">Progress</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeatures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {search ? "No matching features." : 'No features yet. Click "Add Feature" to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredFeatures.map((f) => {
                  const stats = getFeatureStats(f.id);
                  const fTags = featureTagsMap.get(f.id) ?? [];
                  return (
                    <TableRow key={f.id} className="cursor-pointer transition-colors">
                      <TableCell>
                        <Link to={`/features/${f.id}`} className="font-medium text-primary hover:underline">{f.title}</Link>
                        {f.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{f.description}</p>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {fTags.map((ft) => ft.tags && <TagBadge key={ft.tag_id} tag={ft.tags} />)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{stats.versionCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={stats.progress} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-12 text-right">{stats.doneTasks}/{stats.totalTasks}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(f); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteFeature.mutate(f.id); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Feature" : "New Feature"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Feature title" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Tags</label>
              <TagSelector selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!title.trim()}>{editId ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
