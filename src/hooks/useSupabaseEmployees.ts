import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface Employee {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export const useSupabaseEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Array para manter registro de colaboradores excluídos
  // Inicializar com os valores do localStorage se disponíveis
  const [deletedEmployeeIds] = useState<Set<string>>(() => {
    const savedIds = localStorage.getItem('deletedEmployeeIds');
    if (savedIds) {
      try {
        const parsed = JSON.parse(savedIds);
        return new Set(parsed);
      } catch (e) {
        console.error('Erro ao carregar IDs de colaboradores excluídos:', e);
        return new Set<string>();
      }
    }
    return new Set<string>();
  });

  // Função auxiliar para salvar IDs excluídas no localStorage
  const saveDeletedIds = () => {
    try {
      localStorage.setItem('deletedEmployeeIds', JSON.stringify([...deletedEmployeeIds]));
    } catch (e) {
      console.error('Erro ao salvar IDs de colaboradores excluídos:', e);
    }
  };

  // Função para adicionar um ID à lista de excluídos
  const addToDeletedIds = (id: string) => {
    deletedEmployeeIds.add(id);
    saveDeletedIds();
  };

  const fetchEmployees = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filtrar colaboradores excluídos
      const filteredData = (data as Employee[]).filter(emp => !deletedEmployeeIds.has(emp.id));
      console.log(`Filtrados ${data.length - filteredData.length} colaboradores excluídos`);
      
      setEmployees(filteredData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar colaboradores';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (
    employee: Omit<Employee, 'id' | 'created_at'>,
    options?: { silent?: boolean }
  ) => {
    try {
      // Verificar se código já existe
      const { data: existing } = await supabase
        .from('employees')
        .select('code')
        .eq('code', employee.code)
        .single();

      if (existing) {
        throw new Error('Código já está em uso');
      }

      const { data, error } = await supabase
        .from('employees')
        .insert([employee])
        .select()
        .single();

      if (error) throw error;
      
      setEmployees(prevEmployees => [data as Employee, ...prevEmployees]);
      
      if (!options?.silent) {
        toast({
          title: 'Colaborador adicionado',
          description: `${employee.name} foi adicionado com sucesso.`,
          variant: 'success'
        });
      }
      
      return { success: true, data };
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar colaborador';
      if (errorMessage.includes('duplicate key value')) {
        errorMessage = 'Código já está em uso';
      }
      
      if (!options?.silent) {
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const updateEmployee = async (
    id: string, 
    updates: Partial<Omit<Employee, 'id' | 'created_at'>>,
    options?: { silent?: boolean }
  ) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .match({ id })
        .select()
        .single();

      if (error) throw error;
      
      setEmployees(prevEmployees => 
        prevEmployees.map(employee => 
          employee.id === id ? { ...employee, ...data } as Employee : employee
        )
      );
      
      if (!options?.silent) {
        toast({
          title: 'Colaborador atualizado',
          description: `Colaborador foi atualizado com sucesso.`,
          variant: 'success'
        });
      }
      
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar colaborador';
      
      if (!options?.silent) {
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const deleteEmployee = async (id: string, options?: { silent?: boolean, skipUIUpdate?: boolean }) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .delete()
        .match({ id })
        .select()
        .single();

      if (error) throw error;
      
      // Adicionar à lista de colaboradores excluídos
      addToDeletedIds(id);
      
      // Atualizar o estado apenas se skipUIUpdate for falso
      if (!options?.skipUIUpdate) {
        setEmployees(prevEmployees => {
          const updatedEmployees = [...prevEmployees].filter(employee => employee.id !== id);
          console.log(`Colaborador ${id} removido. Total: ${prevEmployees.length} -> ${updatedEmployees.length}`);
          return updatedEmployees;
        });
      }
      
      // Exibir notificação apenas se não estiver no modo silencioso
      if (!options?.silent) {
        toast({
          title: 'Colaborador excluído',
          description: `Colaborador foi excluído com sucesso.`,
          variant: 'success'
        });
      }
      
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir colaborador';
      
      // Exibir notificação apenas se não estiver no modo silencioso
      if (!options?.silent) {
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Função para excluir vários colaboradores de uma vez
  const deleteMultipleEmployees = async (ids: string[]) => {
    if (ids.length === 0) return { success: true, data: [] };
    
    let success = true;
    let deleted = 0;
    const errors: string[] = [];
    
    // Criar apenas uma notificação que pode ser atualizada
    const toastInstance = toast({
      title: "Exclusão em lote",
      description: `Iniciando exclusão de ${ids.length} colaboradores...`,
      variant: "progress"
    });
    
    // Desativar temporariamente atualizações visuais
    const originalEmployees = [...employees];
    
    try {
      // Executar cada exclusão individualmente
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        
        // Atualizar a notificação regularmente
        const progressPercent = Math.floor((i / ids.length) * 100);
        if (ids.length < 10 || i % Math.max(1, Math.floor(ids.length / 20)) === 0) {
          toastInstance.update({
            id: toastInstance.id,
            title: "Exclusão em andamento",
            description: `${i + 1} de ${ids.length} colaboradores processados (${progressPercent}%)`,
            variant: "progress"
          });
        }
        
        // Usar o modo silencioso e pular atualizações de UI
        const result = await deleteEmployee(id, { silent: true, skipUIUpdate: true });
        
        if (result.success) {
          deleted++;
        } else {
          success = false;
          if (result.error) errors.push(result.error);
        }
      }
      
      // Agora atualizar a UI de uma vez
      if (ids.length >= originalEmployees.length) {
        setEmployees([]);
      } else {
        const updatedEmployees = originalEmployees.filter(emp => !ids.includes(emp.id));
        setEmployees(updatedEmployees);
      }
      
      // Atualizar notificação final
      toastInstance.update({
        id: toastInstance.id,
        title: success ? "Colaboradores excluídos" : "Exclusão parcial",
        description: success
          ? `${deleted} de ${ids.length} colaboradores excluídos com sucesso (100%).`
          : `${deleted} de ${ids.length} colaboradores foram excluídos (100%). Alguns não puderam ser excluídos.`,
        variant: success ? "success" : "destructive"
      });
      
      return { success, data: deleted, errors };
    } catch (error) {
      console.error("Erro durante exclusão em lote:", error);
      
      // Restaurar estado em caso de erro
      setEmployees(originalEmployees.filter(emp => !ids.slice(0, deleted).includes(emp.id)));
      
      toastInstance.update({
        id: toastInstance.id,
        title: "Erro na exclusão",
        description: "Ocorreu um erro durante a exclusão em lote.",
        variant: "destructive"
      });
      
      return { success: false, error: "Erro ao processar exclusão em lote" };
    }
  };

  useEffect(() => {
    fetchEmployees();

    const subscription = supabase
      .channel('employees_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'employees' 
        }, 
        (payload: RealtimePostgresChangesPayload<Employee>) => {
          if (payload.eventType === 'INSERT') {
            // Verificar se não está na lista de excluídos
            if (deletedEmployeeIds.has(payload.new.id)) {
              console.log(`Ignorando INSERT de colaborador excluído: ${payload.new.id}`);
              return;
            }
            setEmployees(prev => [payload.new as Employee, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            // Adicionar à lista de excluídos
            addToDeletedIds(payload.old.id);
            setEmployees(prev => prev.filter(employee => employee.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            // Verificar se não está na lista de excluídos
            if (deletedEmployeeIds.has(payload.new.id)) {
              console.log(`Ignorando UPDATE de colaborador excluído: ${payload.new.id}`);
              return;
            }
            setEmployees(prev => prev.map(employee =>
              employee.id === payload.new.id ? payload.new as Employee : employee
            ));
          }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    deleteMultipleEmployees
  };
};