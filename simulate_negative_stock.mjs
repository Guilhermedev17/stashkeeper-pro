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
    console.log("=== SIMULAÇÃO DE CENÁRIO QUE CAUSARIA ESTOQUE NEGATIVO ===");
    
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
    
    // 2. Registrar uma entrada grande (por exemplo, 50 unidades)
    const entryQuantity = 50;
    console.log(`\n2. Registrando entrada de ${entryQuantity} unidades...`);
    
    const { data: entryData, error: entryError } = await supabase
      .from('movements')
      .insert({
        product_id: product.id,
        type: 'entrada',
        quantity: entryQuantity,
        notes: 'Entrada para teste de compensação automática',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (entryError) {
      console.error("Erro ao registrar entrada:", entryError);
      return;
    }
    
    console.log(`Entrada registrada com ID: ${entryData.id}`);
    
    // 3. Atualizar a quantidade do produto
    const newQuantity = product.quantity + entryQuantity;
    console.log(`\n3. Atualizando quantidade do produto para ${newQuantity}...`);
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity: newQuantity })
      .eq('id', product.id);
      
    if (updateError) {
      console.error("Erro ao atualizar produto:", updateError);
      return;
    }
    
    console.log("Quantidade do produto atualizada com sucesso.");
    
    // 4. Registrar uma saída grande (quase todo o estoque)
    const exitQuantity = newQuantity - 5; // Deixar apenas 5 unidades em estoque
    console.log(`\n4. Registrando saída de ${exitQuantity} unidades...`);
    
    const { data: exitData, error: exitError } = await supabase
      .from('movements')
      .insert({
        product_id: product.id,
        type: 'saida',
        quantity: exitQuantity,
        notes: 'Saída para teste de compensação automática',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (exitError) {
      console.error("Erro ao registrar saída:", exitError);
      return;
    }
    
    console.log(`Saída registrada com ID: ${exitData.id}`);
    
    // 5. Atualizar a quantidade do produto
    const finalQuantity = newQuantity - exitQuantity;
    console.log(`\n5. Atualizando quantidade do produto para ${finalQuantity}...`);
    
    const { error: updateError2 } = await supabase
      .from('products')
      .update({ quantity: finalQuantity })
      .eq('id', product.id);
      
    if (updateError2) {
      console.error("Erro ao atualizar produto após saída:", updateError2);
      return;
    }
    
    console.log("Quantidade do produto atualizada com sucesso.");
    
    // 6. Verificar a quantidade atual
    console.log("\n6. Verificando quantidade atual do produto...");
    
    const { data: currentProduct, error: currentError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', product.id)
      .single();
      
    if (currentError) {
      console.error("Erro ao verificar produto:", currentError);
      return;
    }
    
    console.log(`Quantidade atual: ${currentProduct.quantity}`);
    
    // 7. Mostrar as informações para o teste de exclusão
    console.log("\n=== INFORMAÇÕES PARA TESTE DE EXCLUSÃO ===");
    console.log(`ID da entrada criada: ${entryData.id}`);
    console.log(`Quantidade da entrada: ${entryQuantity}`);
    console.log(`Quantidade atual do produto: ${currentProduct.quantity}`);
    console.log(`Se você excluir a entrada de ${entryQuantity} unidades, o estoque ficaria em: ${currentProduct.quantity - entryQuantity}`);
    console.log("Este valor é negativo, portanto deve acionar o mecanismo de compensação automática.");
    console.log("\nPara testar, execute o seguinte comando:");
    console.log(`node test_delete_with_compensation.mjs`);
    
    console.log("\n=== SIMULAÇÃO CONCLUÍDA ===");
    
  } catch (err) {
    console.error("Erro durante a simulação:", err);
  }
}

// Executar o script
main(); 