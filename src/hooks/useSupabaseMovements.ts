
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMovements = async () => {
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
  }, []);

  return {
    movements,
    loading,
    error,
    fetchMovements,
  };
};
