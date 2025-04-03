import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Movements from "./pages/Movements";
import NotFound from "./pages/NotFound";
import Employees from "./pages/Employees";
import ExcelImporter from "./components/ExcelImporter";
import { Fragment } from "react";

// Tenta importar RealtimeProvider, mas tem um fallback caso falhe
let RealtimeWrapper = Fragment;
try {
  // Tenta importar dinamicamente
  const RealtimeModule = require('@/contexts/RealtimeContext');
  if (RealtimeModule && RealtimeModule.RealtimeProvider) {
    RealtimeWrapper = RealtimeModule.RealtimeProvider;
  } else {
    console.warn('RealtimeProvider não encontrado, usando Fragment como fallback');
  }
} catch (error) {
  console.warn('Erro ao importar RealtimeContext:', error);
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <RealtimeWrapper>
          <AuthProvider>
            <SidebarProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<MainLayout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="products" element={<Products />} />
                  <Route path="movements" element={<Movements />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="history" element={<History />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="employees" element={<Employees />} />
                </Route>
                <Route path="/import-excel" element={
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="max-w-4xl w-full">
                      <ExcelImporter onClose={() => window.history.back()} />
                    </div>
                  </div>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SidebarProvider>
          </AuthProvider>
        </RealtimeWrapper>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
