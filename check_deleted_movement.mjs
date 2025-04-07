import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv para módulos ES
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const MOVEMENT_ID = 'c7a79f66-b10a-4225-8eb6-f385db281280';

async function main() {
  console.log(`Verificando movimentação com ID: ${MOVEMENT_ID}`);
  
  try {
    // Buscar a movimentação incluindo a coluna deleted
    const { data, error } = await supabase
      .from('movements')
      .select('id, product_id, type, quantity, deleted')
      .eq('id', MOVEMENT_ID)
      .single();
    
    if (error) {
      console.error('Erro ao buscar movimentação:', error);
      return;
    }
    
    if (!data) {
      console.log('Movimentação não encontrada.');
      return;
    }
    
    console.log('Detalhes da movimentação:');
    console.log(`ID: ${data.id}`);
    console.log(`Produto ID: ${data.product_id}`);
    console.log(`Tipo: ${data.type}`);
    console.log(`Quantidade: ${data.quantity}`);
    console.log(`Excluído: ${data.deleted ? 'Sim' : 'Não'}`);
    
    // Verificar se a movimentação está visível em consultas filtradas
    const { data: filteredData, error: filteredError } = await supabase
      .from('movements')
      .select('id')
      .eq('id', MOVEMENT_ID)
      .eq('deleted', false)
      .single();
    
    if (filteredError && filteredError.code !== 'PGRST116') {
      console.error('Erro ao buscar movimentação filtrada:', filteredError);
    } else {
      console.log(`Visível em consultas filtradas: ${filteredData ? 'Sim' : 'Não'}`);
    }
    
  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

main(); 