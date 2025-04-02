
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
  employees?: {
    id: string;
    name: string;
    code: string;
  };
}

export const useSupabaseMovements = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMovements = async () => {
    if (loading) return; // Evita múltiplas requisições simultâneas
    try {
      setLoading(true);
      // Buscar todas as movimentações com informações dos produtos
      // Usando uma sintaxe mais simples e direta para o join
      const { data, error } = await supabase
        .from('movements')
        .select(`
          id, product_id, type, quantity, user_id, notes, created_at, employee_id,
          products:products(id, name, code),
          employees:employees(id, name, code)
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Erro na consulta Supabase:', error);
        throw new Error(`Erro ao buscar movimentações: ${error.message}`);
      }

      if (!data) {
        throw new Error('Nenhum dado retornado da consulta');
      }
      
      // Formatar os dados para incluir informações do produto e garantir o tipo correto
      const formattedData = data.map(movement => {
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
          employee_name: movement.employees?.name || null,
          employee_code: movement.employees?.code || null,
          products: movement.products,
          employees: movement.employees
        } as Movement;
      }) as Movement[] || [];
      
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
        async (payload: RealtimePostgresChangesPayload<Movement>) => {
          // Buscar informações do produto para o novo movimento
          const fetchProductInfo = async (productId: string) => {
            const { data } = await supabase
              .from('products')
              .select('name, code')
              .eq('id', productId)
              .single();
            return data;
          };

          if (payload.eventType === 'INSERT') {
            const productInfo = await fetchProductInfo(payload.new.product_id);
            const newMovement = {
              ...payload.new,
              product_name: productInfo?.name || 'Produto Removido',
              product_code: productInfo?.code || 'N/A',
              user_name: 'Usuário do Sistema'
            } as Movement;
            setMovements(prev => [newMovement, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setMovements(prev => prev.filter(movement => movement.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            const productInfo = await fetchProductInfo(payload.new.product_id);
            const updatedMovement = {
              ...payload.new,
              product_name: productInfo?.name || 'Produto Removido',
              product_code: productInfo?.code || 'N/A',
              user_name: 'Usuário do Sistema'
            } as Movement;
            setMovements(prev => prev.map(movement =>
              movement.id === updatedMovement.id ? updatedMovement : movement
            ));
          }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  return {
    movements,
    loading,
    error,
    fetchMovements,
  };
};
