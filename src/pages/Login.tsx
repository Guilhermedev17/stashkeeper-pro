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
    <div className="h-screen w-full flex items-center justify-center bg-background/95 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl -top-64 -right-64 animate-pulse-subtle"></div>
      <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/10 blur-3xl -bottom-32 -left-32 animate-pulse-subtle animation-delay-700"></div>
      
      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitcher />
      </div>
      
      <div className="w-full max-w-md px-8 py-12 rounded-2xl card-glass animate-scale-in shadow-xl dark:shadow-primary/5 backdrop-blur-xl border border-white/20 dark:border-white/5 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient">
            StashKeeper<span className="text-primary font-bold">Pro</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Sistema Inteligente de Gerenciamento de Estoque
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLoginMode && (
            <div className="space-y-2">
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
          
          <div className="space-y-2">
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
          
          <div className="space-y-2">
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
            className="w-full transition-all duration-300 rounded-lg bg-primary text-primary-foreground hover:shadow-md mt-8"
            disabled={isLoading}
          >
            {isLoading 
              ? (isLoginMode ? 'Entrando...' : 'Criando conta...') 
              : (isLoginMode ? 'Entrar' : 'Criar conta')}
            {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <Button 
            variant="link" 
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-sm"
          >
            {isLoginMode 
              ? 'Não tem uma conta? Cadastre-se' 
              : 'Já tem uma conta? Faça login'}
          </Button>
        </div>
        
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>Para usar o sistema, crie uma conta ou entre com</p>
          <p className="mt-1">e-mail e senha de sua escolha</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
