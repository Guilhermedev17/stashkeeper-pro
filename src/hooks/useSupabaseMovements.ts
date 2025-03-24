
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
      // Buscar movimentações com informações de produtos
      const { data, error } = await supabase
        .from('movements')
        .select(`
          *,
          products:product_id (
            name,
            code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Formatar os dados para incluir informações do produto
      const formattedData = data?.map(movement => ({
        ...movement,
        product_name: movement.products?.name,
        product_code: movement.products?.code
      })) || [];
      
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
