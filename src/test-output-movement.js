// Script para testar o registro de saídas de produtos
// Deve ser executado com: node src/test-output-movement.js

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase - usando a chave de serviço fornecida
const supabaseUrl = "https://nugerdxawqqxpfjrtikh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2VyZHhhd3FxeHBmanJ0aWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjg1OTAwNywiZXhwIjoyMDU4NDM1MDA3fQ.LoOzortwYrVj6Vma37SGcqtRFlmmR7OrK1gm4RzWIww";
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para obter a lista de produtos
async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, code, quantity, unit')
    .order('name', { ascending: true })
    .limit(10);
  
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
  console.log(`Registrando saída: Produto ${productId}, Quantidade ${quantity}, Unidade ${unit}, Colaborador ${employeeId}`);
  
  const { data, error } = await supabase
    .from('movements')
    .insert({
      product_id: productId,
      type: 'saida',
      quantity: quantity,
      employee_id: employeeId,
      notes: 'Teste automatizado de saída',
      unit: unit
    });
  
  if (error) {
    console.error('Erro ao registrar saída:', error);
    return false;
  }
  
  console.log('Saída registrada com sucesso!');
  return true;
}

// Função principal de teste
async function testOutputMovement() {
  console.log('=== INICIANDO TESTE DE SAÍDA DE PRODUTOS ===');
  
  // 1. Obter produtos disponíveis
  const products = await getProducts();
  if (products.length === 0) {
    console.error('Nenhum produto encontrado para teste.');
    return;
  }
  
  console.log('\n=== PRODUTOS DISPONÍVEIS PARA TESTE ===');
  products.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name} (${product.code}) - Estoque: ${product.quantity} ${product.unit}`);
  });
  
  // 2. Selecionar um produto para teste (o primeiro com estoque > 0)
  const testProduct = products.find(p => p.quantity > 0);
  if (!testProduct) {
    console.error('Nenhum produto com estoque disponível para teste.');
    return;
  }
  
  console.log(`\n=== PRODUTO SELECIONADO PARA TESTE ===`);
  console.log(`Nome: ${testProduct.name}`);
  console.log(`Código: ${testProduct.code}`);
  console.log(`Estoque inicial: ${testProduct.quantity} ${testProduct.unit}`);
  
  // 3. Obter colaboradores ativos
  const employees = await getActiveEmployees();
  if (employees.length === 0) {
    console.error('Nenhum colaborador ativo encontrado para teste.');
    return;
  }
  
  const testEmployee = employees[0];
  console.log(`\n=== COLABORADOR SELECIONADO PARA TESTE ===`);
  console.log(`Nome: ${testEmployee.name}`);
  console.log(`ID: ${testEmployee.id}`);
  
  // 4. Quantidade para teste (metade do estoque disponível ou 1, o que for maior)
  const testQuantity = Math.max(1, Math.floor(testProduct.quantity / 2));
  console.log(`\n=== DETALHES DO TESTE ===`);
  console.log(`Quantidade para saída: ${testQuantity} ${testProduct.unit}`);
  
  // 5. Registrar a saída
  console.log('\n=== REGISTRANDO SAÍDA ===');
  const success = await registerOutput(
    testProduct.id,
    testQuantity,
    testEmployee.id,
    testProduct.unit
  );
  
  if (!success) {
    console.error('Falha no teste: Erro ao registrar saída.');
    return;
  }
  
  // 6. Verificar se o estoque foi atualizado corretamente
  console.log('\n=== VERIFICANDO ATUALIZAÇÃO DO ESTOQUE ===');
  const updatedProduct = await getProduct(testProduct.id);
  if (!updatedProduct) {
    console.error('Falha no teste: Não foi possível verificar o produto após a saída.');
    return;
  }
  
  const expectedQuantity = testProduct.quantity - testQuantity;
  console.log(`Estoque anterior: ${testProduct.quantity} ${testProduct.unit}`);
  console.log(`Quantidade da saída: ${testQuantity} ${testProduct.unit}`);
  console.log(`Estoque esperado: ${expectedQuantity} ${testProduct.unit}`);
  console.log(`Estoque atual: ${updatedProduct.quantity} ${updatedProduct.unit}`);
  
  if (updatedProduct.quantity === expectedQuantity) {
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO! O estoque foi atualizado corretamente.');
  } else {
    console.error('\n❌ TESTE FALHOU! O estoque não foi atualizado corretamente.');
    console.error(`Esperado: ${expectedQuantity}, Atual: ${updatedProduct.quantity}`);
  }
}

// Executar o teste
testOutputMovement()
  .catch(error => {
    console.error('Erro durante a execução do teste:', error);
  })
  .finally(() => {
    console.log('\n=== TESTE FINALIZADO ===');
  }); 