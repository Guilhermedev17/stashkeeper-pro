
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category_id: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  created_at: string;
}

interface Movement {
  id?: string;
  product_id: string;
  type: 'entrada' | 'saida';
  quantity: number;
  user_id?: string;
  notes?: string;
  created_at?: string;
}

export const useSupabaseProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    if (loading) return; // Evita múltiplas requisições simultâneas
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
       // Usar asserção de tipo para garantir que o TypeScript reconheça todas as propriedades
      setProducts((data || []).map(item => {
        // Definir explicitamente o tipo do item retornado pelo Supabase
        const typedItem = item as {
          id: string;
          code: string;
          name: string;
          description: string;
          category_id: string;
          quantity: number;
          min_quantity: number;
          unit?: string;
          created_at: string;
        };
        
        // Garantir que todas as propriedades estejam presentes, incluindo 'unit'
        return {
          id: typedItem.id,
          code: typedItem.code,
          name: typedItem.name,
          description: typedItem.description,
          category_id: typedItem.category_id,
          quantity: typedItem.quantity,
          min_quantity: typedItem.min_quantity,
          unit: typedItem.unit || '', // Garantir que unit sempre tenha um valor, mesmo que seja string vazia
          created_at: typedItem.created_at
        } as Product;
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar produtos';
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

  const addProduct = async (product: Omit<Product, 'id' | 'created_at'>) => {
    try {
      // Verificar se código já existe
      const { data: existing } = await supabase
        .from('products')
        .select('code')
        .eq('code', product.code)
        .single();

      if (existing) {
        throw new Error('Código já está em uso');
      }

      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) throw error;
      
      setProducts(prevProducts => [data as Product, ...prevProducts]);
      
      toast({
        title: 'Produto adicionado',
        description: `${product.name} foi adicionado com sucesso.`,
      });
      
      return { success: true, data };
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar produto';
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

  const updateProduct = async (id: string, updates: Partial<Omit<Product, 'id' | 'created_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .match({ id })
        .select()
        .single();

      if (error) throw error;
      
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === id ? { ...product, ...data } as Product : product
        )
      );
      
      toast({
        title: 'Produto atualizado',
        description: `Produto foi atualizado com sucesso.`,
      });
      
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar produto';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .match({ id });

      if (error) throw error;
      
      setProducts(prevProducts => 
        prevProducts.filter(product => product.id !== id)
      );
      
      toast({
        title: 'Produto removido',
        description: `Produto foi removido com sucesso.`,
      });
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover produto';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  // Remover chamada automática de addMovement
  // que estava gerando registros indesejados
  const addMovement = async (movement: Omit<Movement, 'id' | 'created_at'>) => {
    try {
      // 1. Inserir o movimento
      const { data: movementData, error: movementError } = await supabase
        .from('movements')
        .insert([movement])
        .select()
        .single();

      if (movementError) throw movementError;

      // 2. Atualizar a quantidade do produto
      const product = products.find(p => p.id === movement.product_id);
      if (!product) throw new Error('Produto não encontrado');

      const newQuantity = movement.type === 'entrada' 
        ? product.quantity + movement.quantity 
        : product.quantity - movement.quantity;

      if (newQuantity < 0) throw new Error('Quantidade insuficiente em estoque');

      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity: newQuantity })
        .match({ id: movement.product_id });

      if (updateError) throw updateError;

      // 3. Atualizar a lista de produtos local
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === movement.product_id 
            ? { ...p, quantity: newQuantity } 
            : p
        )
      );
      
      toast({
        title: movement.type === 'entrada' ? 'Entrada registrada' : 'Saída registrada',
        description: `Movimentação registrada com sucesso.`,
      });
      
      return { success: true, data: movementData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar movimentação';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchProducts();

    // Configurar subscriber para atualizações em tempo real
    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'products' 
        }, 
        (payload: RealtimePostgresChangesPayload<Product>) => {
          if (payload.eventType === 'INSERT') {
            setProducts(prev => [payload.new as Product, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setProducts(prev => prev.filter(product => product.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setProducts(prev => prev.map(product => 
              product.id === payload.new.id ? payload.new as Product : product
            ));
          }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    addMovement,
  };
};
