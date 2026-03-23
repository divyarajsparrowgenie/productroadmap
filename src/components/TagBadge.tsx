import type { Tag } from "@/hooks/useTags";

interface Props {
  tag: Tag;
  onRemove?: () => void;
}

export default function TagBadge({ tag, onRemove }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: tag.color + "22",
        color: tag.color,
        border: `1px solid ${tag.color}44`,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 leading-none"
          aria-label={`Remove ${tag.name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
