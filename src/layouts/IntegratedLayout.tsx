import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import {
    BarChart3, FileBox, Home, ListTodo, LogOut,
    Package, Settings, ArrowDownUp, Users, Sparkles,
    Menu, X, Bell, Search, User, ChevronDown,
    Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModernThemeSwitcher from '@/components/layout/modern/ModernThemeSwitcher';
import { NotificationDropdown } from '@/components/layout/modern';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from 'react-router-dom';
import NavigationProgress from '@/components/NavigationProgress';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/layout/PageTransition';

const IntegratedLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="flex h-screen w-full overflow-hidden">
            <NavigationProgress />

            {/* Sidebar para desktop */}
            <aside
                className={cn(
                    "hidden lg:block bg-background border-r border-border shadow-sm transition-all duration-300 z-10 h-full",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                    {isSidebarOpen ? (
                        <div className="flex items-center space-x-2">
                            <h1 className="text-lg font-bold text-gradient">
                                StashKeeper<span className="text-primary font-bold">Pro</span>
                            </h1>
                        </div>
                    ) : (
                        <div className="mx-auto">
                            <h1 className="text-lg font-bold text-primary">SK</h1>
                        </div>
                    )}

                    <button
                        onClick={toggleSidebar}
                        className="text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                        {isSidebarOpen ? (
                            <ChevronDown className="h-5 w-5 rotate-90" />
                        ) : (
                            <ChevronDown className="h-5 w-5 -rotate-90" />
                        )}
                    </button>
                </div>

                <div className="py-4 flex-1 overflow-y-auto h-[calc(100vh-4rem-4rem)]">
                    <ul className="space-y-1">
                        <SidebarItem
                            to="/dashboard"
                            icon={<Home className="size-5" />}
                            label="Dashboard"
                            isActive={isActive('/dashboard')}
                            collapsed={!isSidebarOpen}
                        />
                        <SidebarItem
                            to="/products"
                            icon={<Package className="size-5" />}
                            label="Produtos"
                            isActive={isActive('/products')}
                            collapsed={!isSidebarOpen}
                        />
                        <SidebarItem
                            to="/movements"
                            icon={<ArrowDownUp className="size-5" />}
                            label="Movimentações"
                            isActive={isActive('/movements')}
                            collapsed={!isSidebarOpen}
                        />
                        <SidebarItem
                            to="/categories"
                            icon={<ListTodo className="size-5" />}
                            label="Categorias"
                            isActive={isActive('/categories')}
                            collapsed={!isSidebarOpen}
                        />
                        <SidebarItem
                            to="/employees"
                            icon={<Users className="size-5" />}
                            label="Colaboradores"
                            isActive={isActive('/employees')}
                            collapsed={!isSidebarOpen}
                        />
                        <SidebarItem
                            to="/history"
                            icon={<FileBox className="size-5" />}
                            label="Histórico"
                            isActive={isActive('/history')}
                            collapsed={!isSidebarOpen}
                        />
                        <SidebarItem
                            to="/reports"
                            icon={<BarChart3 className="size-5" />}
                            label="Relatórios"
                            isActive={isActive('/reports')}
                            collapsed={!isSidebarOpen}
                        />
                        <SidebarItem
                            to="/settings"
                            icon={<Settings className="size-5" />}
                            label="Configurações"
                            isActive={isActive('/settings')}
                            collapsed={!isSidebarOpen}
                        />
                    </ul>
                </div>

                <div className="h-16 border-t border-border p-4">
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center justify-center w-full rounded-lg py-2.5 text-sm font-medium",
                            "text-muted-foreground hover:bg-muted transition-colors",
                            !isSidebarOpen && "px-0"
                        )}
                    >
                        <LogOut className="size-5" />
                        {isSidebarOpen && <span className="ml-3">Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Conteúdo Principal */}
            <div className="flex flex-col w-full h-full">
                {/* Barra de navegação superior */}
                <header className="h-16 bg-background flex items-center justify-between px-3 sm:px-4 lg:px-6 z-10 shrink-0">
                    <div className="flex items-center">
                        <button
                            onClick={toggleMobileMenu}
                            className="lg:hidden text-muted-foreground hover:text-foreground focus:outline-none mr-1 sm:mr-2"
                        >
                            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <NotificationDropdown />

                        <div className="hidden sm:block">
                            <ModernThemeSwitcher />
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="relative w-9 h-9 rounded-full overflow-hidden transition-all duration-300 border-muted-foreground/20 hover:bg-muted hover:text-accent-foreground"
                                >
                                    <User className="h-[1.2rem] w-[1.2rem]" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <NavLink to="/settings">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Configurações</span>
                                    </NavLink>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sair</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Conteúdo da página - definindo altura fixa e overflow para garantir espaço consistente */}
                <main className="flex-1 overflow-auto bg-muted/30 w-full">
                    <AnimatePresence mode="wait">
                        <PageTransition key={location.pathname}>
                            <Outlet />
                        </PageTransition>
                    </AnimatePresence>
                </main>
            </div>

            {/* Sidebar para dispositivos móveis */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={toggleMobileMenu}></div>
                    <div className="relative flex flex-col w-72 max-w-xs bg-background shadow-xl">
                        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                            <div className="flex items-center space-x-2">
                                <h1 className="text-lg font-bold text-gradient">
                                    StashKeeper<span className="text-primary font-bold">Pro</span>
                                </h1>
                            </div>
                            <button
                                onClick={toggleMobileMenu}
                                className="text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="py-4 flex-1 overflow-y-auto">
                            <ul className="space-y-1 px-3">
                                <MobileSidebarItem
                                    to="/dashboard"
                                    icon={<Home className="size-5" />}
                                    label="Dashboard"
                                    isActive={isActive('/dashboard')}
                                    onClick={toggleMobileMenu}
                                />
                                <MobileSidebarItem
                                    to="/products"
                                    icon={<Package className="size-5" />}
                                    label="Produtos"
                                    isActive={isActive('/products')}
                                    onClick={toggleMobileMenu}
                                />
                                <MobileSidebarItem
                                    to="/movements"
                                    icon={<ArrowDownUp className="size-5" />}
                                    label="Movimentações"
                                    isActive={isActive('/movements')}
                                    onClick={toggleMobileMenu}
                                />
                                <MobileSidebarItem
                                    to="/categories"
                                    icon={<ListTodo className="size-5" />}
                                    label="Categorias"
                                    isActive={isActive('/categories')}
                                    onClick={toggleMobileMenu}
                                />
                                <MobileSidebarItem
                                    to="/employees"
                                    icon={<Users className="size-5" />}
                                    label="Colaboradores"
                                    isActive={isActive('/employees')}
                                    onClick={toggleMobileMenu}
                                />
                                <MobileSidebarItem
                                    to="/history"
                                    icon={<FileBox className="size-5" />}
                                    label="Histórico"
                                    isActive={isActive('/history')}
                                    onClick={toggleMobileMenu}
                                />
                                <MobileSidebarItem
                                    to="/reports"
                                    icon={<BarChart3 className="size-5" />}
                                    label="Relatórios"
                                    isActive={isActive('/reports')}
                                    onClick={toggleMobileMenu}
                                />
                                <MobileSidebarItem
                                    to="/settings"
                                    icon={<Settings className="size-5" />}
                                    label="Configurações"
                                    isActive={isActive('/settings')}
                                    onClick={toggleMobileMenu}
                                />
                            </ul>
                        </div>

                        <div className="flex justify-between items-center h-16 border-t border-border p-4">
                            <ModernThemeSwitcher />
                            <button
                                onClick={handleLogout}
                                className="flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                                <LogOut className="size-5" />
                                <span className="ml-2">Sair</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface SidebarItemProps {
    to: string;
    icon: ReactNode;
    label: string;
    isActive: boolean;
    collapsed: boolean;
}

const SidebarItem = ({ to, icon, label, isActive, collapsed }: SidebarItemProps) => {
    return (
        <li>
            <NavLink
                to={to}
                className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 h-11",
                    isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-sm"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center"
                )}
            >
                <div className={cn(
                    "flex items-center justify-center transition-transform w-5 h-5",
                    isActive && "text-primary",
                    !isActive && "text-muted-foreground group-hover:text-foreground"
                )}>
                    {icon}
                </div>
                {!collapsed && (
                    <span className={cn(
                        "ml-3 transition-opacity",
                        isActive && "text-primary"
                    )}>
                        {label}
                    </span>
                )}
            </NavLink>
        </li>
    );
};

interface MobileSidebarItemProps {
    to: string;
    icon: ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const MobileSidebarItem = ({ to, icon, label, isActive, onClick }: MobileSidebarItemProps) => {
    return (
        <li>
            <NavLink
                to={to}
                className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 h-11",
                    isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-sm"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={onClick}
            >
                <div className={cn(
                    "flex items-center justify-center transition-transform w-5 h-5",
                    isActive && "text-primary",
                    !isActive && "text-muted-foreground group-hover:text-foreground"
                )}>
                    {icon}
                </div>
                <span className={cn(
                    "ml-3 transition-opacity",
                    isActive && "text-primary"
                )}>
                    {label}
                </span>
            </NavLink>
        </li>
    );
};

export default IntegratedLayout; 