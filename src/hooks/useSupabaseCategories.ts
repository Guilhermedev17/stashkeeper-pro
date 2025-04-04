
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export const useSupabaseCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCategories = async () => {
    if (loading) return; // Evita múltiplas requisições simultâneas
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching categories...');
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Categories fetched:', data);
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
      
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Category added successfully:', data);
      
      // Immediately update the categories state with the new data
      if (data && data.length > 0) {
        setCategories(prevCategories => [...prevCategories, data[0]]);
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
        .from('categories')
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
            category.id === id ? data[0] : category
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
        .from('categories')
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

    // Configurar subscriber para atualizações em tempo real
    const subscription = supabase
      .channel('categories_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'categories' 
        }, 
        (payload: RealtimePostgresChangesPayload<Category>) => {
          if (payload.eventType === 'INSERT') {
            setCategories(prev => [...prev, payload.new as Category]);
          } else if (payload.eventType === 'DELETE') {
            setCategories(prev => prev.filter(category => category.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setCategories(prev => prev.map(category =>
              category.id === payload.new.id ? payload.new as Category : category
            ));
          }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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
