
import { cn } from '@/lib/utils';
import {
  BarChart3,
  FileText,
  Home,
  Package,
  Settings,
  Tags,
  X,
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from './ui/button';

interface SidebarProps {
  showMobile: boolean;
  setShowMobile: (show: boolean) => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Produtos',
    href: '/products',
    icon: Package,
  },
  {
    title: 'Categorias',
    href: '/categories',
    icon: Tags,
  },
  {
    title: 'Relatórios',
    href: '/reports',
    icon: BarChart3,
  },
  {
    title: 'Histórico',
    href: '/history',
    icon: FileText,
  },
  {
    title: 'Configurações',
    href: '/settings',
    icon: Settings,
  },
];

const Sidebar = ({ showMobile, setShowMobile }: SidebarProps) => {
  const location = useLocation();
  
  const closeMobileSidebar = () => {
    setShowMobile(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 hidden md:flex flex-col h-[calc(100vh-4rem)] fixed top-16 left-0 bg-background border-r z-20">
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                location.pathname === item.href
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-40 backdrop-blur-sm bg-black/20 md:hidden transition-opacity duration-200",
          showMobile ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMobileSidebar}
      />
      
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-3/4 max-w-xs bg-background shadow-xl md:hidden transition-transform duration-300 ease-in-out transform",
          showMobile ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            StashKeeper
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileSidebar}
            aria-label="Close Menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                location.pathname === item.href
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={closeMobileSidebar}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
