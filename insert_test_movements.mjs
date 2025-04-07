// Script para inserir movimentações de teste usando a API do Supabase
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Inicializar dotenv
dotenv.config();

// Configuração do cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// IDs dos produtos (conforme identificado pelo script check_products.mjs)
const PRODUCT_IDS = [
  {
    id: 'e390f198-00b3-4df1-aa17-085c16a53e0c',
    name: 'TESTE LITROS',
    code: '34 3'
  },
  {
    id: '5f354142-e9b8-4a63-ba80-5e2981924b8e',
    name: 'teste kg',
    code: '121'
  },
  {
    id: '6dd5c1cf-a7c4-4bf2-b703-6cf60457f57f',
    name: 'LENTE VERDE TON-10',
    code: '2037'
  },
  {
    id: 'c37b6fae-744d-44b0-b3e6-2eb465cef272',
    name: 'PROTETOR AUDITIVO SILICONE PLUS 18 DB',
    code: '507'
  }
];

// IDs dos funcionários (conforme identificado pelo script check_employees.mjs)
const EMPLOYEE_IDS = [
  {
    id: '47fd736f-8891-40a7-ba39-b08c4fe0bcc1',
    name: 'Gabriel Souza',
    code: '11236'
  },
  {
    id: 'eaa168d5-80f6-49e7-bf11-420a68ad81f7',
    name: 'Guilherme Sarmento',
    code: '11234'
  },
  {
    id: '0ba8a104-306d-4811-adec-6a9a0b514406',
    name: 'Wesley Nascimento',
    code: '11235'
  }
];

// Função assíncrona principal
async function insertTestMovements() {
  console.log('Iniciando inserção de movimentações de teste...');
  
  try {
    // Array para armazenar as promessas de inserção
    const movementsPromises = [];
    
    // 1. Criar movimentações de entrada
    console.log('\nCriando movimentações de ENTRADA...');
    
    // Para cada produto, criamos uma movimentação de entrada
    for (let i = 0; i < PRODUCT_IDS.length; i++) {
      const product = PRODUCT_IDS[i];
      const quantity = (Math.random() * 20 + 5).toFixed(2); // Entre 5 e 25
      
      // Preparar dados da movimentação
      const entryData = {
        product_id: product.id,
        type: 'entrada',
        quantity: parseFloat(quantity),
        notes: `Entrada de teste para ${product.name}`,
        created_at: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString() // Até 3 dias atrás
      };
      
      // Adicionar funcionário a algumas movimentações
      if (i % 2 === 0 && EMPLOYEE_IDS.length > 0) {
        const employeeIndex = i % EMPLOYEE_IDS.length;
        entryData.employee_id = EMPLOYEE_IDS[employeeIndex].id;
        entryData.notes += ` (Responsável: ${EMPLOYEE_IDS[employeeIndex].name})`;
      }
      
      console.log(`Inserindo entrada: ${quantity} unidades de ${product.name}`);
      
      // Inserir movimentação
      const entryPromise = supabase
        .from('movements')
        .insert(entryData)
        .then(({ error }) => {
          if (error) throw new Error(`Erro ao inserir entrada: ${error.message}`);
          return { success: true, type: 'entrada', product: product.name, quantity };
        });
      
      movementsPromises.push(entryPromise);
    }
    
    // 2. Criar movimentações de saída
    console.log('\nCriando movimentações de SAÍDA...');
    
    // Para cada produto, criamos uma movimentação de saída (com quantidade menor)
    for (let i = 0; i < PRODUCT_IDS.length; i++) {
      const product = PRODUCT_IDS[i];
      const quantity = (Math.random() * 10 + 1).toFixed(2); // Entre 1 e 11
      
      // Preparar dados da movimentação
      const exitData = {
        product_id: product.id,
        type: 'saida',
        quantity: parseFloat(quantity),
        notes: `Saída de teste para ${product.name}`,
        created_at: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString() // Até 2 dias atrás
      };
      
      // Adicionar funcionário a algumas movimentações
      if (i % 2 === 1 && EMPLOYEE_IDS.length > 0) {
        const employeeIndex = i % EMPLOYEE_IDS.length;
        exitData.employee_id = EMPLOYEE_IDS[employeeIndex].id;
        exitData.notes += ` (Responsável: ${EMPLOYEE_IDS[employeeIndex].name})`;
      }
      
      console.log(`Inserindo saída: ${quantity} unidades de ${product.name}`);
      
      // Inserir movimentação
      const exitPromise = supabase
        .from('movements')
        .insert(exitData)
        .then(({ error }) => {
          if (error) throw new Error(`Erro ao inserir saída: ${error.message}`);
          return { success: true, type: 'saida', product: product.name, quantity };
        });
      
      movementsPromises.push(exitPromise);
    }
    
    // 3. Criar algumas movimentações adicionais com data mais recente
    console.log('\nCriando movimentações de teste com data mais recente...');
    
    // Selecionar dois produtos aleatoriamente
    const randomProducts = [...PRODUCT_IDS].sort(() => 0.5 - Math.random()).slice(0, 2);
    
    for (const product of randomProducts) {
      // Uma entrada e uma saída para cada produto
      const entryQuantity = (Math.random() * 15 + 3).toFixed(2);
      const exitQuantity = (Math.random() * 8 + 1).toFixed(2);
      
      // Movimentação de entrada recente
      const recentEntryData = {
        product_id: product.id,
        type: 'entrada',
        quantity: parseFloat(entryQuantity),
        notes: `Entrada recente para ${product.name}`,
        created_at: new Date(Date.now() - Math.random() * 3600000 * 6).toISOString() // Até 6 horas atrás
      };
      
      // Adicionar funcionário se disponível
      if (EMPLOYEE_IDS.length > 0) {
        const randomEmployee = EMPLOYEE_IDS[Math.floor(Math.random() * EMPLOYEE_IDS.length)];
        recentEntryData.employee_id = randomEmployee.id;
        recentEntryData.notes += ` (Responsável: ${randomEmployee.name})`;
      }
      
      console.log(`Inserindo entrada recente: ${entryQuantity} unidades de ${product.name}`);
      
      // Inserir movimentação de entrada recente
      const recentEntryPromise = supabase
        .from('movements')
        .insert(recentEntryData)
        .then(({ error }) => {
          if (error) throw new Error(`Erro ao inserir entrada recente: ${error.message}`);
          return { success: true, type: 'entrada', product: product.name, quantity: entryQuantity };
        });
      
      movementsPromises.push(recentEntryPromise);
      
      // Movimentação de saída recente
      const recentExitData = {
        product_id: product.id,
        type: 'saida',
        quantity: parseFloat(exitQuantity),
        notes: `Saída recente para ${product.name}`,
        created_at: new Date(Date.now() - Math.random() * 3600000 * 3).toISOString() // Até 3 horas atrás
      };
      
      // Adicionar funcionário se disponível
      if (EMPLOYEE_IDS.length > 0) {
        const randomEmployee = EMPLOYEE_IDS[Math.floor(Math.random() * EMPLOYEE_IDS.length)];
        recentExitData.employee_id = randomEmployee.id;
        recentExitData.notes += ` (Responsável: ${randomEmployee.name})`;
      }
      
      console.log(`Inserindo saída recente: ${exitQuantity} unidades de ${product.name}`);
      
      // Inserir movimentação de saída recente
      const recentExitPromise = supabase
        .from('movements')
        .insert(recentExitData)
        .then(({ error }) => {
          if (error) throw new Error(`Erro ao inserir saída recente: ${error.message}`);
          return { success: true, type: 'saida', product: product.name, quantity: exitQuantity };
        });
      
      movementsPromises.push(recentExitPromise);
    }
    
    // 4. Aguardar todas as inserções e mostrar resultado
    console.log('\nAguardando conclusão das inserções...');
    const results = await Promise.allSettled(movementsPromises);
    
    // Contar sucessos e falhas
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    
    console.log('\n=== RESUMO ===');
    console.log(`Total de movimentações: ${movementsPromises.length}`);
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
insertTestMovements().then(() => {
  console.log('\nProcesso de inserção concluído!');
}); 