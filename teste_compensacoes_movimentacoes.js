// Script para testar compensações de movimentações de estoque
// Ao invés de excluir uma movimentação incorreta, cria-se uma compensação inversa
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

// Lista de colaboradores/usuários para simular operações reais
// Estes IDs são apenas para representar quais colaboradores realizaram cada operação 
// nos logs, mas não serão usados no banco de dados para evitar violação de chave estrangeira
const COLABORADORES = [
  { id: 1, nome: "João Silva", cargo: "Operador de Estoque" },
  { id: 2, nome: "Maria Oliveira", cargo: "Supervisora de Logística" },
  { id: 3, nome: "Carlos Santos", cargo: "Assistente de Inventário" }
];

// Registro de operações para análise posterior
const registroOperacoes = {
  produtos: [],
  movimentacoes: [],
  compensacoes: [],
  ajustes: [],
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
        description: `Produto para teste de compensações (${unidade})`,
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
async function registrarMovimentacao(produtoId, tipo, quantidade, colaboradorId, observacao = null, isCompensacao = false) {
  try {
    // 1. Buscar a quantidade atual do produto
    const { data: produto, error: erroConsulta } = await supabase
      .from('products')
      .select('*')
      .eq('id', produtoId)
      .single();
    
    if (erroConsulta) throw erroConsulta;

    // Buscar dados do colaborador (para logs)
    const colaborador = COLABORADORES.find(c => c.id === colaboradorId) || { nome: 'Sistema' };
    
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
        notes: `${observacao} (Realizado por: ${colaborador.nome})`,
        user_id: null, // Não usar IDs de colaboradores no banco para evitar erro de constraint
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
    
    if (isCompensacao) {
      log(`✅ Compensação registrada: ${tipo} de ${quantidade} ${produto.unit} para ${produto.name} por ${colaborador.nome}`);
    } else {
      log(`✅ Movimentação registrada: ${tipo} de ${quantidade} ${produto.unit} para ${produto.name} por ${colaborador.nome}`);
    }
    log(`   Estoque anterior: ${produto.quantity} ${produto.unit}`);
    log(`   Estoque atual: ${novaQuantidade} ${produto.unit}`);
    
    if (isCompensacao) {
      registroOperacoes.compensacoes.push({
        id: movimentacao.id,
        produto_id: produtoId,
        produto_nome: produto.name,
        tipo,
        quantidade,
        colaborador_id: colaboradorId,
        colaborador_nome: colaborador.nome,
        estoque_anterior: produto.quantity,
        estoque_atual: novaQuantidade,
        observacao,
        timestamp: new Date().toISOString()
      });
    } else {
      registroOperacoes.movimentacoes.push({
        id: movimentacao.id,
        produto_id: produtoId,
        produto_nome: produto.name,
        tipo,
        quantidade,
        colaborador_id: colaboradorId,
        colaborador_nome: colaborador.nome,
        estoque_anterior: produto.quantity,
        estoque_atual: novaQuantidade,
        observacao,
        timestamp: new Date().toISOString()
      });
    }
    
    return { movimentacao, produtoAtualizado };
  } catch (erro) {
    log(`❌ Erro ao registrar movimentação:`, erro.message);
    throw erro;
  }
}

// Função para compensar uma movimentação errada (criar movimentação inversa)
async function compensarMovimentacao(movimentacaoId, colaboradorId, observacao = null) {
  try {
    // 1. Buscar detalhes da movimentação a ser compensada
    const { data: movimentacao, error: erroConsulta } = await supabase
      .from('movements')
      .select('*, products(*)')
      .eq('id', movimentacaoId)
      .single();
    
    if (erroConsulta) throw erroConsulta;
    
    // Buscar dados do colaborador (para logs)
    const colaborador = COLABORADORES.find(c => c.id === colaboradorId) || { nome: 'Sistema' };
    
    // 2. Determinar o tipo e quantidade da compensação (inverso da movimentação original)
    const tipoCompensacao = movimentacao.type === 'entrada' ? 'saida' : 'entrada';
    const quantidadeCompensacao = parseFloat(movimentacao.quantity);
    const observacaoCompensacao = observacao || `Compensação da movimentação ${movimentacaoId}`;
    
    // 3. Criar a movimentação de compensação
    log(`🔄 Preparando compensação para movimentação ${movimentacaoId}:`);
    log(`   Movimentação original: ${movimentacao.type} de ${movimentacao.quantity} ${movimentacao.products.unit}`);
    log(`   Compensação a criar: ${tipoCompensacao} de ${quantidadeCompensacao} ${movimentacao.products.unit}`);
    log(`   Realizada por: ${colaborador.nome}`);
    
    const resultado = await registrarMovimentacao(
      movimentacao.product_id,
      tipoCompensacao,
      quantidadeCompensacao,
      colaboradorId,
      observacaoCompensacao,
      true // marcar como compensação
    );
    
    log(`✅ Compensação criada com sucesso! ID: ${resultado.movimentacao.id}`);
    
    return {
      movimentacaoOriginal: movimentacao,
      compensacao: resultado.movimentacao,
      produtoAtualizado: resultado.produtoAtualizado
    };
  } catch (erro) {
    log(`❌ Erro ao compensar movimentação:`, erro.message);
    
    registroOperacoes.erros.push({
      operacao: 'compensar_movimentacao',
      movimentacao_id: movimentacaoId,
      colaborador_id: colaboradorId,
      erro: erro.message,
      timestamp: new Date().toISOString()
    });
    
    throw erro;
  }
}

// Função para realizar um ajuste manual de estoque (sem vinculação a movimentações anteriores)
async function ajustarEstoqueManualmente(produtoId, novaQuantidade, colaboradorId, justificativa) {
  try {
    // 1. Buscar a quantidade atual do produto
    const { data: produto, error: erroConsulta } = await supabase
      .from('products')
      .select('*')
      .eq('id', produtoId)
      .single();
    
    if (erroConsulta) throw erroConsulta;
    
    // Buscar dados do colaborador (para logs)
    const colaborador = COLABORADORES.find(c => c.id === colaboradorId) || { nome: 'Sistema' };
    
    // 2. Calcular a diferença para criar a movimentação de ajuste
    const diferencaQuantidade = novaQuantidade - produto.quantity;
    
    if (diferencaQuantidade === 0) {
      log(`ℹ️ Nenhum ajuste necessário para ${produto.name}. Quantidade atual já é ${produto.quantity}.`);
      return { produto, ajuste: null };
    }
    
    // 3. Determinar se é entrada ou saída com base na diferença
    const tipoAjuste = diferencaQuantidade > 0 ? 'entrada' : 'saida';
    const quantidadeAjuste = Math.abs(diferencaQuantidade);
    const observacaoAjuste = `Ajuste manual de estoque: ${justificativa}`;
    
    log(`📊 Preparando ajuste manual para ${produto.name}:`);
    log(`   Estoque atual: ${produto.quantity} ${produto.unit}`);
    log(`   Estoque desejado: ${novaQuantidade} ${produto.unit}`);
    log(`   Ajuste necessário: ${tipoAjuste} de ${quantidadeAjuste} ${produto.unit}`);
    log(`   Realizado por: ${colaborador.nome}`);
    
    // 4. Registrar a movimentação de ajuste
    const resultado = await registrarMovimentacao(
      produtoId,
      tipoAjuste,
      quantidadeAjuste,
      colaboradorId,
      observacaoAjuste
    );
    
    log(`✅ Ajuste manual realizado com sucesso!`);
    
    registroOperacoes.ajustes.push({
      id: resultado.movimentacao.id,
      produto_id: produtoId,
      produto_nome: produto.name,
      tipo_ajuste: tipoAjuste,
      quantidade_ajuste: quantidadeAjuste,
      colaborador_id: colaboradorId,
      colaborador_nome: colaborador.nome,
      estoque_anterior: produto.quantity,
      estoque_atual: novaQuantidade,
      justificativa,
      timestamp: new Date().toISOString()
    });
    
    return {
      produto,
      ajuste: resultado.movimentacao,
      produtoAtualizado: resultado.produtoAtualizado
    };
  } catch (erro) {
    log(`❌ Erro ao ajustar estoque manualmente:`, erro.message);
    
    registroOperacoes.erros.push({
      operacao: 'ajuste_manual',
      produto_id: produtoId,
      colaborador_id: colaboradorId,
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

// Função para recuperar o histórico completo de movimentações de um produto
async function consultarHistoricoMovimentacoes(produtoId) {
  try {
    const { data, error } = await supabase
      .from('movements')
      .select('*')
      .eq('product_id', produtoId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    log(`ℹ️ Histórico de movimentações recuperado: ${data.length} registros`);
    return data;
  } catch (erro) {
    log(`❌ Erro ao consultar histórico de movimentações:`, erro.message);
    throw erro;
  }
}

// Função auxiliar de log
function log(mensagem, detalhes = null) {
  if (!EXIBIR_LOGS) return;
  
  console.log(mensagem);
  if (detalhes) console.log(`   ${detalhes}`);
}

// Função auxiliar para extrair informações do colaborador da observação
function extrairColaboradorDaObservacao(observacao) {
  const match = observacao && observacao.match(/Realizado por: ([^)]+)/);
  return match ? match[1] : 'Não identificado';
}

// Função principal de testes
async function executarTesteCompensacoes() {
  try {
    log('🚀 Iniciando testes de compensações de movimentações');
    
    // Exibir os colaboradores que serão utilizados nos testes
    log('\n=== COLABORADORES PARA OS TESTES ===');
    COLABORADORES.forEach((colaborador, index) => {
      log(`Colaborador ${index + 1}: ${colaborador.nome} (${colaborador.cargo}) - ID: ${colaborador.id}`);
    });
    
    // 1. Criar produtos de teste
    const timestamp = Date.now();
    const produto1 = await criarProdutoTeste(`Areia (${timestamp})`, `ARE${timestamp.toString().slice(-4)}`, 'kg', 2000);
    const produto2 = await criarProdutoTeste(`Óleo (${timestamp})`, `OLE${timestamp.toString().slice(-4)}`, 'l', 500);
    
    log('\n=== FASE 1: REGISTRAR MOVIMENTAÇÕES CORRETAS ===');
    // 2. Registrar movimentações corretas - usando diferentes colaboradores
    const movCorreta1 = await registrarMovimentacao(
      produto1.id, 
      'saida', 
      200, 
      COLABORADORES[0].id, // João Silva - Operador de Estoque
      'Saída correta 1'
    );
    const movCorreta2 = await registrarMovimentacao(
      produto2.id, 
      'entrada', 
      50, 
      COLABORADORES[1].id, // Maria Oliveira - Supervisora de Logística
      'Entrada correta 1'
    );
    
    await consultarEstoque(produto1.id); // Deve ser: 2000 - 200 = 1800 kg
    await consultarEstoque(produto2.id); // Deve ser: 500 + 50 = 550 l
    
    log('\n=== FASE 2: REGISTRAR MOVIMENTAÇÕES COM ERRO ===');
    // 3. Registrar movimentações com erro (que vão precisar de compensação)
    const movErrada1 = await registrarMovimentacao(
      produto1.id, 
      'saida', 
      500, 
      COLABORADORES[2].id, // Carlos Santos - Assistente de Inventário
      'Saída errada - quantidade incorreta'
    );
    const movErrada2 = await registrarMovimentacao(
      produto2.id, 
      'saida', 
      100, 
      COLABORADORES[0].id, // João Silva - Operador de Estoque
      'Saída errada - deveria ser entrada'
    );
    
    await consultarEstoque(produto1.id); // Deve ser: 1800 - 500 = 1300 kg
    await consultarEstoque(produto2.id); // Deve ser: 550 - 100 = 450 l
    
    log('\n=== FASE 3: COMPENSAR MOVIMENTAÇÕES ERRADAS ===');
    // 4. Realizar compensações
    
    // 4.1 Compensar saída com quantidade incorreta - supervisor corrigindo o erro
    log('\n>> Cenário 1: Compensar uma saída com quantidade incorreta');
    const comp1 = await compensarMovimentacao(
      movErrada1.movimentacao.id, 
      COLABORADORES[1].id, // Maria Oliveira - Supervisora de Logística
      'Compensação de quantidade errada'
    );
    await consultarEstoque(produto1.id); // Deve ser: 1300 + 500 = 1800 kg
    
    // 4.2 Registrar a movimentação correta após a compensação
    log('\n>> Registrando a movimentação correta após compensação');
    const movCorrecao1 = await registrarMovimentacao(
      produto1.id, 
      'saida', 
      300, 
      COLABORADORES[1].id, // Maria Oliveira - Supervisora de Logística
      'Saída correta após compensação'
    );
    await consultarEstoque(produto1.id); // Deve ser: 1800 - 300 = 1500 kg
    
    // 4.3 Compensar movimentação com tipo incorreto
    log('\n>> Cenário 2: Compensar uma saída que deveria ser entrada');
    const comp2 = await compensarMovimentacao(
      movErrada2.movimentacao.id, 
      COLABORADORES[1].id, // Maria Oliveira - Supervisora de Logística
      'Compensação de tipo errado'
    );
    await consultarEstoque(produto2.id); // Deve ser: 450 + 100 = 550 l
    
    // 4.4 Registrar a movimentação correta após a compensação
    log('\n>> Registrando a movimentação correta após compensação');
    const movCorrecao2 = await registrarMovimentacao(
      produto2.id, 
      'entrada', 
      100, 
      COLABORADORES[0].id, // João Silva - Operador de Estoque
      'Entrada correta após compensação'
    );
    await consultarEstoque(produto2.id); // Deve ser: 550 + 100 = 650 l
    
    log('\n=== FASE 4: TESTAR AJUSTE MANUAL DE ESTOQUE ===');
    
    // 5.1 Realizar um ajuste manual para aumento de estoque
    log('\n>> Cenário 3: Ajuste manual para aumento de estoque');
    const ajuste1 = await ajustarEstoqueManualmente(
      produto1.id, 
      2000, 
      COLABORADORES[1].id, // Maria Oliveira - Supervisora de Logística
      'Ajuste após inventário - estoque real maior que o sistema'
    );
    await consultarEstoque(produto1.id); // Deve ser: 2000 kg (conforme ajustado)
    
    // 5.2 Realizar um ajuste manual para redução de estoque
    log('\n>> Cenário 4: Ajuste manual para redução de estoque');
    const ajuste2 = await ajustarEstoqueManualmente(
      produto2.id, 
      600, 
      COLABORADORES[1].id, // Maria Oliveira - Supervisora de Logística
      'Ajuste após inventário - estoque real menor que o sistema'
    );
    await consultarEstoque(produto2.id); // Deve ser: 600 l (conforme ajustado)
    
    log('\n=== FASE 5: CONSULTAR HISTÓRICO COMPLETO ===');
    
    // 6. Consultar histórico completo de movimentações
    const historico1 = await consultarHistoricoMovimentacoes(produto1.id);
    const historico2 = await consultarHistoricoMovimentacoes(produto2.id);
    
    log(`\n>> Histórico de movimentações do produto ${produto1.name}:`);
    historico1.forEach((mov, idx) => {
      // Extrair nome do colaborador das observações
      const colaboradorNome = extrairColaboradorDaObservacao(mov.notes);
      
      log(`   ${idx + 1}. ${mov.type} de ${mov.quantity} - ${mov.notes} (${mov.created_at})`);
    });
    
    log(`\n>> Histórico de movimentações do produto ${produto2.name}:`);
    historico2.forEach((mov, idx) => {
      // Extrair nome do colaborador das observações
      const colaboradorNome = extrairColaboradorDaObservacao(mov.notes);
      
      log(`   ${idx + 1}. ${mov.type} de ${mov.quantity} - ${mov.notes} (${mov.created_at})`);
    });
    
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
          estoque_inicial: 2000,
          estoque_final: produto1Final.quantity,
          unidade: produto1.unit
        },
        produto2: {
          id: produto2.id,
          nome: produto2.name,
          estoque_inicial: 500,
          estoque_final: produto2Final.quantity,
          unidade: produto2.unit
        }
      },
      colaboradores: COLABORADORES,
      historico: {
        produto1: historico1,
        produto2: historico2
      },
      operacoes: registroOperacoes
    };
    
    // Salvar relatório em arquivo
    const dataHora = new Date().toISOString().replace(/:/g, '-');
    fs.writeFileSync(
      `teste_compensacoes_${dataHora}.json`,
      JSON.stringify(relatorio, null, 2)
    );
    
    log(`\n💾 Resultados salvos em teste_compensacoes_${dataHora}.json`);
    log('\n✅ Testes de compensações concluídos com sucesso!');
    
  } catch (erro) {
    log(`\n❌ ERRO durante os testes de compensações:`, erro.message);
    throw erro;
  }
}

// Executar a função principal
executarTesteCompensacoes()
  .then(() => {
    log('\n🎉 Script finalizado com sucesso!');
  })
  .catch((erro) => {
    console.error('\n💥 Falha na execução do script:', erro.message);
    process.exit(1);
  }); 