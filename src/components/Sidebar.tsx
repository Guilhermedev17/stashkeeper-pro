import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart3,
  FileBox,
  Home,
  ListTodo,
  LogOut,
  Package,
  Settings,
  ArrowDownUp,
  ChevronLeft,
  Users,
  Sparkles,
  Layout,
  Calendar,
  Palette,
  FileText,
  ChevronRight
} from 'lucide-react';
import { useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface SidebarProps {
  showMobile: boolean;
  setShowMobile: (show: boolean) => void;
  showDesktop?: boolean;
  setShowDesktop?: (show: boolean) => void;
}

// Adicionar definição do componente SubmenuGroup
interface SubmenuGroupProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

const SubmenuGroup = ({ icon, label, children, defaultOpen = false }: SubmenuGroupProps) => {
  const [isOpen, setIsOpen] = useState(() => {
    // Se já tiver salvo no localStorage, use esse valor, senão use o defaultOpen
    const savedState = localStorage.getItem(`sidebar-submenu-${label}`);
    return savedState !== null ? savedState === 'open' : defaultOpen;
  });
  
  const toggleSubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const newState = !isOpen;
    setIsOpen(newState);
    // Salvar estado no localStorage
    localStorage.setItem(`sidebar-submenu-${label}`, newState ? 'open' : 'closed');
  };

  return (
    <div className="relative">
      <div
        className="flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all cursor-pointer"
        onClick={toggleSubmenu}
      >
        {icon && <span className="flex-shrink-0 mr-3">{icon}</span>}
        <span className="truncate">{label}</span>
        <ChevronRight className={cn(
          "ml-auto h-4 w-4 transition-transform",
          isOpen && "transform rotate-90"
        )} />
      </div>
      
      {isOpen && (
        <div className="mt-1 space-y-1.5 pl-5">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ showMobile, setShowMobile, showDesktop = true, setShowDesktop }: SidebarProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Usar o showDesktop do localStorage se disponível
  useEffect(() => {
    if (setShowDesktop) {
      const savedState = localStorage.getItem('sidebar-desktop-state');
      if (savedState !== null) {
        setShowDesktop(savedState === 'open');
      }
    }
  }, [setShowDesktop]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Sessão encerrada',
        description: 'Você saiu do sistema com sucesso. Até logo!',
        variant: 'default',
      });
      // Pequeno atraso para permitir que o toast seja exibido
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: 'Erro ao sair',
        description: 'Ocorreu um problema ao encerrar sua sessão. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const closeMobileMenu = () => {
    setShowMobile(false);
  };
  
  // Atualiza o localStorage quando o estado da sidebar é alterado
  const handleToggleDesktop = () => {
    if (setShowDesktop) {
      const newState = !showDesktop;
      setShowDesktop(newState);
      localStorage.setItem('sidebar-desktop-state', newState ? 'open' : 'closed');
    }
  };

  const sidebarContent = (
    <>
      <div className="px-5 py-4">
        <div className="space-y-1.5">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all',
                isActive && 'bg-primary/10 text-primary font-semibold shadow-sm'
              )
            }
            onClick={closeMobileMenu}
          >
            <Home className="mr-3 h-4 w-4 flex-shrink-0" />
            <span className="truncate">Dashboard</span>
          </NavLink>
          <NavLink
            to="/new-dashboard"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all',
                isActive && 'bg-primary/10 text-primary font-semibold shadow-sm'
              )
            }
            onClick={closeMobileMenu}
          >
            <Sparkles className="mr-3 h-4 w-4 flex-shrink-0" />
            <span className="truncate">Dashboard Moderno</span>
          </NavLink>
          <NavLink
            to="/integrated"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all',
                isActive && 'bg-primary/10 text-primary font-semibold shadow-sm'
              )
            }
            onClick={closeMobileMenu}
          >
            <Layout className="mr-3 h-4 w-4 flex-shrink-0" />
            <span className="truncate">Interface Integrada</span>
          </NavLink>
          
          {/* Submenu de Estoque */}
          <SubmenuGroup 
            icon={<Package className="h-4 w-4 flex-shrink-0" />}
            label="Estoque"
            defaultOpen={window.location.pathname.includes('/products') || 
                        window.location.pathname.includes('/movements') ||
                        window.location.pathname.includes('/categories')}
          >
            <NavLink
              to="/products"
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all',
                  isActive && 'bg-primary/10 text-primary font-semibold shadow-sm'
                )
              }
              onClick={closeMobileMenu}
            >
              <Package className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="truncate">Produtos</span>
            </NavLink>
            <NavLink
              to="/movements"
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all',
                  isActive && 'bg-primary/10 text-primary font-semibold shadow-sm'
                )
              }
              onClick={closeMobileMenu}
            >
              <ArrowDownUp className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="truncate">Movimentações</span>
            </NavLink>
            <NavLink
              to="/categories"
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all',
                  isActive && 'bg-primary/10 text-primary font-semibold shadow-sm'
                )
              }
              onClick={closeMobileMenu}
            >
              <ListTodo className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="truncate">Categorias</span>
            </NavLink>
          </SubmenuGroup>
          
          <NavLink
            to="/employees"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all',
                isActive && 'bg-primary/10 text-primary font-semibold shadow-sm'
              )
            }
            onClick={closeMobileMenu}
          >
            <Users className="mr-3 h-4 w-4 flex-shrink-0" />
            <span className="truncate">Colaboradores</span>
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all',
                isActive && 'bg-primary/10 text-primary font-semibold shadow-sm'
              )
            }
            onClick={closeMobileMenu}
          >
            <FileBox className="mr-3 h-4 w-4 flex-shrink-0" />
            <span className="truncate">Histórico</span>
          </NavLink>
          
          {/* Submenu de Relatórios */}
          <SubmenuGroup 
            icon={<BarChart3 className="h-4 w-4 flex-shrink-0" />}
            label="Relatórios"
            defaultOpen={window.location.pathname.includes('/reports') || 
                        window.location.pathname.includes('/employee-output-report')}
          >
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all',
                  isActive && 'bg-primary/10 text-primary font-semibold shadow-sm'
                )
              }
              onClick={closeMobileMenu}
            >
              <BarChart3 className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="truncate">Relatórios Gerais</span>
            </NavLink>
            <NavLink
              to="/employee-output-report"
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all',
                  isActive && 'bg-primary/10 text-primary font-semibold shadow-sm'
                )
              }
              onClick={closeMobileMenu}
            >
              <FileText className="mr-3 h-4 w-4 flex-shrink-0" />
              <span className="truncate">Relatório de Saídas</span>
            </NavLink>
          </SubmenuGroup>
          
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all',
                isActive && 'bg-primary/10 text-primary font-semibold shadow-sm'
              )
            }
            onClick={closeMobileMenu}
          >
            <Settings className="mr-3 h-4 w-4 flex-shrink-0" />
            <span className="truncate">Configurações</span>
          </NavLink>
          <NavLink
            to="/design-system"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all',
                isActive && 'bg-primary/10 text-primary font-semibold shadow-sm'
              )
            }
            onClick={closeMobileMenu}
          >
            <Palette className="mr-3 h-4 w-4 flex-shrink-0" />
            <span className="truncate">Design System</span>
          </NavLink>
        </div>
      </div>
      <div className="mt-auto px-5 py-4 border-t border-border/40 mx-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 rounded-lg transition-all"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Sair</span>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "fixed left-0 top-16 w-64 bg-background/80 backdrop-blur-xl rounded-r-2xl shadow-lg shadow-primary/5 z-20 transition-all duration-300 flex border-r border-r-border/30",
        showDesktop ? "translate-x-0" : "-translate-x-full",
        "md:block hidden"
      )}>
        <ScrollArea className="max-h-[calc(100vh-4rem)] py-6 w-full">{sidebarContent}</ScrollArea>
        {setShowDesktop && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 -right-10 bg-primary/5 text-muted-foreground"
            onClick={handleToggleDesktop}
          >
            <ChevronLeft className={cn("h-5 w-5", !showDesktop && "rotate-180")} />
          </Button>
        )}
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={showMobile} onOpenChange={setShowMobile}>
        <SheetContent side="left" className="p-0 w-72">
          <ScrollArea className="h-full py-6">{sidebarContent}</ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
