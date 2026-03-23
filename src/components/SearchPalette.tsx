import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, GitBranch, CheckSquare, Search } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useGlobalSearch } from "@/hooks/useSearch";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const { data: results = [] } = useGlobalSearch(query);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const icons = { feature: Layers, version: GitBranch, task: CheckSquare };
  const labels = { feature: "Features", version: "Versions", task: "Tasks" };

  const grouped = {
    feature: results.filter((r) => r.type === "feature"),
    version: results.filter((r) => r.type === "version"),
    task: results.filter((r) => r.type === "task"),
  };

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <CommandDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <CommandInput
        placeholder="Search features, versions, tasks..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {results.length === 0 && query.trim().length > 1 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {query.trim().length <= 1 && (
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            <Search className="mx-auto mb-2 h-8 w-8 opacity-40" />
            Type to search…
          </CommandEmpty>
        )}
        {(["feature", "version", "task"] as const).map((type) => {
          const items = grouped[type];
          if (items.length === 0) return null;
          const Icon = icons[type];
          return (
            <CommandGroup key={type} heading={labels[type]}>
              {items.map((r) => (
                <CommandItem key={r.id} onSelect={() => handleSelect(r.url)} className="gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.title}</p>
                    {r.subtitle && (
                      <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
