// Script para validar a integridade do banco de dados e garantir que movimentações excluídas
// estejam marcadas corretamente e não apareçam na interface
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function validateDatabaseIntegrity() {
  console.log("=== VALIDAÇÃO DE INTEGRIDADE DO BANCO DE DADOS ===");
  
  try {
    // 1. Verificar se há movimentações com deleted NULL (que deveriam ser FALSE)
    console.log("\n1. Verificando movimentações com valor NULL no campo 'deleted'...");
    const { data: nullDeleted, error: nullError } = await supabase
      .from('movements')
      .select('id, created_at')
      .is('deleted', null);
    
    if (nullError) throw new Error(`Erro ao verificar movimentações com deleted NULL: ${nullError.message}`);
    
    if (nullDeleted && nullDeleted.length > 0) {
      console.log(`Encontradas ${nullDeleted.length} movimentações com deleted NULL que serão corrigidas para FALSE`);
      
      // Corrigir movimentações com deleted NULL para FALSE
      const { error: fixError } = await supabase
        .from('movements')
        .update({ deleted: false })
        .is('deleted', null);
      
      if (fixError) throw new Error(`Erro ao corrigir movimentações com deleted NULL: ${fixError.message}`);
      console.log(`✅ Corrigidas ${nullDeleted.length} movimentações com deleted NULL para FALSE`);
    } else {
      console.log("✅ Não foram encontradas movimentações com deleted NULL");
    }
    
    // 2. Verificar se há movimentações com inconsistências nas referências
    console.log("\n2. Verificando movimentações com referências a produtos inexistentes...");
    const { data: invalidRefs, error: refsError } = await supabase
      .rpc('find_movements_with_invalid_product_refs');
    
    if (refsError) {
      console.log(`Erro ao verificar referências (função RPC não existe): ${refsError.message}`);
      console.log("Pulando esta etapa - você pode criar a função RPC manualmente se necessário");
    } else if (invalidRefs && invalidRefs.length > 0) {
      console.log(`Encontradas ${invalidRefs.length} movimentações com referências inválidas`);
      console.log("Estas movimentações devem ser tratadas manualmente ou excluídas");
    } else {
      console.log("✅ Não foram encontradas movimentações com referências inválidas");
    }
    
    // 3. Verificar se existem movimentações marcadas como excluídas
    console.log("\n3. Verificando movimentações marcadas como excluídas...");
    const { data: deletedMovements, error: deletedError } = await supabase
      .from('movements')
      .select('id, product_id, type, quantity, created_at')
      .eq('deleted', true);
    
    if (deletedError) throw new Error(`Erro ao verificar movimentações excluídas: ${deletedError.message}`);
    
    if (deletedMovements && deletedMovements.length > 0) {
      console.log(`Encontradas ${deletedMovements.length} movimentações marcadas como excluídas`);
      console.log("Estas movimentações estão ocultas na interface, mas continuam no banco");
      console.log("Se desejar excluí-las permanentemente, execute a função de limpeza");
      
      // Opcionalmente, você pode descomentar esta parte para excluir permanentemente
      /*
      console.log("\nExecutando exclusão permanente das movimentações marcadas como excluídas...");
      for (let i = 0; i < deletedMovements.length; i++) {
        const movement = deletedMovements[i];
        console.log(`Excluindo permanentemente movimentação ${i+1}/${deletedMovements.length}: ${movement.id}`);
        
        const { error: deleteError } = await supabase
          .from('movements')
          .delete()
          .eq('id', movement.id);
        
        if (deleteError) {
          console.log(`  Erro ao excluir movimentação ${movement.id}: ${deleteError.message}`);
        } else {
          console.log(`  ✅ Movimentação ${movement.id} excluída permanentemente`);
        }
      }
      */
    } else {
      console.log("✅ Não foram encontradas movimentações marcadas como excluídas");
    }
    
    // 4. Verificar integridade do estoque
    console.log("\n4. Verificando integridade do estoque...");
    
    // 4.1 Obter todos os produtos com suas quantidades atuais
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, code, quantity');
    
    if (productError) throw new Error(`Erro ao buscar produtos: ${productError.message}`);
    
    if (!products || products.length === 0) {
      console.log("Nenhum produto encontrado para verificação");
    } else {
      console.log(`Verificando ${products.length} produtos...`);
      
      // Para cada produto, recalcular o estoque com base nas movimentações
      for (const product of products) {
        // Buscar todas as movimentações ativas do produto
        const { data: movements, error: mvError } = await supabase
          .from('movements')
          .select('type, quantity')
          .eq('product_id', product.id)
          .eq('deleted', false);
        
        if (mvError) {
          console.log(`  Erro ao buscar movimentações do produto ${product.id}: ${mvError.message}`);
          continue;
        }
        
        // Calcular o estoque teórico
        let calculatedStock = 0;
        for (const movement of movements) {
          if (movement.type === 'entrada') {
            calculatedStock += Number(movement.quantity);
          } else if (movement.type === 'saida') {
            calculatedStock -= Number(movement.quantity);
          }
        }
        
        // Comparar com o estoque atual
        const currentStock = Number(product.quantity);
        const discrepancy = Math.abs(currentStock - calculatedStock);
        
        if (discrepancy > 0.001) {
          console.log(`  ❌ Discrepância encontrada no produto ${product.name} (${product.code}):`);
          console.log(`     Estoque atual: ${currentStock}`);
          console.log(`     Estoque calculado: ${calculatedStock}`);
          console.log(`     Diferença: ${discrepancy.toFixed(4)}`);
          
          // Opcionalmente, corrigir o estoque
          /*
          console.log(`     Corrigindo estoque para o valor calculado...`);
          const { error: updateError } = await supabase
            .from('products')
            .update({ quantity: calculatedStock })
            .eq('id', product.id);
          
          if (updateError) {
            console.log(`     Erro ao corrigir estoque: ${updateError.message}`);
          } else {
            console.log(`     ✅ Estoque corrigido com sucesso`);
          }
          */
        } else {
          console.log(`  ✅ Produto ${product.name} (${product.code}): Estoque correto`);
        }
      }
    }
    
    console.log("\n=== VALIDAÇÃO CONCLUÍDA ===");
    
  } catch (error) {
    console.error("\n❌ ERRO DURANTE A VALIDAÇÃO:", error.message);
  }
}

// Executar a validação
validateDatabaseIntegrity().then(() => console.log("\nScript finalizado.")); 