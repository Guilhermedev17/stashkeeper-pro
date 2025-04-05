import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Bell, Check, EyeOff, ShieldCheck, User as UserIcon } from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import { ModernHeader, ModernFilters } from '@/components/layout/modern';
import PageLoading from '@/components/PageLoading';

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [notifications, setNotifications] = useState({
    email: true,
    criticalStock: true,
    newEntries: true,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: name }
      });

      if (error) throw error;

      await refreshUser();

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: 'Ocorreu um erro ao atualizar suas informações.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro ao atualizar senha',
        description: 'A nova senha e a confirmação não coincidem.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Senha atualizada',
        description: 'Sua senha foi atualizada com sucesso.',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: 'Erro ao atualizar senha',
        description: 'Ocorreu um erro ao atualizar sua senha.',
        variant: 'destructive'
      });
    }
  };

  const handleSaveNotifications = () => {
    toast({
      title: 'Notificações atualizadas',
      description: 'Suas preferências de notificações foram atualizadas.',
    });
  };

  const userName = user?.user_metadata?.name || user?.email || '';
  const userEmail = user?.email || '';

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Iniciar o tempo para medir quanto leva para carregar os dados
      const startTime = performance.now();

      // Carregar dados do perfil do usuário, se necessário
      // (Neste caso apenas simulamos uma operação de carregamento)

      // Quando todas as operações de carregamento terminarem, verificamos o tempo
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Garantir tempo mínimo de carregamento para evitar flash
      // Se os dados carregarem muito rápido, mostramos o loading por pelo menos 250ms
      // Se os dados demorarem mais que isso, não adicionamos atraso adicional
      const minLoadingTime = 250;
      const remainingTime = Math.max(0, minLoadingTime - loadTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <PageWrapper>
        <ModernHeader
          title="Configurações"
          subtitle="Gerenciar suas preferências e configurações do sistema"
        />
        <PageLoading message="Carregando configurações..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <ModernHeader
        title="Configurações"
        subtitle="Gerencie suas preferências e configurações do sistema."
      />

      <Tabs defaultValue="profile" className="mt-4">
        <TabsList className="w-full sm:w-auto flex xs:grid xs:grid-cols-2 max-w-md mb-4">
          <TabsTrigger value="profile" className="flex items-center gap-1.5">
            <UserIcon className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary" />
                Informações do Perfil
              </CardTitle>
              <CardDescription className="text-xs">
                Atualize suas informações pessoais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModernFilters>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Nome</label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Email</label>
                    <Input 
                      id="email" 
                      type="email" 
                      defaultValue={userEmail} 
                      disabled 
                      className="h-9 text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 mt-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="theme" className="text-sm">Tema</Label>
                    <p className="text-xs text-muted-foreground">
                      Alterne entre tema claro e escuro
                    </p>
                  </div>
                  <ThemeSwitcher />
                </div>
              </ModernFilters>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm">Cancelar</Button>
              <Button type="button" onClick={handleSaveProfile} size="sm">Salvar Alterações</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Segurança
              </CardTitle>
              <CardDescription className="text-xs">
                Atualize sua senha e configurações de segurança.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModernFilters>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Senha Atual</label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Nova Senha</label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Confirmar Nova Senha</label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </ModernFilters>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleUpdatePassword}
                disabled={!currentPassword || !newPassword || !confirmPassword}
                size="sm"
              >
                Atualizar Senha
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Preferências de Notificações
              </CardTitle>
              <CardDescription className="text-xs">
                Configure quais notificações deseja receber.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModernFilters>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications" className="text-sm">Notificações por Email</Label>
                    <p className="text-xs text-muted-foreground">
                      Receba atualizações por email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="critical-stock" className="text-sm">Alertas de Estoque Crítico</Label>
                    <p className="text-xs text-muted-foreground">
                      Seja notificado quando o estoque estiver abaixo do mínimo
                    </p>
                  </div>
                  <Switch
                    id="critical-stock"
                    checked={notifications.criticalStock}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, criticalStock: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="new-entries" className="text-sm">Novas Entradas</Label>
                    <p className="text-xs text-muted-foreground">
                      Seja notificado sobre novas entradas no almoxarifado
                    </p>
                  </div>
                  <Switch
                    id="new-entries"
                    checked={notifications.newEntries}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, newEntries: checked })}
                  />
                </div>
              </ModernFilters>
            </CardContent>
            <CardFooter className="flex justify-end pt-2">
              <Button type="button" onClick={handleSaveNotifications} size="sm">Salvar Preferências</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
};

export default Settings;
