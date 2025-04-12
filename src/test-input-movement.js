// Script para testar o registro de entradas de produtos
// Deve ser executado com: node src/test-input-movement.js

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase - usando a chave de serviço fornecida
const supabaseUrl = "https://nugerdxawqqxpfjrtikh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2VyZHhhd3FxeHBmanJ0aWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjg1OTAwNywiZXhwIjoyMDU4NDM1MDA3fQ.LoOzortwYrVj6Vma37SGcqtRFlmmR7OrK1gm4RzWIww";
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para obter a lista de produtos
async function getProducts() {
  console.log("Buscando produtos...");
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, code, quantity, unit')
      .order('name', { ascending: true })
      .limit(10);
    
    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
    
    console.log(`Encontrados ${data ? data.length : 0} produtos.`);
    return data;
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    return [];
  }
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

// Função para registrar uma entrada de produto
async function registerInput(productId, quantity, unit) {
  console.log(`Registrando entrada: Produto ${productId}, Quantidade ${quantity}, Unidade ${unit}`);
  
  const { data, error } = await supabase
    .from('movements')
    .insert({
      product_id: productId,
      type: 'entrada',
      quantity: quantity,
      notes: 'Teste automatizado de entrada',
      unit: unit
    });
  
  if (error) {
    console.error('Erro ao registrar entrada:', error);
    return false;
  }
  
  console.log('Entrada registrada com sucesso!');
  return true;
}

// Função principal de teste
async function testInputMovement() {
  console.log('=== INICIANDO TESTE DE ENTRADA DE PRODUTOS ===');
  
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
  
  // 2. Selecionar um produto para teste (o primeiro)
  const testProduct = products[0];
  
  console.log(`\n=== PRODUTO SELECIONADO PARA TESTE ===`);
  console.log(`Nome: ${testProduct.name}`);
  console.log(`Código: ${testProduct.code}`);
  console.log(`Estoque inicial: ${testProduct.quantity} ${testProduct.unit}`);
  
  // 3. Quantidade para teste (10 unidades)
  const testQuantity = 10;
  console.log(`\n=== DETALHES DO TESTE ===`);
  console.log(`Quantidade para entrada: ${testQuantity} ${testProduct.unit}`);
  
  // 4. Registrar a entrada
  console.log('\n=== REGISTRANDO ENTRADA ===');
  const success = await registerInput(
    testProduct.id,
    testQuantity,
    testProduct.unit
  );
  
  if (!success) {
    console.error('Falha no teste: Erro ao registrar entrada.');
    return;
  }
  
  // 5. Verificar se o estoque foi atualizado corretamente
  console.log('\n=== VERIFICANDO ATUALIZAÇÃO DO ESTOQUE ===');
  const updatedProduct = await getProduct(testProduct.id);
  if (!updatedProduct) {
    console.error('Falha no teste: Não foi possível verificar o produto após a entrada.');
    return;
  }
  
  const expectedQuantity = testProduct.quantity + testQuantity;
  console.log(`Estoque anterior: ${testProduct.quantity} ${testProduct.unit}`);
  console.log(`Quantidade da entrada: ${testQuantity} ${testProduct.unit}`);
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
testInputMovement()
  .catch(error => {
    console.error('Erro durante a execução do teste:', error);
  })
  .finally(() => {
    console.log('\n=== TESTE FINALIZADO ===');
  }); 