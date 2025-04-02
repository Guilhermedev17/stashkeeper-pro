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

  const fetchEmployees = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setEmployees(data as Employee[]);
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

  const addEmployee = async (employee: Omit<Employee, 'id' | 'created_at'>) => {
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
      
      toast({
        title: 'Colaborador adicionado',
        description: `${employee.name} foi adicionado com sucesso.`,
      });
      
      return { success: true, data };
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar colaborador';
      if (errorMessage.includes('duplicate key value')) {
        errorMessage = 'Código já está em uso';
      }
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Omit<Employee, 'id' | 'created_at'>>) => {
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
      
      toast({
        title: 'Colaborador atualizado',
        description: `Colaborador foi atualizado com sucesso.`,
      });
      
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar colaborador';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
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
            setEmployees(prev => [payload.new as Employee, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setEmployees(prev => prev.filter(employee => employee.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
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

  const deleteEmployee = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .delete()
        .match({ id })
        .select()
        .single();

      if (error) throw error;
      
      setEmployees(prevEmployees => 
        prevEmployees.filter(employee => employee.id !== id)
      );
      
      toast({
        title: 'Colaborador excluído',
        description: `Colaborador foi excluído com sucesso.`,
      });
      
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir colaborador';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  };
};