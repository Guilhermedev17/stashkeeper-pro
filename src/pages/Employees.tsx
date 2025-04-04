import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusSquare, UserPlus, Edit2, AlertTriangle, Trash2, Search, Plus, UserCog, UserMinus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ImportEmployeesButton from '@/components/ImportEmployeesButton';
import { ModernHeader } from '@/components/layout/modern';
import PageWrapper from '@/components/layout/PageWrapper';
import PageLoading from '@/components/PageLoading';

// Hook de fallback para quando o RealtimeContext não estiver disponível
const useFallbackRealtime = () => ({
  refreshAllData: () => console.log('Fallback refresh called'),
  lastUpdated: null,
  refreshing: false
});

// Tenta importar useRealtime, mas usa fallback caso falhe
let useRealtimeHook = useFallbackRealtime;
try {
  const RealtimeModule = require('@/contexts/RealtimeContext');
  if (RealtimeModule && RealtimeModule.useRealtime) {
    useRealtimeHook = RealtimeModule.useRealtime;
  }
} catch (error) {
  console.warn('useRealtime não disponível, usando fallback');
}

interface Employee {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  created_at: string;
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [newEmployee, setNewEmployee] = useState({
    code: '',
    name: '',
    status: 'active' as 'active' | 'inactive'
  });

  const { toast } = useToast();
  const {
    employees: supabaseEmployees,
    loading,
    error,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee
  } = useSupabaseEmployees();
  // Usa o hook que pode ser o real ou o fallback
  const { refreshAllData } = useRealtimeHook();

  useEffect(() => {
    if (supabaseEmployees.length > 0) {
      setEmployees(supabaseEmployees);
    }
  }, [supabaseEmployees]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = employees.filter(employee => {
      return (
        employee.name.toLowerCase().includes(lowercasedFilter) ||
        employee.code.toLowerCase().includes(lowercasedFilter)
      );
    });
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  useEffect(() => {
    fetchEmployees();

    const onFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchEmployees();
      }
    };

    document.addEventListener('visibilitychange', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  // Adicionar um listener para eventos de atualização específicos do Excel
  useEffect(() => {
    // Criar um evento personalizado para comunicação entre componentes
    const handleEmployeeImport = () => {
      console.log("Evento de importação de colaboradores detectado - atualizando lista");
      fetchEmployees();
    };

    // Registrar o evento
    window.addEventListener('employee-import-complete', handleEmployeeImport);

    return () => {
      window.removeEventListener('employee-import-complete', handleEmployeeImport);
    };
  }, [fetchEmployees]);

  // Adicionar efeito de carregamento inicial
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Iniciar o tempo para medir quanto leva para carregar os dados
      const startTime = performance.now();

      // Esperar pelo menos que os funcionários sejam carregados
      if (loading) {
        await new Promise(resolve => {
          const checkInterval = setInterval(() => {
            if (!loading) {
              clearInterval(checkInterval);
              resolve(true);
            }
          }, 50);
        });
      }

      // Quando todas as operações de carregamento terminarem, verificamos o tempo
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Garantir tempo mínimo de carregamento para evitar flash
      // Se os dados carregarem muito rápido, mostramos o loading por pelo menos 350ms
      // Se os dados demorarem mais que isso, não adicionamos atraso adicional
      const minLoadingTime = 350;
      const remainingTime = Math.max(0, minLoadingTime - loadTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setIsLoading(false);
    };

    loadData();
  }, [loading]);

  const handleAddEmployee = async () => {
    if (!newEmployee.code || !newEmployee.name) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const result = await addEmployee({
      code: newEmployee.code,
      name: newEmployee.name,
      status: newEmployee.status
    });

    if (result.success) {
      setIsAddDialogOpen(false);
      setNewEmployee({
        code: '',
        name: '',
        status: 'active'
      });
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    const result = await updateEmployee(selectedEmployee.id, {
      name: selectedEmployee.name,
      status: selectedEmployee.status
    });

    if (result.success) {
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
    }
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    const result = await deleteEmployee(selectedEmployee.id);

    if (result.success) {
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
    }
  };

  const statusOptions = [
    { value: 'active', label: 'Ativo', badgeStyle: 'bg-green-500/10 text-green-500 hover:bg-green-500/20' },
    { value: 'inactive', label: 'Inativo', badgeStyle: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20' }
  ];

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <div className="h-full p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Colaboradores</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Gerencie sua equipe
            </p>
          </div>
        </div>

        <PageLoading message="Carregando colaboradores..." />
      </div>
    );
  }

  return (
    <PageWrapper>
      <ModernHeader
        title="Colaboradores"
        subtitle="Gerencie os colaboradores do sistema"
        actions={
          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
            <ImportEmployeesButton />

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 w-full xs:w-auto">
                  <Plus className="size-4" />
                  <span className="flex-nowrap">Novo Colaborador</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <UserPlus className="size-5 text-primary" />
                    Adicionar Colaborador
                  </DialogTitle>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                  <div className="grid gap-3">
                    <Label htmlFor="code" className="text-sm font-medium">
                      Código
                    </Label>
                    <Input
                      id="code"
                      placeholder="Digite o código do colaborador"
                      value={newEmployee.code}
                      onChange={(e) => setNewEmployee({ ...newEmployee, code: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Nome
                    </Label>
                    <Input
                      id="name"
                      placeholder="Digite o nome do colaborador"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="status" className="text-sm font-medium">
                      Status
                    </Label>
                    <Select
                      value={newEmployee.status}
                      onValueChange={(value: 'active' | 'inactive') =>
                        setNewEmployee({ ...newEmployee, status: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="w-[120px]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddEmployee}
                    disabled={!newEmployee.code || !newEmployee.name}
                    className="w-[160px]"
                  >
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="mt-6">
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Filtrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar colaborador por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 overflow-auto">
            <div className="min-w-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="text-right w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-destructive">
                        <div className="flex items-center justify-center gap-2">
                          <AlertTriangle className="size-5" />
                          <p>Erro ao carregar colaboradores</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Search className="size-8" />
                          <p>Nenhum colaborador encontrado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.code}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{employee.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              employee.status === 'active'
                                ? statusOptions[0].badgeStyle
                                : statusOptions[1].badgeStyle
                            )}
                          >
                            {employee.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(employee)}
                              title="Editar colaborador"
                            >
                              <Edit2 className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(employee)}
                              className="text-destructive hover:text-destructive"
                              title="Excluir colaborador"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogos de edição e exclusão */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UserCog className="size-5 text-primary" />
              Editar Colaborador
            </DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="grid gap-5 py-4">
              <div className="grid gap-3">
                <Label htmlFor="edit-code" className="text-sm font-medium">
                  Código
                </Label>
                <Input
                  id="edit-code"
                  value={selectedEmployee.code}
                  disabled
                  className="w-full bg-muted"
                />
                <p className="text-xs text-muted-foreground">O código do colaborador não pode ser alterado.</p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-name" className="text-sm font-medium">
                  Nome
                </Label>
                <Input
                  id="edit-name"
                  placeholder="Digite o nome do colaborador"
                  value={selectedEmployee.name}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, name: e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-status" className="text-sm font-medium">
                  Status
                </Label>
                <Select
                  value={selectedEmployee.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setSelectedEmployee({ ...selectedEmployee, status: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="w-[120px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleEditEmployee}
              disabled={!selectedEmployee?.name}
              className="w-[120px]"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UserMinus className="size-5 text-destructive" />
              Excluir Colaborador
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 px-1">
            <div className="p-4 rounded-lg border bg-muted/40">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-mono">
                  {selectedEmployee?.code}
                </Badge>
                <h3 className="font-medium">{selectedEmployee?.name}</h3>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "mt-3",
                  selectedEmployee?.status === 'active'
                    ? statusOptions[0].badgeStyle
                    : statusOptions[1].badgeStyle
                )}
              >
                {selectedEmployee?.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-[120px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteEmployee}
              className="w-[120px]"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default Employees;