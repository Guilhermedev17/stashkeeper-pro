
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export const useSupabaseCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Use the any type to bypass TypeScript's type checking for Supabase client
      const { data, error } = await (supabase
        .from('categories') as any)
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      setCategories(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar categorias';
      setError(errorMessage);
      console.error('Error fetching categories:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (category: Omit<Category, 'id' | 'created_at'>) => {
    try {
      console.log('Adding category:', category);
      const { data, error } = await (supabase
        .from('categories') as any)
        .insert([category])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setCategories(prevCategories => [...prevCategories, data as Category]);
      
      toast({
        title: 'Categoria adicionada',
        description: `${category.name} foi adicionada com sucesso.`,
      });
      
      return { success: true, data };
    } catch (err) {
      console.error('Error adding category:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar categoria';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id' | 'created_at'>>) => {
    try {
      const { data, error } = await (supabase
        .from('categories') as any)
        .update(updates)
        .match({ id })
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prevCategories => 
        prevCategories.map(category => 
          category.id === id ? { ...category, ...data } as Category : category
        )
      );
      
      toast({
        title: 'Categoria atualizada',
        description: `Categoria foi atualizada com sucesso.`,
      });
      
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar categoria';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await (supabase
        .from('categories') as any)
        .delete()
        .match({ id });

      if (error) throw error;
      
      setCategories(prevCategories => 
        prevCategories.filter(category => category.id !== id)
      );
      
      toast({
        title: 'Categoria removida',
        description: `Categoria foi removida com sucesso.`,
      });
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover categoria';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
};
