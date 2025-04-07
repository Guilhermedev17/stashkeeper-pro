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

const PRODUCT_ID = '5f354142-e9b8-4a63-ba80-5e2981924b8e';

async function main() {
  console.log(`Verificando produto com ID: ${PRODUCT_ID}`);
  
  try {
    // Buscar dados do produto
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, code, quantity')
      .eq('id', PRODUCT_ID)
      .single();
    
    if (productError) {
      console.error('Erro ao buscar produto:', productError);
      return;
    }
    
    if (!product) {
      console.log('Produto não encontrado.');
      return;
    }
    
    console.log('Detalhes do produto:');
    console.log(`ID: ${product.id}`);
    console.log(`Nome: ${product.name}`);
    console.log(`Código: ${product.code}`);
    console.log(`Quantidade atual: ${product.quantity}`);
    
    // Buscar todas as movimentações deste produto (incluindo excluídas)
    const { data: allMovements, error: movementsError } = await supabase
      .from('movements')
      .select('id, type, quantity, deleted')
      .eq('product_id', PRODUCT_ID)
      .order('created_at', { ascending: false });
    
    if (movementsError) {
      console.error('Erro ao buscar movimentações:', movementsError);
      return;
    }
    
    console.log('\nMovimentações do produto:');
    console.log('Total de movimentações: ' + allMovements.length);
    
    const activeMovements = allMovements.filter(m => !m.deleted);
    const deletedMovements = allMovements.filter(m => m.deleted);
    
    console.log('Movimentações ativas: ' + activeMovements.length);
    console.log('Movimentações excluídas: ' + deletedMovements.length);
    
    // Calcular saldo com base nas movimentações ativas
    let calculatedQuantity = 0;
    activeMovements.forEach(movement => {
      if (movement.type === 'entrada') {
        calculatedQuantity += Number(movement.quantity);
      } else if (movement.type === 'saida') {
        calculatedQuantity -= Number(movement.quantity);
      }
    });
    
    console.log(`\nQuantidade calculada com base nas movimentações ativas: ${calculatedQuantity.toFixed(4)}`);
    console.log(`Quantidade atual no banco: ${product.quantity}`);
    console.log(`Diferença: ${(product.quantity - calculatedQuantity).toFixed(4)}`);
    
    // Detalhes das movimentações excluídas
    if (deletedMovements.length > 0) {
      console.log('\nMovimentações excluídas:');
      deletedMovements.forEach((movement, index) => {
        console.log(`${index + 1}. [${movement.type.toUpperCase()}] ${movement.quantity} unidades (deleted: ${movement.deleted})`);
      });
    }
    
  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

main(); 