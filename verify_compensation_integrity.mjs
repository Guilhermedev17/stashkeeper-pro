// Script para verificar o tratamento de movimentações de compensação pelo IntegrityCheck
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

// Função que simula o comportamento do IntegrityCheck especificamente para movimentações de compensação
async function verifyCompensationIntegrity() {
  console.log("=== VERIFICAÇÃO DE INTEGRIDADE PARA MOVIMENTAÇÕES DE COMPENSAÇÃO ===");
  
  try {
    // 1. Buscar todas as movimentações excluídas
    console.log("\n1. Buscando todas as movimentações excluídas no banco...");
    const { data: deletedMovements, error: deletedError } = await supabase
      .from('movements')
      .select('id, notes, type, product_id')
      .eq('deleted', true)
      .order('created_at', { ascending: false });
    
    if (deletedError) throw new Error(`Erro ao buscar movimentações excluídas: ${deletedError.message}`);
    
    console.log(`Encontradas ${deletedMovements.length} movimentações excluídas.`);
    
    // 2. Identificar movimentações de compensação entre as excluídas
    console.log("\n2. Identificando movimentações de compensação...");
    const compensationMovements = deletedMovements.filter(m => 
      m.notes && m.notes.includes('Compensação automática')
    );
    
    console.log(`Encontradas ${compensationMovements.length} movimentações de compensação excluídas.`);
    
    if (compensationMovements.length === 0) {
      console.log("Nenhuma movimentação de compensação excluída para verificar.");
      return;
    }
    
    // 3. Para cada movimentação de compensação, verificar se a movimentação original também está excluída
    console.log("\n3. Verificando se as movimentações originais também estão excluídas...");
    
    const results = [];
    
    for (const compensation of compensationMovements) {
      // Extrair o ID da movimentação original das notas (formato: "Compensação automática para exclusão da movimentação ID")
      const notesMatch = compensation.notes.match(/movimentação ([0-9a-f-]+)/i);
      const originalId = notesMatch ? notesMatch[1] : null;
      
      if (!originalId) {
        results.push({
          compensationId: compensation.id,
          originalId: null,
          status: "ID original não encontrado nas notas",
          isIntegro: false
        });
        continue;
      }
      
      // Verificar se a movimentação original existe e está excluída
      const { data: original, error: originalError } = await supabase
        .from('movements')
        .select('id, deleted, notes')
        .eq('id', originalId)
        .single();
      
      if (originalError) {
        results.push({
          compensationId: compensation.id,
          originalId,
          status: "Movimentação original não encontrada no banco",
          isIntegro: false
        });
        continue;
      }
      
      results.push({
        compensationId: compensation.id,
        originalId,
        status: original.deleted 
          ? "Ambas as movimentações estão corretamente excluídas" 
          : "Movimentação original NÃO está excluída",
        isIntegro: original.deleted === true,
        details: {
          compensationNotes: compensation.notes,
          originalNotes: original.notes,
          compensationType: compensation.type,
          productId: compensation.product_id
        }
      });
    }
    
    // 4. Apresentar os resultados da verificação
    console.log("\n4. Resultados da verificação:");
    
    results.forEach((result, index) => {
      console.log(`\n[${index + 1}/${results.length}] Movimentação de compensação: ${result.compensationId}`);
      console.log(`   Movimentação original: ${result.originalId || 'Não identificada'}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Integridade: ${result.isIntegro ? '✅ OK' : '❌ Problema de integridade'}`);
      
      if (result.details) {
        console.log(`   Detalhes:`);
        console.log(`     - Tipo de compensação: ${result.details.compensationType}`);
        console.log(`     - Notas da compensação: ${result.details.compensationNotes}`);
        console.log(`     - Notas do original: ${result.details.originalNotes || 'N/A'}`);
      }
    });
    
    // 5. Simular diferentes cenários para o IntegrityCheck
    console.log("\n5. Simulando diferentes cenários para o IntegrityCheck...");
    
    // 5.1 CENÁRIO 1: Todas as movimentações no localStorage
    console.log("\nCENÁRIO 1: Todas as movimentações no localStorage");
    const allIds = deletedMovements.map(m => m.id);
    console.log(`Simulando ${allIds.length} IDs no localStorage (todos os excluídos)`);
    
    const { data: inconsistentAll, error: inconsistentAllError } = await supabase
      .from('movements')
      .select('id')
      .in('id', allIds)
      .eq('deleted', false);
    
    if (inconsistentAllError) throw new Error(`Erro na verificação do cenário 1: ${inconsistentAllError.message}`);
    
    console.log(`Resultado: ${inconsistentAll.length === 0 ? '✅ Sistema íntegro' : `❌ ${inconsistentAll.length} inconsistências encontradas`}`);
    
    // 5.2 CENÁRIO 2: Apenas movimentações de compensação no localStorage
    console.log("\nCENÁRIO 2: Apenas movimentações de compensação no localStorage");
    const compensationIds = compensationMovements.map(m => m.id);
    console.log(`Simulando ${compensationIds.length} IDs no localStorage (apenas compensações)`);
    
    const { data: inconsistentCompensation, error: inconsistentCompensationError } = await supabase
      .from('movements')
      .select('id')
      .in('id', compensationIds)
      .eq('deleted', false);
    
    if (inconsistentCompensationError) throw new Error(`Erro na verificação do cenário 2: ${inconsistentCompensationError.message}`);
    
    console.log(`Resultado: ${inconsistentCompensation.length === 0 ? '✅ Sistema íntegro' : `❌ ${inconsistentCompensation.length} inconsistências encontradas`}`);
    
    // 5.3 CENÁRIO 3: Apenas movimentações originais no localStorage
    console.log("\nCENÁRIO 3: Apenas movimentações originais no localStorage");
    const originalIds = results
      .filter(r => r.originalId)
      .map(r => r.originalId);
    
    console.log(`Simulando ${originalIds.length} IDs no localStorage (apenas originais)`);
    
    const { data: inconsistentOriginal, error: inconsistentOriginalError } = await supabase
      .from('movements')
      .select('id')
      .in('id', originalIds)
      .eq('deleted', false);
    
    if (inconsistentOriginalError) throw new Error(`Erro na verificação do cenário 3: ${inconsistentOriginalError.message}`);
    
    console.log(`Resultado: ${inconsistentOriginal.length === 0 ? '✅ Sistema íntegro' : `❌ ${inconsistentOriginal.length} inconsistências encontradas`}`);
    
    // 6. Resumo da verificação
    console.log("\n=== RESUMO DA VERIFICAÇÃO ===");
    console.log(`Total de movimentações excluídas: ${deletedMovements.length}`);
    console.log(`Movimentações de compensação: ${compensationMovements.length}`);
    console.log(`Pares encontrados (compensação + original): ${results.filter(r => r.originalId).length}`);
    console.log(`Movimentações íntegras: ${results.filter(r => r.isIntegro).length}`);
    console.log(`Movimentações com problemas: ${results.filter(r => !r.isIntegro).length}`);
    
    const allIntegro = results.every(r => r.isIntegro);
    console.log(`\nConclusão: ${allIntegro ? '✅ Sistema está íntegro' : '❌ Sistema tem problemas de integridade'}`);
    
  } catch (error) {
    console.error("\n❌ ERRO DURANTE A VERIFICAÇÃO:", error.message);
  }
}

// Executar a verificação
verifyCompensationIntegrity().then(() => console.log("\nVerificação finalizada.")); 