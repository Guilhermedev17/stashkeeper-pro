import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

// Criar cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Função que implementa a lógica de deleteMovement
async function deleteMovementWithCompensation(id) {
  try {
    console.log(`[TEST] Tentando excluir movimentação ${id}`);
    
    // 1. Buscar a movimentação para obter informações antes de excluir
    const { data: movementData, error: fetchError } = await supabase
      .from('movements')
      .select('id, product_id, type, quantity, deleted')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error("[TEST] Erro ao buscar detalhes da movimentação:", fetchError);
      throw new Error(`Não foi possível buscar a movimentação: ${fetchError.message}`);
    }
    
    if (!movementData) {
      console.error("[TEST] Movimentação não encontrada:", id);
      throw new Error('Movimentação não encontrada');
    }

    // Verificar se já está excluída
    if (movementData.deleted) {
      console.log("[TEST] Movimentação já está marcada como excluída:", id);
      return { success: true };
    }
    
    console.log("[TEST] Detalhes da movimentação:", movementData);
    
    // 2. Buscar a quantidade atual do produto
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', movementData.product_id)
      .single();
    
    if (productError) {
      console.error("[TEST] Erro ao buscar produto:", productError);
      throw new Error(`Não foi possível buscar o produto: ${productError.message}`);
    }
    
    // 3. Calcular a nova quantidade do produto
    let currentQuantity = productData.quantity || 0;
    let newQuantity = currentQuantity;
    
    // Converter quantity para número se for string após alteração para DECIMAL
    const movementQuantity = typeof movementData.quantity === 'string' 
      ? parseFloat(movementData.quantity) 
      : movementData.quantity;
    
    if (movementData.type === 'entrada') {
      // Se for entrada, diminuir a quantidade
      newQuantity = currentQuantity - movementQuantity;
      
      console.log("[TEST] Cálculo de nova quantidade:", {
        current: currentQuantity,
        subtract: movementQuantity,
        result: newQuantity
      });
      
      // Verificar se a nova quantidade seria negativa
      if (newQuantity < 0) {
        console.log("[TEST] ALERTA: A exclusão geraria estoque negativo. Realizando compensação.");
        
        // Quantidade necessária para compensação (apenas o que faltaria para zerar)
        const compensationQuantity = Math.abs(newQuantity);
        
        console.log("[TEST] Quantidade para compensação:", compensationQuantity);
        
        // 1. Registrar entrada de compensação
        const { data: compData, error: compError } = await supabase
          .from('movements')
          .insert({
            product_id: movementData.product_id,
            type: 'entrada',
            quantity: compensationQuantity,
            notes: `Compensação automática para exclusão da movimentação ${id}`,
            created_at: new Date().toISOString()
          })
          .select('id, quantity')
          .single();
          
        if (compError) {
          console.error("[TEST] Erro ao criar compensação:", compError);
          throw new Error(`Não foi possível criar a compensação: ${compError.message}`);
        }
        
        console.log("[TEST] Compensação criada com sucesso:", compData);
        
        // 2. Atualizar para quantidade zero em vez de negativa
        newQuantity = 0;
      }
    } else {
      // Se for saída, aumentar a quantidade
      newQuantity = currentQuantity + movementQuantity;
      
      console.log("[TEST] Cálculo de nova quantidade para saída:", {
        current: currentQuantity,
        add: movementQuantity,
        result: newQuantity
      });
    }
    
    // 4. Atualizar o produto
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity: newQuantity })
      .eq('id', movementData.product_id);
    
    if (updateError) {
      console.error("[TEST] Erro ao atualizar produto:", updateError);
      throw new Error(`Não foi possível atualizar o produto: ${updateError.message}`);
    }
    
    console.log("[TEST] Quantidade do produto atualizada para:", newQuantity);
    
    // 5. Marcar a movimentação como excluída (soft delete)
    console.log("[TEST] Marcando movimentação como excluída:", id);
    const { error: deleteError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .eq('id', id);
    
    if (deleteError) {
      console.error("[TEST] Erro ao marcar movimentação como excluída:", deleteError);
      // Reverter a alteração da quantidade do produto em caso de erro
      await supabase
        .from('products')
        .update({ quantity: currentQuantity })
        .eq('id', movementData.product_id);
        
      throw new Error(`Não foi possível excluir a movimentação: ${deleteError.message}`);
    }
    
    console.log("[TEST] Movimentação excluída com sucesso:", id);
    return { success: true };
  } catch (err) {
    console.error("[TEST] Erro ao excluir movimentação:", err);
    return { success: false, error: err.message };
  }
}

// Função principal
async function main() {
  try {
    console.log("=== TESTE DO MECANISMO DE COMPENSAÇÃO AUTOMÁTICA ===");
    
    // 1. Executar a simulação de criação de movimentação
    console.log("\n1. Criando cenário de teste...");
    
    // Buscar o produto teste kg
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
    
    // Criar uma entrada grande
    const entryQuantity = 50;
    const { data: entryData, error: entryError } = await supabase
      .from('movements')
      .insert({
        product_id: product.id,
        type: 'entrada',
        quantity: entryQuantity,
        notes: 'Entrada para teste direto de compensação',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (entryError) {
      console.error("Erro ao registrar entrada:", entryError);
      return;
    }
    
    console.log(`\nEntrada registrada com ID: ${entryData.id}`);
    
    // Atualizar o produto
    const newQuantity = product.quantity + entryQuantity;
    await supabase
      .from('products')
      .update({ quantity: newQuantity })
      .eq('id', product.id);
      
    // Registrar saída para deixar pouco estoque
    const exitQuantity = newQuantity - 5; // Deixar apenas 5 unidades
    await supabase
      .from('movements')
      .insert({
        product_id: product.id,
        type: 'saida',
        quantity: exitQuantity,
        notes: 'Saída para teste direto de compensação',
        created_at: new Date().toISOString()
      });
      
    // Atualizar o produto novamente
    await supabase
      .from('products')
      .update({ quantity: 5 }) // Deixar com 5 unidades
      .eq('id', product.id);
      
    console.log(`\nCenário criado com sucesso. Estoque atual: 5 unidades`);
    console.log(`Se a entrada de ${entryQuantity} unidades for excluída, o estoque ficaria em: ${5 - entryQuantity}`);
    
    // 2. Chamar função de exclusão com compensação
    console.log("\n2. Executando teste de exclusão com compensação...");
    const result = await deleteMovementWithCompensation(entryData.id);
    
    console.log("Resultado:", result);
    
    // 3. Verificar resultado
    console.log("\n3. Verificando resultados...");
    
    // Verificar produto
    const { data: updatedProduct } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', product.id)
      .single();
      
    console.log(`Quantidade atual do produto: ${updatedProduct.quantity}`);
    
    // Verificar se a movimentação foi marcada como excluída
    const { data: checkMovement } = await supabase
      .from('movements')
      .select('deleted')
      .eq('id', entryData.id)
      .single();
      
    console.log(`A movimentação foi marcada como excluída: ${checkMovement.deleted ? 'Sim' : 'Não'}`);
    
    // Verificar se existe uma movimentação de compensação
    const { data: compensations } = await supabase
      .from('movements')
      .select('id, quantity, notes, created_at')
      .eq('product_id', product.id)
      .eq('type', 'entrada')
      .ilike('notes', `%Compensação automática%${entryData.id}%`)
      .order('created_at', { ascending: false });
      
    if (compensations && compensations.length > 0) {
      console.log(`\nEncontrada compensação:`);
      console.log(`ID: ${compensations[0].id}`);
      console.log(`Quantidade: ${compensations[0].quantity}`);
      console.log(`Data: ${new Date(compensations[0].created_at).toLocaleString()}`);
      console.log(`Observações: ${compensations[0].notes}`);
    } else {
      console.log("\nNenhuma compensação encontrada.");
    }
    
    console.log("\n=== TESTE CONCLUÍDO ===");
    
  } catch (err) {
    console.error("Erro durante o teste:", err);
  }
}

// Executar o script
main(); 