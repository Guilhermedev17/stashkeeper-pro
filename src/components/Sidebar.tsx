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
  X,
} from 'lucide-react';

interface SidebarProps {
  showMobile: boolean;
  setShowMobile: (show: boolean) => void;
}

const Sidebar = ({ showMobile, setShowMobile }: SidebarProps) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const closeMobileMenu = () => {
    setShowMobile(false);
  };

  const sidebarContent = (
    <>
      <div className="px-3 py-4">
        <h2 className="mb-4 px-4 text-lg font-semibold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          StashKeeper
        </h2>
        <div className="space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors',
                isActive && 'bg-accent/70 text-primary font-semibold shadow-sm'
              )
            }
            onClick={closeMobileMenu}
          >
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors',
                isActive && 'bg-accent/70 text-primary font-semibold shadow-sm'
              )
            }
            onClick={closeMobileMenu}
          >
            <Package className="mr-2 h-4 w-4" />
            <span>Produtos</span>
          </NavLink>
          <NavLink
            to="/movements"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors',
                isActive && 'bg-accent/70 text-primary font-semibold shadow-sm'
              )
            }
            onClick={closeMobileMenu}
          >
            <ArrowDownUp className="mr-2 h-4 w-4" />
            <span>Movimentações</span>
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors',
                isActive && 'bg-accent/70 text-primary font-semibold shadow-sm'
              )
            }
            onClick={closeMobileMenu}
          >
            <ListTodo className="mr-2 h-4 w-4" />
            <span>Categorias</span>
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors',
                isActive && 'bg-accent/70 text-primary font-semibold shadow-sm'
              )
            }
            onClick={closeMobileMenu}
          >
            <FileBox className="mr-2 h-4 w-4" />
            <span>Histórico</span>
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors',
                isActive && 'bg-accent/70 text-primary font-semibold shadow-sm'
              )
            }
            onClick={closeMobileMenu}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Relatórios</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors',
                isActive && 'bg-accent/70 text-primary font-semibold shadow-sm'
              )
            }
            onClick={closeMobileMenu}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </NavLink>
        </div>
      </div>
      <div className="mt-auto px-3 py-4 border-t border-border/40 mx-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-0 hidden h-[calc(100vh-1.5rem)] w-64 bg-background/80 backdrop-blur-md mt-3 pt-16 md:block rounded-r-xl border-r border-y border-border/40 shadow-md shadow-primary/5 z-20">
        <ScrollArea className="h-full py-6">{sidebarContent}</ScrollArea>
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={showMobile} onOpenChange={setShowMobile}>
        <SheetContent side="left" className="p-0 pt-10 backdrop-blur-md bg-background/95 border-r border-border/40">
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileMenu}
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
          <ScrollArea className="h-full py-6">{sidebarContent}</ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
