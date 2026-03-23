import { useState } from "react";
import { Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTaskComments, useCreateComment, useDeleteComment } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  taskId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function TaskComments({ taskId }: Props) {
  const { data: comments = [], isLoading } = useTaskComments(taskId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const { user } = useAuth();
  const [text, setText] = useState("");

  const handleAdd = async () => {
    if (!text.trim()) return;
    await createComment.mutateAsync({ taskId, content: text.trim() });
    setText("");
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        Comments {comments.length > 0 && `(${comments.length})`}
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No comments yet.</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="group flex gap-2 text-sm">
              <div className="flex-1 rounded-md bg-muted px-3 py-2">
                <p className="text-xs text-muted-foreground mb-1">{timeAgo(c.created_at)}</p>
                <p className="whitespace-pre-wrap break-words">{c.content}</p>
              </div>
              {c.user_id === user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                  onClick={() => deleteComment.mutate({ id: c.id, taskId })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="text-sm resize-none flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd();
          }}
        />
        <Button
          size="sm"
          className="self-end"
          onClick={handleAdd}
          disabled={!text.trim() || createComment.isPending}
        >
          Post
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Ctrl+Enter to post</p>
    </div>
  );
}
