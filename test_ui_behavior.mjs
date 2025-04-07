// Teste para simular o comportamento da UI ao excluir uma movimentação
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Simular o comportamento de eventos em tempo real
async function testUIBehavior() {
  console.log("=== TESTE DE COMPORTAMENTO DA UI AO EXCLUIR MOVIMENTAÇÃO ===");
  
  try {
    // 1. Buscar uma movimentação para teste
    console.log("1. Buscando movimentação para teste...");
    const { data: movements, error: fetchError } = await supabase
      .from('movements')
      .select(`
        id, product_id, type, quantity, deleted,
        products:products(id, name, code)
      `)
      .eq('deleted', false)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) throw new Error(`Erro ao buscar movimentações: ${fetchError.message}`);
    if (!movements || movements.length === 0) throw new Error("Nenhuma movimentação encontrada para teste");
    
    const testMovement = movements[0];
    console.log(`Movimentação: ${testMovement.id}`);
    console.log(`Produto: ${testMovement.products?.name || 'N/A'} (${testMovement.products?.code || 'N/A'})`);
    console.log(`Tipo: ${testMovement.type}, Quantidade: ${testMovement.quantity}`);
    
    // 2. Verificar a quantidade atual do produto
    console.log("\n2. Verificando quantidade atual do produto...");
    const { data: productBefore, error: productError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', testMovement.product_id)
      .single();
    
    if (productError) throw new Error(`Erro ao buscar quantidade do produto: ${productError.message}`);
    console.log(`Quantidade atual do produto: ${productBefore.quantity}`);
    
    // 3. Simular a exclusão de movimentação (soft delete)
    console.log("\n3. Simulando exclusão de movimentação...");
    
    // 3.1 Calcular a nova quantidade do produto
    let expectedQuantity;
    if (testMovement.type === 'entrada') {
      expectedQuantity = productBefore.quantity - testMovement.quantity;
      console.log(`Como é uma entrada, estoque será diminuído em ${testMovement.quantity} unidades`);
    } else {
      expectedQuantity = productBefore.quantity + testMovement.quantity;
      console.log(`Como é uma saída, estoque será aumentado em ${testMovement.quantity} unidades`);
    }
    
    // 3.2 Atualizar o produto
    console.log(`Atualizando produto para quantidade: ${expectedQuantity}`);
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity: expectedQuantity })
      .eq('id', testMovement.product_id);
    
    if (updateError) throw new Error(`Erro ao atualizar produto: ${updateError.message}`);
    
    // 3.3 Marcar movimentação como excluída
    console.log("Marcando movimentação como excluída (deleted=true)");
    const { error: deleteError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .eq('id', testMovement.id);
    
    if (deleteError) throw new Error(`Erro ao excluir movimentação: ${deleteError.message}`);
    
    // 4. Simular reação da UI a eventos em tempo real
    console.log("\n4. Simulando a reação da UI a eventos em tempo real...");
    
    // 4.1 Buscar a movimentação de novo (simulando o evento do Supabase)
    console.log("Obtendo estado atual da movimentação do banco (simulando evento)");
    const { data: updatedMovement, error: updatedError } = await supabase
      .from('movements')
      .select(`
        id, product_id, type, quantity, deleted,
        products:products(id, name, code)
      `)
      .eq('id', testMovement.id)
      .single();
    
    if (updatedError) throw new Error(`Erro ao buscar movimentação atualizada: ${updatedError.message}`);
    
    // 4.2 Verificar se a movimentação está marcada como excluída
    console.log(`Estado atual de deleted: ${updatedMovement.deleted}`);
    if (updatedMovement.deleted === true) {
      console.log("✅ Movimentação está corretamente marcada como excluída");
      
      // 4.3 Simular a lógica que aconteceria no hook quando recebe o evento de movimentação excluída
      console.log("\nSimulando comportamento da UI ao receber um evento de UPDATE com deleted=true:");
      console.log("  - Movimentação seria removida da lista de movimentações ativas");
      console.log("  - ID seria adicionado à lista de IDs excluídos");
      console.log("  - Componente seria re-renderizado sem esta movimentação");
    } else {
      console.log("❌ Movimentação NÃO está marcada como excluída - problema no banco!");
    }
    
    // 5. Verificar se a movimentação aparece em consultas regulares
    console.log("\n5. Verificando se a movimentação aparece em consultas regulares...");
    const { data: regularQuery, error: regularQueryError } = await supabase
      .from('movements')
      .select(`id, deleted`)
      .eq('id', testMovement.id);
    
    if (regularQueryError) throw new Error(`Erro na consulta regular: ${regularQueryError.message}`);
    
    if (!regularQuery || regularQuery.length === 0) {
      console.log("❌ Movimentação não encontrada - problema no banco de dados!");
    } else {
      console.log(`Movimentação encontrada, status deleted: ${regularQuery[0].deleted}`);
      
      // 5.2 Verificar comportamento da consulta com filtro deleted=false
      const { data: filteredQuery, error: filteredError } = await supabase
        .from('movements')
        .select(`id`)
        .eq('id', testMovement.id)
        .eq('deleted', false);
      
      if (filteredError) throw new Error(`Erro na consulta filtrada: ${filteredError.message}`);
      
      if (!filteredQuery || filteredQuery.length === 0) {
        console.log("✅ Movimentação não aparece quando filtramos por deleted=false (comportamento correto)");
        console.log("   As consultas da aplicação usam este filtro, portanto a movimentação não aparecerá na UI");
      } else {
        console.log("❌ Movimentação ainda aparece com filtro deleted=false (problema na consulta)!");
      }
    }
    
    // 6. Testar a consulta que o hook useSupabaseMovements faz
    console.log("\n6. Testando a consulta exata que o hook useSupabaseMovements usa:");
    const { data: hookQueryData, error: hookQueryError } = await supabase
      .from('movements')
      .select(`
        id, product_id, type, quantity, user_id, notes, created_at, employee_id, deleted,
        products:products(id, name, code)
      `)
      .eq('deleted', false)
      .order('created_at', { ascending: false });
    
    if (hookQueryError) throw new Error(`Erro na consulta do hook: ${hookQueryError.message}`);
    
    const movementInResults = hookQueryData.some(m => m.id === testMovement.id);
    
    if (!movementInResults) {
      console.log("✅ Movimentação não está presente nos resultados da consulta do hook (comportamento correto)");
    } else {
      console.log("❌ Movimentação ainda aparece nos resultados da consulta do hook (problema a corrigir!)");
    }
    
    // 7. Restaurar o estado original
    console.log("\n7. Restaurando o estado original para não afetar o ambiente...");
    
    // 7.1 Restaurar a quantidade do produto
    const { error: restoreProductError } = await supabase
      .from('products')
      .update({ quantity: productBefore.quantity })
      .eq('id', testMovement.product_id);
    
    if (restoreProductError) throw new Error(`Erro ao restaurar produto: ${restoreProductError.message}`);
    
    // 7.2 Reverter o soft delete
    const { error: restoreMovementError } = await supabase
      .from('movements')
      .update({ deleted: false })
      .eq('id', testMovement.id);
    
    if (restoreMovementError) throw new Error(`Erro ao restaurar movimentação: ${restoreMovementError.message}`);
    
    console.log("Estado original restaurado com sucesso");
    console.log("\n=== TESTE CONCLUÍDO COM SUCESSO ===");
    
  } catch (error) {
    console.error("\n❌ ERRO DURANTE O TESTE:", error.message);
  }
}

// Executar o teste
testUIBehavior().then(() => console.log("\nTeste finalizado.")); 