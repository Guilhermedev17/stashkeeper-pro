// Script para testar a integração da verificação de integridade entre localStorage e banco de dados
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

async function testFrontendIntegrity() {
  console.log("=== TESTE DE INTEGRAÇÃO DA VERIFICAÇÃO DE INTEGRIDADE FRONTEND ===");
  
  try {
    // 1. Verificar movimentações excluídas no banco de dados
    console.log("\n1. Verificando movimentações excluídas no banco de dados...");
    const { data: deletedMovements, error: deletedError } = await supabase
      .from('movements')
      .select('id')
      .eq('deleted', true);
    
    if (deletedError) throw new Error(`Erro ao buscar movimentações excluídas: ${deletedError.message}`);
    
    console.log(`Encontradas ${deletedMovements.length} movimentações excluídas no banco.`);
    console.log(`IDs excluídos no banco: ${deletedMovements.map(m => m.id).join(', ')}`);
    
    // 2. Simular localStorage para testar o comportamento do IntegrityCheck
    console.log("\n2. Simulando localStorage do frontend...");
    
    // 2.1 Caso 1: localStorage sincronizado com o banco
    console.log("\nCaso 1: localStorage sincronizado com o banco");
    const syncedStorageIds = deletedMovements.map(m => m.id);
    console.log(`IDs sincronizados: ${syncedStorageIds.join(', ')}`);
    
    // 2.2 Caso 2: localStorage com menos IDs que o banco
    console.log("\nCaso 2: localStorage com menos IDs que o banco");
    const partialStorageIds = deletedMovements.length > 0 
      ? deletedMovements.slice(0, Math.max(1, Math.floor(deletedMovements.length / 2))).map(m => m.id)
      : [];
    console.log(`IDs parciais: ${partialStorageIds.join(', ')}`);
    
    // 2.3 Caso 3: localStorage com IDs que não existem no banco
    console.log("\nCaso 3: localStorage com IDs que não existem no banco");
    const fakeIds = ['00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111'];
    const inconsistentStorageIds = [...partialStorageIds, ...fakeIds];
    console.log(`IDs inconsistentes: ${inconsistentStorageIds.join(', ')}`);
    
    // 3. Criar uma movimentação para teste
    console.log("\n3. Criando uma nova movimentação para teste...");
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (productError || !products || products.length === 0) {
      throw new Error("Não foi possível encontrar um produto para teste");
    }
    
    const testMovementData = {
      product_id: products[0].id,
      type: 'entrada',
      quantity: 5,
      notes: 'Movimentação para teste de integridade',
      deleted: false
    };
    
    const { data: newMovement, error: createError } = await supabase
      .from('movements')
      .insert(testMovementData)
      .select();
    
    if (createError || !newMovement) {
      throw new Error("Erro ao criar movimentação de teste");
    }
    
    const testMovementId = newMovement[0].id;
    console.log(`Criada movimentação com ID: ${testMovementId}`);
    
    // 4. Simular exclusão apenas no localStorage (não no banco)
    console.log("\n4. Simulando exclusão apenas no localStorage (não no banco)...");
    const localOnlyDeletedIds = [...syncedStorageIds, testMovementId];
    console.log(`IDs excluídos localmente (incluindo novo ID): ${localOnlyDeletedIds.join(', ')}`);
    
    // 5. Salvar dados para teste manual com o componente IntegrityCheck
    console.log("\n5. Salvando dados para teste manual...");
    
    const testData = {
      // Caso 1: Perfeitamente sincronizado
      syncedLocalStorage: {
        deletedMovementIds: JSON.stringify(syncedStorageIds)
      },
      // Caso 2: Parcialmente sincronizado (faltam IDs no localStorage)
      partialLocalStorage: {
        deletedMovementIds: JSON.stringify(partialStorageIds)
      },
      // Caso 3: IDs inexistentes no banco
      inconsistentLocalStorage: {
        deletedMovementIds: JSON.stringify(inconsistentStorageIds)
      },
      // Caso 4: ID excluído apenas localmente (não no banco)
      localOnlyLocalStorage: {
        deletedMovementIds: JSON.stringify(localOnlyDeletedIds)
      },
      // IDs no banco
      dbDeletedIds: deletedMovements.map(m => m.id),
      // Novo ID para teste
      testMovementId: testMovementId
    };
    
    // Salvar em arquivo para uso no ambiente do navegador
    fs.writeFileSync('integrityTestData.json', JSON.stringify(testData, null, 2));
    console.log("Dados de teste salvos em 'integrityTestData.json'");
    
    // 6. Instruções para teste manual
    console.log("\n6. Instruções para teste manual no navegador:");
    console.log("a) Abra o navegador com o app em execução");
    console.log("b) Abra as ferramentas de desenvolvedor (F12)");
    console.log("c) No console, cole um dos seguintes comandos para testar cada caso:");
    console.log("\n   // Caso 1 - Perfeitamente sincronizado:");
    console.log(`   localStorage.setItem('deletedMovementIds', '${JSON.stringify(syncedStorageIds)}');`);
    console.log("\n   // Caso 2 - Parcialmente sincronizado:");
    console.log(`   localStorage.setItem('deletedMovementIds', '${JSON.stringify(partialStorageIds)}');`);
    console.log("\n   // Caso 3 - IDs inexistentes:");
    console.log(`   localStorage.setItem('deletedMovementIds', '${JSON.stringify(inconsistentStorageIds)}');`);
    console.log("\n   // Caso 4 - ID excluído apenas localmente:");
    console.log(`   localStorage.setItem('deletedMovementIds', '${JSON.stringify(localOnlyDeletedIds)}');`);
    console.log("\nd) Recarregue a página para verificar o comportamento do IntegrityCheck");
    console.log(`e) Observe o ID de teste ${testMovementId} no Caso 4, que deve ser corrigido pelo IntegrityCheck`);
    
    console.log("\n=== TESTE CONCLUÍDO ===");
    
  } catch (error) {
    console.error("\n❌ ERRO DURANTE O TESTE:", error.message);
  }
}

// Executar o teste
testFrontendIntegrity().then(() => console.log("\nScript finalizado.")); 