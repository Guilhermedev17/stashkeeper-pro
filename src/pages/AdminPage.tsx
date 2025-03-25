
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const AdminPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isAdmin, setSpecificUserAsAdmin, setUserAsAdmin } = useAuth();
  const { toast } = useToast();

  const handleSetAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o email do usuário",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await setSpecificUserAsAdmin(email);
      setEmail('');
      toast({
        title: "Sucesso",
        description: `O usuário ${email} foi definido como administrador`,
      });
    } catch (error) {
      console.error('Error setting admin:', error);
      toast({
        title: "Erro",
        description: "Não foi possível definir o usuário como administrador",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelfAdmin = async () => {
    setIsLoading(true);
    try {
      await setUserAsAdmin();
      toast({
        title: "Sucesso",
        description: "Você agora é um administrador",
      });
    } catch (error) {
      console.error('Error setting self as admin:', error);
      toast({
        title: "Erro",
        description: "Não foi possível definir você como administrador",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Área Administrativa
            </CardTitle>
            <CardDescription>
              Esta área é restrita a administradores do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Você não possui permissões administrativas para acessar esta página.
            </p>
            <Button 
              onClick={handleSelfAdmin} 
              className="w-full"
              disabled={isLoading}
            >
              <Shield className="mr-2 h-4 w-4" />
              Tornar-me Administrador
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <UserCog className="h-8 w-8 text-primary" />
        Administração do Sistema
      </h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Gerenciar Administradores
            </CardTitle>
            <CardDescription>
              Defina usuários como administradores do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email do usuário</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Processando...' : 'Definir como Administrador'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-start text-sm text-muted-foreground">
            <p>Usuários administradores podem:</p>
            <ul className="list-disc list-inside mt-1">
              <li>Gerenciar outros usuários</li>
              <li>Acessar todas as funcionalidades do sistema</li>
              <li>Configurar parâmetros globais</li>
            </ul>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
