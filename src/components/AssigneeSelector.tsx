import { useProfiles } from "@/hooks/useProfiles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AssigneeSelector({ value, onChange }: Props) {
  const { data: profiles = [] } = useProfiles();

  return (
    <Select
      value={value ?? "unassigned"}
      onValueChange={(v) => onChange(v === "unassigned" ? null : v)}
    >
      <SelectTrigger className="w-full">
        <SelectValue>
          {value ? (
            (() => {
              const p = profiles.find((pr) => pr.id === value);
              return p ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">{initials(p.display_name)}</AvatarFallback>
                  </Avatar>
                  <span>{p.display_name ?? "Unknown"}</span>
                </div>
              ) : "Unknown";
            })()
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          <span className="text-muted-foreground">Unassigned</span>
        </SelectItem>
        {profiles.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={p.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">{initials(p.display_name)}</AvatarFallback>
              </Avatar>
              <span>{p.display_name ?? p.id.slice(0, 8)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
