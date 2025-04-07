// Script para testar o fluxo completo de exclusão de movimentações
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testDeletionWorkflow() {
  console.log("=== TESTE DE FLUXO DE EXCLUSÃO DE MOVIMENTAÇÕES ===");
  
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
    
    // 2. Criar uma movimentação de entrada
    console.log("\n2. Criando movimentação de teste (entrada de 10 unidades)...");
    const movementData = {
      product_id: testProduct.id,
      type: 'entrada',
      quantity: 10,
      notes: 'Movimentação de teste para verificação de exclusão',
      deleted: false
    };
    
    const { data: newMovement, error: createError } = await supabase
      .from('movements')
      .insert(movementData)
      .select();
    
    if (createError) throw new Error(`Erro ao criar movimentação: ${createError.message}`);
    if (!newMovement || newMovement.length === 0) throw new Error("Falha ao criar movimentação de teste");
    
    const testMovementId = newMovement[0].id;
    console.log(`Movimentação criada com ID: ${testMovementId}`);
    
    // 3. Atualizar a quantidade do produto
    console.log("\n3. Atualizando quantidade do produto...");
    const newQuantity = testProduct.quantity + 10;
    
    const { error: updateProductError } = await supabase
      .from('products')
      .update({ quantity: newQuantity })
      .eq('id', testProduct.id);
    
    if (updateProductError) throw new Error(`Erro ao atualizar produto: ${updateProductError.message}`);
    console.log(`Quantidade atualizada para: ${newQuantity}`);
    
    // 4. Aguardar um momento para simular interação do usuário
    console.log("\n4. Aguardando 2 segundos...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 5. Marcar a movimentação como excluída (soft delete)
    console.log("\n5. Marcando movimentação como excluída (deleted=true)...");
    const { error: deleteError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .eq('id', testMovementId);
    
    if (deleteError) throw new Error(`Erro ao excluir movimentação: ${deleteError.message}`);
    console.log("Movimentação marcada como excluída com sucesso");
    
    // 6. Reverter a quantidade do produto
    console.log("\n6. Revertendo a quantidade do produto...");
    const revertedQuantity = newQuantity - 10;
    
    const { error: revertError } = await supabase
      .from('products')
      .update({ quantity: revertedQuantity })
      .eq('id', testProduct.id);
    
    if (revertError) throw new Error(`Erro ao reverter quantidade: ${revertError.message}`);
    console.log(`Quantidade revertida para: ${revertedQuantity}`);
    
    // 7. Verificar se a movimentação foi realmente marcada como excluída
    console.log("\n7. Verificando status da movimentação...");
    const { data: checkMovement, error: checkError } = await supabase
      .from('movements')
      .select('id, deleted')
      .eq('id', testMovementId)
      .single();
    
    if (checkError) throw new Error(`Erro ao verificar movimentação: ${checkError.message}`);
    console.log(`Status deleted: ${checkMovement.deleted}`);
    
    if (!checkMovement.deleted) {
      console.log("❌ ERRO: Movimentação não foi marcada como excluída corretamente!");
    } else {
      console.log("✅ Movimentação marcada como excluída corretamente");
    }
    
    // 8. Verificar se a movimentação aparece na lista de excluídas
    console.log("\n8. Verificando lista de movimentações excluídas...");
    const { data: deletedMovements, error: listError } = await supabase
      .from('movements')
      .select('id')
      .eq('deleted', true);
    
    if (listError) throw new Error(`Erro ao listar movimentações excluídas: ${listError.message}`);
    
    const isInDeletedList = deletedMovements.some(m => m.id === testMovementId);
    if (!isInDeletedList) {
      console.log("❌ ERRO: Movimentação não está na lista de excluídas!");
    } else {
      console.log("✅ Movimentação encontrada na lista de excluídas");
      console.log(`Total de movimentações excluídas no banco: ${deletedMovements.length}`);
    }
    
    console.log("\n=== TESTE CONCLUÍDO ===");
    console.log(`ID da movimentação de teste: ${testMovementId}`);
    console.log("Para verificação adicional, você pode testar se essa movimentação aparece na interface");
    
  } catch (error) {
    console.error("\n❌ ERRO DURANTE O TESTE:", error.message);
  }
}

// Executar o teste
testDeletionWorkflow().then(() => console.log("\nScript finalizado.")); 