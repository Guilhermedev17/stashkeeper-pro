import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useState } from 'react';

const MainLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  const toggleMobileMenu = () => {
    setShowMobileSidebar(prev => !prev);
  };
  
  // Show loading state
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
    <div className="min-h-screen bg-background w-full">
      <Navbar onMobileMenuToggle={toggleMobileMenu} />
      <Sidebar showMobile={showMobileSidebar} setShowMobile={setShowMobileSidebar} />
      
      <main className="pt-16 md:pl-64 min-h-screen transition-all duration-300">
        <div className="p-3 sm:p-4 md:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
      
      <Toaster />
    </div>
  );
};

export default MainLayout;
