import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePublicRoadmapToken, useCreatePublicToken, useRevokePublicToken } from "@/hooks/usePublicRoadmap";
import { useCustomFieldDefs, useDeleteCustomFieldDef, type EntityType } from "@/hooks/useCustomFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Globe, Trash2, Plus, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import CustomFieldDefDialog from "@/components/CustomFieldDefDialog";

const ENTITY_LABELS: Record<EntityType, string> = {
  task: "Task",
  version: "Version",
  feature: "Feature",
};

const FIELD_TYPE_COLORS: Record<string, string> = {
  text:     "bg-slate-100 text-slate-700",
  number:   "bg-blue-100 text-blue-700",
  date:     "bg-purple-100 text-purple-700",
  url:      "bg-green-100 text-green-700",
  select:   "bg-orange-100 text-orange-700",
  checkbox: "bg-pink-100 text-pink-700",
};

function CustomFieldsManager() {
  const { data: defs = [] } = useCustomFieldDefs();
  const deleteField = useDeleteCustomFieldDef();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultEntity, setDefaultEntity] = useState<EntityType>("task");

  const grouped = (["task", "version", "feature"] as EntityType[]).map((et) => ({
    entityType: et,
    fields: defs.filter((d) => d.entity_type === et),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Custom Fields
            </CardTitle>
            <CardDescription className="mt-1">
              Define your own fields for tasks, versions, and features — text, numbers, dates, URLs, dropdowns, checkboxes.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => { setDefaultEntity("task"); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Field
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {grouped.map(({ entityType, fields }) => (
          <div key={entityType}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {ENTITY_LABELS[entityType]} fields
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => { setDefaultEntity(entityType); setDialogOpen(true); }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="text-xs text-muted-foreground italic pl-1">No fields yet.</p>
            ) : (
              <div className="space-y-1">
                {fields.map((def) => (
                  <div
                    key={def.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{def.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${FIELD_TYPE_COLORS[def.field_type] ?? ""}`}>
                        {def.field_type}
                      </span>
                      {def.field_type === "select" && def.options && (
                        <span className="text-xs text-muted-foreground truncate">
                          {(def.options as string[]).join(", ")}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => deleteField.mutate(def.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>

      <CustomFieldDefDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        defaultEntityType={defaultEntity}
      />
    </Card>
  );
}

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
    <div className="space-y-6 max-w-3xl animate-fade-in">
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

      <CustomFieldsManager />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />Public Roadmap
          </CardTitle>
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
              <Button variant="destructive" size="sm" onClick={() => revokeToken.mutate()} disabled={revokeToken.isPending}>
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
