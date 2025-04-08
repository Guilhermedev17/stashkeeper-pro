// Teste de edição de movimentações com transações
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jsdxpfzwvwkejvwlvofd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZHhwZnp3dndlanZ3bHZvZmQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMjU5OTg1MCwiZXhwIjoyMDI4MTc1ODUwfQ.xfm2X6RRXG9TWVcyGxzP6QfnNdWJj7TNFhsxLLJ4Jko';
const supabase = createClient(supabaseUrl, supabaseKey);

// Função que testa a edição de movimentação
async function testEditMovement() {
  console.log("=== TESTE DE EDIÇÃO DE MOVIMENTAÇÃO COM TRANSAÇÕES ===");
  
  try {
    // 1. Encontrar um produto específico para testar
    console.log("1. Buscando produto para teste...");
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, unit, quantity')
      .eq('name', 'teste kg')
      .limit(1);
    
    if (productError) throw new Error(`Erro ao buscar produto: ${productError.message}`);
    if (!products || products.length === 0) throw new Error("Produto de teste não encontrado");
    
    const product = products[0];
    console.log(`Produto encontrado: ${product.name} (ID: ${product.id}) - Quantidade atual: ${product.quantity} ${product.unit}`);
    
    // 2. Registrar uma movimentação de teste (entrada)
    console.log("\n2. Criando movimentação de teste (entrada)...");
    const movementData = {
      product_id: product.id,
      type: 'entrada',
      quantity: 5,
      notes: 'Movimentação de teste para edição'
    };
    
    const { data: newMovement, error: movementError } = await supabase
      .from('movements')
      .insert(movementData)
      .select()
      .single();
    
    if (movementError) throw new Error(`Erro ao criar movimentação: ${movementError.message}`);
    console.log(`Movimentação criada com sucesso: ID ${newMovement.id}, Quantidade: ${newMovement.quantity}`);
    
    // 3. Verificar se o estoque foi atualizado corretamente
    const { data: updatedProduct, error: updateCheckError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', product.id)
      .single();
    
    if (updateCheckError) throw new Error(`Erro ao verificar quantidade: ${updateCheckError.message}`);
    console.log(`Estoque após criação: ${updatedProduct.quantity} ${product.unit} (esperado: ${product.quantity + movementData.quantity})`);
    
    // 4. Editar a movimentação (alterar quantidade e notas)
    console.log("\n3. Editando a movimentação...");
    const editedData = {
      quantity: 10, // Aumentar a quantidade
      notes: 'Movimentação editada pelo teste'
    };
    
    const { error: editError } = await supabase
      .from('movements')
      .update(editedData)
      .eq('id', newMovement.id);
    
    if (editError) throw new Error(`Erro ao editar movimentação: ${editError.message}`);
    console.log("Movimentação editada com sucesso!");
    
    // 5. Verificar se o estoque foi reajustado corretamente
    const { data: finalProduct, error: finalCheckError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', product.id)
      .single();
    
    if (finalCheckError) throw new Error(`Erro ao verificar quantidade final: ${finalCheckError.message}`);
    
    // A quantidade esperada é: quantidade original + quantidade da edição
    const expectedQuantity = product.quantity + editedData.quantity;
    
    console.log(`\nResultado final:`);
    console.log(`- Estoque após edição: ${finalProduct.quantity} ${product.unit}`);
    console.log(`- Estoque esperado: ${expectedQuantity} ${product.unit}`);
    
    // Verificar se o estoque está correto
    if (Math.abs(finalProduct.quantity - expectedQuantity) < 0.001) {
      console.log("\n✅ TESTE PASSOU: O estoque foi atualizado corretamente após a edição da movimentação.");
    } else {
      console.log("\n❌ TESTE FALHOU: O estoque não foi atualizado corretamente.");
      console.log(`   - Valor atual: ${finalProduct.quantity}`);
      console.log(`   - Valor esperado: ${expectedQuantity}`);
    }
    
    // 6. Limpar - remover a movimentação de teste (soft delete)
    console.log("\n5. Limpando dados de teste...");
    const { error: deleteError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .eq('id', newMovement.id);
    
    if (deleteError) throw new Error(`Erro ao limpar movimentação de teste: ${deleteError.message}`);
    
    // 7. Restaurar a quantidade original do produto
    const { error: restoreError } = await supabase
      .from('products')
      .update({ quantity: product.quantity })
      .eq('id', product.id);
    
    if (restoreError) throw new Error(`Erro ao restaurar quantidade do produto: ${restoreError.message}`);
    
    console.log("Dados de teste limpos com sucesso. Produto restaurado à quantidade original.");
    
  } catch (error) {
    console.error("\n❌ ERRO DURANTE O TESTE:", error.message);
  }
}

// Executar o teste
testEditMovement().then(() => console.log("\nTeste finalizado."));
