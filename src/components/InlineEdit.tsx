import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export default function InlineEdit({ value, onSave, className, inputClassName, disabled }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className={cn("h-7 py-0 px-1 text-sm", inputClassName)}
      />
    );
  }

  return (
    <span
      className={cn(
        "cursor-pointer rounded px-1 hover:bg-muted transition-colors",
        disabled && "cursor-default hover:bg-transparent",
        className
      )}
      onClick={() => !disabled && setEditing(true)}
      title={disabled ? undefined : "Click to edit"}
    >
      {value}
    </span>
  );
}
