import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/layout/PageTransition';

const MainLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  
  const toggleMobileMenu = () => {
    setShowMobileSidebar(prev => !prev);
  };

  // Salva o estado do menu desktop no localStorage
  useEffect(() => {
    localStorage.setItem('showDesktopSidebar', showDesktopSidebar.toString());
  }, [showDesktopSidebar]);

  // Recupera o estado do menu desktop do localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('showDesktopSidebar');
    if (savedState !== null) {
      setShowDesktopSidebar(savedState === 'true');
    }
  }, []);
  
  // Controla o scroll para calcular a altura dinâmica do header
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Calcula a altura dinâmica do header com base no scroll
  const headerHeight = Math.max(56, 64 - Math.min(scrollY * 0.08, 8));
  const mainTopPadding = headerHeight + 4; // Adiciona um pequeno espaço
  
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
    <div className="min-h-screen min-h-dvh bg-background w-full relative flex flex-col">
      <Navbar onMobileMenuToggle={toggleMobileMenu} />
      <Sidebar 
        showMobile={showMobileSidebar} 
        setShowMobile={setShowMobileSidebar}
        showDesktop={showDesktopSidebar}
        setShowDesktop={setShowDesktopSidebar}
      />
      
      <main 
        className="flex-grow transition-all duration-300 relative w-full bg-background/50 backdrop-blur-sm"
        style={{ paddingTop: `${mainTopPadding}px` }}
      >
        <div className={`h-full min-h-full transition-all duration-300 ${showDesktopSidebar ? 'md:pl-64' : 'md:pl-12'}`}>
          <div className="zoom-stable h-full w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6">
            <AnimatePresence mode="wait">
              <PageTransition key={useLocation().pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      <Toaster />
    </div>
  );
};

export default MainLayout;
