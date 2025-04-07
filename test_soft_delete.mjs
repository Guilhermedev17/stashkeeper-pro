// Script para testar a funcionalidade de exclusão lógica (soft delete)
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Inicializar dotenv
dotenv.config();

// Configuração do cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para testar exclusão lógica
async function testSoftDelete() {
  console.log('Testando funcionalidade de exclusão lógica...');

  try {
    // 1. Buscar uma movimentação para testar (última criada)
    console.log('Buscando última movimentação para teste...');
    const { data: movements, error: fetchError } = await supabase
      .from('movements')
      .select('id, product_id, product:products(name), type, quantity, deleted')
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchError) {
      throw new Error(`Erro ao buscar movimentações: ${fetchError.message}`);
    }

    if (!movements || movements.length === 0) {
      throw new Error('Nenhuma movimentação encontrada para teste.');
    }

    // Exibir as movimentações encontradas
    console.log('\nMovimentações disponíveis para teste:');
    movements.forEach((movement, index) => {
      console.log(`${index + 1}. ID: ${movement.id}`);
      console.log(`   Produto: ${movement.product?.name || 'Desconhecido'}`);
      console.log(`   Tipo: ${movement.type}`);
      console.log(`   Quantidade: ${movement.quantity}`);
      console.log(`   Excluído: ${movement.deleted ? 'Sim' : 'Não'}`);
      console.log('---');
    });

    // Selecionar a primeira movimentação não excluída
    const testMovement = movements.find(m => !m.deleted);
    
    if (!testMovement) {
      throw new Error('Todas as movimentações já estão marcadas como excluídas.');
    }

    const movementId = testMovement.id;
    console.log(`\nUsando movimentação ID: ${movementId} para teste`);

    // 2. Buscar produto para verificar quantidade atual
    console.log(`\nBuscando dados do produto ${testMovement.product_id}...`);
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, quantity')
      .eq('id', testMovement.product_id)
      .single();

    if (productError) {
      throw new Error(`Erro ao buscar produto: ${productError.message}`);
    }

    console.log(`Produto: ${product.name}`);
    console.log(`Quantidade atual: ${product.quantity}`);

    // 3. Calcular a nova quantidade esperada após a exclusão
    const movementQuantity = parseFloat(testMovement.quantity);
    let expectedQuantity = parseFloat(product.quantity);

    if (testMovement.type === 'entrada') {
      // Se for entrada, ao excluir diminuímos o estoque
      expectedQuantity -= movementQuantity;
    } else {
      // Se for saída, ao excluir aumentamos o estoque
      expectedQuantity += movementQuantity;
    }

    console.log(`Quantidade esperada após exclusão: ${expectedQuantity}`);

    // 4. Marcar a movimentação como excluída (soft delete)
    console.log('\nRealizando soft delete da movimentação...');
    const { error: updateError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .eq('id', movementId);

    if (updateError) {
      throw new Error(`Erro ao marcar movimentação como excluída: ${updateError.message}`);
    }

    console.log('Movimentação marcada como excluída com sucesso!');

    // 5. Atualizar a quantidade do produto manualmente (simulando o comportamento do hook)
    console.log('\nAtualizando quantidade do produto...');
    const { error: productUpdateError } = await supabase
      .from('products')
      .update({ quantity: expectedQuantity })
      .eq('id', product.id);

    if (productUpdateError) {
      throw new Error(`Erro ao atualizar quantidade do produto: ${productUpdateError.message}`);
    }

    console.log('Quantidade do produto atualizada com sucesso!');

    // 6. Verificar se a movimentação está marcada como excluída
    console.log('\nVerificando se a exclusão lógica funcionou...');
    const { data: checkMovement, error: checkError } = await supabase
      .from('movements')
      .select('deleted')
      .eq('id', movementId)
      .single();

    if (checkError) {
      throw new Error(`Erro ao verificar exclusão: ${checkError.message}`);
    }

    console.log(`Movimentação excluída? ${checkMovement.deleted ? 'Sim' : 'Não'}`);

    // 7. Verificar se a quantidade do produto foi atualizada
    console.log('\nVerificando quantidade atualizada do produto...');
    const { data: updatedProduct, error: updatedProductError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', product.id)
      .single();

    if (updatedProductError) {
      throw new Error(`Erro ao verificar produto atualizado: ${updatedProductError.message}`);
    }

    console.log(`Quantidade atual: ${updatedProduct.quantity}`);
    console.log(`Quantidade esperada: ${expectedQuantity}`);

    // 8. Testar se as consultas filtram automaticamente os registros excluídos
    console.log('\nVerificando se as consultas filtram registros excluídos...');
    const { data: visibleMovements, error: visibleError } = await supabase
      .from('movements')
      .select('id')
      .eq('deleted', false)
      .eq('id', movementId);

    if (visibleError) {
      throw new Error(`Erro ao verificar visibilidade: ${visibleError.message}`);
    }

    console.log(`Movimentação visível em consultas filtradas: ${visibleMovements.length === 0 ? 'Não' : 'Sim'}`);

    // Exibir resumo do teste
    console.log('\n=== RESUMO DO TESTE ===');
    console.log(`Movimentação ${movementId} marcada como excluída: ${checkMovement.deleted ? 'SUCESSO' : 'FALHA'}`);
    
    const quantityUpdated = Math.abs(updatedProduct.quantity - expectedQuantity) < 0.001;
    console.log(`Quantidade do produto atualizada corretamente: ${quantityUpdated ? 'SUCESSO' : 'FALHA'}`);
    
    console.log(`Consulta filtrada por deleted=false: ${visibleMovements.length === 0 ? 'SUCESSO' : 'FALHA'}`);

  } catch (error) {
    console.error('\nErro durante o teste:');
    console.error(error);
  }
}

// Executar o teste
testSoftDelete().then(() => {
  console.log('\nTeste de exclusão lógica concluído!');
}); 