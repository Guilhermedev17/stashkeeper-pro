// Script para inserir movimentações de teste usando a API do Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função assíncrona principal
async function main() {
  console.log('Iniciando inserção de movimentações de teste...');
  
  try {
    // 1. Buscar produtos existentes para usar seus IDs
    console.log('Buscando produtos existentes...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, code')
      .limit(5);
    
    if (productsError) {
      throw new Error(`Erro ao buscar produtos: ${productsError.message}`);
    }
    
    if (!products || products.length === 0) {
      throw new Error('Nenhum produto encontrado. Cadastre produtos primeiro.');
    }
    
    console.log(`Produtos encontrados: ${products.length}`);
    products.forEach(p => console.log(`- ${p.code}: ${p.name} (${p.id})`));
    
    // 2. Buscar funcionários existentes (opcional)
    console.log('\nBuscando funcionários...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, code')
      .limit(3);
    
    if (employeesError) {
      console.warn(`Aviso: Erro ao buscar funcionários: ${employeesError.message}`);
      console.warn('Continuando sem incluir funcionários nas movimentações.');
    }
    
    if (employees && employees.length > 0) {
      console.log(`Funcionários encontrados: ${employees.length}`);
      employees.forEach(e => console.log(`- ${e.code}: ${e.name} (${e.id})`));
    } else {
      console.log('Nenhum funcionário encontrado. As movimentações serão criadas sem funcionário.');
    }
    
    // 3. Criar movimentações de teste - entradas
    console.log('\nCriando movimentações de ENTRADA...');
    
    // Array para armazenar as promessas de inserção
    const entriesPromises = [];
    
    for (let i = 0; i < Math.min(products.length, 3); i++) {
      const product = products[i];
      const quantity = (Math.random() * 20 + 5).toFixed(2); // Entre 5 e 25
      
      // Movimentação sem funcionário
      const entryData = {
        product_id: product.id,
        type: 'entrada',
        quantity: parseFloat(quantity),
        notes: `Entrada de teste para ${product.name}`,
        created_at: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString() // Até 3 dias atrás
      };
      
      // Adicionar funcionário se disponível e é a primeira movimentação
      if (employees && employees.length > 0 && i === 0) {
        entryData.employee_id = employees[0].id;
        entryData.notes += ` (Responsável: ${employees[0].name})`;
      }
      
      console.log(`Inserindo entrada: ${quantity} unidades de ${product.name}`);
      
      // Inserir a movimentação
      const entryPromise = supabase
        .from('movements')
        .insert(entryData)
        .then(({ error }) => {
          if (error) throw new Error(`Erro ao inserir entrada: ${error.message}`);
          return { success: true, type: 'entrada', product: product.name, quantity };
        });
      
      entriesPromises.push(entryPromise);
    }
    
    // 4. Criar movimentações de teste - saídas
    console.log('\nCriando movimentações de SAÍDA...');
    
    const exitsPromises = [];
    
    for (let i = 0; i < Math.min(products.length, 2); i++) {
      const product = products[i];
      const quantity = (Math.random() * 10 + 1).toFixed(2); // Entre 1 e 11
      
      // Movimentação sem funcionário
      const exitData = {
        product_id: product.id,
        type: 'saida',
        quantity: parseFloat(quantity),
        notes: `Saída de teste para ${product.name}`,
        created_at: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString() // Até 2 dias atrás
      };
      
      // Adicionar funcionário se disponível e é a primeira movimentação
      if (employees && employees.length > 1 && i === 0) {
        exitData.employee_id = employees[1].id;
        exitData.notes += ` (Responsável: ${employees[1].name})`;
      }
      
      console.log(`Inserindo saída: ${quantity} unidades de ${product.name}`);
      
      // Inserir a movimentação
      const exitPromise = supabase
        .from('movements')
        .insert(exitData)
        .then(({ error }) => {
          if (error) throw new Error(`Erro ao inserir saída: ${error.message}`);
          return { success: true, type: 'saida', product: product.name, quantity };
        });
      
      exitsPromises.push(exitPromise);
    }
    
    // 5. Aguardar todas as inserções e mostrar resultado
    const allPromises = [...entriesPromises, ...exitsPromises];
    const results = await Promise.allSettled(allPromises);
    
    // Contar sucessos e falhas
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    
    console.log('\n=== RESUMO ===');
    console.log(`Total de movimentações: ${allPromises.length}`);
    console.log(`Sucesso: ${successful}`);
    console.log(`Falhas: ${failed}`);
    
    if (failed > 0) {
      console.log('\nErros:');
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`  - Movimento ${index + 1}: ${result.reason}`);
        } else if (result.status === 'fulfilled' && !result.value.success) {
          console.error(`  - Movimento ${index + 1}: Falha ao inserir`);
        }
      });
    }
    
  } catch (error) {
    console.error('Erro durante a execução:');
    console.error(error);
  }
}

// Executar o script
main().then(() => {
  console.log('\nProcesso concluído!');
}); 