import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

// Configuração do ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não encontradas.');
  process.exit(1);
}

// Cliente Supabase para verificar a conexão
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Arquivos de teste para executar
const testFiles = [
  'test_supabase_compensation.js',
  'test_supabase_multiple_conversions.js',
  'test_supabase_compensation_scenarios.js'
];

// Função para formatar a data
function formatDate(date) {
  return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// Verificar conexão com o Supabase
async function checkSupabaseConnection() {
  try {
    // Tentativa simples de conexão - apenas buscar 1 produto
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      throw new Error(`Erro ao conectar ao Supabase: ${error.message}`);
    }
    
    console.log('✓ Conexão com Supabase estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error(`✗ Falha na conexão com Supabase: ${error.message}`);
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('\n======================================');
  console.log('INICIANDO TESTES INTEGRADOS SUPABASE');
  console.log('======================================\n');
  
  const startTime = new Date();
  const reportData = {
    startTime,
    endTime: null,
    testsRun: [],
    summary: {
      total: testFiles.length,
      success: 0,
      failed: 0
    }
  };
  
  // Verificar conexão com o Supabase primeiro
  const connected = await checkSupabaseConnection();
  if (!connected) {
    console.error('Abortando testes devido a falha na conexão com o Supabase');
    process.exit(1);
  }
  
  // Executar cada arquivo de teste
  for (const testFile of testFiles) {
    const testPath = join(__dirname, testFile);
    const testName = testFile.replace('.js', '');
    
    console.log(`\n-------------------------------------`);
    console.log(`Executando teste: ${testName}`);
    console.log(`-------------------------------------`);
    
    const testResult = {
      name: testName,
      file: testFile,
      startTime: new Date(),
      endTime: null,
      success: false,
      output: '',
      error: null
    };
    
    try {
      // Executa o teste e captura a saída
      const output = execSync(`node ${testPath}`, { encoding: 'utf-8' });
      
      testResult.output = output;
      testResult.success = true;
      testResult.endTime = new Date();
      
      reportData.summary.success++;
      
      // Exibe um resumo curto do resultado
      const successMatch = output.match(/Cenários bem-sucedidos: (\d+)/);
      const failedMatch = output.match(/Cenários com falha: (\d+)/);
      
      if (successMatch && failedMatch) {
        const successCount = parseInt(successMatch[1]);
        const failedCount = parseInt(failedMatch[1]);
        
        console.log(`✓ Teste concluído: ${successCount} cenários bem-sucedidos, ${failedCount} falhas`);
      } else {
        console.log(`✓ Teste concluído com sucesso`);
      }
      
    } catch (error) {
      testResult.success = false;
      testResult.error = error.message;
      testResult.output = error.stdout ? error.stdout.toString() : '';
      testResult.endTime = new Date();
      
      reportData.summary.failed++;
      
      console.error(`✗ Falha ao executar teste: ${error.message}`);
    }
    
    reportData.testsRun.push(testResult);
  }
  
  // Finalizar relatório
  reportData.endTime = new Date();
  const totalDuration = (reportData.endTime - reportData.startTime) / 1000;
  
  console.log('\n======================================');
  console.log('RESUMO DOS TESTES INTEGRADOS SUPABASE');
  console.log('======================================');
  console.log(`Total de suítes de teste: ${reportData.summary.total}`);
  console.log(`Suítes bem-sucedidas: ${reportData.summary.success}`);
  console.log(`Suítes com falha: ${reportData.summary.failed}`);
  console.log(`Tempo total de execução: ${totalDuration.toFixed(2)} segundos`);
  console.log('======================================\n');
  
  // Gerar relatório detalhado em HTML
  generateHTMLReport(reportData);
}

// Gerar relatório em HTML
function generateHTMLReport(reportData) {
  const reportDate = formatDate(reportData.startTime);
  const reportFileName = `supabase_test_report_${reportDate}.html`;
  const reportPath = join(__dirname, '../../../', reportFileName);
  
  const totalDuration = (reportData.endTime - reportData.startTime) / 1000;
  
  let htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Testes Supabase - ${reportDate}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .summary {
      background-color: #f8f9fa;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 20px;
      border-left: 5px solid #007bff;
    }
    .test-result {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      border-radius: 5px;
      overflow: hidden;
    }
    .test-header {
      padding: 10px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #f8f9fa;
      border-bottom: 1px solid #ddd;
    }
    .test-header h3 {
      margin: 0;
    }
    .success {
      color: #28a745;
    }
    .failure {
      color: #dc3545;
    }
    .test-output {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 3px;
      font-family: monospace;
      white-space: pre-wrap;
      max-height: 500px;
      overflow-y: auto;
      font-size: 14px;
      line-height: 1.5;
    }
    .success-bg {
      background-color: #e8f5e9;
    }
    .failure-bg {
      background-color: #ffebee;
    }
    .badge {
      padding: 5px 10px;
      border-radius: 3px;
      color: white;
      font-weight: bold;
    }
    .badge-success {
      background-color: #28a745;
    }
    .badge-failure {
      background-color: #dc3545;
    }
    details {
      margin-bottom: 10px;
    }
    summary {
      cursor: pointer;
      padding: 10px;
      background-color: #f8f9fa;
      border-radius: 3px;
      font-weight: bold;
    }
    .meta-info {
      display: flex;
      justify-content: space-between;
      color: #6c757d;
      font-size: 0.9em;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Relatório de Testes Integrados Supabase</h1>
    <p>Data de execução: ${reportData.startTime.toLocaleString()}</p>
    
    <div class="summary">
      <h2>Resumo</h2>
      <p>Total de suítes de teste: <strong>${reportData.summary.total}</strong></p>
      <p>Suítes bem-sucedidas: <strong class="success">${reportData.summary.success}</strong></p>
      <p>Suítes com falha: <strong class="failure">${reportData.summary.failed}</strong></p>
      <p>Tempo total de execução: <strong>${totalDuration.toFixed(2)} segundos</strong></p>
    </div>
    
    <h2>Resultados Detalhados</h2>
`;

  // Adicionar resultados para cada teste
  reportData.testsRun.forEach(test => {
    const testDuration = (test.endTime - test.startTime) / 1000;
    const statusClass = test.success ? 'success' : 'failure';
    const statusBadge = test.success ? 'badge-success' : 'badge-failure';
    const statusText = test.success ? 'Sucesso' : 'Falha';
    
    htmlContent += `
    <div class="test-result">
      <div class="test-header">
        <h3>${test.name}</h3>
        <span class="badge ${statusBadge}">${statusText}</span>
      </div>
      <div class="meta-info" style="padding: 0 15px;">
        <span>Arquivo: ${test.file}</span>
        <span>Duração: ${testDuration.toFixed(2)}s</span>
      </div>
      <details>
        <summary>Ver detalhes da execução</summary>
        <div class="test-output ${statusClass}-bg">
${test.output}
${test.error ? `\nERRO: ${test.error}` : ''}
        </div>
      </details>
    </div>
`;
  });

  // Fechar o HTML
  htmlContent += `
  </div>
</body>
</html>
  `;
  
  // Salvar o relatório
  writeFileSync(reportPath, htmlContent);
  console.log(`Relatório HTML gerado: ${reportPath}`);
}

// Executar os testes
runAllTests(); 