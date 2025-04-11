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

// Função para aguardar entrada do usuário
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

// Função para aguardar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      movements: movements.length,
      isNegative: calculatedStock < 0
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

// Função para adicionar movimento de ajuste para estoque negativo
async function addAdjustmentMovement(productId, currentQuantity, unit) {
  try {
    // Calcular o ajuste necessário
    const adjustmentQuantity = Math.abs(currentQuantity) + 1; // +1 para garantir saldo positivo
    
    // Criar movimento de ajuste
    const { data, error } = await supabase
      .from('movements')
      .insert({
        product_id: productId,
        type: 'entrada',
        quantity: adjustmentQuantity,
        unit,
        notes: 'Ajuste automático para compensar estoque negativo (utilitário de correção)'
      })
      .select();
    
    if (error) {
      throw new Error(`Erro ao criar movimento de ajuste: ${error.message}`);
    }
    
    // Aguardar processamento do trigger
    await sleep(1000);
    
    return {
      success: true,
      adjustmentQuantity,
      movementId: data[0].id
    };
  } catch (error) {
    console.error(`Erro ao adicionar movimento de ajuste: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Função para atualizar manualmente o estoque no banco de dados
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
    
    return { success: true, data: data[0] };
  } catch (error) {
    console.error(`Erro ao atualizar estoque do produto ${productId}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Função para corrigir um estoque de produto específico
async function fixSingleProductStock(productId) {
  console.log(`\n=== CORREÇÃO DE ESTOQUE PARA PRODUTO ESPECÍFICO ===`);
  
  // Recalcular o estoque
  const result = await recalculateProductStock(productId);
  
  if (result.error) {
    console.error(`Erro ao recalcular estoque: ${result.error}`);
    return { success: false, error: result.error };
  }
  
  console.log(`\nProduto: ${result.name} (${result.code})`);
  console.log(`Estoque atual: ${result.currentStock} ${result.unit}`);
  console.log(`Estoque calculado: ${result.calculatedStock} ${result.unit}`);
  
  if (result.isConsistent) {
    console.log(`\n✅ Estoque já está consistente!`);
    return { success: true, noChangeNeeded: true };
  }
  
  console.log(`Diferença: ${result.difference} ${result.unit}`);
  
  // Se o estoque calculado for negativo
  if (result.isNegative) {
    console.log(`\n⚠️ Estoque calculado é negativo!`);
    
    // Perguntar como tratar o estoque negativo
    console.log(`\nOpções para tratar estoque negativo:`);
    console.log(`1. Adicionar movimento de entrada de ajuste [recomendado]`);
    console.log(`2. Forçar estoque para o valor calculado negativo`);
    console.log(`3. Forçar estoque para zero`);
    
    const option = await askQuestion(`\nEscolha uma opção (1-3): `);
    
    if (option === '1') {
      console.log(`\nAdicionando movimento de ajuste...`);
      const adjustment = await addAdjustmentMovement(result.id, result.calculatedStock, result.unit);
      
      if (adjustment.success) {
        console.log(`✅ Movimento de ajuste adicionado: +${adjustment.adjustmentQuantity} ${result.unit}`);
        console.log(`Novo estoque esperado: ${result.calculatedStock + adjustment.adjustmentQuantity} ${result.unit}`);
        
        // Verificar o estoque atualizado
        await sleep(1000);
        const updatedResult = await recalculateProductStock(productId);
        
        if (updatedResult.error) {
          console.error(`Erro ao verificar estoque atualizado: ${updatedResult.error}`);
        } else {
          console.log(`Estoque atual após ajuste: ${updatedResult.currentStock} ${updatedResult.unit}`);
        }
        
        return { success: true, adjustmentAdded: true };
      } else {
        console.error(`❌ Falha ao adicionar movimento de ajuste: ${adjustment.error}`);
        return { success: false, error: adjustment.error };
      }
    } else if (option === '2') {
      console.log(`\nForçando estoque para valor negativo: ${result.calculatedStock} ${result.unit}`);
      const update = await updateProductStock(result.id, result.calculatedStock);
      
      if (update.success) {
        console.log(`✅ Estoque atualizado com sucesso!`);
        return { success: true, manualUpdate: true };
      } else {
        console.error(`❌ Falha ao atualizar estoque: ${update.error}`);
        return { success: false, error: update.error };
      }
    } else if (option === '3') {
      console.log(`\nForçando estoque para zero.`);
      const update = await updateProductStock(result.id, 0);
      
      if (update.success) {
        console.log(`✅ Estoque zerado com sucesso!`);
        return { success: true, manualZero: true };
      } else {
        console.error(`❌ Falha ao zerar estoque: ${update.error}`);
        return { success: false, error: update.error };
      }
    } else {
      console.log(`\n❌ Opção inválida. Nenhuma alteração realizada.`);
      return { success: false, error: 'Opção inválida' };
    }
  } else {
    // Se o estoque calculado for positivo, apenas atualizar
    const shouldUpdate = await askConfirmation(`\nDeseja atualizar o estoque para ${result.calculatedStock} ${result.unit}? (S/N): `);
    
    if (shouldUpdate) {
      console.log(`\nAtualizando estoque...`);
      const update = await updateProductStock(result.id, result.calculatedStock);
      
      if (update.success) {
        console.log(`✅ Estoque atualizado com sucesso!`);
        return { success: true, updated: true };
      } else {
        console.error(`❌ Falha ao atualizar estoque: ${update.error}`);
        return { success: false, error: update.error };
      }
    } else {
      console.log(`\nOperação cancelada pelo usuário.`);
      return { success: false, canceled: true };
    }
  }
}

// Função para verificar e corrigir todos os estoques
async function checkAndFixAllStocks() {
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
    let negativeCount = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`Verificando produto ${i + 1}/${products.length}: ${product.name}`);
      
      const result = await recalculateProductStock(product.id);
      results.push(result);
      
      if (result.isConsistent) {
        consistentCount++;
      } else {
        inconsistentCount++;
        if (result.isNegative) {
          negativeCount++;
        }
      }
    }
    
    // Exibir resultados da verificação
    console.log('\n=== RESULTADO DA VERIFICAÇÃO DE ESTOQUE ===');
    console.log(`✅ Produtos consistentes: ${consistentCount}`);
    console.log(`❌ Produtos inconsistentes: ${inconsistentCount}`);
    console.log(`⚠️ Produtos com estoque negativo: ${negativeCount}`);
    
    if (inconsistentCount > 0) {
      console.log('\nProdutos com inconsistências:');
      
      const inconsistentProducts = results.filter(r => !r.isConsistent && !r.error);
      
      for (const product of inconsistentProducts) {
        const negativeIndicator = product.isNegative ? '⚠️ NEGATIVO' : '';
        console.log(`- ${product.name} (${product.code}): ${negativeIndicator}`);
        console.log(`  Estoque atual: ${product.currentStock} ${product.unit}`);
        console.log(`  Estoque calculado: ${product.calculatedStock} ${product.unit}`);
        console.log(`  Diferença: ${product.difference} ${product.unit}`);
        console.log(`  Movimentos: ${product.movements}`);
      }
      
      // Perguntar se deseja corrigir as inconsistências em massa
      const fixMode = await askQuestion('\nOpções de correção:\n1. Corrigir todas as inconsistências automaticamente\n2. Corrigir produtos um por um\n3. Cancelar\n\nEscolha uma opção (1-3): ');
      
      if (fixMode === '1') {
        console.log('\n=== CORREÇÃO AUTOMÁTICA DE ESTOQUES ===');
        
        let correctedCount = 0;
        let failedCount = 0;
        let adjustedCount = 0;
        
        for (const product of inconsistentProducts) {
          console.log(`\nProcessando ${product.name}...`);
          
          // Para estoques negativos, adicionar movimento de ajuste
          if (product.isNegative) {
            console.log(`⚠️ Estoque negativo detectado: ${product.calculatedStock} ${product.unit}`);
            console.log(`Adicionando movimento de ajuste...`);
            
            const adjustment = await addAdjustmentMovement(product.id, product.calculatedStock, product.unit);
            
            if (adjustment.success) {
              console.log(`✅ Ajuste adicionado: +${adjustment.adjustmentQuantity} ${product.unit}`);
              adjustedCount++;
              correctedCount++;
            } else {
              console.error(`❌ Falha no ajuste: ${adjustment.error}`);
              failedCount++;
            }
          } else {
            // Para estoques positivos, atualizar diretamente
            console.log(`Atualizando de ${product.currentStock} para ${product.calculatedStock} ${product.unit}...`);
            
            const update = await updateProductStock(product.id, product.calculatedStock);
            
            if (update.success) {
              console.log(`✅ Atualizado com sucesso!`);
              correctedCount++;
            } else {
              console.error(`❌ Falha na atualização: ${update.error}`);
              failedCount++;
            }
          }
        }
        
        console.log('\n=== RESUMO DA CORREÇÃO AUTOMÁTICA ===');
        console.log(`✅ Produtos corrigidos: ${correctedCount}`);
        console.log(`⚠️ Produtos com ajustes para estoque negativo: ${adjustedCount}`);
        console.log(`❌ Falhas na correção: ${failedCount}`);
      } else if (fixMode === '2') {
        console.log('\n=== CORREÇÃO MANUAL PRODUTO A PRODUTO ===');
        
        let correctedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        
        for (const product of inconsistentProducts) {
          console.log(`\n-----------------------------------------------`);
          console.log(`Produto: ${product.name} (${product.code})`);
          console.log(`Estoque atual: ${product.currentStock} ${product.unit}`);
          console.log(`Estoque calculado: ${product.calculatedStock} ${product.unit}`);
          console.log(`Diferença: ${product.difference} ${product.unit}`);
          
          const shouldFix = await askConfirmation(`Deseja corrigir este produto? (S/N): `);
          
          if (shouldFix) {
            const result = await fixSingleProductStock(product.id);
            
            if (result.success) {
              correctedCount++;
            } else if (result.canceled) {
              skippedCount++;
            } else {
              failedCount++;
            }
          } else {
            console.log(`Produto pulado.`);
            skippedCount++;
          }
        }
        
        console.log('\n=== RESUMO DA CORREÇÃO MANUAL ===');
        console.log(`✅ Produtos corrigidos: ${correctedCount}`);
        console.log(`⏩ Produtos pulados: ${skippedCount}`);
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

// Função para procurar produto pelo nome ou código
async function searchProduct() {
  console.log('=== PESQUISA DE PRODUTO ===\n');
  
  const searchTerm = await askQuestion('Digite o nome ou código do produto: ');
  
  if (!searchTerm || searchTerm.trim() === '') {
    console.log('Termo de pesquisa vazio. Operação cancelada.');
    return null;
  }
  
  try {
    // Pesquisar por nome ou código
    const { data, error } = await supabase
      .from('products')
      .select('id, name, code, quantity, unit')
      .or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
      .order('name');
    
    if (error) {
      throw new Error(`Erro na pesquisa: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('Nenhum produto encontrado com este termo.');
      return null;
    }
    
    // Mostrar resultados
    console.log(`\nResultados encontrados: ${data.length}`);
    
    for (let i = 0; i < data.length; i++) {
      const product = data[i];
      console.log(`${i + 1}. ${product.name} (${product.code}) - Estoque: ${product.quantity} ${product.unit}`);
    }
    
    // Se houver muitos resultados, perguntar qual corrigir
    if (data.length === 1) {
      return data[0].id;
    } else if (data.length > 1) {
      const selection = await askQuestion('\nSelecione o número do produto para corrigir (ou 0 para cancelar): ');
      const index = parseInt(selection, 10) - 1;
      
      if (index >= 0 && index < data.length) {
        return data[index].id;
      } else {
        console.log('Seleção inválida ou cancelada.');
        return null;
      }
    }
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    return null;
  }
}

// Menu principal
async function mainMenu() {
  console.log('\n=== UTILITÁRIO DE GERENCIAMENTO DE ESTOQUE ===');
  console.log('1. Verificar e corrigir todos os estoques');
  console.log('2. Corrigir um produto específico');
  console.log('3. Sair');
  
  const option = await askQuestion('\nEscolha uma opção (1-3): ');
  
  switch (option) {
    case '1':
      await checkAndFixAllStocks();
      break;
    case '2':
      const productId = await searchProduct();
      if (productId) {
        await fixSingleProductStock(productId);
      }
      break;
    case '3':
      console.log('\nEncerrando utilitário...');
      break;
    default:
      console.log('\nOpção inválida. Tente novamente.');
      await mainMenu();
      break;
  }
}

// Executar o menu principal
mainMenu()
  .then(() => rl.close())
  .catch(error => {
    console.error(`\n❌ ERRO FATAL: ${error.message}`);
    rl.close();
    process.exit(1);
  }); 