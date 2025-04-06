import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Interface atualizada conforme a estrutura real da tabela
interface DbMovement {
  id: string;
  product_id: string;
  type: 'entrada' | 'saida';
  quantity: number;
  user_id: string | null;
  notes: string | null;
  created_at: string;
  employee_id: string | null;
  products?: {
    id: string;
    name: string;
    code: string;
  };
  employees?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

// Interface expandida com campos adicionais usados na UI
interface Movement {
  id: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  type: 'entrada' | 'saida';
  quantity: number;
  user_id: string | null;
  user_name?: string;
  employee_id: string | null;
  employee_name?: string | null;
  employee_code?: string | null;
  notes: string | null;
  created_at: string;
  products?: {
    id: string;
    name: string;
    code: string;
  };
  employees?: any | null;
}

export const useSupabaseMovements = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Array para manter registro das movimentações excluídas
  // Inicializar com os valores do localStorage se disponíveis
  const [deletedMovementIds] = useState<Set<string>>(() => {
    const savedIds = localStorage.getItem('deletedMovementIds');
    if (savedIds) {
      try {
        const parsed = JSON.parse(savedIds);
        return new Set(parsed);
      } catch (e) {
        console.error('Erro ao carregar IDs excluídas:', e);
        return new Set<string>();
      }
    }
    return new Set<string>();
  });

  // Função auxiliar para salvar IDs excluídas no localStorage
  const saveDeletedIds = () => {
    try {
      localStorage.setItem('deletedMovementIds', JSON.stringify([...deletedMovementIds]));
    } catch (e) {
      console.error('Erro ao salvar IDs excluídas:', e);
    }
  };

  // Função para adicionar um ID à lista de excluídos
  const addToDeletedIds = (id: string) => {
    deletedMovementIds.add(id);
    saveDeletedIds();
  };

  const fetchMovements = async () => {
    if (loading) return; // Evita múltiplas requisições simultâneas
    try {
      setLoading(true);
      console.log('Buscando movimentações...');
      
      // Buscar todas as movimentações com informações dos produtos
      const { data, error } = await supabase
        .from('movements')
        .select(`
          id, product_id, type, quantity, user_id, notes, created_at, employee_id,
          products:products(id, name, code)
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Erro na consulta Supabase:', error);
        throw new Error(`Erro ao buscar movimentações: ${error.message}`);
      }

      if (!data) {
        throw new Error('Nenhum dado retornado da consulta');
      }
      
      console.log(`Recebidas ${data.length} movimentações do servidor`);
      
      // Filtrar movimentações que foram excluídas anteriormente
      let filteredData = (data as any[]).filter(m => !deletedMovementIds.has(m.id));
      
      if (data.length !== filteredData.length) {
        console.log(`Filtradas ${data.length - filteredData.length} movimentações excluídas anteriormente`);
      }
      
      // Formatar os dados para incluir informações do produto e garantir o tipo correto
      let formattedData: Movement[] = (filteredData as unknown as DbMovement[]).map(movement => {
        const validType = movement.type === 'entrada' || movement.type === 'saida' ? movement.type : 'entrada';
        
        return {
          id: movement.id,
          product_id: movement.product_id,
          type: validType,
          quantity: movement.quantity,
          user_id: movement.user_id,
          notes: movement.notes,
          created_at: movement.created_at,
          employee_id: movement.employee_id,
          product_name: movement.products?.name || 'Produto Removido',
          product_code: movement.products?.code || 'N/A',
          user_name: 'Usuário do Sistema',
          employee_name: null,
          employee_code: null,
          products: movement.products,
          employees: null
        };
      });
      
      // Agora, buscar os dados dos colaboradores separadamente
      // Primeiro, filtrar apenas movimentações com employee_id
      const movementsWithEmployees = formattedData.filter(m => m.employee_id);
      
      if (movementsWithEmployees.length > 0) {
        // Obter uma lista única de employee_ids
        const employeeIds = [...new Set(movementsWithEmployees.map(m => m.employee_id))].filter(Boolean);
        
        // Buscar os colaboradores em uma única consulta
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, name, code')
          .in('id', employeeIds as string[]);
          
        if (!employeesError && employeesData) {
          // Criar um mapa para acesso rápido
          const employeeMap = new Map();
          employeesData.forEach(emp => {
            employeeMap.set(emp.id, emp);
          });
          
          // Atualizar as movimentações com os dados dos colaboradores
          formattedData = formattedData.map(movement => {
            if (movement.employee_id && employeeMap.has(movement.employee_id)) {
              const employee = employeeMap.get(movement.employee_id);
              return {
                ...movement,
                employee_name: employee.name,
                employee_code: employee.code,
                employees: employee
              };
            }
            return movement;
          });
        }
      }
      
      setMovements(formattedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar movimentações';
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

  const handleProductChangeEvent = async (payload: RealtimePostgresChangesPayload<any>) => {
    // Buscar informações do produto para o novo movimento
    const fetchProductInfo = async (productId: string) => {
      const { data } = await supabase
        .from('products')
        .select('name, code')
        .eq('id', productId)
        .single();
      return data;
    };

    // Buscar informações do colaborador
    const fetchEmployeeInfo = async (employeeId: string | null) => {
      if (!employeeId) return null;
      const { data } = await supabase
        .from('employees')
        .select('name, code')
        .eq('id', employeeId)
        .single();
      return data;
    };

    if (payload.eventType === 'DELETE') {
      // Tratamento especial para exclusões - garantir que a movimentação seja removida
      const deletedId = payload.old.id;
      console.log(`Evento DELETE recebido para movimento ${deletedId}`);
      
      // Adicionar à lista de IDs excluídas para evitar que reapareça
      addToDeletedIds(deletedId);
      
      // Garantir que a movimentação excluída seja removida do estado
      setMovements(prevMovements => {
        // Importante: criar uma cópia do array para garantir nova referência
        const updatedMovements = [...prevMovements];
        // Filtrar removendo a movimentação
        const filteredMovements = updatedMovements.filter(movement => movement.id !== deletedId);
        
        console.log(`Movimento ${deletedId} removido via evento. Anterior: ${prevMovements.length}, Atual: ${filteredMovements.length}`);
        
        // Retornar como nova referência para forçar atualização da UI
        return [...filteredMovements];
      });
      
      return; // Importante: não prosseguir com o restante da função
    } else if (payload.eventType === 'INSERT') {
      // Verificar se a movimentação não está na lista de excluídos
      if (deletedMovementIds.has(payload.new.id)) {
        console.log(`Ignorando INSERT de movimento excluído: ${payload.new.id}`);
        return;
      }
      
      const productInfo = await fetchProductInfo(payload.new.product_id);
      const employeeInfo = await fetchEmployeeInfo(payload.new.employee_id);
      const newMovement: Movement = {
        ...payload.new,
        product_name: productInfo?.name || 'Produto Removido',
        product_code: productInfo?.code || 'N/A',
        user_name: 'Usuário do Sistema',
        employee_id: payload.new.employee_id || null,
        employee_name: employeeInfo?.name || null,
        employee_code: employeeInfo?.code || null,
        employees: employeeInfo
      };
      setMovements(prev => [newMovement, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      // Verificar se a movimentação não está na lista de excluídos
      if (deletedMovementIds.has(payload.new.id)) {
        console.log(`Ignorando UPDATE de movimento excluído: ${payload.new.id}`);
        return;
      }
      
      const productInfo = await fetchProductInfo(payload.new.product_id);
      const employeeInfo = await fetchEmployeeInfo(payload.new.employee_id);
      const updatedMovement: Movement = {
        ...payload.new,
        product_name: productInfo?.name || 'Produto Removido',
        product_code: productInfo?.code || 'N/A',
        user_name: 'Usuário do Sistema',
        employee_id: payload.new.employee_id || null,
        employee_name: employeeInfo?.name || null,
        employee_code: employeeInfo?.code || null,
        employees: employeeInfo
      };
      setMovements(prev => prev.map(movement =>
        movement.id === updatedMovement.id ? updatedMovement : movement
      ));
    }
  };

  useEffect(() => {
    fetchMovements();

    // Configurar subscriber para atualizações em tempo real
    const subscription = supabase
      .channel('movements_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'movements' 
        }, 
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log("Movimento payload:", payload.eventType, payload);
          await handleProductChangeEvent(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função auxiliar para excluir movimentações
  const deleteMovement = async (id: string, options?: { silent?: boolean, skipUIUpdate?: boolean }) => {
    try {
      console.log(`[useSupabaseMovements] Tentando excluir movimentação ${id}`);
      
      // 1. Buscar a movimentação para obter informações antes de excluir
      const { data: movementData, error: fetchError } = await supabase
        .from('movements')
        .select('id, product_id, type, quantity')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('[useSupabaseMovements] Erro ao buscar detalhes da movimentação:', fetchError);
        throw new Error(`Não foi possível buscar a movimentação: ${fetchError.message}`);
      }
      
      if (!movementData) {
        console.error('[useSupabaseMovements] Movimentação não encontrada:', id);
        throw new Error('Movimentação não encontrada');
      }
      
      console.log('[useSupabaseMovements] Detalhes da movimentação:', movementData);
      
      // 2. Buscar a quantidade atual do produto
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', movementData.product_id)
        .single();
      
      if (productError) {
        console.error('[useSupabaseMovements] Erro ao buscar produto:', productError);
        throw new Error(`Não foi possível buscar o produto: ${productError.message}`);
      }
      
      // 3. Calcular a nova quantidade do produto
      let currentQuantity = productData.quantity || 0;
      let newQuantity = currentQuantity;
      
      // Converter quantity para número se for string após alteração para DECIMAL
      const movementQuantity = typeof movementData.quantity === 'string' 
        ? parseFloat(movementData.quantity) 
        : movementData.quantity;
      
      if (movementData.type === 'entrada') {
        // Se for entrada, diminuir a quantidade
        newQuantity = currentQuantity - movementQuantity;
      } else {
        // Se for saída, aumentar a quantidade
        newQuantity = currentQuantity + movementQuantity;
      }
      
      console.log('[useSupabaseMovements] Atualizando produto:', {
        currentQuantity,
        movementQuantity,
        newQuantity,
        type: movementData.type
      });
      
      // 4. Atualizar o produto
      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity: newQuantity })
        .eq('id', movementData.product_id);
      
      if (updateError) {
        console.error('[useSupabaseMovements] Erro ao atualizar produto:', updateError);
        throw new Error(`Não foi possível atualizar o produto: ${updateError.message}`);
      }
      
      // 5. Excluir a movimentação
      console.log('[useSupabaseMovements] Excluindo movimentação:', id);
      const { error: deleteError } = await supabase
        .from('movements')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('[useSupabaseMovements] Erro ao excluir movimentação:', deleteError);
        // Reverter a alteração da quantidade do produto em caso de erro
        await supabase
          .from('products')
          .update({ quantity: currentQuantity })
          .eq('id', movementData.product_id);
          
        throw new Error(`Não foi possível excluir a movimentação: ${deleteError.message}`);
      }
      
      // 6. Registrar a exclusão localmente
      addToDeletedIds(id);
      
      // 7. Atualizar a UI, se necessário
      if (!options?.skipUIUpdate) {
        setMovements(prevMovements => {
          return prevMovements.filter(movement => movement.id !== id);
        });
      }
      
      // 8. Exibir notificação, se não estiver no modo silencioso
      if (!options?.silent) {
        toast({
          title: 'Movimentação excluída',
          description: 'A movimentação foi excluída com sucesso.',
          variant: 'default',
        });
      }
      
      console.log('[useSupabaseMovements] Movimentação excluída com sucesso:', id);
      return { success: true };
    } catch (err) {
      console.error('[useSupabaseMovements] Erro ao excluir movimentação:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir movimentação';
      
      // Exibir notificação de erro apenas se não estiver no modo silencioso
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

  return {
    movements,
    loading,
    error,
    fetchMovements,
    // Adicionar função para excluir movimentação (usar no componente)
    deleteMovementLocally: (id: string) => {
      // Adicionar à lista de IDs excluídas
      addToDeletedIds(id);
      // Atualizar o estado removendo a movimentação
      setMovements(prevMovements => {
        // Importante: criar uma nova referência para garantir re-renderização
        const updatedMovements = [...prevMovements].filter(movement => movement.id !== id);
        console.log(`[useSupabaseMovements] Movimentação ${id} removida localmente. Total: ${prevMovements.length} -> ${updatedMovements.length}`);
        
        // Forçar nova referência para garantir que o React reconheça a mudança
        return [...updatedMovements];
      });
    },
    // Adicionar a função de exclusão
    deleteMovement
  };
};
