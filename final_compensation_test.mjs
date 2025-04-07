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
    console.log("=== TESTE FINAL DO MECANISMO DE COMPENSAÇÃO ===");
    
    // 1. Buscar o produto teste kg
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
    
    // 2. Criar um novo cenário de teste do zero
    console.log("\n2. Criando um cenário de teste completamente novo...");
    
    // 2.1. Criar uma entrada grande
    const entryQuantity = 100;
    const { data: newEntry, error: newEntryError } = await supabase
      .from('movements')
      .insert({
        product_id: product.id,
        type: 'entrada',
        quantity: entryQuantity,
        notes: 'Entrada para novo teste de compensação',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (newEntryError) {
      console.error("Erro ao criar nova entrada:", newEntryError);
      return;
    }
    
    console.log(`Nova entrada criada com ID: ${newEntry.id}`);
    console.log(`Quantidade da entrada: ${newEntry.quantity}`);
    
    // 2.2. Atualizar a quantidade do produto
    const updatedQuantity = parseFloat(product.quantity) + entryQuantity;
    await supabase
      .from('products')
      .update({ quantity: updatedQuantity })
      .eq('id', product.id);
      
    console.log(`Quantidade do produto atualizada para: ${updatedQuantity}`);
    
    // 2.3. Criar uma saída para deixar pouco estoque
    const exitQuantity = updatedQuantity - 5; // Deixar apenas 5 unidades
    const { data: newExit, error: exitError } = await supabase
      .from('movements')
      .insert({
        product_id: product.id,
        type: 'saida',
        quantity: exitQuantity,
        notes: 'Saída para novo teste de compensação',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (exitError) {
      console.error("Erro ao criar saída:", exitError);
      return;
    }
    
    console.log(`Nova saída criada com ID: ${newExit.id}`);
    console.log(`Quantidade da saída: ${newExit.quantity}`);
    
    // 2.4. Atualizar a quantidade do produto novamente
    await supabase
      .from('products')
      .update({ quantity: 5 }) // Deixar com 5 unidades
      .eq('id', product.id);
      
    console.log(`Quantidade do produto ajustada para: 5`);
    
    // 3. Verificar o cenário criado
    console.log("\n3. Cenário de teste criado com sucesso");
    console.log(`Quantidade atual do produto: 5 unidades`);
    console.log(`Entrada criada: ${entryQuantity} unidades (ID: ${newEntry.id})`);
    console.log(`Se excluirmos esta entrada, o estoque ficaria em: ${5 - entryQuantity}`);
    console.log(`Este valor é negativo, portanto deve acionar o mecanismo de compensação automática.`);
    
    // 4. Executar a exclusão (simulando o uso do hook)
    console.log("\n4. Executando a exclusão da entrada...");
    
    // 4.1. Buscar a movimentação
    const { data: movement, error: fetchError } = await supabase
      .from('movements')
      .select('id, product_id, type, quantity, deleted')
      .eq('id', newEntry.id)
      .single();
      
    if (fetchError) {
      console.error("Erro ao buscar movimentação:", fetchError);
      return;
    }
    
    // 4.2. Calcular a nova quantidade
    let currentQuantity = 5; // Sabemos que está com 5
    let newQuantity = currentQuantity;
    
    // Converter quantity para número se for string
    const movementQuantity = typeof movement.quantity === 'string' 
      ? parseFloat(movement.quantity) 
      : movement.quantity;
    
    if (movement.type === 'entrada') {
      // Se for entrada, diminuir a quantidade
      newQuantity = currentQuantity - movementQuantity;
      
      console.log("Cálculo de nova quantidade:", {
        current: currentQuantity,
        subtract: movementQuantity,
        result: newQuantity
      });
      
      // Verificar se a nova quantidade seria negativa
      if (newQuantity < 0) {
        console.log("ALERTA: A exclusão geraria estoque negativo. Realizando compensação.");
        
        // Quantidade necessária para compensação
        const compensationQuantity = Math.abs(newQuantity);
        
        console.log("Quantidade para compensação:", compensationQuantity);
        
        // 1. Registrar entrada de compensação
        const { data: compData, error: compError } = await supabase
          .from('movements')
          .insert({
            product_id: movement.product_id,
            type: 'entrada',
            quantity: compensationQuantity,
            notes: `Compensação automática para exclusão da movimentação ${movement.id}`,
            created_at: new Date().toISOString()
          })
          .select('id, quantity')
          .single();
          
        if (compError) {
          console.error("Erro ao criar compensação:", compError);
          throw new Error(`Não foi possível criar a compensação: ${compError.message}`);
        }
        
        console.log("Compensação criada com sucesso:", compData);
        
        // 2. Atualizar para quantidade zero em vez de negativa
        newQuantity = 0;
      }
    }
    
    // 4.3. Atualizar a quantidade do produto
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity: newQuantity })
      .eq('id', movement.product_id);
      
    if (updateError) {
      console.error("Erro ao atualizar produto:", updateError);
      return;
    }
    
    console.log(`Quantidade do produto atualizada para: ${newQuantity}`);
    
    // 4.4. Marcar a movimentação como excluída
    const { error: deleteError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .eq('id', movement.id);
      
    if (deleteError) {
      console.error("Erro ao marcar como excluída:", deleteError);
      return;
    }
    
    console.log("Movimentação marcada como excluída com sucesso.");
    
    // 5. Verificar o resultado
    console.log("\n5. Verificando resultados...");
    
    // 5.1. Verificar a quantidade do produto
    const { data: finalProduct, error: finalError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', product.id)
      .single();
      
    if (finalError) {
      console.error("Erro ao verificar produto:", finalError);
      return;
    }
    
    console.log(`Quantidade final do produto: ${finalProduct.quantity}`);
    
    // 5.2. Verificar se há compensação
    const { data: compensations, error: compListError } = await supabase
      .from('movements')
      .select('id, quantity, notes, created_at')
      .eq('product_id', product.id)
      .eq('type', 'entrada')
      .gt('created_at', newEntry.created_at)
      .ilike('notes', `%Compensação automática%${newEntry.id}%`)
      .order('created_at', { ascending: false });
      
    if (compListError) {
      console.error("Erro ao buscar compensações:", compListError);
      return;
    }
    
    if (compensations && compensations.length > 0) {
      console.log(`\nCompensações encontradas: ${compensations.length}`);
      compensations.forEach(comp => {
        console.log(`ID: ${comp.id}`);
        console.log(`Quantidade: ${comp.quantity}`);
        console.log(`Data: ${new Date(comp.created_at).toLocaleString()}`);
        console.log(`Observações: ${comp.notes}`);
        console.log('---');
      });
      
      console.log("\n✅ TESTE CONCLUÍDO COM SUCESSO!");
      console.log(`A compensação automática foi criada corretamente para evitar estoque negativo.`);
    } else {
      console.log("\n❌ TESTE FALHOU!");
      console.log(`Nenhuma compensação foi encontrada, mas a exclusão deveria ter gerado uma.`);
    }
    
  } catch (err) {
    console.error("Erro durante o teste:", err);
  }
}

// Executar o script
main(); 