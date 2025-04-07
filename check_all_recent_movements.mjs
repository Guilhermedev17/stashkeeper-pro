import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

// Criar cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Função principal
async function main() {
  try {
    console.log("=== VERIFICAÇÃO DE TODAS AS MOVIMENTAÇÕES RECENTES ===");
    
    // 1. Buscar o produto teste kg
    console.log("\n1. Buscando produto teste kg...");
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, code, quantity')
      .eq('name', 'teste kg')
      .single();
      
    if (productError) {
      console.error("Erro ao buscar produto:", productError);
      return;
    }
    
    console.log(`Produto encontrado: ${product.name} (${product.code})`);
    console.log(`Quantidade atual: ${product.quantity}`);
    
    // 2. Buscar todas as movimentações recentes, incluindo as excluídas
    console.log("\n2. Buscando todas as movimentações recentes (últimas 24h)...");
    
    // Data de 24 horas atrás
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const { data: movements, error: movementsError } = await supabase
      .from('movements')
      .select('id, type, quantity, notes, created_at, deleted')
      .eq('product_id', product.id)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false });
      
    if (movementsError) {
      console.error("Erro ao buscar movimentações:", movementsError);
      return;
    }
    
    // Mostrar todas as movimentações, incluindo as excluídas
    console.log(`Encontradas ${movements.length} movimentações recentes para este produto:`);
    
    // Separar em categorias
    const regularMovements = movements.filter(m => !m.deleted && !m.notes?.includes('Compensação automática'));
    const deletedMovements = movements.filter(m => m.deleted === true);
    const compensationMovements = movements.filter(m => !m.deleted && m.notes?.includes('Compensação automática'));
    
    console.log(`\nA. Movimentações Regulares (${regularMovements.length}):`);
    regularMovements.forEach(movement => {
      console.log(`ID: ${movement.id}`);
      console.log(`Tipo: ${movement.type}`);
      console.log(`Quantidade: ${movement.quantity}`);
      console.log(`Data: ${new Date(movement.created_at).toLocaleString()}`);
      console.log(`Observações: ${movement.notes || 'Nenhuma'}`);
      console.log('---');
    });
    
    console.log(`\nB. Movimentações Excluídas (${deletedMovements.length}):`);
    deletedMovements.forEach(movement => {
      console.log(`ID: ${movement.id}`);
      console.log(`Tipo: ${movement.type}`);
      console.log(`Quantidade: ${movement.quantity}`);
      console.log(`Data: ${new Date(movement.created_at).toLocaleString()}`);
      console.log(`Observações: ${movement.notes || 'Nenhuma'}`);
      console.log('---');
    });
    
    console.log(`\nC. Movimentações de Compensação (${compensationMovements.length}):`);
    compensationMovements.forEach(movement => {
      console.log(`ID: ${movement.id}`);
      console.log(`Tipo: ${movement.type}`);
      console.log(`Quantidade: ${movement.quantity}`);
      console.log(`Data: ${new Date(movement.created_at).toLocaleString()}`);
      console.log(`Observações: ${movement.notes || 'Nenhuma'}`);
      console.log('---');
    });
    
    console.log("\n=== VERIFICAÇÃO CONCLUÍDA ===");
    
  } catch (err) {
    console.error("Erro durante a verificação:", err);
  }
}

// Executar o script
main(); 