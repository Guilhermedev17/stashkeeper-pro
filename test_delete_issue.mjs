// Teste para verificar o problema de movimentações que reaparecem após exclusão
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do cliente Supabase usando as variáveis de ambiente
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testDeleteAndVerify() {
  console.log("=== TESTE DE EXCLUSÃO DE MOVIMENTAÇÃO E VERIFICAÇÃO DE REAPARECIMENTO ===");
  
  try {
    // 1. Buscar uma movimentação recente (não excluída) para teste
    console.log("1. Buscando movimentação para teste...");
    const { data: movements, error: fetchError } = await supabase
      .from('movements')
      .select(`
        id, 
        product_id, 
        type, 
        quantity,
        deleted,
        products(name, code)
      `)
      .eq('deleted', false)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) throw new Error(`Erro ao buscar movimentações: ${fetchError.message}`);
    if (!movements || movements.length === 0) throw new Error("Nenhuma movimentação não excluída encontrada para teste");
    
    const testMovement = movements[0];
    console.log(`Movimentação encontrada: ID ${testMovement.id}`);
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
    
    // 3. Excluir a movimentação (soft delete)
    console.log("\n3. Excluindo movimentação (soft delete)...");
    const { error: deleteError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .eq('id', testMovement.id);
    
    if (deleteError) throw new Error(`Erro ao excluir movimentação: ${deleteError.message}`);
    console.log(`Movimentação marcada como excluída com sucesso`);
    
    // 4. Verificar se a quantidade do produto foi ajustada (dependendo do tipo de movimentação)
    console.log("\n4. Verificando se a quantidade foi ajustada...");
    let expectedQuantity;
    
    if (testMovement.type === 'entrada') {
      expectedQuantity = productBefore.quantity - testMovement.quantity;
      console.log(`Como era uma entrada, esperamos que o estoque diminua em ${testMovement.quantity} unidades`);
    } else {
      expectedQuantity = productBefore.quantity + testMovement.quantity;
      console.log(`Como era uma saída, esperamos que o estoque aumente em ${testMovement.quantity} unidades`);
    }
    
    console.log(`Quantidade esperada: ${expectedQuantity}`);
    
    // 5. Verificar o novo valor do produto
    const { data: productAfter, error: checkError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', testMovement.product_id)
      .single();
    
    if (checkError) throw new Error(`Erro ao verificar quantidade após exclusão: ${checkError.message}`);
    console.log(`Quantidade atual após exclusão: ${productAfter.quantity}`);
    
    if (Math.abs(productAfter.quantity - expectedQuantity) < 0.001) {
      console.log("✅ Quantidade do produto ajustada corretamente");
    } else {
      console.log("❌ Quantidade do produto não foi ajustada conforme esperado");
    }
    
    // 6. Verificar se a movimentação está marcada como excluída no banco
    console.log("\n5. Verificando se a movimentação está marcada como excluída...");
    const { data: checkDeleted, error: checkDeletedError } = await supabase
      .from('movements')
      .select('deleted')
      .eq('id', testMovement.id)
      .single();
    
    if (checkDeletedError) throw new Error(`Erro ao verificar status de exclusão: ${checkDeletedError.message}`);
    
    if (checkDeleted.deleted === true) {
      console.log("✅ Movimentação está corretamente marcada como excluída no banco");
    } else {
      console.log("❌ Movimentação NÃO está marcada como excluída no banco");
    }
    
    // 7. Verificar se a movimentação aparece em uma consulta regular
    console.log("\n6. Verificando se a movimentação aparece em consultas regulares...");
    const { data: regularQuery, error: regularQueryError } = await supabase
      .from('movements')
      .select('id')
      .eq('id', testMovement.id)
      .eq('deleted', false);
    
    if (regularQueryError) throw new Error(`Erro ao fazer consulta regular: ${regularQueryError.message}`);
    
    if (!regularQuery || regularQuery.length === 0) {
      console.log("✅ Movimentação NÃO aparece em consultas regulares (comportamento correto)");
    } else {
      console.log("❌ Movimentação ainda aparece em consultas regulares mesmo excluída!");
    }
    
    // 8. Restaurar o estado para não afetar o ambiente
    console.log("\n7. Restaurando o estado original para não afetar o ambiente...");
    
    // Reverter o soft delete (opcional em testes de produção)
    /*
    await supabase
      .from('movements')
      .update({ deleted: false })
      .eq('id', testMovement.id);
    */
    
    // Restaurar a quantidade original do produto
    const { error: restoreError } = await supabase
      .from('products')
      .update({ quantity: productBefore.quantity })
      .eq('id', testMovement.product_id);
    
    if (restoreError) throw new Error(`Erro ao restaurar quantidade do produto: ${restoreError.message}`);
    console.log("Quantidade do produto restaurada ao valor original");
    
    console.log("\n=== TESTE CONCLUÍDO COM SUCESSO ===");
    
  } catch (error) {
    console.error("\n❌ ERRO DURANTE O TESTE:", error.message);
  }
}

// Executar o teste
testDeleteAndVerify().then(() => console.log("\nTeste finalizado.")); 