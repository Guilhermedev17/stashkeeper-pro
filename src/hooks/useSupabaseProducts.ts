
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category_id: string;
  quantity: number;
  min_quantity: number;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProducts(data || []);
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
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar produto';
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
