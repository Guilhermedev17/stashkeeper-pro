import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

// Criar cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function listProducts() {
  try {
    console.log('Buscando produtos na Supabase...');
    
    // Buscar produtos
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    if (!products || products.length === 0) {
      console.log('Nenhum produto encontrado.');
      return;
    }
    
    console.log(`\n=== ${products.length} PRODUTOS ENCONTRADOS ===\n`);
    
    // Exibir produtos
    products.forEach((product, index) => {
      console.log(`Produto ${index + 1}:`);
      console.log(`- ID: ${product.id}`);
      console.log(`- Nome: ${product.name}`);
      console.log(`- Unidade: ${product.unit || 'Não especificada'}`);
      console.log(`- Quantidade: ${product.quantity !== undefined ? product.quantity : 'N/A'}`);
      console.log('');
    });
    
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
  }
}

// Executar função
listProducts(); 