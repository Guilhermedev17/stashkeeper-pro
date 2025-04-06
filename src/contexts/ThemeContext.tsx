import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if theme is stored in localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    // Check if user prefers dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme || (prefersDark ? 'dark' : 'light');
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Armazena primeiro no localStorage para garantir consistência em recargas
    localStorage.setItem('theme', theme);
    
    // Preserva botões e ícones de troca de tema da desativação de transições
    const themeToggleElements = document.querySelectorAll('.theme-toggle-btn, .theme-toggle-icon');
    themeToggleElements.forEach(el => el.classList.add('preserve-animations'));
    
    // Bloqueia todas as transições antes de qualquer mudança, exceto nos elementos preservados
    root.classList.add('disable-transitions');
    
    // Garante que não há efeitos de transição pendentes
    // Executando tudo de forma síncrona para minimizar flashes
    root.classList.remove('light', 'dark');
    
    // Força um reflow completo em todo o documento antes de continuar
    void document.documentElement.offsetHeight;
    void document.body.offsetHeight;
    
    // Aplicando a nova classe de tema
    root.classList.add(theme);
    root.style.setProperty('--theme-transition', theme);
    
    // Usa um setTimeout com prioridade alta para reativar transições
    // depois que todas as mudanças do DOM tiverem sido processadas
    setTimeout(() => {
      requestAnimationFrame(() => {
        root.classList.remove('disable-transitions');
      });
    }, 16); // Aproximadamente um frame a 60fps
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const value = { theme, setTheme, toggleTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
