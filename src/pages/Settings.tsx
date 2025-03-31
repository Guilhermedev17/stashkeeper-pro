import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Bell, Check, EyeOff } from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState({
    email: true,
    criticalStock: true,
    newEntries: true,
  });
  
  const [appSettings, setAppSettings] = useState({
    autoLogout: false,
    darkMode: false,
    showProductCode: true,
  });
  
  const handleSaveProfile = () => {
    toast({
      title: 'Perfil atualizado',
      description: 'Suas informações foram atualizadas com sucesso.',
    });
  };
  
  const handleSaveNotifications = () => {
    toast({
      title: 'Notificações atualizadas',
      description: 'Suas preferências de notificações foram atualizadas.',
    });
  };
  
  const handleSaveAppSettings = () => {
    toast({
      title: 'Configurações salvas',
      description: 'As configurações do aplicativo foram atualizadas.',
    });
  };

  const userName = user?.user_metadata?.name || user?.email || '';
  const userEmail = user?.email || '';
  const userRole = user?.user_metadata?.role || 'user';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações do sistema.
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="app">Aplicativo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" defaultValue={userName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={userEmail} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Input id="role" value={userRole === 'admin' ? 'Administrador' : 'Usuário'} disabled />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancelar</Button>
              <Button onClick={handleSaveProfile}>Salvar Alterações</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Atualize sua senha e configurações de segurança.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancelar</Button>
              <Button>Atualizar Senha</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificações</CardTitle>
              <CardDescription>
                Configure quais notificações deseja receber.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba atualizações por email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="critical-stock">Alertas de Estoque Crítico</Label>
                  <p className="text-sm text-muted-foreground">
                    Seja notificado quando o estoque estiver abaixo do mínimo
                  </p>
                </div>
                <Switch
                  id="critical-stock"
                  checked={notifications.criticalStock}
                  onCheckedChange={(checked) => setNotifications({...notifications, criticalStock: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-entries">Novas Entradas</Label>
                  <p className="text-sm text-muted-foreground">
                    Seja notificado sobre novas entradas no almoxarifado
                  </p>
                </div>
                <Switch
                  id="new-entries"
                  checked={notifications.newEntries}
                  onCheckedChange={(checked) => setNotifications({...notifications, newEntries: checked})}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotifications} className="ml-auto">Salvar Preferências</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Alertas Ativos</CardTitle>
                <CardDescription>
                  Alertas configurados atualmente
                </CardDescription>
              </div>
              <Bell className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">Estoque Crítico</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando o estoque estiver abaixo de 10%
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <EyeOff className="h-4 w-4 mr-2" />
                    Silenciar
                  </Button>
                </div>
                
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">Requisições Pendentes</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar sobre requisições que precisam de aprovação
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <EyeOff className="h-4 w-4 mr-2" />
                    Silenciar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="app" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Aplicativo</CardTitle>
              <CardDescription>
                Personalize a experiência do aplicativo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="theme">Tema</Label>
                  <p className="text-sm text-muted-foreground">
                    Alterne entre tema claro e escuro
                  </p>
                </div>
                <ThemeSwitcher />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-logout">Logout Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Logout após 30 minutos de inatividade
                  </p>
                </div>
                <Switch
                  id="auto-logout"
                  checked={appSettings.autoLogout}
                  onCheckedChange={(checked) => setAppSettings({...appSettings, autoLogout: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-product-code">Mostrar Código do Produto</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir o código do produto nas listagens
                  </p>
                </div>
                <Switch
                  id="show-product-code"
                  checked={appSettings.showProductCode}
                  onCheckedChange={(checked) => setAppSettings({...appSettings, showProductCode: checked})}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveAppSettings} className="ml-auto">Salvar Configurações</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Exportação de Dados</CardTitle>
              <CardDescription>
                Exporte seus dados para outros formatos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">Relatórios</p>
                <p className="text-sm text-muted-foreground">
                  Exporte relatórios em formato CSV ou PDF
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Exportar como CSV
                </Button>
                <Button variant="outline" size="sm">
                  Exportar como PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
