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
    console.log("=== TESTE DE EXCLUSÃO DE MOVIMENTAÇÃO ESPECÍFICA ===");
    
    // 1. Usar o ID da movimentação da simulação diretamente
    const movementId = '81e2524f-4f86-4b6e-8559-bfd35fb5d44a'; // ID da simulação anterior
    console.log(`Usando ID da movimentação: ${movementId}`);
    
    // 2. Buscar detalhes da movimentação
    console.log("\n1. Buscando detalhes da movimentação...");
    const { data: movement, error: movementError } = await supabase
      .from('movements')
      .select('id, product_id, type, quantity, notes, deleted, created_at')
      .eq('id', movementId)
      .single();
      
    if (movementError) {
      console.error("Erro ao buscar movimentação:", movementError);
      return;
    }
    
    if (!movement) {
      console.log("Movimentação não encontrada.");
      return;
    }
    
    if (movement.deleted) {
      console.log("Esta movimentação já está marcada como excluída.");
      return;
    }
    
    console.log("Detalhes da movimentação:");
    console.log(`ID: ${movement.id}`);
    console.log(`Tipo: ${movement.type}`);
    console.log(`Quantidade: ${movement.quantity}`);
    console.log(`Data: ${new Date(movement.created_at).toLocaleString()}`);
    console.log(`Observações: ${movement.notes || 'Nenhuma'}`);
    
    // 3. Buscar detalhes do produto
    console.log("\n2. Buscando detalhes do produto relacionado...");
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, code, quantity')
      .eq('id', movement.product_id)
      .single();
      
    if (productError) {
      console.error("Erro ao buscar produto:", productError);
      return;
    }
    
    console.log(`Produto: ${product.name} (${product.code})`);
    console.log(`Quantidade atual: ${product.quantity}`);
    
    // 4. Calcular resultado esperado
    let expectedQuantity;
    if (movement.type === 'entrada') {
      expectedQuantity = product.quantity - movement.quantity;
    } else {
      expectedQuantity = product.quantity + movement.quantity;
    }
    
    console.log(`\nSe esta ${movement.type} for excluída, a quantidade do produto ficaria: ${expectedQuantity}`);
    
    if (expectedQuantity < 0) {
      console.log("\nAVISO: A exclusão desta entrada causaria estoque negativo!");
      console.log("O mecanismo de compensação automática deve ser acionado.");
      console.log(`Compensação esperada: ${Math.abs(expectedQuantity)} unidades`);
    }
    
    // 5. Confirmar automaticamente
    console.log("\nProsseguindo com a exclusão automaticamente em 3 segundos...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 6. Executar a exclusão
    console.log("\n3. Excluindo movimentação...");
    const { error: deleteError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .eq('id', movement.id);
      
    if (deleteError) {
      console.error("Erro ao excluir movimentação:", deleteError);
      return;
    }
    
    console.log("Movimentação marcada como excluída com sucesso!");
    
    // 7. Verificar resultado
    console.log("\n4. Verificando quantidade atual do produto após exclusão...");
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
    
    // 8. Verificar se houve compensação
    if (expectedQuantity < 0) {
      console.log("\n5. Verificando se houve compensação...");
      const { data: compensations, error: compError } = await supabase
        .from('movements')
        .select('id, quantity, notes, created_at')
        .eq('product_id', product.id)
        .eq('type', 'entrada')
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Últimos 60 segundos
        .order('created_at', { ascending: false });
        
      if (compError) {
        console.error("Erro ao verificar compensações:", compError);
      } else if (compensations && compensations.length > 0) {
        console.log(`Encontradas ${compensations.length} movimentações recentes de entrada:`);
        compensations.forEach(comp => {
          console.log(`ID: ${comp.id}`);
          console.log(`Quantidade: ${comp.quantity}`);
          console.log(`Data: ${new Date(comp.created_at).toLocaleString()}`);
          console.log(`Observações: ${comp.notes}`);
          console.log('---');
        });
      } else {
        console.log("Nenhuma movimentação de entrada recente encontrada.");
      }
    }
    
    console.log("\n=== TESTE CONCLUÍDO ===");
    
  } catch (err) {
    console.error("Erro durante o teste:", err);
  }
}

// Executar o script
main(); 