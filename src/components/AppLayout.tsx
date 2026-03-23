import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface Props {
  children: React.ReactNode;
  onSearchOpen?: () => void;
}

export function AppLayout({ children, onSearchOpen }: Props) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <header className="h-12 flex items-center justify-between border-b px-4 bg-card gap-2">
            <SidebarTrigger />
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex items-center gap-2 text-muted-foreground text-xs"
                onClick={onSearchOpen}
              >
                <Search className="h-3.5 w-3.5" />
                Search
                <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-[10px]">⌘K</kbd>
              </Button>
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
