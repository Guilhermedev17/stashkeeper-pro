
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
  notes: string | null;
  created_at: string;
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
          id, product_id, type, quantity, user_id, notes, created_at,
          products(id, name, code)
        `)
        .or('type.in.(entrada,saida)')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Erro na consulta Supabase:', error);
        throw new Error(`Erro ao buscar movimentações: ${error.message}`);
      }
      
      // Formatar os dados para incluir informações do produto e garantir o tipo correto
      const formattedData = data?.map(movement => {
        const validType = movement.type === 'entrada' || movement.type === 'saida' ? movement.type : 'entrada';
        
        // Verificar se os dados do produto existem e têm a estrutura esperada
        let productName = 'Produto Removido';
        let productCode = 'N/A';
        
        // Com a nova sintaxe de consulta, o Supabase sempre retorna o produto como objeto
        if (movement.products) {
          productName = movement.products.name || 'Produto Removido';
          productCode = movement.products.code || 'N/A';
        }
        
        return {
          ...movement,
          product_name: productName,
          product_code: productCode,
          user_name: 'Usuário do Sistema', // Simplificado já que não estamos buscando usuários
          type: validType
        };
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
