// Script para testar exclusão de movimentações de compensação automática
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCompensationMovementDeletion() {
  console.log("=== TESTE DE EXCLUSÃO DE MOVIMENTAÇÕES DE COMPENSAÇÃO ===");
  
  try {
    // 1. Buscar um produto para teste
    console.log("\n1. Buscando produto para teste...");
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, code, quantity')
      .limit(1);
    
    if (productError) throw new Error(`Erro ao buscar produto: ${productError.message}`);
    if (!products || products.length === 0) throw new Error("Nenhum produto encontrado para teste");
    
    const testProduct = products[0];
    console.log(`Produto: ${testProduct.name} (${testProduct.code})`);
    console.log(`Quantidade atual: ${testProduct.quantity}`);
    
    // 2. Criar uma movimentação original
    console.log("\n2. Criando movimentação original (entrada de 25 unidades)...");
    const originalMovementData = {
      product_id: testProduct.id,
      type: 'entrada',
      quantity: 25,
      notes: 'Movimentação original para teste de compensação',
      deleted: false
    };
    
    const { data: originalMovement, error: originalError } = await supabase
      .from('movements')
      .insert(originalMovementData)
      .select();
    
    if (originalError) throw new Error(`Erro ao criar movimentação original: ${originalError.message}`);
    if (!originalMovement || originalMovement.length === 0) throw new Error("Falha ao criar movimentação original");
    
    const originalMovementId = originalMovement[0].id;
    console.log(`Movimentação original criada com ID: ${originalMovementId}`);
    
    // 3. Atualizar a quantidade do produto
    console.log("\n3. Atualizando quantidade do produto...");
    const newQuantity = testProduct.quantity + 25;
    
    const { error: updateProductError } = await supabase
      .from('products')
      .update({ quantity: newQuantity })
      .eq('id', testProduct.id);
    
    if (updateProductError) throw new Error(`Erro ao atualizar produto: ${updateProductError.message}`);
    console.log(`Quantidade atualizada para: ${newQuantity}`);
    
    // 4. Criar uma movimentação de compensação automática
    console.log("\n4. Criando movimentação de compensação automática (saída de 25 unidades)...");
    const compensationMovementData = {
      product_id: testProduct.id,
      type: 'saida',
      quantity: 25,
      notes: `Compensação automática para exclusão da movimentação ${originalMovementId}`,
      deleted: false
    };
    
    const { data: compensationMovement, error: compensationError } = await supabase
      .from('movements')
      .insert(compensationMovementData)
      .select();
    
    if (compensationError) throw new Error(`Erro ao criar movimentação de compensação: ${compensationError.message}`);
    if (!compensationMovement || compensationMovement.length === 0) throw new Error("Falha ao criar movimentação de compensação");
    
    const compensationMovementId = compensationMovement[0].id;
    console.log(`Movimentação de compensação criada com ID: ${compensationMovementId}`);
    
    // 5. Restaurar a quantidade original do produto (simulando o efeito da compensação)
    console.log("\n5. Restaurando quantidade original do produto...");
    const originalQuantity = testProduct.quantity;
    
    const { error: restoreError } = await supabase
      .from('products')
      .update({ quantity: originalQuantity })
      .eq('id', testProduct.id);
    
    if (restoreError) throw new Error(`Erro ao restaurar quantidade: ${restoreError.message}`);
    console.log(`Quantidade restaurada para: ${originalQuantity}`);
    
    // 6. Excluir a movimentação original (soft delete)
    console.log("\n6. Marcando movimentação original como excluída...");
    const { error: deleteOriginalError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .eq('id', originalMovementId);
    
    if (deleteOriginalError) throw new Error(`Erro ao excluir movimentação original: ${deleteOriginalError.message}`);
    console.log("Movimentação original marcada como excluída com sucesso");
    
    // 7. Excluir a movimentação de compensação (soft delete)
    console.log("\n7. Marcando movimentação de compensação como excluída...");
    const { error: deleteCompensationError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .eq('id', compensationMovementId);
    
    if (deleteCompensationError) throw new Error(`Erro ao excluir movimentação de compensação: ${deleteCompensationError.message}`);
    console.log("Movimentação de compensação marcada como excluída com sucesso");
    
    // 8. Verificar se ambas movimentações foram marcadas como excluídas
    console.log("\n8. Verificando status das movimentações...");
    const { data: checkMovements, error: checkError } = await supabase
      .from('movements')
      .select('id, deleted, notes')
      .in('id', [originalMovementId, compensationMovementId]);
    
    if (checkError) throw new Error(`Erro ao verificar movimentações: ${checkError.message}`);
    
    const originalDeleted = checkMovements.find(m => m.id === originalMovementId)?.deleted;
    const compensationDeleted = checkMovements.find(m => m.id === compensationMovementId)?.deleted;
    
    console.log(`Movimentação original (${originalMovementId}): ${originalDeleted ? "Excluída ✅" : "Não excluída ❌"}`);
    console.log(`Movimentação de compensação (${compensationMovementId}): ${compensationDeleted ? "Excluída ✅" : "Não excluída ❌"}`);
    
    if (!originalDeleted || !compensationDeleted) {
      console.log("❌ ERRO: Uma ou ambas movimentações não foram marcadas como excluídas corretamente!");
    } else {
      console.log("✅ Ambas movimentações foram marcadas como excluídas corretamente");
    }
    
    // 9. Simular localStorage com essas movimentações excluídas
    console.log("\n9. Simulando localStorage com movimentações excluídas...");
    const deletedIds = [originalMovementId, compensationMovementId];
    console.log(`IDs excluídos: ${deletedIds.join(', ')}`);
    
    // 10. Verificar se o IntegrityCheck detecta corretamente
    console.log("\n10. Verificando integridade das movimentações excluídas...");
    
    // Simular comportamento do IntegrityCheck de forma simplificada
    const { data: inconsistentMovements, error: inconsistentError } = await supabase
      .from('movements')
      .select('id, deleted')
      .in('id', deletedIds)
      .eq('deleted', false); // Buscar movimentações que deveriam estar excluídas mas não estão
    
    if (inconsistentError) throw new Error(`Erro ao verificar integridade: ${inconsistentError.message}`);
    
    if (inconsistentMovements.length > 0) {
      console.log(`❌ Encontradas ${inconsistentMovements.length} movimentações inconsistentes!`);
      console.log("IDs inconsistentes:", inconsistentMovements.map(m => m.id).join(', '));
    } else {
      console.log("✅ Nenhuma inconsistência encontrada. O sistema está íntegro.");
    }
    
    // 11. Verificar movimentações excluídas no banco
    console.log("\n11. Verificando todas as movimentações excluídas no banco...");
    const { data: allDeleted, error: listError } = await supabase
      .from('movements')
      .select('id, notes, type')
      .eq('deleted', true)
      .order('created_at', { ascending: false });
    
    if (listError) throw new Error(`Erro ao listar movimentações excluídas: ${listError.message}`);
    
    console.log(`Total de movimentações excluídas no banco: ${allDeleted.length}`);
    console.log("Últimas movimentações excluídas:");
    
    allDeleted.slice(0, 5).forEach((movement, index) => {
      console.log(`${index + 1}. ID: ${movement.id}`);
      console.log(`   Tipo: ${movement.type}`);
      console.log(`   Notas: ${movement.notes || 'N/A'}`);
    });
    
    // 12. Verificar se entre as movimentações excluídas existem outras compensações
    const compensationMovements = allDeleted.filter(m => m.notes && m.notes.includes('Compensação automática'));
    console.log(`\nMovimentações de compensação excluídas: ${compensationMovements.length}`);
    
    console.log("\n=== TESTE CONCLUÍDO ===");
    console.log("ID da movimentação original: " + originalMovementId);
    console.log("ID da movimentação de compensação: " + compensationMovementId);
    
  } catch (error) {
    console.error("\n❌ ERRO DURANTE O TESTE:", error.message);
  }
}

// Executar o teste
testCompensationMovementDeletion().then(() => console.log("\nScript finalizado.")); 