import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { Mail, KeyRound, User, Eye, EyeOff, BarChart2, LineChart } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Fundo gradiente para o tema claro */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/60 light-only"></div>

      {/* Fundo para o tema escuro */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 dark-only"></div>

      {/* Grid pattern para ambos os temas */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(100, 120, 255, 0.4) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(100, 120, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}>
        </div>
      </div>

      {/* Elementos decorativos sutis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Circulos decorativos - lado direito superior */}
        <div className="absolute top-[8%] right-[8%] w-56 h-56 rounded-full border border-primary/5 opacity-30 hidden md:block"></div>
        <div className="absolute top-[15%] right-[15%] w-24 h-24 rounded-full border border-primary/5 opacity-20 hidden md:block"></div>

        {/* Circulos decorativos - lado esquerdo inferior */}
        <div className="absolute bottom-[12%] left-[8%] w-40 h-40 rounded-full border border-primary/5 opacity-20 hidden md:block"></div>
        <div className="absolute bottom-[25%] left-[5%] w-20 h-20 rounded-full border border-primary/5 opacity-15 hidden md:block"></div>
        
        {/* Linhas decorativas horizontais - distribuídas pela tela */}
        <div className="absolute top-[22%] left-[5%] w-[15%] h-px bg-gradient-to-r from-primary/10 to-transparent hidden md:block"></div>
        <div className="absolute top-[25%] left-[10%] w-[10%] h-px bg-gradient-to-r from-primary/10 to-transparent hidden md:block"></div>
        
        <div className="absolute top-[70%] right-[8%] w-[15%] h-px bg-gradient-to-l from-primary/10 to-transparent hidden md:block"></div>
        <div className="absolute top-[73%] right-[12%] w-[10%] h-px bg-gradient-to-l from-primary/10 to-transparent hidden md:block"></div>

        {/* Elementos gráficos sutis - colocados nos cantos */}
        <div className="absolute bottom-[15%] right-[6%] text-primary/15 hidden md:block">
          <BarChart2 size={120} strokeWidth={1} />
        </div>
        <div className="absolute top-[18%] left-[6%] text-primary/10 hidden md:block">
          <LineChart size={100} strokeWidth={1} />
        </div>

        {/* Elementos para telas menores */}
        <div className="absolute top-[5%] right-[5%] w-20 h-20 rounded-full border border-primary/5 opacity-20 md:hidden"></div>
        <div className="absolute bottom-[5%] left-[5%] w-20 h-20 rounded-full border border-primary/5 opacity-20 md:hidden"></div>
        </div>

      <div className="flex flex-col items-center md:items-start md:flex-row w-full max-w-6xl px-6 z-10">
        {/* Lado esquerdo - Conteúdo da marca */}
        <div className="w-full md:w-1/2 mb-8 md:mb-0 md:pr-8">
          <div className="mb-4 md:mb-8">
            <div className="flex items-center justify-center md:justify-start">
              <svg className="w-12 h-12 text-primary" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V5C22 3.9 21.1 3 20 3ZM4 19V5H20V19H4Z" />
                <path d="M6 7H18V9H6V7Z" />
                <path d="M6 11H18V13H6V11Z" />
                <path d="M6 15H12V17H6V15Z" />
          </svg>
              <h1 className="text-3xl md:text-4xl font-bold ml-2 text-gradient">
                StashKeeper<span className="text-primary font-bold">Pro</span>
              </h1>
        </div>
            <p className="text-center md:text-left text-muted-foreground mt-2">
              Sistema Inteligente de Gerenciamento de Estoque
            </p>
        </div>

          <div className="hidden md:block">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              {isLoginMode ? 'Olá, Bem-vindo de volta!' : 'Crie sua conta'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isLoginMode 
                ? 'Entre em sua conta para gerenciar seus produtos e controlar seu estoque de forma eficiente.' 
                : 'Registre-se para começar a usar o StashKeeper e otimizar o gerenciamento do seu estoque.'}
            </p>
            
            <div className="hidden md:flex space-x-6 mb-6">
              <div className="flex items-center">
                <div className="rounded-full p-2 bg-primary/10 mr-3">
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.9999 2C6.47774 2 1.99994 6.478 1.99994 12C1.99994 17.522 6.47774 22 11.9999 22C17.5219 22 21.9999 17.522 21.9999 12C21.9999 6.478 17.5219 2 11.9999 2ZM16.7879 10.121L11.2999 15.607C11.1069 15.8 10.8559 15.896 10.6059 15.896C10.3559 15.896 10.1049 15.8 9.91194 15.607L7.21194 12.908C6.82594 12.522 6.82594 11.88 7.21194 11.494C7.59794 11.107 8.23894 11.107 8.62594 11.494L10.6059 13.474L15.3799 8.7C15.7659 8.314 16.4069 8.314 16.7939 8.7C17.1809 9.086 17.1799 9.726 16.7879 10.121Z" />
          </svg>
        </div>
                <div>
                  <h3 className="text-sm font-semibold">Fácil de Usar</h3>
                  <p className="text-xs text-muted-foreground">Interface intuitiva</p>
        </div>
      </div>

              <div className="flex items-center">
                <div className="rounded-full p-2 bg-primary/10 mr-3">
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" />
                  </svg>
      </div>
                <div>
                  <h3 className="text-sm font-semibold">Seguro</h3>
                  <p className="text-xs text-muted-foreground">Acesso protegido</p>
      </div>
      </div>
      </div>
        </div>
      </div>

        {/* Lado direito - Formulário */}
        <div className="w-full md:w-1/2 max-w-md">
          <div className="bg-card rounded-xl shadow-lg p-6 md:p-8 border border-border/30">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {isLoginMode ? 'Faça login' : 'Criar uma nova conta'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isLoginMode ? 'Acesse sua conta para continuar' : 'Preencha os dados para se cadastrar'}
          </p>
        </div>

            <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
                <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nome</Label>
                  <div className="relative">
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLoginMode}
                      className="pl-10"
              />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
            </div>
          )}

              <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
                    className="pl-10"
            />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
          </div>

              <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              {isLoginMode && (
                <Button variant="link" className="h-auto p-0 text-xs">
                  Esqueceu a senha?
                </Button>
              )}
            </div>
                <div className="relative">
            <Input
              id="password"
                    type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
                    className="pl-10 pr-10"
                  />
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
          </div>

          <Button
            type="submit"
                className="w-full mt-2 bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
              {isLoading
                ? (isLoginMode ? 'Entrando...' : 'Criando conta...')
                  : (isLoginMode ? 'Login' : 'Cadastrar')}
          </Button>

              <div className="pt-2 text-center">
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
            </form>
        </div>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default Login;
