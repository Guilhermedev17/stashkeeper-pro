// Script para verificar produtos existentes no banco de dados
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função assíncrona para verificar produtos
async function checkProducts() {
  console.log('Verificando produtos existentes no banco de dados...');
  
  try {
    // Buscar produtos
    const { data, error } = await supabase
      .from('products')
      .select('id, name, code, quantity')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Erro ao buscar produtos: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('Nenhum produto encontrado no banco de dados.');
      console.log('É necessário cadastrar produtos antes de inserir movimentações.');
      return;
    }
    
    console.log(`\nTotal de produtos encontrados: ${data.length}`);
    console.log('\nPrimeiros 10 produtos:');
    
    data.slice(0, 10).forEach((product, index) => {
      console.log(`${index + 1}. ${product.code}: ${product.name} (Estoque: ${product.quantity}) - ID: ${product.id}`);
    });
    
    console.log('\nUtilize estes IDs para criar movimentações de teste.');
    
  } catch (error) {
    console.error('Erro durante a verificação:');
    console.error(error);
  }
}

// Executar a função de verificação
checkProducts().then(() => {
  console.log('\nVerificação concluída!');
}); 