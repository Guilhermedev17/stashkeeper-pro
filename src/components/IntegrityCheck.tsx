import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_KEYS } from '@/lib/constants';

export const IntegrityCheck = () => {
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [issues, setIssues] = useState<{
    inconsistentMovements: number;
    fixedMovements: number;
  }>({
    inconsistentMovements: 0,
    fixedMovements: 0,
  });
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [showComponent, setShowComponent] = useState(false);

  // Verificar movimentações excluídas
  const checkDeletedMovements = async () => {
    try {
      setChecking(true);
      
      // 1. Obter IDs de movimentações excluídas do localStorage
      const storedIds = localStorage.getItem(STORAGE_KEYS.DELETED_MOVEMENT_IDS);
      if (!storedIds) {
        console.log('[IntegrityCheck] Nenhum ID de movimentação excluída encontrado no localStorage');
        setIssues({ inconsistentMovements: 0, fixedMovements: 0 });
        setShowComponent(false);
        return;
      }
      
      const localDeletedIds = JSON.parse(storedIds);
      console.log(`[IntegrityCheck] ${localDeletedIds.length} IDs de movimentações excluídas encontrados no localStorage`);
      
      if (localDeletedIds.length === 0) {
        setIssues({ inconsistentMovements: 0, fixedMovements: 0 });
        setShowComponent(false);
        return;
      }
      
      // 2. Verificar quais dessas movimentações existem no banco, mas não estão marcadas como excluídas
      const { data, error } = await supabase
        .from('movements')
        .select('id, deleted')
        .in('id', localDeletedIds);
      
      if (error) {
        console.error('[IntegrityCheck] Erro ao verificar movimentações:', error);
        throw new Error(`Erro ao verificar integridade: ${error.message}`);
      }
      
      // 3. Identificar movimentações inconsistentes (estão marcadas como excluídas localmente mas não no banco)
      const inconsistentMovements = data.filter(m => m.deleted !== true);
      
      console.log(`[IntegrityCheck] Encontradas ${inconsistentMovements.length} movimentações inconsistentes`);
      
      if (inconsistentMovements.length === 0) {
        setIssues({ inconsistentMovements: 0, fixedMovements: 0 });
        setShowComponent(false);
        return;
      }
      
      // 4. Atualizar movimentações inconsistentes para deleted=true
      const idsToFix = inconsistentMovements.map(m => m.id);
      const { error: updateError } = await supabase
        .from('movements')
        .update({ deleted: true })
        .in('id', idsToFix);
      
      if (updateError) {
        console.error('[IntegrityCheck] Erro ao corrigir movimentações:', updateError);
        throw new Error(`Erro ao corrigir inconsistências: ${updateError.message}`);
      }
      
      console.log(`[IntegrityCheck] Corrigidas ${idsToFix.length} movimentações inconsistentes`);
      
      // 5. Buscar todas as movimentações marcadas como excluídas no banco
      const { data: allDeleted, error: allDeletedError } = await supabase
        .from('movements')
        .select('id')
        .eq('deleted', true);
      
      if (allDeletedError) {
        console.error('[IntegrityCheck] Erro ao obter todas as movimentações excluídas:', allDeletedError);
      } else {
        // 6. Atualizar localStorage com lista completa de IDs excluídos
        const allDeletedIds = allDeleted.map(m => m.id);
        const mergedIds = [...new Set([...localDeletedIds, ...allDeletedIds])];
        
        // Apenas atualizar se houver diferença
        if (mergedIds.length !== localDeletedIds.length) {
          localStorage.setItem(STORAGE_KEYS.DELETED_MOVEMENT_IDS, JSON.stringify(mergedIds));
          console.log(`[IntegrityCheck] Lista de IDs excluídos atualizada no localStorage: ${mergedIds.length} IDs`);
        }
      }
      
      // 7. Atualizar estado com resultados
      setIssues({
        inconsistentMovements: inconsistentMovements.length,
        fixedMovements: idsToFix.length,
      });
      
      setLastCheck(new Date());
      
      // Sempre ocultar o alerta visual
      setShowComponent(false);
      
      // 8. Notificar o usuário apenas se houver correções significativas (mais de 5)
      if (idsToFix.length > 5) {
        toast({
          title: "Verificação concluída",
          description: `Encontradas e corrigidas ${idsToFix.length} inconsistências.`,
          variant: "default",
        });
      }
      
    } catch (error) {
      console.error('[IntegrityCheck] Erro durante verificação de integridade:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao verificar integridade do sistema",
        variant: "destructive",
      });
      // Não mostrar componente mesmo em caso de erro
      setShowComponent(false);
    } finally {
      setChecking(false);
    }
  };

  // Verificar integridade na inicialização
  useEffect(() => {
    const lastCheckTime = localStorage.getItem(STORAGE_KEYS.LAST_INTEGRITY_CHECK);
    
    if (lastCheckTime) {
      setLastCheck(new Date(lastCheckTime));
      
      // Verificar se a última verificação foi há mais de 1 hora
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      if (new Date(lastCheckTime) < oneHourAgo) {
        console.log('[IntegrityCheck] Última verificação foi há mais de 1 hora, executando nova verificação');
        checkDeletedMovements();
      }
    } else {
      // Primeira execução, executar verificação
      console.log('[IntegrityCheck] Primeira verificação de integridade');
      checkDeletedMovements();
    }
  }, []);

  // Salvar timestamp da última verificação
  useEffect(() => {
    if (lastCheck) {
      localStorage.setItem(STORAGE_KEYS.LAST_INTEGRITY_CHECK, lastCheck.toISOString());
    }
  }, [lastCheck]);

  // Se não houver inconsistências e não estiver verificando, não renderizar nada
  if (!showComponent && !checking) {
    return null;
  }

  return (
    <div className="mb-4">
      {/* Removemos o alerta de inconsistência detectada que estava aqui */}
      
      <Button 
        onClick={checkDeletedMovements} 
        disabled={checking}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {checking ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Verificando...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Verificar integridade
          </>
        )}
      </Button>
    </div>
  );
}; 