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

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 5) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

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

  return (
    <header className={`fixed top-0 left-0 w-full z-40 transition-all duration-200 ${
      isScrolled ? 'bg-background border-b shadow-sm' : 'bg-background/80 backdrop-blur-md'
    }`}>
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <div 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center gap-2 font-semibold text-lg cursor-pointer"
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
            className="h-9 w-9"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-4 w-4" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
            <span className="sr-only">Alternar tema</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
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
              <Button variant="ghost" size="icon" className="md:hidden">
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