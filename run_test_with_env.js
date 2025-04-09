/**
 * Script para executar os testes com carregamento explícito de variáveis de ambiente
 */

import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual usando ES modules (substitui __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do arquivo .env.test
function loadEnvVars() {
  try {
    const envFilePath = path.join(__dirname, '.env.test');
    if (fs.existsSync(envFilePath)) {
      const envFileContent = fs.readFileSync(envFilePath, 'utf8');
      const envVars = envFileContent.split('\n')
        .filter(line => line && !line.startsWith('#'))
        .reduce((acc, line) => {
          const [key, value] = line.split('=');
          if (key && value) {
            acc[key.trim()] = value.trim();
          }
          return acc;
        }, {});

      // Definir as variáveis de ambiente
      Object.entries(envVars).forEach(([key, value]) => {
        process.env[key] = value;
      });

      console.log('Variáveis de ambiente carregadas com sucesso.');
      console.log(`URL do Supabase: ${process.env.VITE_SUPABASE_URL}`);
      return true;
    } else {
      console.error('Arquivo .env.test não encontrado');
      return false;
    }
  } catch (error) {
    console.error(`Erro ao carregar variáveis de ambiente: ${error.message}`);
    return false;
  }
}

// Executa um script como subprocesso
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`Executando script: ${scriptPath}`);
    
    // Passar as variáveis de ambiente para o processo filho
    const env = { ...process.env };
    
    const child = spawn('node', [scriptPath], { 
      env,
      stdio: 'inherit' // Redireciona stdout/stderr do processo filho para o processo pai
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Processo saiu com código ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

// Função principal
async function main() {
  try {
    console.log('=== INICIANDO TESTES COM VARIÁVEIS DE AMBIENTE ===');
    
    // Carregar variáveis de ambiente
    if (!loadEnvVars()) {
      console.error('Falha ao carregar variáveis de ambiente. Abortando testes.');
      process.exit(1);
    }
    
    // Lista de scripts para executar
    const scripts = [
      'database_integrity_test.js',
      'validate_movement_business_rules.js',
      'test_negative_stock_movements.js'
    ];
    
    // Executar scripts em sequência
    for (const script of scripts) {
      try {
        console.log(`\n=== EXECUTANDO TESTE: ${script} ===`);
        await runScript(script);
        console.log(`\n=== TESTE CONCLUÍDO: ${script} ===`);
      } catch (error) {
        console.error(`\nERRO ao executar ${script}: ${error.message}`);
        console.log('Continuando para o próximo teste...');
      }
    }
    
    console.log('\n=== TODOS OS TESTES FORAM CONCLUÍDOS ===');
    
  } catch (error) {
    console.error(`\nERRO FATAL: ${error.message}`);
    process.exit(1);
  }
}

// Executar o script principal
main(); 