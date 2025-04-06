import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoonIcon, SunIcon, Menu, LogOut, Settings, User } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      if (currentScrollY > 5) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const routes = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/products', label: 'Produtos' },
    { path: '/movements', label: 'Movimentações' },
    { path: '/categories', label: 'Categorias' }
  ];

  const getInitials = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name.split(' ')
        .map((part: string) => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  // Calcular a altura dinâmica baseada no scroll
  const headerHeight = Math.max(56, 64 - Math.min(scrollY * 0.1, 8));
  const logoScale = Math.max(0.9, 1 - Math.min(scrollY * 0.002, 0.1));

  return (
    <header className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${
      isScrolled 
        ? 'bg-background/95 border-b shadow-sm backdrop-blur-lg' 
        : 'bg-background/80 backdrop-blur-md'
    }`}
    style={{
      transform: scrollY > 100 && scrollY < 300 ? `translateY(-${Math.min((scrollY - 100) / 2, 100)}px)` : 
               scrollY >= 300 ? 'translateY(-100px)' : 'translateY(0)',
      transition: 'transform 400ms ease-in-out, background-color 300ms ease, border-color 300ms ease, box-shadow 300ms ease'
    }}>
      <div className="container mx-auto px-4 flex items-center justify-between transition-all duration-300"
           style={{ height: `${headerHeight}px` }}>
        <div className="flex items-center gap-6">
          <div 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center gap-2 font-semibold cursor-pointer transition-transform duration-300 theme-toggle-btn"
            style={{ transform: `scale(${logoScale})` }}
          >
            <span className="text-primary">StashKeeper</span>
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Pro</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 ml-6">
            {routes.map(route => (
              <div 
                key={route.path} 
                onClick={() => navigate(route.path)}
                className={`text-sm transition-colors hover:text-primary cursor-pointer ${
                  location.pathname === route.path 
                    ? 'font-medium text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                {route.label}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleTheme()}
            className="h-8 w-8 md:h-9 md:w-9 theme-toggle-btn"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-4 w-4 theme-toggle-icon" />
            ) : (
              <MoonIcon className="h-4 w-4 theme-toggle-icon" />
            )}
            <span className="sr-only">Alternar tema</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 md:h-9 md:w-9 rounded-full">
                <Avatar className="h-8 w-8 md:h-9 md:w-9 transition-all duration-300">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt="Avatar" />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.user_metadata?.name || user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  <span className="text-primary">StashKeeper</span>
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Pro</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4">
                {routes.map(route => (
                  <div 
                    key={route.path} 
                    onClick={() => navigate(route.path)}
                    className={`px-2 py-1.5 rounded transition-colors hover:bg-muted cursor-pointer ${
                      location.pathname === route.path 
                        ? 'font-medium text-primary bg-muted' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    {route.label}
                  </div>
                ))}
                <div className="h-px bg-border my-2"></div>
                <div 
                  onClick={() => navigate('/profile')}
                  className="px-2 py-1.5 rounded transition-colors hover:bg-muted flex items-center gap-2 text-muted-foreground cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  Perfil
                </div>
                <div 
                  onClick={() => navigate('/settings')}
                  className="px-2 py-1.5 rounded transition-colors hover:bg-muted flex items-center gap-2 text-muted-foreground cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  Configurações
                </div>
                <button 
                  onClick={handleSignOut}
                  className="px-2 py-1.5 rounded transition-colors hover:bg-muted flex items-center gap-2 text-muted-foreground text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default NavBar; 