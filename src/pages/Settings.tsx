import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Check, EyeOff, MoreVertical, Plus, ShieldCheck, Trash2, User, X } from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  lastLogin?: Date;
}

const MOCK_USERS: UserData[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    lastLogin: new Date('2023-07-15T10:30:00'),
  },
  {
    id: '2',
    name: 'Regular User',
    email: 'user@example.com',
    role: 'user',
    status: 'active',
    lastLogin: new Date('2023-07-14T14:45:00'),
  },
  {
    id: '3',
    name: 'João Silva',
    email: 'joao@example.com',
    role: 'user',
    status: 'active',
    lastLogin: new Date('2023-07-10T09:15:00'),
  },
  {
    id: '4',
    name: 'Maria Oliveira',
    email: 'maria@example.com',
    role: 'user',
    status: 'inactive',
  },
];

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>(MOCK_USERS);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
  });
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  
  // Form states
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
  
  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if email already exists
    if (users.some(user => user.email === newUser.email)) {
      toast({
        title: 'Erro',
        description: 'Este email já está cadastrado.',
        variant: 'destructive',
      });
      return;
    }
    
    const newUserData: UserData = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'active',
    };
    
    setUsers([...users, newUserData]);
    setIsAddUserDialogOpen(false);
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'user',
    });
    
    toast({
      title: 'Usuário adicionado',
      description: `${newUserData.name} foi adicionado com sucesso.`,
    });
  };
  
  const handleToggleUserStatus = (userId: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
          : user
      )
    );
    
    const user = users.find(u => u.id === userId);
    if (user) {
      toast({
        title: `Usuário ${user.status === 'active' ? 'desativado' : 'ativado'}`,
        description: `${user.name} foi ${user.status === 'active' ? 'desativado' : 'ativado'} com sucesso.`,
      });
    }
  };
  
  const handleDeleteUser = (userId: string) => {
    // Prevent deleting current user
    if (userId === '1' || userId === '2') {
      toast({
        title: 'Erro',
        description: 'Não é possível excluir este usuário de demonstração.',
        variant: 'destructive',
      });
      return;
    }
    
    const user = users.find(u => u.id === userId);
    setUsers(users.filter(u => u.id !== userId));
    
    if (user) {
      toast({
        title: 'Usuário removido',
        description: `${user.name} foi removido com sucesso.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações do sistema.
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-4 max-w-md">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="app">Aplicativo</TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="users">Usuários</TabsTrigger>
          )}
        </TabsList>
        
        {/* Profile Tab */}
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
                <Input id="name" defaultValue={user?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Input id="role" value={user?.role === 'admin' ? 'Administrador' : 'Usuário'} disabled />
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
        
        {/* Notifications Tab */}
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
        
        {/* App Settings Tab */}
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
        
        {/* Users Tab (Admin Only) */}
        {user?.role === 'admin' && (
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Gerenciamento de Usuários</CardTitle>
                  <CardDescription>
                    Gerencie os usuários que têm acesso ao sistema.
                  </CardDescription>
                </div>
                
                <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes para adicionar um novo usuário ao sistema.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-name">Nome</Label>
                        <Input
                          id="new-name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-email">Email</Label>
                        <Input
                          id="new-email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Senha</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Função</Label>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="role-user"
                              name="role"
                              value="user"
                              checked={newUser.role === 'user'}
                              onChange={() => setNewUser({...newUser, role: 'user'})}
                              className="form-radio h-4 w-4 text-primary"
                            />
                            <Label htmlFor="role-user" className="cursor-pointer">Usuário</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="role-admin"
                              name="role"
                              value="admin"
                              checked={newUser.role === 'admin'}
                              onChange={() => setNewUser({...newUser, role: 'admin'})}
                              className="form-radio h-4 w-4 text-primary"
                            />
                            <Label htmlFor="role-admin" className="cursor-pointer">Administrador</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="button" onClick={handleAddUser}>
                        Adicionar Usuário
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último Acesso</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {user.name}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.role === 'admin' ? (
                            <div className="flex items-center gap-1">
                              <ShieldCheck className="h-4 w-4 text-primary" />
                              <span>Administrador</span>
                            </div>
                          ) : (
                            'Usuário'
                          )}
                        </TableCell>
                        <TableCell>
                          {user.status === 'active' ? (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
                              <Check className="h-4 w-4" />
                              Ativo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <X className="h-4 w-4" />
                              Inativo
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.lastLogin ? (
                            <span className="text-sm text-muted-foreground">
                              {user.lastLogin.toLocaleDateString('pt-BR')} às {user.lastLogin.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Ações</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleToggleUserStatus(user.id)}
                              >
                                {user.status === 'active' ? 'Desativar' : 'Ativar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
