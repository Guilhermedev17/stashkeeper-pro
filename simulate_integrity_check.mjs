// Script para simular o comportamento do componente IntegrityCheck
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Função que imita o comportamento do componente IntegrityCheck
async function simulateIntegrityCheck(localStorageData) {
  console.log("Simulando IntegrityCheck com dados:", localStorageData);
  
  try {
    // 1. Obter IDs de movimentações excluídas do localStorage simulado
    if (!localStorageData.deletedMovementIds) {
      console.log('[SimulatedIntegrityCheck] Nenhum ID de movimentação excluída encontrado');
      return { inconsistentMovements: 0, fixedMovements: 0, showComponent: false };
    }
    
    const localDeletedIds = JSON.parse(localStorageData.deletedMovementIds);
    console.log(`[SimulatedIntegrityCheck] ${localDeletedIds.length} IDs excluídos encontrados`);
    
    if (localDeletedIds.length === 0) {
      return { inconsistentMovements: 0, fixedMovements: 0, showComponent: false };
    }
    
    // 2. Verificar quais movimentações existem no banco, mas não estão marcadas como excluídas
    const { data, error } = await supabase
      .from('movements')
      .select('id, deleted')
      .in('id', localDeletedIds);
    
    if (error) {
      console.error('[SimulatedIntegrityCheck] Erro ao verificar movimentações:', error);
      throw new Error(`Erro ao verificar integridade: ${error.message}`);
    }
    
    // 3. Identificar movimentações inconsistentes
    const inconsistentMovements = data.filter(m => m.deleted !== true);
    
    console.log(`[SimulatedIntegrityCheck] Encontradas ${inconsistentMovements.length} movimentações inconsistentes`);
    console.log(`[SimulatedIntegrityCheck] IDs inconsistentes: ${inconsistentMovements.map(m => m.id).join(', ')}`);
    
    if (inconsistentMovements.length === 0) {
      console.log("[SimulatedIntegrityCheck] Não há inconsistências para corrigir");
      return { inconsistentMovements: 0, fixedMovements: 0, showComponent: false };
    }
    
    // 4. Simular a atualização das movimentações para deleted=true
    console.log("[SimulatedIntegrityCheck] Simulando correção das inconsistências...");
    const idsToFix = inconsistentMovements.map(m => m.id);
    
    // Em uma simulação real, aqui faria o update no banco
    // Apenas para demonstração, não modificaremos o banco realmente
    console.log(`[SimulatedIntegrityCheck] Movimentações que seriam marcadas como excluídas: ${idsToFix.join(', ')}`);
    
    // 5. Simular a busca de todas as movimentações excluídas
    const { data: allDeleted, error: allDeletedError } = await supabase
      .from('movements')
      .select('id')
      .eq('deleted', true);
    
    if (allDeletedError) {
      console.error('[SimulatedIntegrityCheck] Erro ao obter movimentações excluídas:', allDeletedError);
    } else {
      // 6. Simular a atualização do localStorage
      const allDeletedIds = allDeleted.map(m => m.id);
      const mergedIds = [...new Set([...localDeletedIds, ...allDeletedIds])];
      
      if (mergedIds.length !== localDeletedIds.length) {
        console.log(`[SimulatedIntegrityCheck] Lista de IDs excluídos seria atualizada: ${mergedIds.length} IDs`);
        console.log(`[SimulatedIntegrityCheck] Novos IDs: ${mergedIds.filter(id => !localDeletedIds.includes(id)).join(', ')}`);
      }
    }
    
    return {
      inconsistentMovements: inconsistentMovements.length,
      fixedMovements: idsToFix.length,
      showComponent: true,
      idsFixed: idsToFix
    };
    
  } catch (error) {
    console.error('[SimulatedIntegrityCheck] Erro:', error);
    return { error: error.message, showComponent: true };
  }
}

async function runAllSimulations() {
  console.log("=== SIMULAÇÃO DO COMPONENTE INTEGRITYCHECK ===");
  
  try {
    // Carregar dados de teste gerados anteriormente
    if (!fs.existsSync('integrityTestData.json')) {
      throw new Error("Arquivo de dados de teste não encontrado. Execute primeiro test_frontend_integrity.mjs");
    }
    
    const testData = JSON.parse(fs.readFileSync('integrityTestData.json', 'utf8'));
    
    // Executar simulação para cada caso de teste
    console.log("\n=== CASO 1: localStorage sincronizado com o banco ===");
    const case1Result = await simulateIntegrityCheck(testData.syncedLocalStorage);
    console.log("Resultado:", case1Result);
    
    console.log("\n=== CASO 2: localStorage com menos IDs que o banco ===");
    const case2Result = await simulateIntegrityCheck(testData.partialLocalStorage);
    console.log("Resultado:", case2Result);
    
    console.log("\n=== CASO 3: localStorage com IDs que não existem no banco ===");
    const case3Result = await simulateIntegrityCheck(testData.inconsistentLocalStorage);
    console.log("Resultado:", case3Result);
    
    console.log("\n=== CASO 4: ID excluído apenas localmente (não no banco) ===");
    const case4Result = await simulateIntegrityCheck(testData.localOnlyLocalStorage);
    console.log("Resultado:", case4Result);
    
    // Sumário dos resultados
    console.log("\n=== SUMÁRIO DOS RESULTADOS ===");
    console.log("Caso 1 (Sincronizado):", case1Result.showComponent ? "Alerta seria mostrado" : "Nada seria mostrado");
    console.log("Caso 2 (Parcial):", case2Result.showComponent ? "Alerta seria mostrado" : "Nada seria mostrado");
    console.log("Caso 3 (IDs inexistentes):", case3Result.showComponent ? "Alerta seria mostrado" : "Nada seria mostrado");
    console.log("Caso 4 (Exclusão local):", case4Result.showComponent ? "Alerta seria mostrado" : "Nada seria mostrado");
    
    if (case4Result.idsFixed && case4Result.idsFixed.includes(testData.testMovementId)) {
      console.log(`\n✅ SUCESSO: A movimentação de teste (${testData.testMovementId}) seria marcada como excluída no banco!`);
    } else {
      console.log(`\n❌ FALHA: A movimentação de teste (${testData.testMovementId}) NÃO seria corrigida!`);
    }
    
  } catch (error) {
    console.error("\n❌ ERRO DURANTE A SIMULAÇÃO:", error.message);
  }
}

// Executar todas as simulações
runAllSimulations().then(() => console.log("\nSimulação finalizada.")); 