import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useCreateCustomFieldDef, FieldType, EntityType } from "@/hooks/useCustomFields";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text",     label: "Text" },
  { value: "number",   label: "Number" },
  { value: "date",     label: "Date" },
  { value: "url",      label: "URL / Link" },
  { value: "select",   label: "Dropdown (select)" },
  { value: "checkbox", label: "Checkbox" },
];

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: "task",    label: "Task" },
  { value: "version", label: "Version" },
  { value: "feature", label: "Feature" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  defaultEntityType?: EntityType;
}

export default function CustomFieldDefDialog({ open, onClose, defaultEntityType = "task" }: Props) {
  const create = useCreateCustomFieldDef();

  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [entityType, setEntityType] = useState<EntityType>(defaultEntityType);
  const [optionInput, setOptionInput] = useState("");
  const [options, setOptions] = useState<string[]>([]);

  const reset = () => {
    setName(""); setFieldType("text"); setEntityType(defaultEntityType);
    setOptionInput(""); setOptions([]);
  };

  const addOption = () => {
    const v = optionInput.trim();
    if (v && !options.includes(v)) setOptions((o) => [...o, v]);
    setOptionInput("");
  };

  const handleSave = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), field_type: fieldType, entity_type: entityType, options: fieldType === "select" ? options : undefined },
      { onSuccess: () => { reset(); onClose(); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Custom Field</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Field name</label>
            <Input
              placeholder="e.g. Customer Link, Story Points, Release Note…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Field type</label>
            <Select value={fieldType} onValueChange={(v) => setFieldType(v as FieldType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Attach to</label>
            <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {fieldType === "select" && (
            <div>
              <label className="text-sm font-medium block mb-1">Options</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add option…"
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addOption()}
                  className="flex-1"
                />
                <Button type="button" size="icon" variant="outline" onClick={addOption}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {options.map((o) => (
                  <Badge key={o} variant="secondary" className="gap-1">
                    {o}
                    <button onClick={() => setOptions((prev) => prev.filter((x) => x !== o))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || create.isPending}>
            Create Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
