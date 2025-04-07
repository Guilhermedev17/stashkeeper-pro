import { useState, useEffect, useCallback } from 'react';
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
  deleted?: boolean; // Adicionado o campo deleted
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
  deleted?: boolean; // Adicionado o campo deleted
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
  
  // Tratamento de IDs de movimentações excluídas
  const [deletedMovementIds, setDeletedMovementIds] = useState<Set<string>>(new Set());

  // Adicionar ID à lista de excluídos de forma persistente
  const addToDeletedIds = useCallback((id: string) => {
    // Atualizar o estado local
    setDeletedMovementIds(prev => {
      const updated = new Set(prev);
      updated.add(id);
      return updated;
    });

    // Persistir no localStorage para garantir que a movimentação não volte
    try {
      const storedIds = JSON.parse(localStorage.getItem('deletedMovementIds') || '[]');
      if (!storedIds.includes(id)) {
        storedIds.push(id);
        localStorage.setItem('deletedMovementIds', JSON.stringify(storedIds));
        console.log(`[useSupabaseMovements] ID ${id} adicionado à lista persistente de movimentações excluídas`);
      }
    } catch (error) {
      console.error('[useSupabaseMovements] Erro ao atualizar localStorage com ID excluído:', error);
    }
  }, []);

  // Inicializar a lista de IDs excluídos a partir do localStorage
  useEffect(() => {
    try {
      const storedIds = JSON.parse(localStorage.getItem('deletedMovementIds') || '[]');
      if (storedIds.length > 0) {
        setDeletedMovementIds(new Set(storedIds));
        console.log(`[useSupabaseMovements] Carregados ${storedIds.length} IDs de movimentações excluídas do localStorage`);
      }
    } catch (error) {
      console.error('[useSupabaseMovements] Erro ao carregar IDs excluídos do localStorage:', error);
    }
  }, []);

  const fetchMovements = async (productId?: string) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('movements')
        .select(`
          id, 
          created_at, 
          type, 
          quantity, 
          product_id,
          employee_id,
          notes,
          deleted,
          products:products(id, name, code),
          employees:employees(id, name, code)
        `)
        .eq('deleted', false) // Filtrar apenas movimentações não excluídas
        .order('created_at', { ascending: false });
      
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Processar os dados para o formato esperado
        const formattedData: Movement[] = data.map((item) => {
          // Filtrar novamente para garantir que movimentações excluídas não passem
          if (item.deleted === true || deletedMovementIds.has(item.id)) {
            console.log(`[useSupabaseMovements] Ignorando movimentação excluída: ${item.id}`);
            return null;
          }
          
          return {
            id: item.id,
            created_at: item.created_at,
            type: item.type,
            quantity: item.quantity,
            product_id: item.product_id,
            product_name: item.products?.name || 'Produto Removido',
            product_code: item.products?.code || 'N/A',
            user_name: 'Usuário do Sistema',
            employee_id: item.employee_id || null,
            employee_name: item.employees?.name || null,
            employee_code: item.employees?.code || null,
            notes: item.notes || '',
            deleted: item.deleted,
            products: item.products,
            employees: item.employees
          };
        }).filter(Boolean) as Movement[];
        
        // Registrar para depuração
        console.log(`[useSupabaseMovements] Buscados ${data.length} movimentos, filtrados para ${formattedData.length} após remoção de excluídos`);
        
        setMovements(formattedData);
      }
    } catch (error) {
      console.error('[useSupabaseMovements] Erro ao buscar movimentos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao buscar movimentos',
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

    // Log detalhado do payload para depuração
    console.log(`[useSupabaseMovements] Evento recebido: ${payload.eventType} para movimento ${payload.new?.id || '(sem id)'}`, payload);

    // Tratamento simplificado para DELETE, apenas log sem tentar acessar payload.old diretamente
    if (payload.eventType === 'DELETE') {
      console.log(`[useSupabaseMovements] Evento DELETE recebido`, payload);
      
      // Como não temos garantia de acesso seguro ao payload.old.id devido ao tipo,
      // não faremos nada específico aqui. A lógica de exclusão já é tratada com
      // o update para deleted=true antes de qualquer exclusão física
      return;
    }

    // Tratamento especial quando a movimentação é marcada como excluída
    if (payload.eventType === 'UPDATE' && payload.new && payload.new.deleted === true) {
      const deletedId = payload.new.id;
      console.log(`[useSupabaseMovements] Evento UPDATE com deleted=true recebido para movimento ${deletedId}`);
      
      // Garantir que o ID está na lista de IDs excluídas localmente
      addToDeletedIds(deletedId);
      
      // Remover imediatamente a movimentação da lista
      setMovements(prevMovements => {
        const updatedMovements = prevMovements.filter(movement => movement.id !== deletedId);
        
        // Verificar se houve remoção efetiva
        if (updatedMovements.length !== prevMovements.length) {
          console.log(`[useSupabaseMovements] Removida movimentação ${deletedId} da lista local`);
        } else {
          console.log(`[useSupabaseMovements] Movimentação ${deletedId} já não estava na lista local`);
        }
        
        return updatedMovements;
      });
      
      return;
    }

    // Ignorar TODOS os eventos para movimentações marcadas como excluídas ou na lista de excluídos
    if ((payload.new && 
          (payload.new.deleted === true || 
           (('id' in payload.new) && deletedMovementIds.has(payload.new.id as string)))) ||
        (payload.old && ('id' in payload.old) && deletedMovementIds.has(payload.old.id as string))) {
      console.log(`[useSupabaseMovements] Ignorando evento para movimento excluído: ${
        (payload.new && ('id' in payload.new) ? payload.new.id : '') || 
        (payload.old && ('id' in payload.old) ? payload.old.id : '')
      }`);
      return;
    }

    // Processamento normal para outros tipos de eventos (INSERT, UPDATE não-excluído)
    if (payload.eventType === 'INSERT') {
      // Verificar se a movimentação não está na lista de excluídos e não está marcada como excluída
      if (deletedMovementIds.has(payload.new.id) || payload.new.deleted === true) {
        console.log(`[useSupabaseMovements] Ignorando INSERT de movimento excluído: ${payload.new.id}`);
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
      // Verificar se a movimentação não está na lista de excluídos e não está marcada como excluída
      if (deletedMovementIds.has(payload.new.id) || payload.new.deleted === true) {
        console.log(`[useSupabaseMovements] Ignorando UPDATE de movimento excluído: ${payload.new.id}`);
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
          console.log("[useSupabaseMovements] Movimento payload:", payload.eventType, payload);
          
          // Verificar se esta movimentação está na lista de excluídos
          const moveId = 
            (payload.new && ('id' in payload.new) ? payload.new.id as string : undefined) || 
            (payload.old && ('id' in payload.old) ? payload.old.id as string : undefined);
            
          if (moveId && deletedMovementIds.has(moveId)) {
            console.log(`[useSupabaseMovements] Ignorando evento para movimentação na lista de excluídos: ${moveId}`);
            return;
          }
          
          // Interceptar IMEDIATAMENTE eventos de UPDATE com deleted=true
          if (payload.eventType === 'UPDATE' && payload.new && payload.new.deleted === true) {
            const deletedId = payload.new.id;
            console.log(`[useSupabaseMovements] *** EVENTO DE EXCLUSÃO DETECTADO *** ID: ${deletedId}`);
            
            // Garantir que este ID esteja na lista de excluídos
            addToDeletedIds(deletedId);
            
            // Remover IMEDIATAMENTE do estado local
            setMovements(prevMovements => {
              const filtered = prevMovements.filter(m => m.id !== deletedId);
              console.log(`[useSupabaseMovements] Removidas ${prevMovements.length - filtered.length} movimentações após evento de exclusão`);
              return filtered;
            });
            
            return;
          }
          
          // Ignorar qualquer outro evento para movimentações marcadas como excluídas
          if (payload.new && payload.new.deleted === true) {
            console.log(`[useSupabaseMovements] Ignorando evento para movimentação marcada como excluída: ${payload.new.id}`);
            return;
          }
          
          // Para outros tipos de eventos, continuar com o processamento normal
          await handleProductChangeEvent(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [deletedMovementIds]); // Adicionando dependência para garantir que os eventos sejam filtrados corretamente

  // Função para marcar movimentação como excluída (soft delete)
  const deleteMovement = async (id: string, options?: { silent?: boolean, skipUIUpdate?: boolean }) => {
    try {
      console.log(`[useSupabaseMovements] Tentando excluir movimentação ${id}`);
      
      // 1. Buscar a movimentação para obter informações antes de excluir
      const { data: movementData, error: fetchError } = await supabase
        .from('movements')
        .select('id, product_id, type, quantity, deleted')
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

      // Verificar se já está excluída
      if (movementData.deleted) {
        console.log('[useSupabaseMovements] Movimentação já está marcada como excluída:', id);
        return { success: true };
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
        
        // Verificar se a nova quantidade seria negativa
        if (newQuantity < 0) {
          console.log('[useSupabaseMovements] A exclusão geraria estoque negativo. Realizando compensação.');
          
          // Quantidade necessária para compensação (apenas o que faltaria para zerar)
          const compensationQuantity = Math.abs(newQuantity);
          
          // 1. Registrar entrada de compensação
          const { data: compData, error: compError } = await supabase
            .from('movements')
            .insert({
              product_id: movementData.product_id,
              type: 'entrada',
              quantity: compensationQuantity,
              notes: `Compensação automática para exclusão da movimentação ${id}`,
              created_at: new Date().toISOString()
            })
            .select('id, quantity')
            .single();
            
          if (compError) {
            console.error('[useSupabaseMovements] Erro ao criar compensação:', compError);
            throw new Error(`Não foi possível criar a compensação: ${compError.message}`);
          }
          
          console.log('[useSupabaseMovements] Compensação criada com sucesso:', compData);
          
          // 2. Atualizar para quantidade zero em vez de negativa
          newQuantity = 0;
          
          // 3. Preparar notificação especial sobre a compensação
          if (!options?.silent) {
            toast({
              title: 'Exclusão com compensação',
              description: `A movimentação foi excluída, mas foi necessário registrar uma entrada de compensação de ${compensationQuantity.toFixed(4)} unidades para manter o estoque não-negativo.`,
              variant: 'warning',
              duration: 4000, // Duração mais longa para a mensagem de compensação
            });
          }
        }
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
      
      // 5. Marcar a movimentação como excluída (soft delete)
      console.log('[useSupabaseMovements] Marcando movimentação como excluída:', id);
      const { error: deleteError } = await supabase
        .from('movements')
        .update({ deleted: true })
        .eq('id', id);
      
      if (deleteError) {
        console.error('[useSupabaseMovements] Erro ao marcar movimentação como excluída:', deleteError);
        // Reverter a alteração da quantidade do produto em caso de erro
        await supabase
          .from('products')
          .update({ quantity: currentQuantity })
          .eq('id', movementData.product_id);
          
        throw new Error(`Não foi possível excluir a movimentação: ${deleteError.message}`);
      }
      
      // 6. Registrar a exclusão localmente (para compatibilidade)
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
          duration: 2000, // Reduzir para 2 segundos (era padrão 5000ms)
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
          duration: 3000, // Reduzir para 3 segundos
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
    // Função para marcação local de exclusão (para compatibilidade)
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
