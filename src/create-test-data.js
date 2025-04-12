// Script para criar dados de teste no banco de dados
// Deve ser executado com: node src/create-test-data.js

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase - usando a chave de serviço fornecida
const supabaseUrl = "https://nugerdxawqqxpfjrtikh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2VyZHhhd3FxeHBmanJ0aWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjg1OTAwNywiZXhwIjoyMDU4NDM1MDA3fQ.LoOzortwYrVj6Vma37SGcqtRFlmmR7OrK1gm4RzWIww";
const supabase = createClient(supabaseUrl, supabaseKey);

// Dados de teste para produtos
const testProducts = [
  {
    code: 'P001',
    name: 'Caneta Azul',
    description: 'Caneta esferográfica azul',
    unit: 'unidade',
    quantity: 100,
    min_quantity: 10,
    category_id: null
  },
  {
    code: 'P002',
    name: 'Papel A4',
    description: 'Papel A4 para impressora',
    unit: 'pacote',
    quantity: 50,
    min_quantity: 5,
    category_id: null
  },
  {
    code: 'P003',
    name: 'Açúcar',
    description: 'Açúcar refinado',
    unit: 'kg',
    quantity: 30,
    min_quantity: 3,
    category_id: null
  },
  {
    code: 'P004',
    name: 'Leite',
    description: 'Leite integral',
    unit: 'l',
    quantity: 40,
    min_quantity: 4,
    category_id: null
  },
  {
    code: 'P005',
    name: 'Café',
    description: 'Café em pó',
    unit: 'kg',
    quantity: 20,
    min_quantity: 2,
    category_id: null
  }
];

// Dados de teste para colaboradores
const testEmployees = [
  {
    name: 'Ana Silva',
    status: 'active',
    position: 'Gerente'
  },
  {
    name: 'Pedro Santos',
    status: 'active',
    position: 'Assistente'
  }
];

// Função para criar uma categoria de teste
async function createTestCategory() {
  console.log('Criando categoria de teste...');
  
  const { data, error } = await supabase
    .from('categories')
    .insert([
      {
        name: 'Geral',
        description: 'Categoria geral para produtos de teste'
      }
    ])
    .select();
  
  if (error) {
    console.error('Erro ao criar categoria:', error);
    return null;
  }
  
  console.log('Categoria criada:', data[0]);
  return data[0].id;
}

// Função para criar produtos de teste
async function createTestProducts(categoryId) {
  console.log('Criando produtos de teste...');
  
  // Adicionar a categoria aos produtos
  const productsWithCategory = testProducts.map(product => ({
    ...product,
    category_id: categoryId
  }));
  
  const { data, error } = await supabase
    .from('products')
    .insert(productsWithCategory)
    .select();
  
  if (error) {
    console.error('Erro ao criar produtos:', error);
    return false;
  }
  
  console.log(`${data.length} produtos criados com sucesso!`);
  return true;
}

// Função para criar colaboradores de teste
async function createTestEmployees() {
  console.log('Criando colaboradores de teste...');
  
  const { data, error } = await supabase
    .from('employees')
    .insert(testEmployees)
    .select();
  
  if (error) {
    console.error('Erro ao criar colaboradores:', error);
    return false;
  }
  
  console.log(`${data.length} colaboradores criados com sucesso!`);
  return true;
}

// Função principal para criar todos os dados de teste
async function createTestData() {
  console.log('=== INICIANDO CRIAÇÃO DE DADOS DE TESTE ===');
  
  // 1. Verificar se já existem produtos
  const { data: existingProducts } = await supabase
    .from('products')
    .select('id')
    .limit(1);
  
  if (existingProducts && existingProducts.length > 0) {
    console.log('Já existem produtos no banco de dados. Deseja continuar? (y/n)');
    // Como não podemos ter interação, vamos apenas avisar que existem produtos
    console.log('AVISO: Produtos já existem no banco de dados. Script continuará a criar mais produtos.');
  }
  
  // 2. Criar categoria
  const categoryId = await createTestCategory();
  
  // 3. Criar produtos
  const productsCreated = await createTestProducts(categoryId);
  
  // 4. Criar colaboradores
  const employeesCreated = await createTestEmployees();
  
  // Resumo
  console.log('\n=== RESUMO DA CRIAÇÃO DE DADOS DE TESTE ===');
  console.log(`Categoria: ${categoryId ? 'Criada com sucesso' : 'Falha na criação'}`);
  console.log(`Produtos: ${productsCreated ? 'Criados com sucesso' : 'Falha na criação'}`);
  console.log(`Colaboradores: ${employeesCreated ? 'Criados com sucesso' : 'Falha na criação'}`);
  
  if (productsCreated && employeesCreated) {
    console.log('\n✅ DADOS DE TESTE CRIADOS COM SUCESSO!');
    console.log('Agora você pode executar os scripts de teste:');
    console.log('1. node src/test-input-movement.js');
    console.log('2. node src/test-output-movement.js');
    console.log('3. node src/test-stress-movements.js');
  } else {
    console.error('\n❌ FALHA NA CRIAÇÃO DE DADOS DE TESTE!');
  }
}

// Executar a função principal
createTestData()
  .catch(error => {
    console.error('Erro durante a criação de dados de teste:', error);
  })
  .finally(() => {
    console.log('\n=== CRIAÇÃO DE DADOS DE TESTE FINALIZADA ===');
  }); 