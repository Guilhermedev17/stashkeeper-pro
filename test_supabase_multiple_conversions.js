import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuração do ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não encontradas.');
  process.exit(1);
}

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função de utilidade para esperar um tempo específico
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para formatar valores numéricos
function formatNumber(value) {
  return Number(value).toFixed(4);
}

// Cenários de teste para diferentes tipos de conversão
const conversionScenarios = [
  {
    name: 'Peso - kg para g',
    productUnit: 'kg',
    initialQuantity: 10,
    movements: [
      { type: 'entrada', quantity: 500, unit: 'g', expectedConversion: 0.5 },
      { type: 'saida', quantity: 2500, unit: 'g', expectedConversion: 2.5 },
    ]
  },
  {
    name: 'Volume - l para ml',
    productUnit: 'l',
    initialQuantity: 20,
    movements: [
      { type: 'entrada', quantity: 750, unit: 'ml', expectedConversion: 0.75 },
      { type: 'saida', quantity: 1500, unit: 'ml', expectedConversion: 1.5 },
    ]
  },
  {
    name: 'Comprimento - m para cm',
    productUnit: 'm',
    initialQuantity: 30,
    movements: [
      { type: 'entrada', quantity: 80, unit: 'cm', expectedConversion: 0.8 },
      { type: 'saida', quantity: 120, unit: 'cm', expectedConversion: 1.2 },
    ]
  },
  {
    name: 'Peso - g para kg',
    productUnit: 'g',
    initialQuantity: 5000,
    movements: [
      { type: 'entrada', quantity: 2.5, unit: 'kg', expectedConversion: 2500 },
      { type: 'saida', quantity: 1.8, unit: 'kg', expectedConversion: 1800 },
    ]
  },
  {
    name: 'Volume - ml para l',
    productUnit: 'ml',
    initialQuantity: 3000,
    movements: [
      { type: 'entrada', quantity: 1.2, unit: 'l', expectedConversion: 1200 },
      { type: 'saida', quantity: 0.8, unit: 'l', expectedConversion: 800 },
    ]
  },
  {
    name: 'Comprimento - cm para m',
    productUnit: 'cm',
    initialQuantity: 150,
    movements: [
      { type: 'entrada', quantity: 1.5, unit: 'm', expectedConversion: 150 },
      { type: 'saida', quantity: 0.6, unit: 'm', expectedConversion: 60 },
    ]
  }
];

// Testar um cenário específico de conversão
async function testConversionScenario(scenario) {
  console.log(`\n==== Testando Cenário: ${scenario.name} ====`);
  
  try {
    // Criar produto de teste
    const productName = `Produto Teste ${scenario.name} ${new Date().getTime()}`;
    const productData = {
      name: productName,
      code: `TEST-${Math.floor(Math.random() * 10000)}`,
      unit: scenario.productUnit,
      quantity: scenario.initialQuantity
      // Removido o campo min_stock que não existe na tabela
    };
    
    console.log(`Criando produto de teste "${productName}" com unidade ${scenario.productUnit}...`);
    
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
    
    if (productError) {
      throw new Error(`Erro ao criar produto: ${productError.message}`);
    }
    
    console.log(`✓ Produto criado com sucesso: ${product.name}, ID: ${product.id}`);
    console.log(`  Quantidade inicial: ${product.quantity} ${product.unit}`);
    
    let currentQuantity = Number(product.quantity);
    
    // Registrar movimentações
    for (let i = 0; i < scenario.movements.length; i++) {
      const movement = scenario.movements[i];
      console.log(`\nRegistrando ${movement.type} de ${movement.quantity} ${movement.unit}...`);
      
      const movementData = {
        product_id: product.id,
        type: movement.type,
        quantity: movement.quantity,
        unit: movement.unit,
        notes: `Teste de ${movement.type} em ${movement.unit} para produto em ${product.unit}`
      };
      
      const { data: newMovement, error: movementError } = await supabase
        .from('movements')
        .insert(movementData)
        .select()
        .single();
      
      if (movementError) {
        throw new Error(`Erro ao registrar movimento: ${movementError.message}`);
      }
      
      // Verificar se o estoque foi atualizado corretamente
      await sleep(1000); // Aguardar o trigger ser executado
      
      const { data: updatedProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .single();
      
      if (fetchError) {
        throw new Error(`Erro ao buscar produto atualizado: ${fetchError.message}`);
      }
      
      // Calcular a quantidade esperada
      let expectedQuantity;
      if (movement.type === 'entrada') {
        expectedQuantity = currentQuantity + movement.expectedConversion;
      } else {
        expectedQuantity = currentQuantity - movement.expectedConversion;
      }
      
      console.log(`✓ Movimento registrado: ${newMovement.quantity} ${newMovement.unit}`);
      console.log(`  Estoque atualizado: ${updatedProduct.quantity} ${updatedProduct.unit}`);
      console.log(`  Esperado: ${formatNumber(expectedQuantity)} ${product.unit}`);
      
      const isConversionCorrect = Math.abs(updatedProduct.quantity - expectedQuantity) < 0.0001;
      if (!isConversionCorrect) {
        console.error(`✗ Teste falhou: Conversão de unidades não funcionou corretamente`);
        console.error(`  Diferença: ${Math.abs(updatedProduct.quantity - expectedQuantity)}`);
      } else {
        console.log(`✓ Teste passou: Conversão de unidades funcionou corretamente`);
      }
      
      // Atualizar a quantidade atual para o próximo teste
      currentQuantity = Number(updatedProduct.quantity);
    }
    
    // Limpeza - remover produto e movimentos de teste
    console.log('\nLimpando dados de teste...');
    
    const { error: deleteMovementsError } = await supabase
      .from('movements')
      .delete()
      .eq('product_id', product.id);
    
    if (deleteMovementsError) {
      console.warn(`Aviso: Não foi possível excluir movimentos: ${deleteMovementsError.message}`);
    }
    
    const { error: deleteProductError } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);
    
    if (deleteProductError) {
      console.warn(`Aviso: Não foi possível excluir produto: ${deleteProductError.message}`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`Erro durante o teste do cenário ${scenario.name}: ${error.message}`);
    return false;
  }
}

// Testar todas as variações de conversão
async function runAllConversionTests() {
  console.log('Iniciando testes de conversão de unidades no Supabase');
  
  const results = {
    total: conversionScenarios.length,
    passed: 0,
    failed: 0
  };
  
  for (const scenario of conversionScenarios) {
    const success = await testConversionScenario(scenario);
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // Exibir resumo final
  console.log('\n======= Resumo dos Testes de Conversão =======');
  console.log(`Total de cenários: ${results.total}`);
  console.log(`Cenários bem-sucedidos: ${results.passed}`);
  console.log(`Cenários com falha: ${results.failed}`);
  console.log('==============================================');
}

// Executar os testes
runAllConversionTests(); 