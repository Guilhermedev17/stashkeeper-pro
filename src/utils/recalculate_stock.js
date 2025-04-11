import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

// Configuração do ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não encontradas.');
  process.exit(1);
}

// Cliente Supabase com chave de serviço para acesso admin
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Interface para interação com o usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para aguardar confirmação do usuário
function askConfirmation(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim');
    });
  });
}

// Função para converter unidades
function convertQuantity(quantity, fromUnit, toUnit) {
  if (fromUnit === toUnit) {
    return quantity;
  }
  
  // Conversões de peso
  if (fromUnit === 'g' && toUnit === 'kg') {
    return quantity / 1000;
  } else if (fromUnit === 'kg' && toUnit === 'g') {
    return quantity * 1000;
  }
  
  // Conversões de volume
  else if (fromUnit === 'ml' && toUnit === 'l') {
    return quantity / 1000;
  } else if (fromUnit === 'l' && toUnit === 'ml') {
    return quantity * 1000;
  }
  
  // Conversões de comprimento
  else if (fromUnit === 'cm' && toUnit === 'm') {
    return quantity / 100;
  } else if (fromUnit === 'm' && toUnit === 'cm') {
    return quantity * 100;
  }
  
  // Se não for possível converter, retorna o valor original
  console.warn(`⚠️ Aviso: Não foi possível converter de ${fromUnit} para ${toUnit}. Usando valor original.`);
  return quantity;
}

// Função para recalcular o estoque de um produto
async function recalculateProductStock(productId) {
  try {
    // Buscar informações do produto
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (productError) {
      throw new Error(`Erro ao buscar produto ${productId}: ${productError.message}`);
    }
    
    // Buscar todos os movimentos não excluídos
    const { data: movements, error: movementsError } = await supabase
      .from('movements')
      .select('*')
      .eq('product_id', productId)
      .eq('deleted', false)
      .order('created_at', { ascending: true });
    
    if (movementsError) {
      throw new Error(`Erro ao buscar movimentos para produto ${productId}: ${movementsError.message}`);
    }
    
    // Valor inicial
    let calculatedStock = product.initial_quantity || 0;
    
    // Recalcular o estoque considerando todos os movimentos
    for (const movement of movements) {
      // Converter para a unidade do produto se necessário
      const convertedQuantity = convertQuantity(
        movement.quantity,
        movement.unit,
        product.unit
      );
      
      // Aplicar o movimento
      if (movement.type === 'entrada') {
        calculatedStock += convertedQuantity;
      } else if (movement.type === 'saida') {
        calculatedStock -= convertedQuantity;
      }
    }
    
    return {
      id: product.id,
      name: product.name,
      code: product.code,
      currentStock: product.quantity,
      calculatedStock,
      unit: product.unit,
      difference: Math.abs(product.quantity - calculatedStock),
      isConsistent: Math.abs(product.quantity - calculatedStock) < 0.0001,
      movements: movements.length
    };
  } catch (error) {
    console.error(`Erro ao recalcular estoque para produto ${productId}: ${error.message}`);
    return {
      id: productId,
      error: error.message,
      isConsistent: false
    };
  }
}

// Função para atualizar o estoque no banco de dados
async function updateProductStock(productId, newQuantity) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ quantity: newQuantity })
      .eq('id', productId)
      .select('id, name, quantity');
    
    if (error) {
      throw new Error(`Erro ao atualizar produto ${productId}: ${error.message}`);
    }
    
    return data[0];
  } catch (error) {
    console.error(`Erro ao atualizar estoque do produto ${productId}: ${error.message}`);
    return null;
  }
}

// Função principal para verificar e corrigir estoques
async function checkAndFixStocks() {
  console.log('=== UTILITÁRIO DE VERIFICAÇÃO E RECÁLCULO DE ESTOQUE ===\n');
  
  try {
    // Buscar todos os produtos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, code, quantity, unit')
      .order('name');
    
    if (productsError) {
      throw new Error(`Erro ao buscar produtos: ${productsError.message}`);
    }
    
    if (!products || products.length === 0) {
      console.log('Nenhum produto encontrado.');
      return;
    }
    
    console.log(`Encontrados ${products.length} produtos para verificação.\n`);
    
    // Verificar consistência de estoque para cada produto
    console.log('Verificando consistência de estoque...\n');
    
    const results = [];
    let consistentCount = 0;
    let inconsistentCount = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`Verificando produto ${i + 1}/${products.length}: ${product.name}`);
      
      const result = await recalculateProductStock(product.id);
      results.push(result);
      
      if (result.isConsistent) {
        consistentCount++;
      } else {
        inconsistentCount++;
      }
    }
    
    // Exibir resultados da verificação
    console.log('\n=== RESULTADO DA VERIFICAÇÃO DE ESTOQUE ===');
    console.log(`✅ Produtos consistentes: ${consistentCount}`);
    console.log(`❌ Produtos inconsistentes: ${inconsistentCount}`);
    
    if (inconsistentCount > 0) {
      console.log('\nProdutos com inconsistências:');
      
      const inconsistentProducts = results.filter(r => !r.isConsistent && !r.error);
      
      for (const product of inconsistentProducts) {
        console.log(`- ${product.name} (${product.code}):`);
        console.log(`  Estoque atual: ${product.currentStock} ${product.unit}`);
        console.log(`  Estoque calculado: ${product.calculatedStock} ${product.unit}`);
        console.log(`  Diferença: ${product.difference} ${product.unit}`);
        console.log(`  Movimentos: ${product.movements}`);
      }
      
      // Perguntar se deseja corrigir as inconsistências
      const shouldFix = await askConfirmation('\nDeseja corrigir estas inconsistências? (S/N): ');
      
      if (shouldFix) {
        console.log('\nCorrigindo inconsistências de estoque...');
        
        let correctedCount = 0;
        let failedCount = 0;
        
        for (const product of inconsistentProducts) {
          console.log(`Atualizando ${product.name} de ${product.currentStock} para ${product.calculatedStock} ${product.unit}...`);
          
          const updated = await updateProductStock(product.id, product.calculatedStock);
          
          if (updated) {
            console.log(`✅ Produto ${product.name} atualizado com sucesso.`);
            correctedCount++;
          } else {
            console.log(`❌ Falha ao atualizar produto ${product.name}.`);
            failedCount++;
          }
        }
        
        console.log('\n=== RESUMO DA CORREÇÃO ===');
        console.log(`✅ Produtos corrigidos: ${correctedCount}`);
        console.log(`❌ Falhas na correção: ${failedCount}`);
      } else {
        console.log('\nOperação de correção cancelada pelo usuário.');
      }
    } else {
      console.log('\n✨ Todos os produtos estão com estoques consistentes!');
    }
  } catch (error) {
    console.error(`\n❌ ERRO: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Executar a verificação e correção
checkAndFixStocks(); 