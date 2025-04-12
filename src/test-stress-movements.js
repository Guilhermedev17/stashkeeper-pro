// Script para teste de estresse de movimentações consecutivas
// Deve ser executado com: node src/test-stress-movements.js

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase - usando a chave de serviço fornecida
const supabaseUrl = "https://nugerdxawqqxpfjrtikh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2VyZHhhd3FxeHBmanJ0aWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjg1OTAwNywiZXhwIjoyMDU4NDM1MDA3fQ.LoOzortwYrVj6Vma37SGcqtRFlmmR7OrK1gm4RzWIww";
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para obter a lista de produtos com estoque suficiente
async function getProductsWithStock(minStock = 30) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, code, quantity, unit')
    .gt('quantity', minStock)
    .order('name', { ascending: true })
    .limit(5);
  
  if (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
  
  return data;
}

// Função para obter um produto específico
async function getProduct(productId) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, code, quantity, unit')
    .eq('id', productId)
    .single();
  
  if (error) {
    console.error('Erro ao buscar produto:', error);
    return null;
  }
  
  return data;
}

// Função para obter a lista de colaboradores ativos
async function getActiveEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name')
    .eq('status', 'active')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Erro ao buscar colaboradores:', error);
    return [];
  }
  
  return data;
}

// Função para registrar uma saída de produto
async function registerOutput(productId, quantity, employeeId, unit) {
  const { data, error } = await supabase
    .from('movements')
    .insert({
      product_id: productId,
      type: 'saida',
      quantity: quantity,
      employee_id: employeeId,
      notes: 'Teste de estresse - saída',
      unit: unit
    });
  
  if (error) {
    console.error('Erro ao registrar saída:', error);
    return false;
  }
  
  return true;
}

// Função para registrar uma entrada de produto
async function registerInput(productId, quantity, unit) {  
  const { data, error } = await supabase
    .from('movements')
    .insert({
      product_id: productId,
      type: 'entrada',
      quantity: quantity,
      notes: 'Teste de estresse - entrada',
      unit: unit
    });
  
  if (error) {
    console.error('Erro ao registrar entrada:', error);
    return false;
  }
  
  return true;
}

// Função para esperar um tempo determinado
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal de teste de estresse
async function testStressMovements() {
  console.log('=== INICIANDO TESTE DE ESTRESSE DE MOVIMENTAÇÕES ===');
  
  // 1. Buscar produtos com estoque suficiente
  const products = await getProductsWithStock(30);
  if (products.length === 0) {
    console.error('Nenhum produto com estoque suficiente encontrado para teste.');
    return;
  }
  
  console.log(`\n=== PRODUTOS SELECIONADOS PARA TESTE (${products.length}) ===`);
  products.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name} (${product.code}) - Estoque: ${product.quantity} ${product.unit}`);
  });
  
  // 2. Buscar colaboradores ativos
  const employees = await getActiveEmployees();
  if (employees.length === 0) {
    console.error('Nenhum colaborador ativo encontrado para teste.');
    return;
  }
  
  const testEmployee = employees[0];
  console.log(`\n=== COLABORADOR SELECIONADO PARA TESTE ===`);
  console.log(`Nome: ${testEmployee.name}`);
  console.log(`ID: ${testEmployee.id}`);
  
  // 3. Definir parâmetros do teste
  const numOperations = 10; // Número de operações por produto
  const operationDelay = 100; // Delay entre operações (ms)
  
  console.log(`\n=== PARÂMETROS DO TESTE ===`);
  console.log(`Número de produtos: ${products.length}`);
  console.log(`Número de operações por produto: ${numOperations}`);
  console.log(`Total de operações: ${products.length * numOperations}`);
  console.log(`Delay entre operações: ${operationDelay}ms`);
  
  // Rastrear resultados do teste
  const results = {
    total: 0,
    success: 0,
    failures: 0,
    productResults: {}
  };
  
  // 4. Executar operações para cada produto
  for (const product of products) {
    console.log(`\n=== TESTANDO PRODUTO: ${product.name} ===`);
    
    // Armazenar estoque inicial
    const initialStock = product.quantity;
    console.log(`Estoque inicial: ${initialStock} ${product.unit}`);
    
    results.productResults[product.id] = {
      name: product.name,
      initialStock,
      operations: [],
      finalStock: null,
      expectedStock: initialStock,
      success: false
    };
    
    // Executar operações alternadas de entrada e saída
    for (let i = 0; i < numOperations; i++) {
      const isOutput = i % 2 === 0; // Alternar entre saída e entrada
      const operationType = isOutput ? 'saida' : 'entrada';
      const quantity = isOutput ? 1 : 2; // Saída = 1, Entrada = 2 (para garantir que o estoque nunca fique negativo)
      
      results.total++;
      
      try {
        let success;
        if (isOutput) {
          success = await registerOutput(product.id, quantity, testEmployee.id, product.unit);
          if (success) {
            results.productResults[product.id].expectedStock -= quantity;
          }
        } else {
          success = await registerInput(product.id, quantity, product.unit);
          if (success) {
            results.productResults[product.id].expectedStock += quantity;
          }
        }
        
        results.productResults[product.id].operations.push({
          type: operationType,
          quantity,
          success
        });
        
        if (success) {
          console.log(`✅ Operação ${i+1}/${numOperations}: ${operationType.toUpperCase()} de ${quantity} ${product.unit} - OK`);
          results.success++;
        } else {
          console.error(`❌ Operação ${i+1}/${numOperations}: ${operationType.toUpperCase()} de ${quantity} ${product.unit} - FALHA`);
          results.failures++;
        }
        
        // Aguardar um pouco entre operações para permitir que o trigger processe
        await sleep(operationDelay);
        
      } catch (error) {
        console.error(`❌ Erro na operação ${i+1}/${numOperations}:`, error.message);
        results.failures++;
        results.productResults[product.id].operations.push({
          type: operationType,
          quantity,
          success: false,
          error: error.message
        });
      }
    }
    
    // Verificar estoque final
    await sleep(500); // Aguardar um pouco mais para garantir que todas as operações foram processadas
    const updatedProduct = await getProduct(product.id);
    
    if (updatedProduct) {
      results.productResults[product.id].finalStock = updatedProduct.quantity;
      const expectedStock = results.productResults[product.id].expectedStock;
      const actualStock = updatedProduct.quantity;
      
      console.log(`\nEstoque inicial: ${initialStock} ${product.unit}`);
      console.log(`Estoque esperado: ${expectedStock} ${product.unit}`);
      console.log(`Estoque final: ${actualStock} ${product.unit}`);
      
      if (actualStock === expectedStock) {
        console.log(`✅ Estoque final correto!`);
        results.productResults[product.id].success = true;
      } else {
        console.error(`❌ Estoque final incorreto! Diferença: ${actualStock - expectedStock} ${product.unit}`);
        results.productResults[product.id].success = false;
      }
    } else {
      console.error(`❌ Não foi possível verificar o estoque final do produto.`);
    }
  }
  
  // 5. Exibir resultados finais
  console.log('\n=== RESULTADOS DO TESTE DE ESTRESSE ===');
  console.log(`Total de operações: ${results.total}`);
  console.log(`Operações bem-sucedidas: ${results.success}`);
  console.log(`Operações com falha: ${results.failures}`);
  console.log(`Taxa de sucesso: ${(results.success / results.total * 100).toFixed(2)}%`);
  
  console.log('\n=== RESULTADOS POR PRODUTO ===');
  let allProductsCorrect = true;
  
  for (const productId in results.productResults) {
    const result = results.productResults[productId];
    console.log(`\n${result.name}:`);
    console.log(`  Estoque inicial: ${result.initialStock}`);
    console.log(`  Estoque esperado: ${result.expectedStock}`);
    console.log(`  Estoque final: ${result.finalStock}`);
    console.log(`  Status: ${result.success ? '✅ CORRETO' : '❌ INCORRETO'}`);
    
    if (!result.success) {
      allProductsCorrect = false;
    }
  }
  
  if (allProductsCorrect && results.failures === 0) {
    console.log('\n✅ TESTE DE ESTRESSE CONCLUÍDO COM SUCESSO! Todas as operações funcionaram corretamente.');
  } else {
    console.error('\n❌ TESTE DE ESTRESSE FALHOU! Verificar logs para detalhes.');
  }
}

// Executar o teste
testStressMovements()
  .catch(error => {
    console.error('Erro durante a execução do teste:', error);
  })
  .finally(() => {
    console.log('\n=== TESTE FINALIZADO ===');
  }); 