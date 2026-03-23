import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTags, useCreateTag, type Tag } from "@/hooks/useTags";
import TagBadge from "@/components/TagBadge";

const TAG_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6",
];

interface Props {
  selectedTagIds: string[];
  onChange: (ids: string[]) => void;
}

export default function TagSelector({ selectedTagIds, onChange }: Props) {
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const toggle = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((t) => t !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createTag.mutateAsync({ name: newName.trim(), color: newColor });
    setNewName("");
    setCreating(false);
  };

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));

  return (
    <div className="flex flex-wrap items-center gap-1">
      {selectedTags.map((t) => (
        <TagBadge key={t.id} tag={t} onRemove={() => toggle(t.id)} />
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1 max-h-48 overflow-y-auto mb-2">
            {tags.length === 0 && (
              <p className="text-xs text-muted-foreground px-1">No tags yet.</p>
            )}
            {tags.map((tag) => (
              <button
                key={tag.id}
                className="flex items-center w-full gap-2 rounded px-2 py-1 hover:bg-accent text-sm"
                onClick={() => toggle(tag.id)}
              >
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 text-left">{tag.name}</span>
                {selectedTagIds.includes(tag.id) && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </button>
            ))}
          </div>

          <div className="border-t pt-2">
            {!creating ? (
              <button
                className="text-xs text-primary flex items-center gap-1 hover:underline px-1"
                onClick={() => setCreating(true)}
              >
                <Plus className="h-3 w-3" /> Create new tag
              </button>
            ) : (
              <div className="space-y-2">
                <Input
                  autoFocus
                  placeholder="Tag name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-7 text-xs"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <div className="flex flex-wrap gap-1">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c}
                      className={`h-5 w-5 rounded-full border-2 ${newColor === c ? "border-foreground" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewColor(c)}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" className="h-6 text-xs flex-1" onClick={handleCreate} disabled={!newName.trim()}>
                    Create
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
