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
  
  // Array para manter registro de categorias excluídas
  // Inicializar com os valores do localStorage se disponíveis
  const [deletedCategoryIds] = useState<Set<string>>(() => {
    const savedIds = localStorage.getItem('deletedCategoryIds');
    if (savedIds) {
      try {
        const parsed = JSON.parse(savedIds);
        return new Set(parsed);
      } catch (e) {
        console.error('Erro ao carregar IDs de categorias excluídas:', e);
        return new Set<string>();
      }
    }
    return new Set<string>();
  });

  // Função auxiliar para salvar IDs excluídas no localStorage
  const saveDeletedIds = () => {
    try {
      localStorage.setItem('deletedCategoryIds', JSON.stringify([...deletedCategoryIds]));
    } catch (e) {
      console.error('Erro ao salvar IDs de categorias excluídas:', e);
    }
  };

  // Função para adicionar um ID à lista de excluídos
  const addToDeletedIds = (id: string) => {
    deletedCategoryIds.add(id);
    saveDeletedIds();
  };

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
      
      // Filtrar categorias excluídas
      const filteredData = (data || []).filter(item => !deletedCategoryIds.has(item.id));
      console.log(`Filtered out ${(data || []).length - filteredData.length} deleted categories`);
      
      setCategories(filteredData);
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

  const deleteCategory = async (id: string, options?: { silent?: boolean, skipUIUpdate?: boolean }) => {
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
      
      // Adicionar à lista de categorias excluídas
      addToDeletedIds(id);
      
      // Atualizar o estado apenas se skipUIUpdate for falso
      if (!options?.skipUIUpdate) {
        // Immediately update the categories state by removing the deleted category
        setCategories(prevCategories => {
          const updatedCategories = [...prevCategories].filter(category => category.id !== id);
          console.log(`Category ${id} removed. Total: ${prevCategories.length} -> ${updatedCategories.length}`);
          return updatedCategories;
        });
      }
      
      // Exibir notificação apenas se não estiver no modo silencioso
      if (!options?.silent) {
        toast({
          title: 'Categoria removida',
          description: `Categoria foi removida com sucesso.`,
        });
      }
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover categoria';
      
      // Exibir notificação apenas se não estiver no modo silencioso
      if (!options?.silent) {
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
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
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'INSERT') {
            // Verificar se não está na lista de excluídos
            if (deletedCategoryIds.has(payload.new.id)) {
              console.log(`Ignorando INSERT de categoria excluída: ${payload.new.id}`);
              return;
            }
            setCategories(prev => [...prev, payload.new as Category]);
          } else if (payload.eventType === 'DELETE') {
            // Adicionar à lista de excluídos
            addToDeletedIds(payload.old.id);
            setCategories(prev => prev.filter(category => category.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            // Verificar se não está na lista de excluídos
            if (deletedCategoryIds.has(payload.new.id)) {
              console.log(`Ignorando UPDATE de categoria excluída: ${payload.new.id}`);
              return;
            }
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
