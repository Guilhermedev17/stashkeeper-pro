// Script para verificar funcionários existentes no banco de dados
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Inicializar dotenv
dotenv.config();

// Configuração do cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função assíncrona para verificar funcionários
async function checkEmployees() {
  console.log('Verificando funcionários existentes no banco de dados...');
  
  try {
    // Buscar funcionários
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, code, status')
      .order('name', { ascending: true });
    
    if (error) {
      throw new Error(`Erro ao buscar funcionários: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('Nenhum funcionário encontrado no banco de dados.');
      return;
    }
    
    console.log(`\nTotal de funcionários encontrados: ${data.length}`);
    console.log('\nFuncionários:');
    
    data.forEach((employee, index) => {
      console.log(`${index + 1}. ${employee.code}: ${employee.name} (Status: ${employee.status}) - ID: ${employee.id}`);
    });
    
    console.log('\nUtilize estes IDs para criar movimentações de teste com funcionários.');
    
  } catch (error) {
    console.error('Erro durante a verificação:');
    console.error(error);
  }
}

// Executar a função de verificação
checkEmployees().then(() => {
  console.log('\nVerificação concluída!');
}); 