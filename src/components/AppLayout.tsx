import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <header className="h-12 flex items-center justify-between border-b px-4 bg-card">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
