// Script para testar exclusão de movimentações e verificar restauração de estoque
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

// Carregar variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nugerdxawqqxpfjrtikh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2VyZHhhd3FxeHBmanJ0aWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjg1OTAwNywiZXhwIjoyMDU4NDM1MDA3fQ.LoOzortwYrVj6Vma37SGcqtRFlmmR7OrK1gm4RzWIww';

// Inicializar cliente Supabase com a service key para ter acesso completo
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Configuração de logs
const EXIBIR_LOGS = true;

// Registro de operações para análise posterior
const registroOperacoes = {
  produtos: [],
  movimentacoes: [],
  exclusoes: [],
  erros: []
};

// Função para criar um novo produto de teste
async function criarProdutoTeste(nome, codigo, unidade, quantidade = 0) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: nome,
        code: codigo,
        description: `Produto para teste de exclusão de movimentações (${unidade})`,
        quantity: quantidade,
        min_quantity: 0,
        unit: unidade
      }])
      .select()
      .single();

    if (error) throw error;
    
    log(`✅ Produto criado: ${nome} (${codigo}) - ${unidade}`);
    
    registroOperacoes.produtos.push({
      id: data.id,
      nome,
      codigo,
      unidade,
      quantidade_inicial: quantidade,
      timestamp: new Date().toISOString()
    });
    
    return data;
  } catch (erro) {
    log(`❌ Erro ao criar produto ${nome}:`, erro.message);
    
    // Se o erro for de código duplicado, tentar buscar o produto existente
    if (erro.message.includes('duplicate key value') || erro.message.includes('unique constraint')) {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('code', codigo)
        .single();
      
      if (data) {
        log(`ℹ️ Produto ${codigo} já existe, usando o existente.`);
        return data;
      }
    }
    
    throw erro;
  }
}

// Função para registrar uma movimentação e atualizar o estoque do produto
async function registrarMovimentacao(produtoId, tipo, quantidade, observacao = null) {
  try {
    // 1. Buscar a quantidade atual do produto
    const { data: produto, error: erroConsulta } = await supabase
      .from('products')
      .select('*')
      .eq('id', produtoId)
      .single();
    
    if (erroConsulta) throw erroConsulta;
    
    // 2. Calcular nova quantidade
    let novaQuantidade = produto.quantity;
    if (tipo === 'entrada') {
      novaQuantidade += parseFloat(quantidade);
    } else { // saida
      novaQuantidade -= parseFloat(quantidade);
      
      // Garantir que não fique negativo
      if (novaQuantidade < 0) {
        log(`⚠️ Atenção: Estoque de ${produto.name} ficaria negativo. Ajustando para zero.`);
        novaQuantidade = 0;
      }
    }
    
    // 3. Registrar a movimentação
    const { data: movimentacao, error: erroMovimentacao } = await supabase
      .from('movements')
      .insert([{
        product_id: produtoId,
        type: tipo,
        quantity: quantidade,
        notes: observacao,
        user_id: null,
        deleted: false // garantir que não está excluído
      }])
      .select()
      .single();
    
    if (erroMovimentacao) throw erroMovimentacao;
    
    // 4. Atualizar a quantidade do produto
    const { data: produtoAtualizado, error: erroAtualizacao } = await supabase
      .from('products')
      .update({ quantity: novaQuantidade })
      .eq('id', produtoId)
      .select()
      .single();
    
    if (erroAtualizacao) throw erroAtualizacao;
    
    log(`✅ Movimentação registrada: ${tipo} de ${quantidade} ${produto.unit} para ${produto.name}`);
    log(`   Estoque anterior: ${produto.quantity} ${produto.unit}`);
    log(`   Estoque atual: ${novaQuantidade} ${produto.unit}`);
    
    registroOperacoes.movimentacoes.push({
      id: movimentacao.id,
      produto_id: produtoId,
      produto_nome: produto.name,
      tipo,
      quantidade,
      estoque_anterior: produto.quantity,
      estoque_atual: novaQuantidade,
      observacao,
      timestamp: new Date().toISOString()
    });
    
    return { movimentacao, produtoAtualizado };
  } catch (erro) {
    log(`❌ Erro ao registrar movimentação:`, erro.message);
    throw erro;
  }
}

// Função para excluir uma movimentação e reverter o estoque
async function excluirMovimentacaoERestaurarEstoque(movimentacaoId) {
  try {
    // 1. Buscar detalhes da movimentação
    const { data: movimentacao, error: erroConsulta } = await supabase
      .from('movements')
      .select('*, products(*)')
      .eq('id', movimentacaoId)
      .single();
    
    if (erroConsulta) throw erroConsulta;
    
    // 2. Calcular a quantidade que deve ser restaurada
    const produto = movimentacao.products;
    let novaQuantidade = produto.quantity;
    
    // A lógica de restauração é inversa à da movimentação
    if (movimentacao.type === 'entrada') {
      // Se foi uma entrada, precisamos SUBTRAIR do estoque atual
      novaQuantidade -= parseFloat(movimentacao.quantity);
      if (novaQuantidade < 0) novaQuantidade = 0; // Proteção contra negativos
    } else { // saida
      // Se foi uma saída, precisamos ADICIONAR ao estoque atual
      novaQuantidade += parseFloat(movimentacao.quantity);
    }
    
    log(`🔄 Preparando exclusão da movimentação ${movimentacaoId} (${movimentacao.type} de ${movimentacao.quantity})`);
    log(`   Produto: ${produto.name}`);
    log(`   Estoque atual: ${produto.quantity} ${produto.unit}`);
    log(`   Estoque após restauração: ${novaQuantidade} ${produto.unit}`);
    
    // 3. Marcar a movimentação como excluída (exclusão lógica)
    // Verificar primeiro se a tabela tem a coluna 'deleted'
    let tabelaTemColunaDeleted = true;
    try {
      // Verificar se podemos usar deleted na atualização
      const { data: teste, error: erroTeste } = await supabase
        .from('movements')
        .select('deleted')
        .eq('id', movimentacaoId)
        .single();
      
      if (erroTeste) {
        // A coluna provavelmente não existe
        tabelaTemColunaDeleted = false;
        log(`ℹ️ A tabela movements não tem coluna 'deleted'. Usando exclusão física.`);
      }
    } catch (e) {
      tabelaTemColunaDeleted = false;
      log(`ℹ️ A tabela movements não tem coluna 'deleted'. Usando exclusão física.`);
    }
    
    // 4. Restaurar o estoque do produto
    const { data: produtoAtualizado, error: erroAtualizacao } = await supabase
      .from('products')
      .update({ quantity: novaQuantidade })
      .eq('id', produto.id)
      .select()
      .single();
    
    if (erroAtualizacao) throw erroAtualizacao;
    
    // 5. Excluir a movimentação (lógica ou física)
    let resultadoExclusao;
    
    if (tabelaTemColunaDeleted) {
      // Exclusão lógica
      const { data, error } = await supabase
        .from('movements')
        .update({ deleted: true })
        .eq('id', movimentacaoId)
        .select()
        .single();
      
      if (error) throw error;
      resultadoExclusao = { data, tipo: 'logica' };
    } else {
      // Exclusão física
      const { data, error } = await supabase
        .from('movements')
        .delete()
        .eq('id', movimentacaoId)
        .select()
        .single();
      
      if (error) throw error;
      resultadoExclusao = { data, tipo: 'fisica' };
    }
    
    log(`✅ Movimentação excluída (${resultadoExclusao.tipo}) e estoque restaurado!`);
    
    registroOperacoes.exclusoes.push({
      movimentacao_id: movimentacaoId,
      produto_id: produto.id,
      produto_nome: produto.name,
      tipo_movimentacao: movimentacao.type,
      quantidade_movimentacao: movimentacao.quantity,
      estoque_antes: produto.quantity,
      estoque_depois: novaQuantidade,
      tipo_exclusao: resultadoExclusao.tipo,
      timestamp: new Date().toISOString()
    });
    
    return { movimentacao, produtoAtualizado, exclusao: resultadoExclusao };
  } catch (erro) {
    log(`❌ Erro ao excluir movimentação:`, erro.message);
    
    registroOperacoes.erros.push({
      operacao: 'exclusao_movimentacao',
      movimentacao_id: movimentacaoId,
      erro: erro.message,
      timestamp: new Date().toISOString()
    });
    
    throw erro;
  }
}

// Função para consultar o estoque atual de um produto
async function consultarEstoque(produtoId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', produtoId)
      .single();

    if (error) throw error;
    
    log(`ℹ️ Estoque atual do produto ${data.name}: ${data.quantity} ${data.unit}`);
    return data;
  } catch (erro) {
    log(`❌ Erro ao consultar estoque:`, erro.message);
    throw erro;
  }
}

// Função auxiliar de log
function log(mensagem, detalhes = null) {
  if (!EXIBIR_LOGS) return;
  
  console.log(mensagem);
  if (detalhes) console.log(`   ${detalhes}`);
}

// Função principal de testes
async function executarTesteExclusaoMovimentacoes() {
  try {
    log('🚀 Iniciando testes de exclusão de movimentações e restauração de estoque');
    
    // IDs das movimentações que serão posteriormente excluídas
    const movimentacoesParaExcluir = [];
    
    // 1. Criar produtos de teste
    const timestamp = Date.now();
    const produto1 = await criarProdutoTeste(`Cimento (${timestamp})`, `CIM${timestamp.toString().slice(-4)}`, 'kg', 1000);
    const produto2 = await criarProdutoTeste(`Tinta (${timestamp})`, `TIN${timestamp.toString().slice(-4)}`, 'l', 200);
    
    log('\n=== FASE 1: REGISTRAR MOVIMENTAÇÕES INICIAIS ===');
    // 2. Registrar movimentações iniciais
    const mov1 = await registrarMovimentacao(produto1.id, 'saida', 150, 'Saída para obra A');
    const mov2 = await registrarMovimentacao(produto1.id, 'saida', 300, 'Saída para obra B');
    const mov3 = await registrarMovimentacao(produto2.id, 'saida', 50, 'Saída para obra A');
    const mov4 = await registrarMovimentacao(produto2.id, 'entrada', 100, 'Reposição de estoque');
    
    // Armazenar IDs para exclusão posterior
    movimentacoesParaExcluir.push(
      mov1.movimentacao.id,
      mov2.movimentacao.id,
      mov3.movimentacao.id,
      mov4.movimentacao.id
    );
    
    log('\n=== FASE 2: VERIFICAR ESTOQUE APÓS MOVIMENTAÇÕES ===');
    // 3. Verificar estoque atual
    await consultarEstoque(produto1.id); // Deve ser: 1000 - 150 - 300 = 550 kg
    await consultarEstoque(produto2.id); // Deve ser: 200 - 50 + 100 = 250 l
    
    log('\n=== FASE 3: EXCLUIR MOVIMENTAÇÕES ===');
    // 4. Excluir movimentações e restaurar estoque
    
    // 4.1 Excluir uma saída do produto 1
    await excluirMovimentacaoERestaurarEstoque(mov1.movimentacao.id);
    await consultarEstoque(produto1.id); // Deve ser: 550 + 150 = 700 kg
    
    // 4.2 Excluir uma entrada do produto 2
    await excluirMovimentacaoERestaurarEstoque(mov4.movimentacao.id);
    await consultarEstoque(produto2.id); // Deve ser: 250 - 100 = 150 l
    
    log('\n=== FASE 4: CRIAR NOVAS MOVIMENTAÇÕES E EXCLUÍ-LAS IMEDIATAMENTE ===');
    
    // 5.1 Criar nova movimentação de SAÍDA
    const mov5 = await registrarMovimentacao(produto1.id, 'saida', 200, 'Saída para teste de exclusão');
    await consultarEstoque(produto1.id); // Deve ser: 700 - 200 = 500 kg
    
    // 5.2 Excluir imediatamente esta saída
    await excluirMovimentacaoERestaurarEstoque(mov5.movimentacao.id);
    await consultarEstoque(produto1.id); // Deve ser: 500 + 200 = 700 kg
    
    // 5.3 Criar nova movimentação de ENTRADA
    const mov6 = await registrarMovimentacao(produto2.id, 'entrada', 50, 'Entrada para teste de exclusão');
    await consultarEstoque(produto2.id); // Deve ser: 150 + 50 = 200 l
    
    // 5.4 Excluir imediatamente esta entrada
    await excluirMovimentacaoERestaurarEstoque(mov6.movimentacao.id);
    await consultarEstoque(produto2.id); // Deve ser: 200 - 50 = 150 l
    
    log('\n=== FASE 5: TESTE DE RESTAURAÇÃO COM QUANTIDADE NEGATIVA ===');
    
    // 6.1 Forçar exclusão que resultaria em estoque negativo
    // Primeiro, reduzir o estoque do produto 2 para um valor baixo
    const estoqueBaixo = 10;
    await supabase
      .from('products')
      .update({ quantity: estoqueBaixo })
      .eq('id', produto2.id);
    
    await consultarEstoque(produto2.id); // Agora é 10 l
    
    // 6.2 Excluir uma saída grande
    await excluirMovimentacaoERestaurarEstoque(mov3.movimentacao.id);
    await consultarEstoque(produto2.id); // Deve ser: 10 + 50 = 60 l
    
    log('\n=== FASE 6: GERAÇÃO DO RELATÓRIO ===');
    
    // 7. Verificar estoque final
    const produto1Final = await consultarEstoque(produto1.id);
    const produto2Final = await consultarEstoque(produto2.id);
    
    // 8. Gerar relatório de resultados
    const relatorio = {
      timestamp: new Date().toISOString(),
      produtos: {
        produto1: {
          id: produto1.id,
          nome: produto1.name,
          estoque_inicial: 1000,
          estoque_final: produto1Final.quantity,
          unidade: produto1.unit
        },
        produto2: {
          id: produto2.id,
          nome: produto2.name,
          estoque_inicial: 200,
          estoque_final: produto2Final.quantity,
          unidade: produto2.unit
        }
      },
      operacoes: registroOperacoes
    };
    
    // Salvar relatório em arquivo
    const dataHora = new Date().toISOString().replace(/:/g, '-');
    fs.writeFileSync(
      `teste_exclusao_movimentacoes_${dataHora}.json`,
      JSON.stringify(relatorio, null, 2)
    );
    
    log(`\n💾 Resultados salvos em teste_exclusao_movimentacoes_${dataHora}.json`);
    log('\n✅ Testes de exclusão de movimentações concluídos com sucesso!');
    
  } catch (erro) {
    log(`\n❌ ERRO durante os testes de exclusão:`, erro.message);
    throw erro;
  }
}

// Executar a função principal
executarTesteExclusaoMovimentacoes()
  .then(() => {
    log('\n🎉 Script finalizado com sucesso!');
  })
  .catch((erro) => {
    console.error('\n💥 Falha na execução do script:', erro.message);
    process.exit(1);
  }); 