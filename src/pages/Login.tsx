import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { Mail, KeyRound, User, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Add name field for signup
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLoginMode) {
        // Login flow
        await login(email, password);
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao StashKeeper',
        });
        navigate('/dashboard');
      } else {
        // Register flow with name metadata
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name, // Store name in user metadata
            },
          },
        });

        if (error) throw error;

        toast({
          title: 'Conta criada com sucesso',
          description: 'Verifique seu email para confirmar seu cadastro.',
        });

        // Switch back to login mode
        setIsLoginMode(true);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: isLoginMode ? 'Erro ao fazer login' : 'Erro ao criar conta',
        description: 'Email ou senha inválidos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background/95 dark:bg-background/95 p-4 relative overflow-hidden">
      {/* Fundo abstrato premium para tema claro */}
      <div className="absolute inset-0 light-only bg-gradient-to-br from-blue-50 via-white to-indigo-50 opacity-90"></div>
      <div className="absolute inset-0 light-only bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent"></div>

      {/* Grid pattern animado para tema claro */}
      <div className="absolute inset-0 light-only opacity-20 overflow-hidden">
        <div className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(100, 120, 255, 0.15) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(100, 120, 255, 0.15) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            animation: 'pan 50s infinite linear'
          }}>
        </div>
      </div>

      {/* Fundo abstrato para tema escuro */}
      <div className="absolute inset-0 dark-only bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 opacity-95"></div>
      <div className="absolute inset-0 dark-only bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>

      {/* Grid pattern para tema escuro */}
      <div className="absolute inset-0 dark-only opacity-10 overflow-hidden">
        <div className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(100, 120, 255, 0.2) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(100, 120, 255, 0.2) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            animation: 'pan 60s infinite linear'
          }}>
        </div>
      </div>

      {/* Partículas fluidas para tema claro */}
      <div className="absolute light-only w-48 h-48 rounded-full bg-gradient-radial from-blue-200/50 to-transparent blur-xl top-1/4 left-1/4 animate-float"></div>
      <div className="absolute light-only w-64 h-64 rounded-full bg-gradient-radial from-indigo-200/50 to-transparent blur-xl bottom-1/3 right-1/4 animate-float-reverse animation-delay-1000"></div>
      <div className="absolute light-only w-72 h-72 rounded-full bg-gradient-radial from-purple-200/40 to-transparent blur-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-subtle"></div>

      {/* Partículas brilhantes para tema claro */}
      <div className="absolute light-only inset-0 overflow-hidden">
        <div className="particle absolute w-2 h-2 rounded-full bg-blue-400/80 top-[15%] left-[10%] animate-twinkle animate-pulse-glow"></div>
        <div className="particle absolute w-3 h-3 rounded-full bg-indigo-400/80 top-[25%] left-[20%] animate-twinkle animation-delay-500 animate-pulse-glow"></div>
        <div className="particle absolute w-2 h-2 rounded-full bg-purple-400/80 top-[40%] left-[40%] animate-twinkle animation-delay-1000 animate-pulse-glow"></div>
        <div className="particle absolute w-1.5 h-1.5 rounded-full bg-pink-400/80 top-[60%] left-[30%] animate-twinkle animation-delay-1500 animate-pulse-glow"></div>
        <div className="particle absolute w-2 h-2 rounded-full bg-blue-400/80 top-[70%] left-[15%] animate-twinkle animation-delay-2000 animate-pulse-glow"></div>
        <div className="particle absolute w-3 h-3 rounded-full bg-indigo-400/80 top-[85%] left-[35%] animate-twinkle animation-delay-700 animate-pulse-glow"></div>

        <div className="particle absolute w-2 h-2 rounded-full bg-purple-400/80 top-[10%] right-[20%] animate-twinkle animation-delay-300 animate-pulse-glow"></div>
        <div className="particle absolute w-1.5 h-1.5 rounded-full bg-pink-400/80 top-[30%] right-[10%] animate-twinkle animation-delay-800 animate-pulse-glow"></div>
        <div className="particle absolute w-3 h-3 rounded-full bg-blue-400/80 top-[50%] right-[25%] animate-twinkle animation-delay-1300 animate-pulse-glow"></div>
        <div className="particle absolute w-2 h-2 rounded-full bg-indigo-400/80 top-[65%] right-[40%] animate-twinkle animation-delay-1800 animate-pulse-glow"></div>
        <div className="particle absolute w-1.5 h-1.5 rounded-full bg-purple-400/80 top-[80%] right-[15%] animate-twinkle animate-pulse-glow"></div>
        <div className="particle absolute w-3 h-3 rounded-full bg-pink-400/80 top-[90%] right-[30%] animate-twinkle animation-delay-500 animate-pulse-glow"></div>
      </div>

      {/* Adicionando bolhas coloridas flutuantes para tema claro */}
      <div className="absolute light-only w-10 h-10 rounded-full bg-blue-400/60 blur-md top-[20%] right-[15%] animate-float-random"></div>
      <div className="absolute light-only w-8 h-8 rounded-full bg-indigo-400/60 blur-md top-[30%] right-[30%] animate-float-random animation-delay-700"></div>
      <div className="absolute light-only w-12 h-12 rounded-full bg-purple-400/60 blur-md top-[60%] right-[20%] animate-float-random animation-delay-1500"></div>
      <div className="absolute light-only w-6 h-6 rounded-full bg-pink-400/60 blur-sm top-[45%] right-[10%] animate-float-random animation-delay-2000"></div>

      {/* Elementos vibrantes exclusivos para o tema claro */}
      <div className="absolute light-only w-28 h-28 bg-gradient-to-r from-blue-400/40 to-indigo-400/40 rounded-full blur-xl top-[35%] left-[55%] animate-float-random animation-delay-1200"></div>
      <div className="absolute light-only w-20 h-20 bg-gradient-to-r from-purple-400/40 to-pink-400/40 rounded-full blur-xl top-[55%] left-[15%] animate-float-random animation-delay-1800"></div>
      <div className="absolute light-only w-24 h-24 bg-gradient-to-r from-blue-400/40 to-purple-400/40 rounded-full blur-xl top-[75%] left-[45%] animate-float-random animation-delay-500"></div>

      {/* Luzes de destaque para o tema claro */}
      <div className="absolute light-only w-40 h-40 bg-blue-400/20 rounded-full blur-2xl top-[20%] left-[60%] animate-pulse-glow"></div>
      <div className="absolute light-only w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl top-[60%] left-[70%] animate-pulse-glow animation-delay-1000"></div>
      <div className="absolute light-only w-36 h-36 bg-purple-400/20 rounded-full blur-2xl top-[80%] left-[30%] animate-pulse-glow animation-delay-1500"></div>

      {/* Estrelas cintilantes para o tema escuro */}
      <div className="absolute dark-only inset-0 overflow-hidden">
        <div className="absolute w-1 h-1 rounded-full bg-white/60 top-[10%] left-[20%] animate-twinkle"></div>
        <div className="absolute w-1.5 h-1.5 rounded-full bg-white/70 top-[15%] left-[40%] animate-twinkle animation-delay-500"></div>
        <div className="absolute w-1 h-1 rounded-full bg-white/60 top-[20%] left-[80%] animate-twinkle animation-delay-1000"></div>
        <div className="absolute w-1 h-1 rounded-full bg-white/70 top-[30%] left-[10%] animate-twinkle animation-delay-1500"></div>
        <div className="absolute w-2 h-2 rounded-full bg-white/60 top-[35%] left-[30%] animate-twinkle animation-delay-2000"></div>
        <div className="absolute w-1 h-1 rounded-full bg-white/80 top-[40%] left-[60%] animate-twinkle animation-delay-700"></div>
        <div className="absolute w-1.5 h-1.5 rounded-full bg-white/70 top-[50%] left-[80%] animate-twinkle animation-delay-300"></div>
        <div className="absolute w-1 h-1 rounded-full bg-white/60 top-[60%] left-[60%] animate-twinkle animation-delay-800"></div>
        <div className="absolute w-1 h-1 rounded-full bg-white/70 top-[65%] left-[20%] animate-twinkle animation-delay-1300"></div>
        <div className="absolute w-1.5 h-1.5 rounded-full bg-white/80 top-[70%] left-[40%] animate-twinkle animation-delay-1800"></div>
        <div className="absolute w-1 h-1 rounded-full bg-white/60 top-[75%] left-[70%] animate-twinkle"></div>
        <div className="absolute w-1 h-1 rounded-full bg-white/70 top-[80%] left-[15%] animate-twinkle animation-delay-500"></div>
      </div>

      {/* Nebulas para o tema escuro */}
      <div className="absolute dark-only w-60 h-60 rounded-full bg-primary/5 blur-3xl top-1/3 right-1/3 animate-float-reverse"></div>
      <div className="absolute dark-only w-80 h-80 rounded-full bg-indigo-900/10 blur-3xl bottom-1/4 left-1/3 animate-float"></div>
      <div className="absolute dark-only w-72 h-72 rounded-full bg-purple-900/10 blur-3xl top-1/4 left-1/4 animate-float-reverse animation-delay-1000"></div>

      {/* Círculos decorativos para tema escuro */}
      <div className="absolute dark-only w-96 h-96 rounded-full border border-primary/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-subtle"></div>
      <div className="absolute dark-only w-[500px] h-[500px] rounded-full border border-primary/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-subtle animation-delay-1000"></div>
      <div className="absolute dark-only w-[700px] h-[700px] rounded-full border border-primary/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-subtle animation-delay-2000"></div>

      {/* Elementos decorativos para o tema escuro */}
      <div className="absolute dark-only w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-60 blur-3xl -top-20 -right-20 animate-pulse-subtle"></div>
      <div className="absolute dark-only w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-60 blur-3xl -bottom-20 -left-20 animate-pulse-subtle animation-delay-1500"></div>

      {/* Elementos adicionais para o tema claro */}
      <div className="absolute light-only w-60 h-60 rounded-full bg-gradient-to-br from-blue-200/50 to-purple-200/50 blur-3xl top-1/3 right-1/2 animate-float-reverse animation-delay-300 animate-rotate"></div>
      <div className="absolute light-only w-52 h-52 rounded-full bg-gradient-to-tr from-indigo-200/50 to-pink-200/50 blur-2xl bottom-1/4 left-1/2 animate-float animation-delay-1000 animate-rotate"></div>

      {/* Elementos especiais apenas para tema claro com mais visibilidade */}
      <div className="absolute hidden md:block light-only w-80 h-80 rounded-full bg-gradient-to-tr from-blue-300/40 to-indigo-300/40 blur-3xl top-1/4 right-1/3 animate-float-reverse animation-delay-1200 animate-color-shift"></div>
      <div className="absolute hidden md:block light-only w-72 h-72 rounded-full bg-gradient-to-bl from-purple-300/40 to-pink-300/40 blur-3xl bottom-1/3 left-1/4 animate-float animation-delay-500 animate-rotate"></div>

      {/* Padrões geométricos exclusivos para o tema claro */}
      <div className="absolute light-only w-96 h-96 rounded-full border-2 border-blue-400/50 top-20 right-20 animate-pulse-subtle"></div>
      <div className="absolute light-only w-64 h-64 rounded-full border-2 border-indigo-400/50 bottom-20 left-1/4 animate-pulse-subtle animation-delay-1000"></div>
      <div className="absolute light-only w-80 h-80 rounded-full border-4 border-purple-400/40 top-1/2 right-1/4 animate-pulse-subtle animation-delay-1500"></div>

      {/* Elementos decorativos adicionais apenas para tema claro */}
      <div className="absolute light-only w-full h-full bg-blue-200/40 rounded-full blur-3xl -top-20 -left-20 animate-pulse-subtle"></div>
      <div className="absolute light-only w-full h-full bg-indigo-200/40 rounded-full blur-3xl -bottom-10 -right-10 animate-pulse-subtle animation-delay-1200"></div>

      {/* Efeito de brilho animado para tema claro */}
      <div className="absolute light-only inset-0 bg-gradient-to-br from-primary/15 to-transparent opacity-50 animate-pulse-subtle"></div>

      {/* Efeito de brilho animado para ambos os temas */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-30 animate-pulse-subtle"></div>

      {/* Ícones temáticos flutuantes relacionados ao sistema */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Ícones para o tema claro */}
        <div className="absolute light-only w-8 h-8 text-blue-500/60 top-[25%] right-[28%] animate-icon-float animation-delay-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3Zm4 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm2-7a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm8 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </div>
        <div className="absolute light-only w-9 h-9 text-indigo-500/60 top-[65%] right-[13%] animate-icon-float animation-delay-1500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5Zm10 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-6 8h12v-2a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3v2Z" />
          </svg>
        </div>
        <div className="absolute light-only w-7 h-7 text-purple-500/60 top-[15%] left-[25%] animate-icon-float animation-delay-1200">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 2a1 1 0 0 0-1 1v3H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1V3a1 1 0 0 0-1-1H8ZM7 8h10v10H7V8Zm2 3v4h6v-4H9Z" />
          </svg>
        </div>
        <div className="absolute light-only w-8 h-8 text-blue-500/60 top-[50%] left-[15%] animate-icon-float animation-delay-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 5V19H19V5H5ZM4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3ZM13 7H16V16H13V7ZM10 9H7V16H10V9Z" />
          </svg>
        </div>
        <div className="absolute light-only w-9 h-9 text-indigo-500/60 top-[80%] left-[22%] animate-icon-float animation-delay-1800">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 18h1.4l3.7-6.5-3.7-6.5H2V3h9v2H9.4l3 5.3a1 1 0 0 1 0 .4l-3 5.3H11v2H2v-2Zm15-9h4v2h-4v-2Zm0 4h4v2h-4v-2Zm-8 3h2v3h-2v-3Zm0-14h2v3h-2V2Zm4 7h2v3h-2V9Zm0-7h2v3h-2V2Z" />
          </svg>
        </div>

        {/* Ícones adicionais para o tema claro */}
        <div className="absolute light-only w-8 h-8 text-blue-500/60 top-[38%] right-[45%] animate-icon-float animation-delay-950">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 19V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Zm14-13H7v2h10V6Zm0 4H7v6h10v-6Zm0 8H7v2h10v-2Z" />
          </svg>
        </div>
        <div className="absolute light-only w-7 h-7 text-purple-500/60 top-[72%] right-[32%] animate-icon-float animation-delay-1250">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 11.646V21H3v-9.354l-3-3V6h4.756a4.5 4.5 0 0 1 8.488 0H24v2.646l-3 3Zm-1-6.646H4v.465l3 3V18h10v-9.535l3-3V5ZM12 3a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 12 8a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 12 3Z" />
          </svg>
        </div>
        <div className="absolute light-only w-8 h-8 text-blue-500/60 top-[18%] right-[60%] animate-icon-float animation-delay-300">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.012 2a3 3 0 0 0-3-3H4.012a3 3 0 0 0-3 3v20a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V11h6a1 1 0 0 0 1-1V2h-1Zm-7 18h-4v-4h4v4Zm0-6h-4v-4h4v4Zm0-6h-4V4h4v4Zm6 0h-4V4h4v4Z" />
          </svg>
        </div>

        {/* Ícones para o tema escuro */}
        <div className="absolute dark-only w-8 h-8 text-blue-400/40 top-[25%] right-[28%] animate-icon-float animation-delay-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3Zm4 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm2-7a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm8 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </div>
        <div className="absolute dark-only w-9 h-9 text-indigo-400/40 top-[65%] right-[13%] animate-icon-float animation-delay-1500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5Zm10 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-6 8h12v-2a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3v2Z" />
          </svg>
        </div>
        <div className="absolute dark-only w-7 h-7 text-purple-400/40 top-[15%] left-[25%] animate-icon-float animation-delay-1200">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 2a1 1 0 0 0-1 1v3H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1V3a1 1 0 0 0-1-1H8ZM7 8h10v10H7V8Zm2 3v4h6v-4H9Z" />
          </svg>
        </div>
        <div className="absolute dark-only w-8 h-8 text-blue-400/40 top-[50%] left-[15%] animate-icon-float animation-delay-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 5V19H19V5H5ZM4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3ZM13 7H16V16H13V7ZM10 9H7V16H10V9Z" />
          </svg>
        </div>
        <div className="absolute dark-only w-9 h-9 text-indigo-400/40 top-[80%] left-[22%] animate-icon-float animation-delay-1800">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 18h1.4l3.7-6.5-3.7-6.5H2V3h9v2H9.4l3 5.3a1 1 0 0 1 0 .4l-3 5.3H11v2H2v-2Zm15-9h4v2h-4v-2Zm0 4h4v2h-4v-2Zm-8 3h2v3h-2v-3Zm0-14h2v3h-2V2Zm4 7h2v3h-2V9Zm0-7h2v3h-2V2Z" />
          </svg>
        </div>

        {/* Ícones adicionais para o tema escuro */}
        <div className="absolute dark-only w-8 h-8 text-blue-400/40 top-[38%] right-[45%] animate-icon-float animation-delay-950">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 19V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Zm14-13H7v2h10V6Zm0 4H7v6h10v-6Zm0 8H7v2h10v-2Z" />
          </svg>
        </div>
        <div className="absolute dark-only w-7 h-7 text-purple-400/40 top-[72%] right-[32%] animate-icon-float animation-delay-1250">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 11.646V21H3v-9.354l-3-3V6h4.756a4.5 4.5 0 0 1 8.488 0H24v2.646l-3 3Zm-1-6.646H4v.465l3 3V18h10v-9.535l3-3V5ZM12 3a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 12 8a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 12 3Z" />
          </svg>
        </div>
        <div className="absolute dark-only w-8 h-8 text-blue-400/40 top-[18%] right-[60%] animate-icon-float animation-delay-300">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.012 2a3 3 0 0 0-3-3H4.012a3 3 0 0 0-3 3v20a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V11h6a1 1 0 0 0 1-1V2h-1Zm-7 18h-4v-4h4v4Zm0-6h-4v-4h4v4Zm0-6h-4V4h4v4Zm6 0h-4V4h4v4Z" />
          </svg>
        </div>
      </div>

      {/* Partículas adicionais - tema claro */}
      <div className="absolute light-only inset-0 overflow-hidden">
        <div className="particle absolute w-2 h-2 rounded-full bg-blue-400/80 top-[8%] left-[30%] animate-twinkle animate-pulse-glow"></div>
        <div className="particle absolute w-1.5 h-1.5 rounded-full bg-indigo-400/80 top-[32%] left-[42%] animate-twinkle animation-delay-600 animate-pulse-glow"></div>
        <div className="particle absolute w-1 h-1 rounded-full bg-purple-400/80 top-[88%] left-[65%] animate-twinkle animation-delay-800 animate-pulse-glow"></div>
        <div className="particle absolute w-1.5 h-1.5 rounded-full bg-pink-400/80 top-[75%] left-[83%] animate-twinkle animation-delay-1200 animate-pulse-glow"></div>
        <div className="particle absolute w-1 h-1 rounded-full bg-blue-400/80 top-[12%] left-[75%] animate-twinkle animation-delay-1600 animate-pulse-glow"></div>
        <div className="particle absolute w-2 h-2 rounded-full bg-indigo-400/80 top-[55%] left-[90%] animate-twinkle animation-delay-900 animate-pulse-glow"></div>

        <div className="particle absolute w-1.5 h-1.5 rounded-full bg-purple-400/80 top-[10%] right-[42%] animate-twinkle animation-delay-400 animate-pulse-glow"></div>
        <div className="particle absolute w-1 h-1 rounded-full bg-pink-400/80 top-[42%] right-[22%] animate-twinkle animation-delay-950 animate-pulse-glow"></div>
        <div className="particle absolute w-2 h-2 rounded-full bg-blue-400/80 top-[63%] right-[35%] animate-twinkle animation-delay-1250 animate-pulse-glow"></div>
        <div className="particle absolute w-1 h-1 rounded-full bg-indigo-400/80 top-[83%] right-[48%] animate-twinkle animation-delay-1650 animate-pulse-glow"></div>
      </div>

      {/* Partículas adicionais - tema escuro */}
      <div className="absolute dark-only inset-0 overflow-hidden">
        <div className="absolute w-1 h-1 rounded-full bg-white/60 top-[8%] left-[30%] animate-twinkle"></div>
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white/70 top-[32%] left-[42%] animate-twinkle animation-delay-600"></div>
        <div className="absolute w-1 h-1 rounded-full bg-white/60 top-[88%] left-[65%] animate-twinkle animation-delay-800"></div>
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white/70 top-[75%] left-[83%] animate-twinkle animation-delay-1200"></div>
        <div className="absolute w-1 h-1 rounded-full bg-white/60 top-[12%] left-[75%] animate-twinkle animation-delay-1600"></div>
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white/70 top-[55%] left-[90%] animate-twinkle animation-delay-900"></div>

        <div className="absolute w-1 h-1 rounded-full bg-white/60 top-[10%] right-[42%] animate-twinkle animation-delay-400"></div>
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white/70 top-[42%] right-[22%] animate-twinkle animation-delay-950"></div>
        <div className="absolute w-1 h-1 rounded-full bg-white/60 top-[63%] right-[35%] animate-twinkle animation-delay-1250"></div>
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white/70 top-[83%] right-[48%] animate-twinkle animation-delay-1650"></div>
      </div>

      {/* Elementos animados adicionais - Ondas animadas */}
      <div className="absolute inset-x-0 bottom-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-20 light-only bg-gradient-to-r from-blue-300/20 via-indigo-300/20 to-purple-300/20 animate-wave"></div>
        <div className="absolute w-full h-24 -bottom-4 light-only bg-gradient-to-r from-indigo-300/10 via-purple-300/10 to-blue-300/10 animate-wave-reverse"></div>
        <div className="absolute w-full h-16 -bottom-2 light-only bg-gradient-to-r from-purple-300/15 via-blue-300/15 to-indigo-300/15 animate-wave animation-delay-500"></div>

        <div className="absolute w-full h-20 dark-only bg-gradient-to-r from-blue-800/10 via-indigo-800/10 to-purple-800/10 animate-wave"></div>
        <div className="absolute w-full h-24 -bottom-4 dark-only bg-gradient-to-r from-indigo-800/5 via-purple-800/5 to-blue-800/5 animate-wave-reverse"></div>
        <div className="absolute w-full h-16 -bottom-2 dark-only bg-gradient-to-r from-purple-800/8 via-blue-800/8 to-indigo-800/8 animate-wave animation-delay-500"></div>
      </div>

      {/* Partículas flutuantes grandes */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute w-40 h-40 rounded-full bg-gradient-to-br from-blue-400/10 to-purple-400/10 blur-3xl -top-10 left-1/4 animate-floating-blob animation-delay-300"></div>
        <div className="absolute w-56 h-56 rounded-full bg-gradient-to-br from-indigo-400/10 to-blue-400/10 blur-3xl top-1/3 -right-20 animate-floating-blob animation-delay-700"></div>
        <div className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-purple-400/10 to-indigo-400/10 blur-3xl -bottom-10 left-1/3 animate-floating-blob animation-delay-1100"></div>
        <div className="absolute w-60 h-60 rounded-full bg-gradient-to-br from-blue-400/10 to-purple-400/10 blur-3xl bottom-1/4 right-1/4 animate-floating-blob animation-delay-1500"></div>
      </div>

      {/* Partículas com efeitos mais dinâmicos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute light-only w-3 h-3 rounded-full bg-blue-400/40 blur-sm top-[40%] left-[45%] animate-pulse-and-move"></div>
        <div className="absolute light-only w-2 h-2 rounded-full bg-indigo-400/40 blur-sm top-[25%] right-[55%] animate-pulse-and-move animation-delay-400"></div>
        <div className="absolute light-only w-4 h-4 rounded-full bg-purple-400/40 blur-sm bottom-[35%] left-[65%] animate-pulse-and-move animation-delay-800"></div>

        <div className="absolute dark-only w-3 h-3 rounded-full bg-blue-400/20 blur-sm top-[40%] left-[45%] animate-pulse-and-move"></div>
        <div className="absolute dark-only w-2 h-2 rounded-full bg-indigo-400/20 blur-sm top-[25%] right-[55%] animate-pulse-and-move animation-delay-400"></div>
        <div className="absolute dark-only w-4 h-4 rounded-full bg-purple-400/20 blur-sm bottom-[35%] left-[65%] animate-pulse-and-move animation-delay-800"></div>
      </div>

      {/* Créditos do desenvolvedor */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center z-10">
        <div className="px-3 py-1.5 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm animate-pulse-subtle">
          <p className="text-xs text-foreground/70 font-medium">
            Desenvolvido por: <span className="text-primary font-semibold animate-pulse-glow">Guilherme Sarmento</span>
          </p>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md px-4 sm:px-8 py-8 sm:py-12 rounded-2xl card-glass card-border-glow animate-form-appear shadow-xl dark:shadow-primary/5 light:shadow-xl light:shadow-blue-200/30 backdrop-blur-xl relative z-10 overflow-hidden">
        {/* Gradiente estático interno mais minimalista */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-primary/5 dark:to-transparent pointer-events-none"></div>

        <div className="text-center mb-6 sm:mb-8 animate-fade-in animation-delay-100">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient animate-color-shift">
            StashKeeper<span className="text-primary font-bold">Pro</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-xs sm:text-sm">
            Sistema Inteligente de Gerenciamento de Estoque
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {!isLoginMode && (
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLoginMode}
                className="bg-background/50"
                prefix={<User className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
          )}

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              className="bg-background/50"
              prefix={<Mail className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              {isLoginMode && (
                <Button variant="link" className="h-auto p-0 text-xs">
                  Esqueceu a senha?
                </Button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50"
              prefix={<KeyRound className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <Button
            type="submit"
            className="w-full transition-all duration-300 rounded-lg bg-primary text-primary-foreground hover:shadow-md mt-6 sm:mt-8 relative overflow-hidden group"
            disabled={isLoading}
          >
            {/* Efeito de hover no botão */}
            <span className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            <span className="relative flex items-center justify-center">
              {isLoading
                ? (isLoginMode ? 'Entrando...' : 'Criando conta...')
                : (isLoginMode ? 'Entrar' : 'Criar conta')}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            </span>
          </Button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <Button
            variant="link"
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-xs sm:text-sm"
          >
            {isLoginMode
              ? 'Não tem uma conta? Cadastre-se'
              : 'Já tem uma conta? Faça login'}
          </Button>
        </div>

        <div className="mt-3 sm:mt-4 text-center text-xs text-muted-foreground">
          <p>Para usar o sistema, crie uma conta ou entre com</p>
          <p className="mt-1">e-mail e senha de sua escolha</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
