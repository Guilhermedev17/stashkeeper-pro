
import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';

const MainLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-pulse-subtle">Carregando...</div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar setShowMobileSidebar={setShowMobileSidebar} />
      <Sidebar showMobile={showMobileSidebar} setShowMobile={setShowMobileSidebar} />
      
      <main className="pt-16 md:pl-64 min-h-screen">
        <div className="container mx-auto p-4 md:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
      
      <Toaster />
    </div>
  );
};

export default MainLayout;
