
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      setError(null);

      console.log('Fetching categories...');
      
      // Cast to any to bypass TypeScript's type checking for Supabase client
      const { data, error } = await supabase
        .from('categories' as any)
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Categories fetched:', data);
      // Use explicit type casting to Category[]
      setCategories(data as Category[] || []);
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
      
      // Cast to any for the Supabase client
      const { data, error } = await supabase
        .from('categories' as any)
        .insert([category])
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Category added successfully:', data);
      
      // Immediately update the categories state with the new data
      if (data && data.length > 0) {
        // Use explicit type casting to Category
        setCategories(prevCategories => [...prevCategories, data[0] as Category]);
      }
      
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
      console.log('Updating category:', id, updates);
      
      const { data, error } = await supabase
        .from('categories' as any)
        .update(updates)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Category updated successfully:', data);
      
      // Immediately update the categories state with the updated data
      if (data && data.length > 0) {
        setCategories(prevCategories => 
          prevCategories.map(category => 
            category.id === id ? (data[0] as Category) : category
          )
        );
      }
      
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
      console.log('Deleting category:', id);
      
      const { error } = await supabase
        .from('categories' as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // Immediately update the categories state by removing the deleted category
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
