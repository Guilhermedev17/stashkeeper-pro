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
    <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 fixed top-0 left-0 right-0 z-30 flex items-center shadow-sm shadow-primary/5">
      <div className="container mx-auto px-3 md:px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menu"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
        
          <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent transition-all">
            StashKeeper
          </h1>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Help"
            className="text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="text-muted-foreground hover:text-foreground"
          >
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          
          <ThemeSwitcher />
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 h-9 hover:bg-accent/50 ml-1">
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
