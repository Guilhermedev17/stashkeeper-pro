// Script para aplicar a correção de integridade
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

async function applyIntegrityFix() {
  console.log("=== APLICANDO CORREÇÃO DE INTEGRIDADE NO BANCO DE DADOS ===");
  
  try {
    // 1. Carregar dados de teste
    if (!fs.existsSync('integrityTestData.json')) {
      throw new Error("Arquivo de dados de teste não encontrado. Execute primeiro test_frontend_integrity.mjs");
    }
    
    const testData = JSON.parse(fs.readFileSync('integrityTestData.json', 'utf8'));
    const testMovementId = testData.testMovementId;
    
    console.log(`Aplicando correção para a movimentação de teste: ${testMovementId}`);
    
    // 2. Verificar se a movimentação ainda existe e não está excluída
    const { data: movement, error: getError } = await supabase
      .from('movements')
      .select('id, deleted, type, quantity, product_id')
      .eq('id', testMovementId)
      .single();
    
    if (getError) {
      throw new Error(`Erro ao buscar movimentação: ${getError.message}`);
    }
    
    if (movement.deleted === true) {
      console.log("A movimentação já está marcada como excluída. Nenhuma ação necessária.");
      return;
    }
    
    console.log("Estado atual da movimentação:");
    console.log(`- ID: ${movement.id}`);
    console.log(`- Tipo: ${movement.type}`);
    console.log(`- Quantidade: ${movement.quantity}`);
    console.log(`- Excluída: ${movement.deleted}`);
    
    // 3. Marcar a movimentação como excluída
    console.log("\nAplicando correção (marcando como excluída)...");
    const { error: updateError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .eq('id', testMovementId);
    
    if (updateError) {
      throw new Error(`Erro ao atualizar movimentação: ${updateError.message}`);
    }
    
    // 4. Verificar se a correção foi aplicada
    const { data: updatedMovement, error: checkError } = await supabase
      .from('movements')
      .select('id, deleted')
      .eq('id', testMovementId)
      .single();
    
    if (checkError) {
      throw new Error(`Erro ao verificar movimentação atualizada: ${checkError.message}`);
    }
    
    if (updatedMovement.deleted !== true) {
      throw new Error("A movimentação não foi marcada como excluída corretamente");
    }
    
    console.log("\n✅ Correção aplicada com sucesso!");
    console.log(`Movimentação ${testMovementId} agora está marcada como excluída.`);
    
    // 5. Verificar total de movimentações excluídas
    const { data: deletedMovements, error: countError } = await supabase
      .from('movements')
      .select('id')
      .eq('deleted', true);
    
    if (!countError) {
      console.log(`\nTotal de movimentações excluídas no banco: ${deletedMovements.length}`);
      console.log(`IDs: ${deletedMovements.map(m => m.id).join(', ')}`);
    }
    
    console.log("\n=== CORREÇÃO CONCLUÍDA ===");
    
  } catch (error) {
    console.error("\n❌ ERRO DURANTE A APLICAÇÃO DA CORREÇÃO:", error.message);
  }
}

// Executar a correção
applyIntegrityFix().then(() => console.log("\nScript finalizado.")); 