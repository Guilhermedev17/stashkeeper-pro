
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
  Shield,
  X,
} from 'lucide-react';

interface SidebarProps {
  showMobile: boolean;
  setShowMobile: (show: boolean) => void;
}

const Sidebar = ({ showMobile, setShowMobile }: SidebarProps) => {
  const { logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const closeMobileMenu = () => {
    setShowMobile(false);
  };

  const sidebarContent = (
    <>
      <div className="px-3 py-4">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          StashKeeper
        </h2>
        <div className="space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/70 hover:bg-primary/20 hover:text-primary-foreground transition-colors',
                isActive && 'bg-primary/30 text-primary-foreground'
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
                'flex items-center rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/70 hover:bg-primary/20 hover:text-primary-foreground transition-colors',
                isActive && 'bg-primary/30 text-primary-foreground'
              )
            }
            onClick={closeMobileMenu}
          >
            <Package className="mr-2 h-4 w-4" />
            <span>Produtos</span>
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/70 hover:bg-primary/20 hover:text-primary-foreground transition-colors',
                isActive && 'bg-primary/30 text-primary-foreground'
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
                'flex items-center rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/70 hover:bg-primary/20 hover:text-primary-foreground transition-colors',
                isActive && 'bg-primary/30 text-primary-foreground'
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
                'flex items-center rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/70 hover:bg-primary/20 hover:text-primary-foreground transition-colors',
                isActive && 'bg-primary/30 text-primary-foreground'
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
                'flex items-center rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/70 hover:bg-primary/20 hover:text-primary-foreground transition-colors',
                isActive && 'bg-primary/30 text-primary-foreground'
              )
            }
            onClick={closeMobileMenu}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </NavLink>
          
          {/* Adiciona link para a área de administração visível apenas para admins */}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/70 hover:bg-primary/20 hover:text-primary-foreground transition-colors',
                  isActive && 'bg-primary/30 text-primary-foreground'
                )
              }
              onClick={closeMobileMenu}
            >
              <Shield className="mr-2 h-4 w-4" />
              <span>Administração</span>
            </NavLink>
          )}
        </div>
      </div>
      <div className="mt-auto px-3 py-3">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-0 hidden h-full w-64 border-r bg-primary/5 pt-16 md:block">
        <ScrollArea className="h-full py-6">{sidebarContent}</ScrollArea>
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={showMobile} onOpenChange={setShowMobile}>
        <SheetContent side="left" className="p-0 pt-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileMenu}
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
          </Button>
          <ScrollArea className="h-full py-6">{sidebarContent}</ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
