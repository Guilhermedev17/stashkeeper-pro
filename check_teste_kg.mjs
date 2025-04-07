import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

// Criar o cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Função principal
async function main() {
  try {
    console.log("Verificando produto teste kg...");
    
    // Buscar o produto pelo nome
    const { data, error } = await supabase
      .from('products')
      .select('code, quantity')
      .eq('name', 'teste kg')
      .single();
      
    if (error) {
      console.error("Erro ao buscar produto:", error);
      return;
    }
    
    if (!data) {
      console.log("Produto 'teste kg' não encontrado");
      return;
    }
    
    // Exibir informações do produto
    console.log(`Código: ${data.code}`);
    console.log(`Quantidade atual: ${data.quantity}`);
    
  } catch (err) {
    console.error("Erro:", err);
  }
}

// Executar a função principal
main(); 