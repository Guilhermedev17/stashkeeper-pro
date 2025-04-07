import { useLocation, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-pulse-subtle flex flex-col items-center gap-3">
          <div className="h-8 w-48 rounded-md bg-accent animate-pulse"></div>
          <div className="text-muted-foreground text-sm">Carregando...</div>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="relative mb-4">
          <div className="text-9xl font-bold text-primary/10">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-3xl font-bold">Página não encontrada</h1>
          </div>
        </div>
        <p className="text-muted-foreground mb-6">
          A página que você está tentando acessar não existe ou foi movida.
        </p>
        <Button asChild className="animate-pulse-subtle">
          <a href="/dashboard">Voltar para o Dashboard</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
