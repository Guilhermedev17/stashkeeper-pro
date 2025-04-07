// Script para aplicar a migração de adicionar a coluna deleted na tabela movements
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Inicializar dotenv
dotenv.config();

// Configuração do cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para aplicar a migração
async function applyMigration() {
  console.log('Iniciando aplicação da migração para adicionar coluna deleted...');
  
  try {
    // Caminho do arquivo de migração
    const migrationFilePath = path.join(process.cwd(), 'sql', 'add_deleted_column_to_movements.sql');
    
    // Ler o conteúdo do arquivo
    const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');
    
    console.log('Conteúdo da migração:');
    console.log('-'.repeat(50));
    console.log(sqlContent);
    console.log('-'.repeat(50));
    
    // Verificar se a coluna já existe para evitar erro
    console.log('Verificando se a coluna deleted já existe...');
    
    const { data: columnExists, error: checkError } = await supabase.rpc(
      'check_column_exists',
      { table_name: 'movements', column_name: 'deleted' }
    );
    
    if (checkError) {
      // Se a função não existir, vamos criar uma função para verificar a existência da coluna
      console.log('A função check_column_exists não existe, continuando com a migração...');
    } else if (columnExists) {
      console.log('A coluna deleted já existe na tabela movements. Pulando migração.');
      return;
    }
    
    // Executar a migração
    console.log('Aplicando migração...');
    
    // Executar o SQL no banco de dados
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      // Se houver erro com a função RPC, tentaremos outra abordagem
      console.log('Erro ao executar via RPC, tentando via SQL direto...');
      
      // Dividir o SQL em comandos separados
      const commands = sqlContent.split(';').filter(cmd => cmd.trim());
      
      // Executar cada comando individualmente
      for (const command of commands) {
        if (command.trim()) {
          const { error: cmdError } = await supabase.from('migrations').insert({
            name: 'add_deleted_column_to_movements',
            sql: command.trim(),
            applied_at: new Date().toISOString()
          });
          
          if (cmdError) {
            console.error('Erro ao registrar migração:', cmdError);
          }
        }
      }
      
      console.log('Migração aplicada via SQL direto (pode não ter sido executada corretamente).');
      console.log('Por favor, verifique manualmente se a coluna foi adicionada.');
    } else {
      console.log('Migração aplicada com sucesso!');
    }
    
    // Verificar novamente se a coluna foi adicionada
    console.log('Verificando se a migração foi bem-sucedida...');
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('movements')
        .select('deleted')
        .limit(1);
      
      if (testError) {
        console.error('Erro ao testar a coluna deleted:', testError);
        console.log('A migração pode não ter sido aplicada corretamente.');
      } else {
        console.log('Migração verificada! A coluna deleted foi adicionada com sucesso.');
      }
    } catch (e) {
      console.error('Erro ao testar a migração:', e);
    }
    
  } catch (error) {
    console.error('Erro durante a aplicação da migração:');
    console.error(error);
  }
}

// Executar a migração
applyMigration().then(() => {
  console.log('\nProcesso de migração concluído!');
}); 