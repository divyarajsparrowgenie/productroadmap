import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/AppLayout";
import AuthGuard from "@/components/AuthGuard";
import Dashboard from "./pages/Dashboard";
import Features from "./pages/Features";
import FeatureDetail from "./pages/FeatureDetail";
import Kanban from "./pages/Kanban";
import Roadmap from "./pages/Roadmap";
import Sprint from "./pages/Sprint";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import JiraIntegration from "./pages/JiraIntegration";
import Notifications from "./pages/Notifications";
import Team from "./pages/Team";
import PublicRoadmap from "./pages/PublicRoadmap";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import SearchPalette from "./components/SearchPalette";
import KeyboardShortcutsHelp from "./components/KeyboardShortcutsHelp";
import { useRealtime } from "./hooks/useRealtime";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

function AppRoutes() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const location = useLocation();

  useRealtime();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K — search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      // ? — shortcuts help (only when not in input)
      if (e.key === "?" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <KeyboardShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/public/roadmap/:token" element={<PublicRoadmap />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <AppLayout onSearchOpen={() => setSearchOpen(true)}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/features/:id" element={<FeatureDetail />} />
                  <Route path="/kanban" element={<Kanban />} />
                  <Route path="/roadmap" element={<Roadmap />} />
                  <Route path="/sprint" element={<Sprint />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/integrations/jira" element={<JiraIntegration />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </AuthGuard>
          }
        />
      </Routes>
      </ErrorBoundary>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
