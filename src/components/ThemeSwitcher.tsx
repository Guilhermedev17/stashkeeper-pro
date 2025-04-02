import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-full overflow-hidden transition-all duration-300"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <Sun className={`absolute h-[1.2rem] w-[1.2rem] text-foreground transition-all duration-500 ${theme === 'light' ? 'opacity-0 scale-0 rotate-90' : 'opacity-100 scale-100 rotate-0'}`} />
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] text-foreground transition-all duration-500 ${theme === 'light' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 rotate-90'}`} />
    </Button>
  );
};

export default ThemeSwitcher;
