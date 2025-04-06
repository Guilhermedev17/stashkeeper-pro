import { useAuth } from '@/contexts/AuthContext';
import { Bell, HelpCircle, LogOut, Menu } from 'lucide-react';
import { Button } from './ui/button';
import ThemeSwitcher from './ThemeSwitcher';
import UserAvatar from './UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useState, useEffect } from 'react';

interface NavbarProps {
  onMobileMenuToggle?: () => void;
}

const Navbar = ({ onMobileMenuToggle }: NavbarProps = {}) => {
  const { user, logout } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Determina se o header está scrollado (para alterar aparência)
      if (currentScrollY > 5) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
      
      // Determina se o header deve esconder quando scrollando para baixo
      // e reaparecer quando scrollando para cima
      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Calcular a altura dinâmica baseada no scroll
  const headerHeight = Math.max(56, 64 - Math.min(scrollY * 0.08, 8));
  const logoScale = Math.max(0.85, 1 - Math.min(scrollY * 0.001, 0.15));

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-30 flex items-center transition-all duration-300 ${
        isScrolled 
          ? 'border-b border-border/60 bg-background/95 backdrop-blur-xl shadow-sm' 
          : 'border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-md shadow-primary/5'
      }`}
      style={{ 
        height: `${headerHeight}px`,
        transform: isHidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 400ms ease, height 300ms ease, background-color 300ms ease, border-color 300ms ease, box-shadow 300ms ease',
      }}
    >
      <div className="w-full px-3 sm:px-6 flex justify-between items-center">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menu"
            className="md:hidden text-muted-foreground hover:text-foreground h-8 w-8 sm:h-9 sm:w-9 rounded-full"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-[18px] w-[18px]" />
          </Button>
        
          <h1 
            className="text-lg sm:text-xl md:text-2xl font-semibold text-gradient transition-all flex items-center gap-1.5 theme-toggle-btn"
            style={{ transform: `scale(${logoScale})` }}
          >
            StashKeeper
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Pro</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Help"
            className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-9 sm:w-9 rounded-full hidden sm:flex"
          >
            <HelpCircle className="h-[18px] w-[18px]" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-9 sm:w-9 rounded-full relative"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </Button>
          
          <ThemeSwitcher />
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-accent/50 overflow-hidden ring-offset-background transition-all duration-300 hover:ring-2 hover:ring-primary/50">
                  <UserAvatar />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl border-border/50 shadow-lg">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Minha Conta</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
