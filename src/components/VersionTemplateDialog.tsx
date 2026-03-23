import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVersionTemplates, useSaveTemplate, useDeleteTemplate, VersionTemplate } from "@/hooks/useTemplates";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface SaveProps {
  open: boolean;
  onClose: () => void;
  templateData: VersionTemplate["data"];
}

export function SaveTemplateDialog({ open, onClose, templateData }: SaveProps) {
  const [name, setName] = useState("");
  const save = useSaveTemplate();

  const handleSave = () => {
    if (!name.trim()) { toast.error("Name required"); return; }
    save.mutate({ name: name.trim(), data: templateData }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Save as Template</DialogTitle></DialogHeader>
        <Input
          placeholder="Template name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={save.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface LoadProps {
  open: boolean;
  onClose: () => void;
  onApply: (data: VersionTemplate["data"]) => void;
}

export function LoadTemplateDialog({ open, onClose, onApply }: LoadProps) {
  const { data: templates = [] } = useVersionTemplates();
  const deleteTemplate = useDeleteTemplate();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Load Template</DialogTitle></DialogHeader>
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No templates saved yet.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-auto">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.data.tasks?.length ?? 0} tasks</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => { onApply(t.data); onClose(); }}>
                    <Plus className="h-3 w-3 mr-1" />Apply
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteTemplate.mutate(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
