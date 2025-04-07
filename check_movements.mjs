// Script para verificar as movimentações existentes no banco de dados
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Inicializar dotenv
dotenv.config();

// Configuração do cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função assíncrona para verificar movimentações
async function checkMovements() {
  console.log('Verificando movimentações existentes no banco de dados...');
  
  try {
    // Buscar movimentações com informações dos produtos e funcionários
    // Filtrando apenas movimentações não excluídas
    const { data, error } = await supabase
      .from('movements')
      .select(`
        id, 
        product_id, 
        type, 
        quantity, 
        notes, 
        created_at,
        employee_id,
        deleted,
        products(name, code),
        employees(name, code)
      `)
      .eq('deleted', false) // Filtrar apenas movimentações não excluídas
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      throw new Error(`Erro ao buscar movimentações: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('Nenhuma movimentação encontrada no banco de dados.');
      return;
    }
    
    console.log(`\nTotal de movimentações ativas: ${data.length}`);
    console.log('\nMovimentações mais recentes (últimas 20):');
    console.log('----------------------------------------------');
    
    data.forEach((movement, index) => {
      const date = new Date(movement.created_at);
      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      const productName = movement.products ? movement.products.name : 'Produto não encontrado';
      const productCode = movement.products ? movement.products.code : 'N/A';
      const employeeName = movement.employees ? movement.employees.name : 'Sem responsável';
      
      console.log(`${index + 1}. [${movement.type.toUpperCase()}] ${movement.quantity} unid. de ${productName} (${productCode})`);
      console.log(`   Data: ${formattedDate}`);
      console.log(`   Responsável: ${employeeName}`);
      console.log(`   Observações: ${movement.notes || 'Nenhuma'}`);
      console.log(`   ID: ${movement.id}`);
      console.log('----------------------------------------------');
    });
    
    // Verificar se há movimentações excluídas
    const { data: deletedData, error: deletedError } = await supabase
      .from('movements')
      .select('id')
      .eq('deleted', true)
      .limit(1);
      
    if (!deletedError && deletedData && deletedData.length > 0) {
      console.log('\nExistem movimentações marcadas como excluídas no banco de dados.');
      console.log('Essas movimentações não são exibidas na listagem acima.');
    }
    
  } catch (error) {
    console.error('Erro durante a verificação:');
    console.error(error);
  }
}

// Executar a função de verificação
checkMovements().then(() => {
  console.log('\nVerificação de movimentações concluída!');
}); 