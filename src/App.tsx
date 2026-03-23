import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import AuthGuard from "@/components/AuthGuard";
import Dashboard from "./pages/Dashboard";
import Features from "./pages/Features";
import FeatureDetail from "./pages/FeatureDetail";
import Kanban from "./pages/Kanban";
import Roadmap from "./pages/Roadmap";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/*"
            element={
              <AuthGuard>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/features/:id" element={<FeatureDetail />} />
                    <Route path="/kanban" element={<Kanban />} />
                    <Route path="/roadmap" element={<Roadmap />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </AuthGuard>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
