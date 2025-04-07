// Script para corrigir inconsistências entre movimentações excluídas localmente e no banco de dados
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

async function fixDeletedMovements() {
  console.log("=== CORREÇÃO DE INCONSISTÊNCIAS EM MOVIMENTAÇÕES EXCLUÍDAS ===");
  
  try {
    // 1. Obter os IDs excluídos armazenados localmente
    console.log("\n1. Lendo IDs excluídos do arquivo de localStorage...");
    let localDeletedIds = [];
    try {
      // Ler do arquivo localStorageData.json se existir (exportado do navegador)
      if (fs.existsSync('localStorageData.json')) {
        const localStorageData = JSON.parse(fs.readFileSync('localStorageData.json', 'utf8'));
        if (localStorageData.deletedMovementIds) {
          localDeletedIds = JSON.parse(localStorageData.deletedMovementIds);
        }
      } else {
        // Caso não exista, perguntar sobre a entrada manual
        console.log("Arquivo localStorageData.json não encontrado.");
        console.log("Por favor, exporte os dados do localStorage do navegador ou informe os IDs excluídos manualmente.");
        
        // Você pode descomentar a linha abaixo e adicionar IDs manualmente para teste
        // localDeletedIds = ['id1', 'id2', 'id3'];
      }
    } catch (error) {
      console.error("Erro ao ler dados de localStorage:", error.message);
    }
    
    // Verificar se temos IDs para processar
    if (localDeletedIds.length === 0) {
      console.log("Nenhum ID de movimentação excluída encontrado localmente para processamento.");
      return;
    }
    
    console.log(`Encontrados ${localDeletedIds.length} IDs excluídos no armazenamento local.`);
    
    // 2. Verificar quais desses IDs ainda existem no banco e não estão marcados como excluídos
    console.log("\n2. Verificando estado desses IDs no banco de dados...");
    const { data: existingMovements, error: queryError } = await supabase
      .from('movements')
      .select('id, deleted')
      .in('id', localDeletedIds);
    
    if (queryError) {
      throw new Error(`Erro ao consultar movimentações: ${queryError.message}`);
    }
    
    if (!existingMovements || existingMovements.length === 0) {
      console.log("Nenhuma das movimentações excluídas localmente existe no banco.");
      return;
    }
    
    console.log(`Encontradas ${existingMovements.length} movimentações no banco correspondentes aos IDs excluídos localmente.`);
    
    // 3. Identificar quais precisam ser atualizadas (existem no banco mas não estão com deleted=true)
    const needsUpdate = existingMovements.filter(m => m.deleted !== true);
    
    console.log(`${needsUpdate.length} movimentações precisam ser atualizadas para deleted=true.`);
    
    if (needsUpdate.length === 0) {
      console.log("Nenhuma atualização necessária. O banco está consistente com o armazenamento local.");
      return;
    }
    
    // 4. Atualizar as movimentações para deleted=true
    console.log("\n3. Atualizando movimentações para deleted=true...");
    const idsToUpdate = needsUpdate.map(m => m.id);
    
    // Registrar os IDs que serão atualizados
    console.log("IDs a serem atualizados:", idsToUpdate);
    
    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .in('id', idsToUpdate);
    
    if (updateError) {
      throw new Error(`Erro ao atualizar movimentações: ${updateError.message}`);
    }
    
    console.log(`Atualização concluída: ${idsToUpdate.length} movimentações agora estão marcadas como excluídas.`);
    
    // 5. Verificar se existem movimentações no banco marcadas como excluídas mas não presentes na lista local
    console.log("\n4. Verificando movimentações excluídas no banco que não estão na lista local...");
    const { data: deletedInDb, error: deletedError } = await supabase
      .from('movements')
      .select('id')
      .eq('deleted', true);
    
    if (deletedError) {
      throw new Error(`Erro ao consultar movimentações excluídas: ${deletedError.message}`);
    }
    
    const deletedIdsInDb = deletedInDb.map(m => m.id);
    const localDeletedIdSet = new Set(localDeletedIds);
    
    const missingInLocal = deletedIdsInDb.filter(id => !localDeletedIdSet.has(id));
    
    if (missingInLocal.length > 0) {
      console.log(`Encontradas ${missingInLocal.length} movimentações marcadas como excluídas no banco mas não no armazenamento local.`);
      console.log("Isso pode causar problemas se o frontend não reconhecer essas movimentações como excluídas.");
      
      // Gerar arquivo com lista completa de IDs excluídos para atualizar no navegador
      const mergedIds = [...new Set([...localDeletedIds, ...deletedIdsInDb])];
      fs.writeFileSync('updated_deleted_ids.json', JSON.stringify(mergedIds, null, 2));
      console.log(`Lista combinada de IDs excluídos salva em 'updated_deleted_ids.json'. Copie este conteúdo para o localStorage do navegador.`);
    } else {
      console.log("Todas as movimentações excluídas no banco estão presentes na lista local. O sistema está consistente.");
    }
    
    // 6. Resumo da operação
    console.log("\n=== RESUMO DA OPERAÇÃO ===");
    console.log(`- IDs excluídos no armazenamento local: ${localDeletedIds.length}`);
    console.log(`- Movimentações correspondentes no banco: ${existingMovements.length}`);
    console.log(`- Movimentações que precisavam ser atualizadas: ${needsUpdate.length}`);
    console.log(`- Movimentações marcadas como excluídas no banco: ${deletedIdsInDb.length}`);
    console.log(`- Movimentações excluídas no banco mas não no local: ${missingInLocal.length}`);
    console.log("\nOperação concluída com sucesso.");
    
  } catch (error) {
    console.error("\n❌ ERRO DURANTE A CORREÇÃO:", error.message);
  }
}

// Executar a função principal
fixDeletedMovements().then(() => console.log("\nScript finalizado.")); 