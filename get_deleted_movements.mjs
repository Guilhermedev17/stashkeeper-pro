// Script para examinar em detalhes as movimentações marcadas como excluídas
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function examineDeletedMovements() {
  console.log("=== ANÁLISE DETALHADA DE MOVIMENTAÇÕES EXCLUÍDAS ===");
  
  try {
    // 1. Buscar todas as movimentações marcadas como excluídas
    console.log("\n1. Buscando movimentações marcadas como excluídas (deleted=true)...");
    const { data: deletedMovements, error: deletedError } = await supabase
      .from('movements')
      .select(`
        id, 
        product_id, 
        type, 
        quantity, 
        notes, 
        created_at, 
        deleted,
        products:products(id, name, code, quantity)
      `)
      .eq('deleted', true)
      .order('created_at', { ascending: false });
    
    if (deletedError) throw new Error(`Erro ao buscar movimentações excluídas: ${deletedError.message}`);
    
    if (!deletedMovements || deletedMovements.length === 0) {
      console.log("Nenhuma movimentação excluída encontrada.");
      return;
    }
    
    console.log(`Encontradas ${deletedMovements.length} movimentações marcadas como excluídas:`);
    console.log("----------------------------------------------------------------------");
    
    // Exibir detalhes de cada movimentação excluída
    deletedMovements.forEach((movement, index) => {
      console.log(`\n[${index + 1}/${deletedMovements.length}] Movimentação ID: ${movement.id}`);
      console.log(`Produto: ${movement.products?.name || 'N/A'} (${movement.products?.code || 'N/A'})`);
      console.log(`Tipo: ${movement.type}, Quantidade: ${movement.quantity}`);
      console.log(`Data: ${new Date(movement.created_at).toLocaleString()}`);
      console.log(`Notas: ${movement.notes || 'N/A'}`);
      console.log(`Marcada como excluída: ${movement.deleted}`);
      console.log("----------------------------------------------------------------------");
    });
    
    // 2. Verificar se há correspondência entre o localStorage e as movimentações excluídas
    console.log("\n2. Verificando movimentações no localStorage...");
    // Supondo que você está rodando este script em um ambiente Node.js com acesso ao localStorage
    // Neste caso, vamos simular lendo um arquivo que representa o localStorage
    
    // Salvar a análise em um arquivo JSON para referência
    console.log("\n3. Salvando análise em arquivo JSON...");
    fs.writeFileSync('deleted_movements_analysis.json', JSON.stringify(deletedMovements, null, 2));
    console.log("Análise salva em 'deleted_movements_analysis.json'");
    
    // 4. Verificar inconsistências de estoque relacionadas a estas movimentações
    console.log("\n4. Verificando inconsistências de estoque relacionadas...");
    
    // Agrupar movimentações por produto
    const movementsByProduct = deletedMovements.reduce((acc, movement) => {
      const productId = movement.product_id;
      if (!acc[productId]) {
        acc[productId] = [];
      }
      acc[productId].push(movement);
      return acc;
    }, {});
    
    // Para cada produto, calcular o impacto no estoque
    for (const [productId, movements] of Object.entries(movementsByProduct)) {
      // Buscar produto atual
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, code, quantity')
        .eq('id', productId)
        .single();
      
      if (productError) {
        console.log(`Erro ao buscar produto ${productId}: ${productError.message}`);
        continue;
      }
      
      console.log(`\nProduto: ${product.name} (${product.code})`);
      console.log(`Quantidade atual no banco: ${product.quantity}`);
      
      // Calcular impacto das movimentações excluídas
      let stockImpact = 0;
      movements.forEach(movement => {
        const quantity = Number(movement.quantity);
        
        // Calcular o impacto reverso (porque foram excluídas)
        if (movement.type === 'entrada') {
          // Se era uma entrada excluída, o estoque deve ter sido reduzido
          stockImpact -= quantity;
        } else {
          // Se era uma saída excluída, o estoque deve ter sido aumentado
          stockImpact += quantity;
        }
      });
      
      console.log(`Impacto total das ${movements.length} movimentações excluídas: ${stockImpact}`);
      
      // Estimar quantidade esperada
      // Buscar movimentações ativas
      const { data: activeMovements, error: activeError } = await supabase
        .from('movements')
        .select('type, quantity')
        .eq('product_id', productId)
        .eq('deleted', false);
      
      if (activeError) {
        console.log(`Erro ao buscar movimentações ativas: ${activeError.message}`);
        continue;
      }
      
      // Calcular estoque teórico
      let calculatedStock = 0;
      activeMovements.forEach(movement => {
        if (movement.type === 'entrada') {
          calculatedStock += Number(movement.quantity);
        } else if (movement.type === 'saida') {
          calculatedStock -= Number(movement.quantity);
        }
      });
      
      console.log(`Estoque calculado com base em movimentações ativas: ${calculatedStock}`);
      console.log(`Discrepância: ${Math.abs(product.quantity - calculatedStock).toFixed(4)}`);
    }
    
    // 5. Verificar eventos relacionados na interface
    console.log("\n5. Verificando comportamento dos eventos relacionados...");
    console.log("Este script de diagnóstico não consegue verificar diretamente os eventos Supabase e sua manipulação na UI.");
    console.log("Recomendação: Abra os logs no console do navegador ao excluir uma movimentação e observe o comportamento dos eventos em tempo real.");
    
    console.log("\n=== ANÁLISE CONCLUÍDA ===");
    
  } catch (error) {
    console.error("\n❌ ERRO DURANTE A ANÁLISE:", error.message);
  }
}

// Executar a análise
examineDeletedMovements().then(() => console.log("\nScript finalizado.")); 