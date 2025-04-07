import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

// Criar cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function listMovements() {
  try {
    console.log('Buscando movimentos na Supabase...');
    
    // Buscar movimentos com informações do produto relacionado
    const { data: movements, error } = await supabase
      .from('movements')
      .select(`
        *,
        products:product_id (
          name,
          unit
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    if (!movements || movements.length === 0) {
      console.log('Nenhum movimento encontrado.');
      return;
    }
    
    console.log(`\n=== ${movements.length} MOVIMENTOS ENCONTRADOS ===\n`);
    
    // Exibir movimentos
    movements.forEach((movement, index) => {
      console.log(`Movimento ${index + 1}:`);
      console.log(`- ID: ${movement.id}`);
      console.log(`- Tipo: ${movement.type === 'in' ? 'Entrada' : 'Saída'}`);
      console.log(`- Produto: ${movement.products?.name || 'Desconhecido'}`);
      console.log(`- Quantidade: ${movement.quantity}`);
      console.log(`- Unidade do Movimento: ${movement.unit || 'Não especificada'}`);
      console.log(`- Unidade do Produto: ${movement.products?.unit || 'Não especificada'}`);
      console.log(`- Deletado: ${movement.deleted ? 'Sim' : 'Não'}`);
      console.log(`- Data: ${new Date(movement.created_at).toLocaleString()}`);
      console.log('');
    });
    
    // Buscar movimentos marcados como deletados
    const { data: deletedMovements, error: deletedError } = await supabase
      .from('movements')
      .select('*')
      .eq('deleted', true)
      .limit(5);
    
    if (deletedError) {
      console.error('Erro ao buscar movimentos deletados:', deletedError);
    } else if (deletedMovements && deletedMovements.length > 0) {
      console.log(`\n=== ${deletedMovements.length} MOVIMENTOS DELETADOS ENCONTRADOS ===\n`);
      
      deletedMovements.forEach((movement, index) => {
        console.log(`Movimento Deletado ${index + 1}:`);
        console.log(`- ID: ${movement.id}`);
        console.log(`- Produto ID: ${movement.product_id}`);
        console.log(`- Quantidade: ${movement.quantity}`);
        console.log(`- Unidade: ${movement.unit || 'Não especificada'}`);
        console.log(`- Data: ${new Date(movement.created_at).toLocaleString()}`);
        console.log('');
      });
    }
    
  } catch (err) {
    console.error('Erro ao listar movimentos:', err);
  }
}

// Executar função
listMovements(); 