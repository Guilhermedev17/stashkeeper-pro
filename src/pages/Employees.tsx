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
import { PlusSquare, UserPlus, Edit2, AlertTriangle, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ImportEmployeesButton from '@/components/ImportEmployeesButton';

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Colaboradores</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os colaboradores do sistema
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <ImportEmployeesButton />

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Novo Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Colaborador</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    placeholder="Digite o código do colaborador"
                    value={newEmployee.code}
                    onChange={(e) => setNewEmployee({ ...newEmployee, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Digite o nome do colaborador"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newEmployee.status}
                    onValueChange={(value: 'active' | 'inactive') => 
                      setNewEmployee({ ...newEmployee, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={handleAddEmployee}
                  disabled={!newEmployee.code || !newEmployee.name}
                >
                  Adicionar Colaborador
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Colaborador</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Código</Label>
                  <Input
                    id="edit-code"
                    value={selectedEmployee.code}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome</Label>
                  <Input
                    id="edit-name"
                    placeholder="Digite o nome do colaborador"
                    value={selectedEmployee.name}
                    onChange={(e) => setSelectedEmployee({ ...selectedEmployee, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={selectedEmployee.status}
                    onValueChange={(value: 'active' | 'inactive') => 
                      setSelectedEmployee({ ...selectedEmployee, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={handleEditEmployee}
                  disabled={!selectedEmployee.name}
                >
                  Atualizar Colaborador
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Colaborador</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o colaborador {selectedEmployee?.name}?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteEmployee}
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-none bg-background">
          <CardContent className="p-0">
            <Input
              placeholder="Buscar colaborador por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </CardContent>
        </Card>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
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
                      <AlertTriangle className="h-5 w-5" />
                      <p>Erro ao carregar colaboradores</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="h-8 w-8" />
                      <p>Nenhum colaborador encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.code}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={employee.status === 'active' ? 'default' : 'secondary'}
                        className={cn(
                          employee.status === 'active' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
                        )}
                      >
                        {employee.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(employee)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(employee)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Employees;