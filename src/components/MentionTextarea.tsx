import { useState, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useProfiles } from "@/hooks/useProfiles";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onMentions?: (userIds: string[]) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export default function MentionTextarea({ value, onChange, onMentions, placeholder, className, onKeyDown }: Props) {
  const { data: profiles = [] } = useProfiles();
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredProfiles = mentionSearch !== null
    ? profiles.filter((p) =>
        (p.display_name ?? p.id).toLowerCase().includes(mentionSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    onChange(v);

    // Detect @ trigger
    const cursor = e.target.selectionStart ?? 0;
    const textBefore = v.slice(0, cursor);
    const atIdx = textBefore.lastIndexOf("@");
    if (atIdx >= 0 && !textBefore.slice(atIdx + 1).includes(" ")) {
      setMentionSearch(textBefore.slice(atIdx + 1));
      setMentionStart(atIdx);
      setActiveIdx(0);
    } else {
      setMentionSearch(null);
    }

    // Extract all @mentions for callback
    if (onMentions) {
      const mentionedNames = Array.from(v.matchAll(/@(\w+)/g)).map((m) => m[1]);
      const ids = profiles
        .filter((p) => mentionedNames.some((n) => (p.display_name ?? "").toLowerCase() === n.toLowerCase()))
        .map((p) => p.id);
      onMentions(ids);
    }
  }, [onChange, onMentions, profiles]);

  const insertMention = (profile: { id: string; display_name: string | null }) => {
    const name = profile.display_name ?? profile.id;
    const before = value.slice(0, mentionStart);
    const after = value.slice(textareaRef.current?.selectionStart ?? mentionStart);
    onChange(`${before}@${name} ${after}`);
    setMentionSearch(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionSearch !== null && filteredProfiles.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i + 1) % filteredProfiles.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => (i - 1 + filteredProfiles.length) % filteredProfiles.length); return; }
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); insertMention(filteredProfiles[activeIdx]); return; }
      if (e.key === "Escape") { setMentionSearch(null); return; }
    }
    onKeyDown?.(e);
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {mentionSearch !== null && filteredProfiles.length > 0 && (
        <div className={cn(
          "absolute z-50 bottom-full mb-1 left-0 w-56 rounded-md border bg-popover shadow-md",
        )}>
          {filteredProfiles.map((p, i) => (
            <button
              key={p.id}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm hover:bg-accent",
                i === activeIdx && "bg-accent"
              )}
              onMouseDown={(e) => { e.preventDefault(); insertMention(p); }}
            >
              {p.display_name ?? p.id}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
