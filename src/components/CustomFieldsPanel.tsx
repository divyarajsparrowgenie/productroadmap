import { useState } from "react";
import { ExternalLink, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useCustomFieldDefs,
  useCustomFieldValues,
  useSetCustomFieldValue,
  useDeleteCustomFieldDef,
  type EntityType,
  type CustomFieldDef,
} from "@/hooks/useCustomFields";
import CustomFieldDefDialog from "@/components/CustomFieldDefDialog";
import { cn } from "@/lib/utils";

interface FieldValueEditorProps {
  def: CustomFieldDef;
  entityId: string;
  currentValue: string | null;
}

function FieldValueEditor({ def, entityId, currentValue }: FieldValueEditorProps) {
  const set = useSetCustomFieldValue();
  const [localVal, setLocalVal] = useState(currentValue ?? "");

  const commit = (val: string | null) => {
    set.mutate({ fieldDefId: def.id, entityId, value: val });
  };

  // URL type — render as clickable link
  if (def.field_type === "url") {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <Input
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={() => commit(localVal || null)}
          onKeyDown={(e) => e.key === "Enter" && commit(localVal || null)}
          placeholder="https://…"
          className="h-7 text-sm flex-1 min-w-0"
        />
        {localVal && (
          <a href={localVal} target="_blank" rel="noopener noreferrer" title="Open link">
            <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" />
          </a>
        )}
      </div>
    );
  }

  if (def.field_type === "checkbox") {
    return (
      <Checkbox
        checked={currentValue === "true"}
        onCheckedChange={(checked) => commit(checked ? "true" : "false")}
      />
    );
  }

  if (def.field_type === "select" && def.options) {
    return (
      <Select value={currentValue ?? ""} onValueChange={(v) => commit(v || null)}>
        <SelectTrigger className="h-7 text-sm w-40">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">—</SelectItem>
          {def.options.map((o: string) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (def.field_type === "date") {
    return (
      <Input
        type="date"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={() => commit(localVal || null)}
        className="h-7 text-sm w-40"
      />
    );
  }

  if (def.field_type === "number") {
    return (
      <Input
        type="number"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={() => commit(localVal || null)}
        onKeyDown={(e) => e.key === "Enter" && commit(localVal || null)}
        placeholder="0"
        className="h-7 text-sm w-28"
      />
    );
  }

  // Default: text
  return (
    <Input
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={() => commit(localVal || null)}
      onKeyDown={(e) => e.key === "Enter" && commit(localVal || null)}
      placeholder="—"
      className="h-7 text-sm flex-1 min-w-0"
    />
  );
}

interface Props {
  entityId: string;
  entityType: EntityType;
  className?: string;
}

export default function CustomFieldsPanel({ entityId, entityType, className }: Props) {
  const { data: defs = [] } = useCustomFieldDefs(entityType);
  const { data: values = [] } = useCustomFieldValues(entityId);
  const deleteField = useDeleteCustomFieldDef();
  const [defDialogOpen, setDefDialogOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const getValue = (defId: string) =>
    values.find((v) => v.field_def_id === defId)?.value ?? null;

  if (defs.length === 0) {
    return (
      <>
        <button
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
          onClick={() => setDefDialogOpen(true)}
        >
          <Plus className="h-3 w-3" /> Add custom field
        </button>
        <CustomFieldDefDialog
          open={defDialogOpen}
          onClose={() => setDefDialogOpen(false)}
          defaultEntityType={entityType}
        />
      </>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Custom Fields
        </span>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setDefDialogOpen(true)} title="Add field">
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Popover open={manageOpen} onOpenChange={setManageOpen}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6" title="Manage fields">
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                Manage {entityType} fields
              </p>
              <div className="space-y-1">
                {defs.map((def) => (
                  <div key={def.id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted text-sm">
                    <div className="min-w-0">
                      <span className="truncate">{def.name}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">{def.field_type}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => deleteField.mutate(def.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        {defs.map((def) => (
          <div key={def.id} className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground w-28 shrink-0 truncate text-xs" title={def.name}>
              {def.name}
            </span>
            <div className="flex-1 min-w-0">
              <FieldValueEditor def={def} entityId={entityId} currentValue={getValue(def.id)} />
            </div>
          </div>
        ))}
      </div>

      <CustomFieldDefDialog
        open={defDialogOpen}
        onClose={() => setDefDialogOpen(false)}
        defaultEntityType={entityType}
      />
    </div>
  );
}
