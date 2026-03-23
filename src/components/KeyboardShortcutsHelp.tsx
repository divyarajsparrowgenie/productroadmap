import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ["⌘", "K"], description: "Open global search" },
  { keys: ["N"], description: "New feature (on Features page)" },
  { keys: ["?"], description: "Show this help" },
  { keys: ["Esc"], description: "Close dialogs" },
  { keys: ["Ctrl", "Enter"], description: "Submit comment" },
  { keys: ["Enter"], description: "Save inline edit" },
];

export default function KeyboardShortcutsHelp({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {SHORTCUTS.map(({ keys, description }) => (
            <div key={description} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{description}</span>
              <div className="flex gap-1">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-0.5 rounded border bg-muted font-mono text-xs"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
