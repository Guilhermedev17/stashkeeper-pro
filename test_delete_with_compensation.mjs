import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

// Criar cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Função principal
async function main() {
  try {
    console.log("=== TESTE DE EXCLUSÃO COM COMPENSAÇÃO AUTOMÁTICA ===");
    
    // 1. Buscar o produto "teste kg"
    console.log("\n1. Buscando produto teste kg...");
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, code, quantity')
      .eq('name', 'teste kg')
      .single();
      
    if (productError) {
      console.error("Erro ao buscar produto:", productError);
      return;
    }
    
    console.log(`Produto encontrado: ${product.name} (${product.code})`);
    console.log(`Quantidade atual: ${product.quantity}`);
    
    // 2. Verificar se há uma entrada grande para excluir
    console.log("\n2. Buscando uma entrada grande para excluir...");
    const { data: movements, error: movementsError } = await supabase
      .from('movements')
      .select('id, type, quantity, deleted, created_at')
      .eq('product_id', product.id)
      .eq('type', 'entrada')
      .eq('deleted', false)
      .order('quantity', { ascending: false })
      .limit(5);
      
    if (movementsError) {
      console.error("Erro ao buscar movimentações:", movementsError);
      return;
    }
    
    if (!movements || movements.length === 0) {
      console.log("Nenhuma movimentação de entrada encontrada para este produto.");
      return;
    }
    
    // Exibir movimentações encontradas
    console.log("Movimentações de entrada encontradas:");
    movements.forEach((m, i) => {
      console.log(`${i+1}. ID: ${m.id}, Quantidade: ${m.quantity}, Data: ${new Date(m.created_at).toLocaleDateString()}`);
    });
    
    // Selecionar a maior entrada que exceda o estoque atual (para forçar compensação)
    let selectedMovement = null;
    for (const m of movements) {
      if (m.quantity > product.quantity) {
        selectedMovement = m;
        break;
      }
    }
    
    if (!selectedMovement) {
      console.log("\nNenhuma movimentação grande o suficiente para forçar compensação.");
      console.log("Usando a maior entrada disponível para teste...");
      selectedMovement = movements[0];
    }
    
    console.log(`\nMovimentação selecionada: ID ${selectedMovement.id}, Quantidade ${selectedMovement.quantity}`);
    console.log(`Quantidade atual do produto: ${product.quantity}`);
    console.log(`Resultado esperado após exclusão: ${Math.max(0, product.quantity - selectedMovement.quantity)}`);
    
    if (selectedMovement.quantity <= product.quantity) {
      console.log("\nAVISO: Esta exclusão não deve acionar a compensação automática pois o estoque é suficiente.");
    } else {
      console.log("\nAVISO: Esta exclusão deve acionar a compensação automática pois o estoque ficaria negativo.");
      console.log(`Compensação esperada: ${selectedMovement.quantity - product.quantity}`);
    }
    
    // 3. Solicitar confirmação do usuário
    console.log("\n3. ATENÇÃO: Prosseguir com a exclusão? (pressione Ctrl+C para cancelar)");
    await new Promise(resolve => setTimeout(resolve, 5000)); // Espera 5 segundos
    
    // 4. Excluir a movimentação
    console.log("\n4. Excluindo movimentação...");
    const { error: deleteError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .eq('id', selectedMovement.id);
      
    if (deleteError) {
      console.error("Erro ao excluir movimentação:", deleteError);
      return;
    }
    
    console.log("Movimentação marcada como excluída com sucesso!");
    
    // 5. Verificar se o produto foi atualizado corretamente
    console.log("\n5. Verificando quantidade atual do produto após exclusão...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2 segundos
    
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', product.id)
      .single();
      
    if (updateError) {
      console.error("Erro ao verificar produto atualizado:", updateError);
      return;
    }
    
    console.log(`Quantidade anterior: ${product.quantity}`);
    console.log(`Quantidade atual: ${updatedProduct.quantity}`);
    
    // 6. Verificar se houve compensação
    console.log("\n6. Verificando se houve compensação...");
    const { data: compensations, error: compError } = await supabase
      .from('movements')
      .select('id, quantity, notes, created_at')
      .eq('product_id', product.id)
      .eq('type', 'entrada')
      .ilike('notes', `%Compensação automática%${selectedMovement.id}%`)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (compError) {
      console.error("Erro ao verificar compensações:", compError);
    } else if (compensations && compensations.length > 0) {
      console.log("Compensação encontrada:");
      console.log(compensations[0]);
    } else {
      console.log("Nenhuma compensação foi encontrada. A exclusão não gerou estoque negativo.");
    }
    
    console.log("\n=== TESTE CONCLUÍDO ===");
    
  } catch (err) {
    console.error("Erro durante o teste:", err);
  }
}

// Executar o script
main(); 