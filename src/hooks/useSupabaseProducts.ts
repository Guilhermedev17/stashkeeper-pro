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
  employee_id?: string | null;
  deleted?: boolean;
}

export const useSupabaseProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Array para manter registro de produtos excluídos
  // Inicializar com os valores do localStorage se disponíveis
  const [deletedProductIds] = useState<Set<string>>(() => {
    const savedIds = localStorage.getItem('deletedProductIds');
    if (savedIds) {
      try {
        const parsed = JSON.parse(savedIds);
        return new Set(parsed);
      } catch (e) {
        console.error('Erro ao carregar IDs de produtos excluídos:', e);
        return new Set<string>();
      }
    }
    return new Set<string>();
  });

  // Função auxiliar para salvar IDs excluídas no localStorage
  const saveDeletedIds = () => {
    try {
      localStorage.setItem('deletedProductIds', JSON.stringify([...deletedProductIds]));
    } catch (e) {
      console.error('Erro ao salvar IDs de produtos excluídos:', e);
    }
  };

  // Função para adicionar um ID à lista de excluídos
  const addToDeletedIds = (id: string) => {
    deletedProductIds.add(id);
    saveDeletedIds();
  };

  const fetchProducts = async () => {
    if (loading) {
      console.log("fetchProducts: Já estamos carregando, ignorando chamada duplicada");
      return Promise.reject(new Error("Carregamento já em andamento"));
    }

    console.log("fetchProducts: Iniciando carregamento dos produtos");
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("fetchProducts: Erro ao buscar produtos:", error);
        throw error;
      }

      console.log(`fetchProducts: Carregados ${data?.length || 0} produtos`);

      // Filtrar produtos que foram excluídos localmente
      const filteredData = (data || []).filter(item => !deletedProductIds.has(item.id));
      console.log(`fetchProducts: ${data?.length - filteredData.length || 0} produtos filtrados por exclusão local`);

      // Usar asserção de tipo para garantir que o TypeScript reconheça todas as propriedades
      setProducts(filteredData.map(item => {
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

      setLoading(false);
      console.log("fetchProducts: Carregamento concluído com sucesso");
      return Promise.resolve(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar produtos';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      setLoading(false);
      console.error("fetchProducts: Falha no carregamento:", errorMessage);
      return Promise.reject(err);
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'created_at'>, options?: { silent?: boolean }) => {
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

      // Exibir notificação apenas se não estiver no modo silencioso
      if (!options?.silent) {
        toast({
          title: 'Produto adicionado',
          description: `${product.name} foi adicionado com sucesso.`,
          variant: 'success'
        });
      }

      return { success: true, data };
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar produto';
      if (errorMessage.includes('duplicate key value')) {
        errorMessage = 'Código já está em uso';
      }

      // Exibir notificação de erro apenas se não estiver no modo silencioso
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

  const updateProduct = async (id: string, updates: Partial<Omit<Product, 'id' | 'created_at'>>, options?: { silent?: boolean }) => {
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

      // Exibir notificação apenas se não estiver no modo silencioso
      if (!options?.silent) {
        toast({
          title: 'Produto atualizado',
          description: `Produto foi atualizado com sucesso.`,
          variant: 'success'
        });
      }

      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar produto';

      // Exibir notificação de erro apenas se não estiver no modo silencioso
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

  const deleteProduct = async (id: string, options?: { silent?: boolean, skipUIUpdate?: boolean }) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .match({ id });

      if (error) throw error;

      // Adicionar à lista de produtos excluídos
      addToDeletedIds(id);

      // Se skipUIUpdate está ativado, não atualizar a UI (usado em exclusões em lote)
      if (!options?.skipUIUpdate) {
        // Atualizar o estado com uma nova referência para garantir renderização
        setProducts(prevProducts => {
          const updatedProducts = [...prevProducts].filter(product => product.id !== id);
          console.log(`Produto ${id} removido. Total: ${prevProducts.length} -> ${updatedProducts.length}`);
          
          // Verificar se após a remoção a lista estaria vazia ou com 1 item
          // Se sim, forçar uma atualização completa do servidor
          if (updatedProducts.length <= 1) {
            console.log("Lista quase vazia após exclusão, agendando refresh completo");
            setTimeout(() => {
              console.log("Executando refresh completo da lista");
              fetchProducts().catch(e => console.error("Erro no refresh após exclusão:", e));
            }, 100);
          }
          
          return updatedProducts;
        });

        // Forçar uma nova referência do array para garantir re-renderização
        setTimeout(() => {
          setProducts(current => {
            // Se estiver no último item, retornar array vazio
            if (current.length <= 1) {
              console.log("Forçando lista vazia após exclusão do último item");
              return [];
            }
            return [...current];
          });
        }, 10);
      }

      // Exibir notificação apenas se não estiver no modo silencioso
      if (!options?.silent) {
        toast({
          title: 'Produto removido',
          description: `Produto foi removido com sucesso.`,
          variant: 'success'
        });
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover produto';

      // Exibir notificação de erro apenas se não estiver no modo silencioso
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
        variant: 'success'
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

  // Função para tratar eventos do Supabase Realtime
  const handleProductChangeEvent = (payload: RealtimePostgresChangesPayload<any>) => {
    console.log(`Evento ${payload.eventType} recebido para produto:`, payload);
    
    if (payload.eventType === 'DELETE') {
      // Se um produto foi excluído, garantir que seja removido do estado
      const deletedId = payload.old.id;
      
      // Adicionar à lista de IDs excluídos
      addToDeletedIds(deletedId);
      
      // Atualizar o estado para remover o produto
      setProducts(prevProducts => {
        // Filtrar o produto excluído
        const updatedProducts = [...prevProducts].filter(p => p.id !== deletedId);
        console.log(`Produto ${deletedId} removido por evento. Total anterior: ${prevProducts.length}, novo total: ${updatedProducts.length}`);
        return updatedProducts;
      });
    } else if (payload.eventType === 'INSERT') {
      // Se um produto foi adicionado, verificar se não está na lista de excluídos
      if (deletedProductIds.has(payload.new.id)) {
        console.log(`Ignorando INSERT do produto excluído: ${payload.new.id}`);
        return;
      }
      
      // Formatar o produto novo
      const newProduct: Product = {
        ...payload.new,
        unit: payload.new.unit || ''
      };
      
      // Adicionar ao início da lista
      setProducts(prevProducts => [newProduct, ...prevProducts]);
    } else if (payload.eventType === 'UPDATE') {
      // Se um produto foi atualizado, verificar se não está na lista de excluídos
      if (deletedProductIds.has(payload.new.id)) {
        console.log(`Ignorando UPDATE do produto excluído: ${payload.new.id}`);
        return;
      }
      
      // Atualizar o produto na lista
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === payload.new.id 
            ? { ...product, ...payload.new, unit: payload.new.unit || product.unit || '' } 
            : product
        )
      );
    }
  };

  // Efeito para configurar o subscriber de eventos em tempo real
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
        (payload: RealtimePostgresChangesPayload<any>) => {
          handleProductChangeEvent(payload);
        }
      )
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
    addMovement
  };
};
