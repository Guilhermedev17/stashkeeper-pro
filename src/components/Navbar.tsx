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
import { useState } from 'react';

interface NavbarProps {
  onMobileMenuToggle?: () => void;
}

const Navbar = ({ onMobileMenuToggle }: NavbarProps = {}) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 sm:h-16 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 fixed top-0 left-0 right-0 z-30 flex items-center shadow-sm shadow-primary/5">
      <div className="w-full px-4 flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menu"
            className="md:hidden text-muted-foreground hover:text-foreground h-9 w-9"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-[18px] w-[18px]" />
          </Button>
        
          <h1 className="text-base sm:text-lg md:text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent transition-all flex items-center gap-1.5">
            StashKeeper
            <span className="text-[10px] sm:text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Pro</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Help"
            className="text-muted-foreground hover:text-foreground h-9 w-9 hidden sm:flex"
          >
            <HelpCircle className="h-[18px] w-[18px]" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="text-muted-foreground hover:text-foreground h-9 w-9"
          >
            <Bell className="h-[18px] w-[18px]" />
          </Button>
          
          <ThemeSwitcher />
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 h-9 w-9 hover:bg-accent/50">
                  <UserAvatar />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
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
