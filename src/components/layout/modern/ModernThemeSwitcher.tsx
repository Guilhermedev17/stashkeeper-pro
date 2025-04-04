import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Componente moderno para alternar entre os temas claro e escuro.
 * Inclui animações suaves e feedback visual.
 */
export function ModernThemeSwitcher() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleTheme}
                        className="relative w-9 h-9 rounded-full overflow-hidden transition-all duration-300 border-muted-foreground/20 hover:bg-muted hover:text-accent-foreground"
                        aria-label={`Alternar para o tema ${isDark ? 'claro' : 'escuro'}`}
                    >
                        <span className="sr-only">
                            {isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                        </span>

                        {/* Ícones com animação suave */}
                        <Sun className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-500 ${isDark
                                ? 'rotate-0 scale-100 opacity-100'
                                : 'rotate-90 scale-0 opacity-0'
                            }`} />

                        <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-500 ${!isDark
                                ? 'rotate-0 scale-100 opacity-100'
                                : 'rotate-90 scale-0 opacity-0'
                            }`} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <p>{isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default ModernThemeSwitcher; 