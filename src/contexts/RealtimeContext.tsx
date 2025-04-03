import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode,
  useCallback
} from 'react';
import { supabase } from '@/integrations/supabase/client';

// Em vez de importar os hooks diretamente, vamos usar passagem de funções
// para evitar dependências circulares e múltiplas chamadas
type RealtimeContextType = {
  refreshAllData: () => void;
  lastUpdated: Date | null;
  refreshing: boolean;
};

const defaultContext: RealtimeContextType = {
  refreshAllData: () => {},
  lastUpdated: null,
  refreshing: false
};

const RealtimeContext = createContext<RealtimeContextType>(defaultContext);

// Exportar um hook simples que retorna o contexto
export const useRealtime = () => useContext(RealtimeContext);

// Provider principal que gerencia a lógica de tempo real
export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Usar useCallback para estabilizar a função e evitar recriação
  const refreshAllData = useCallback(() => {
    // Evitar múltiplas chamadas simultâneas
    if (refreshing) return;
    
    setRefreshing(true);
    
    // Simplesmente atualizar o timestamp - os componentes individuais 
    // decidirão se precisam recarregar dados com base nessa mudança
    setLastUpdated(new Date());
    
    // Limpar flag de atualização após um tempo curto
    setTimeout(() => setRefreshing(false), 300);
  }, [refreshing]);

  useEffect(() => {
    // Tentar configurar a inscrição apenas se o Supabase estiver disponível
    try {
      // Configurar um único canal de tempo real para todas as tabelas principais
      const channel = supabase.channel('global_db_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'products' 
        }, () => {
          // Apenas atualizar o timestamp - componentes decidem o que fazer
          setLastUpdated(new Date());
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'categories' 
        }, () => {
          setLastUpdated(new Date());
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'movements' 
        }, () => {
          setLastUpdated(new Date());
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'employees' 
        }, () => {
          setLastUpdated(new Date());
        })
        .subscribe();

      return () => {
        // Limpar a inscrição quando o componente for desmontado
        channel.unsubscribe();
      };
    } catch (error) {
      console.error("Falha ao configurar inscrição de tempo real:", error);
      // Retornar uma função de limpeza vazia para evitar erros
      return () => {};
    }
  }, []);

  return (
    <RealtimeContext.Provider 
      value={{ 
        refreshAllData,
        lastUpdated,
        refreshing 
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}; 