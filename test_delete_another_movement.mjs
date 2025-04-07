import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv para módulos ES
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Vamos usar uma movimentação diferente para testar
async function main() {
  try {
    // 1. Buscar uma movimentação não excluída para o teste
    console.log('Buscando uma movimentação para excluir...');
    const { data: movements, error: fetchError } = await supabase
      .from('movements')
      .select('id, product_id, type, quantity, deleted, created_at')
      .eq('deleted', false)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (fetchError) {
      console.error('Erro ao buscar movimentações:', fetchError);
      return;
    }
    
    if (!movements || movements.length === 0) {
      console.log('Nenhuma movimentação encontrada para excluir');
      return;
    }
    
    console.log('Movimentações disponíveis:');
    movements.forEach((m, index) => {
      console.log(`${index + 1}. ID: ${m.id}, Tipo: ${m.type}, Quantidade: ${m.quantity}, Data: ${new Date(m.created_at).toLocaleString()}`);
    });
    
    // Usar a primeira movimentação disponível
    const movementToDelete = movements[0];
    console.log(`\nSelecionada movimentação para exclusão: ${movementToDelete.id}`);
    
    // 2. Buscar dados do produto antes da exclusão
    const { data: productBefore, error: productError } = await supabase
      .from('products')
      .select('id, name, quantity')
      .eq('id', movementToDelete.product_id)
      .single();
    
    if (productError) {
      console.error('Erro ao buscar produto:', productError);
      return;
    }
    
    console.log(`\nProduto relacionado: ${productBefore.name}`);
    console.log(`Quantidade atual: ${productBefore.quantity}`);
    
    // 3. Calcular quantidade esperada após exclusão
    let quantityChange = parseFloat(movementToDelete.quantity);
    let expectedQuantity;
    
    if (movementToDelete.type === 'entrada') {
      expectedQuantity = parseFloat(productBefore.quantity) - quantityChange;
      console.log(`Operação de exclusão: Removendo entrada de ${quantityChange} unidades`);
    } else {
      expectedQuantity = parseFloat(productBefore.quantity) + quantityChange;
      console.log(`Operação de exclusão: Devolvendo saída de ${quantityChange} unidades`);
    }
    
    console.log(`Quantidade esperada após exclusão: ${expectedQuantity}`);
    
    // 4. Simular a função deleteMovement do hook
    console.log('\nRealizando exclusão lógica...');
    
    // 4.1 Marcar a movimentação como excluída
    const { error: updateError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .eq('id', movementToDelete.id);
    
    if (updateError) {
      console.error('Erro ao marcar movimentação como excluída:', updateError);
      return;
    }
    
    // 4.2 Atualizar a quantidade do produto
    const { error: productUpdateError } = await supabase
      .from('products')
      .update({ quantity: expectedQuantity })
      .eq('id', movementToDelete.product_id);
    
    if (productUpdateError) {
      console.error('Erro ao atualizar quantidade do produto:', productUpdateError);
      // Reverter a exclusão lógica
      await supabase
        .from('movements')
        .update({ deleted: false })
        .eq('id', movementToDelete.id);
      return;
    }
    
    // 5. Verificar se a exclusão funcionou
    console.log('\nVerificando exclusão...');
    
    // 5.1 Verificar se a movimentação está marcada como excluída
    const { data: updatedMovement, error: checkError } = await supabase
      .from('movements')
      .select('deleted')
      .eq('id', movementToDelete.id)
      .single();
    
    if (checkError) {
      console.error('Erro ao verificar status da movimentação:', checkError);
      return;
    }
    
    console.log(`Movimentação marcada como excluída: ${updatedMovement.deleted}`);
    
    // 5.2 Verificar se a quantidade do produto foi atualizada
    const { data: productAfter, error: finalProductError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', movementToDelete.product_id)
      .single();
    
    if (finalProductError) {
      console.error('Erro ao verificar quantidade final do produto:', finalProductError);
      return;
    }
    
    console.log(`Quantidade atual do produto: ${productAfter.quantity}`);
    console.log(`Quantidade esperada: ${expectedQuantity}`);
    console.log(`Diferença: ${Math.abs(productAfter.quantity - expectedQuantity).toFixed(4)}`);
    
    // 5.3 Verificar se a movimentação não aparece em consultas filtradas
    const { data: filteredMovements, error: filterError } = await supabase
      .from('movements')
      .select('id')
      .eq('id', movementToDelete.id)
      .eq('deleted', false);
    
    if (filterError) {
      console.error('Erro ao verificar consultas filtradas:', filterError);
      return;
    }
    
    console.log(`\nMovimentação visível em consultas filtradas: ${filteredMovements.length > 0 ? 'Sim' : 'Não'}`);
    
    console.log('\n=== RESUMO DO TESTE ===');
    console.log(`Exclusão lógica da movimentação ${movementToDelete.id}: SUCESSO`);
    console.log(`Atualização da quantidade do produto: ${Math.abs(productAfter.quantity - expectedQuantity) < 0.0001 ? 'SUCESSO' : 'FALHA'}`);
    console.log(`Filtragem nas consultas: ${filteredMovements.length === 0 ? 'SUCESSO' : 'FALHA'}`);
    
  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

main(); 