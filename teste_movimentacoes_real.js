// Script para testar movimentações com diferentes unidades de medida usando dados reais
// Utiliza colaboradores e categorias existentes no banco de dados
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

// Carregar variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nugerdxawqqxpfjrtikh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2VyZHhhd3FxeHBmanJ0aWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjg1OTAwNywiZXhwIjoyMDU4NDM1MDA3fQ.LoOzortwYrVj6Vma37SGcqtRFlmmR7OrK1gm4RzWIww';

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Dados reais do sistema
let COLABORADORES = [];
let CATEGORIAS = [];

// Configuração de unidades de medida para teste
const UNIDADES_MEDIDA = [
  { nome: 'unidade', abreviacao: 'un' },
  { nome: 'quilograma', abreviacao: 'kg' },
  { nome: 'metro', abreviacao: 'm' },
  { nome: 'litro', abreviacao: 'l' },
  { nome: 'caixa', abreviacao: 'cx' },
  { nome: 'pacote', abreviacao: 'pct' },
  { nome: 'par', abreviacao: 'par' },
];

// Registro de operações para análise posterior
const registroOperacoes = {
  produtos: [],
  movimentacoes: [],
  compensacoes: [],
  erros: []
};

// Função para buscar dados reais do sistema
async function buscarDadosReais() {
  try {
    // Buscar categorias
    const { data: categorias, error: erroCategorias } = await supabase
      .from('categories')
      .select('*');
    
    if (erroCategorias) throw erroCategorias;
    
    console.log(`✅ Categorias encontradas: ${categorias.length}`);
    
    // Buscar colaboradores (employees)
    const { data: colaboradores, error: erroColaboradores } = await supabase
      .from('employees')
      .select('*')
      .not('name', 'is', null);
    
    if (erroColaboradores) throw erroColaboradores;
    
    console.log(`✅ Colaboradores encontrados: ${colaboradores.length}`);
    
    return {
      categorias,
      colaboradores
    };
  } catch (erro) {
    console.error(`❌ Erro ao buscar dados reais:`, erro.message);
    throw erro;
  }
}

// Função para criar produtos de teste com base nas categorias existentes
async function criarProdutosTeste(quantidadePorCategoria = 2) {
  const produtosCriados = [];
  
  try {
    // Para cada categoria, criar produtos com diferentes unidades de medida
    for (const categoria of CATEGORIAS) {
      console.log(`\n>> Criando produtos para categoria: ${categoria.name}`);
      
      for (let i = 0; i < quantidadePorCategoria; i++) {
        // Selecionar unidade de medida com base no índice
        const unidadeIndex = i % UNIDADES_MEDIDA.length;
        const unidade = UNIDADES_MEDIDA[unidadeIndex];
        
        // Criar produto
        const timestamp = Date.now();
        const codigo = `${categoria.name.substring(0, 3)}${timestamp.toString().slice(-4)}${i}`;
        const nome = `${categoria.name} - ${unidade.nome} ${timestamp.toString().slice(-4)}`;
        const quantidadeInicial = 100 * (i + 1);
        
        const { data: produto, error } = await supabase
          .from('products')
          .insert([{
            name: nome,
            code: codigo,
            description: `Produto de teste para categoria ${categoria.name} (${unidade.abreviacao})`,
            quantity: quantidadeInicial,
            min_quantity: Math.floor(quantidadeInicial * 0.2), // 20% da quantidade como mínimo
            unit: unidade.abreviacao,
            category_id: categoria.id // Associar à categoria real
          }])
          .select()
          .single();
        
        if (error) {
          console.error(`❌ Erro ao criar produto ${nome}:`, error.message);
          continue;
        }
        
        console.log(`✅ Produto criado: ${nome} (${codigo}) - ${unidade.abreviacao} - Estoque: ${quantidadeInicial}`);
        
        registroOperacoes.produtos.push({
          id: produto.id,
          nome,
          codigo,
          unidade: unidade.abreviacao,
          quantidade_inicial: quantidadeInicial,
          categoria: categoria.name,
          categoria_id: categoria.id,
          timestamp: new Date().toISOString()
        });
        
        produtosCriados.push(produto);
      }
    }
    
    return produtosCriados;
  } catch (erro) {
    console.error(`❌ Erro ao criar produtos de teste:`, erro.message);
    throw erro;
  }
}

// Função para registrar movimentação
async function registrarMovimentacao(produtoId, tipo, quantidade, colaboradorId, observacao = null) {
  try {
    // 1. Buscar a quantidade atual do produto
    const { data: produto, error: erroConsulta } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('id', produtoId)
      .single();
    
    if (erroConsulta) throw erroConsulta;

    // Buscar dados do colaborador (para logs)
    const colaborador = COLABORADORES.find(c => c.id === colaboradorId) || { name: 'Sistema' };
    
    // 2. Calcular nova quantidade
    let novaQuantidade = produto.quantity;
    if (tipo === 'entrada') {
      novaQuantidade += parseFloat(quantidade);
    } else { // saida
      novaQuantidade -= parseFloat(quantidade);
      
      // Garantir que não fique negativo
      if (novaQuantidade < 0) {
        console.log(`⚠️ Atenção: Estoque de ${produto.name} ficaria negativo. Ajustando para zero.`);
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
        notes: `${observacao} (Realizado por: ${colaborador.name})`,
        user_id: null, // Usar null no user_id para evitar erro de chave estrangeira
        employee_id: colaboradorId, // Usar o ID real do colaborador no campo employee_id
        deleted: false
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
    
    const categoriaInfo = produto.categories ? ` (${produto.categories.name})` : '';
    
    console.log(`✅ Movimentação registrada: ${tipo} de ${quantidade} ${produto.unit} para ${produto.name}${categoriaInfo} por ${colaborador.name}`);
    console.log(`   Estoque anterior: ${produto.quantity} ${produto.unit}`);
    console.log(`   Estoque atual: ${novaQuantidade} ${produto.unit}`);
    
    registroOperacoes.movimentacoes.push({
      id: movimentacao.id,
      produto_id: produtoId,
      produto_nome: produto.name,
      produto_categoria: produto.categories?.name,
      tipo,
      quantidade,
      unidade: produto.unit,
      colaborador_id: colaboradorId,
      colaborador_nome: colaborador.name,
      estoque_anterior: produto.quantity,
      estoque_atual: novaQuantidade,
      observacao,
      timestamp: new Date().toISOString()
    });
    
    return { movimentacao, produtoAtualizado };
  } catch (erro) {
    console.error(`❌ Erro ao registrar movimentação:`, erro.message);
    
    registroOperacoes.erros.push({
      operacao: 'registrar_movimentacao',
      produto_id: produtoId,
      tipo,
      quantidade,
      colaborador_id: colaboradorId,
      erro: erro.message,
      timestamp: new Date().toISOString()
    });
    
    throw erro;
  }
}

// Função para compensar uma movimentação errada
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
    const colaborador = COLABORADORES.find(c => c.id === colaboradorId) || { name: 'Sistema' };
    
    // 2. Determinar o tipo e quantidade da compensação (inverso da movimentação original)
    const tipoCompensacao = movimentacao.type === 'entrada' ? 'saida' : 'entrada';
    const quantidadeCompensacao = parseFloat(movimentacao.quantity);
    const observacaoCompensacao = observacao || `Compensação da movimentação ${movimentacaoId}`;
    
    // 3. Criar a movimentação de compensação
    console.log(`🔄 Preparando compensação para movimentação ${movimentacaoId}:`);
    console.log(`   Movimentação original: ${movimentacao.type} de ${movimentacao.quantity} ${movimentacao.products.unit}`);
    console.log(`   Compensação a criar: ${tipoCompensacao} de ${quantidadeCompensacao} ${movimentacao.products.unit}`);
    console.log(`   Realizada por: ${colaborador.name}`);
    
    // 3.1 Buscar a quantidade atual do produto
    const { data: produto, error: erroProduto } = await supabase
      .from('products')
      .select('*')
      .eq('id', movimentacao.product_id)
      .single();
    
    if (erroProduto) throw erroProduto;
    
    // 3.2 Calcular nova quantidade
    let novaQuantidade = produto.quantity;
    if (tipoCompensacao === 'entrada') {
      novaQuantidade += parseFloat(quantidadeCompensacao);
    } else { // saida
      novaQuantidade -= parseFloat(quantidadeCompensacao);
      
      // Garantir que não fique negativo
      if (novaQuantidade < 0) {
        console.log(`⚠️ Atenção: Estoque de ${produto.name} ficaria negativo após compensação. Ajustando para zero.`);
        novaQuantidade = 0;
      }
    }
    
    // 3.3 Registrar a movimentação de compensação
    const { data: compensacao, error: erroCompensacao } = await supabase
      .from('movements')
      .insert([{
        product_id: movimentacao.product_id,
        type: tipoCompensacao,
        quantity: quantidadeCompensacao,
        notes: `${observacaoCompensacao} (Realizado por: ${colaborador.name})`,
        user_id: null, // Usar null no user_id para evitar erro de chave estrangeira
        employee_id: colaboradorId, // Usar o ID real do colaborador no campo employee_id
        deleted: false
      }])
      .select()
      .single();
    
    if (erroCompensacao) throw erroCompensacao;
    
    // 3.4 Atualizar a quantidade do produto
    const { data: produtoAtualizado, error: erroAtualizacao } = await supabase
      .from('products')
      .update({ quantity: novaQuantidade })
      .eq('id', movimentacao.product_id)
      .select()
      .single();
    
    if (erroAtualizacao) throw erroAtualizacao;
    
    console.log(`✅ Compensação registrada: ${tipoCompensacao} de ${quantidadeCompensacao} ${produto.unit} para ${produto.name} por ${colaborador.name}`);
    console.log(`   Estoque anterior: ${produto.quantity} ${produto.unit}`);
    console.log(`   Estoque atual: ${novaQuantidade} ${produto.unit}`);
    console.log(`✅ Compensação criada com sucesso! ID: ${compensacao.id}`);
    
    registroOperacoes.compensacoes.push({
      id: compensacao.id,
      movimentacao_original_id: movimentacaoId,
      produto_id: movimentacao.product_id,
      produto_nome: produto.name,
      tipo: tipoCompensacao,
      quantidade: quantidadeCompensacao,
      unidade: produto.unit,
      colaborador_id: colaboradorId,
      colaborador_nome: colaborador.name,
      estoque_anterior: produto.quantity,
      estoque_atual: novaQuantidade,
      observacao: observacaoCompensacao,
      timestamp: new Date().toISOString()
    });
    
    return {
      movimentacaoOriginal: movimentacao,
      compensacao,
      produtoAtualizado
    };
  } catch (erro) {
    console.error(`❌ Erro ao compensar movimentação:`, erro.message);
    
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

// Função para consultar o estoque atual de um produto
async function consultarEstoque(produtoId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('id', produtoId)
      .single();

    if (error) throw error;
    
    const categoriaInfo = data.categories ? ` (${data.categories.name})` : '';
    console.log(`ℹ️ Estoque atual do produto ${data.name}${categoriaInfo}: ${data.quantity} ${data.unit}`);
    return data;
  } catch (erro) {
    console.error(`❌ Erro ao consultar estoque:`, erro.message);
    throw erro;
  }
}

// Função para recuperar o histórico completo de movimentações de um produto
async function consultarHistoricoMovimentacoes(produtoId) {
  try {
    const { data, error } = await supabase
      .from('movements')
      .select('*, employees(name)')
      .eq('product_id', produtoId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    console.log(`ℹ️ Histórico de movimentações recuperado: ${data.length} registros`);
    return data;
  } catch (erro) {
    console.error(`❌ Erro ao consultar histórico de movimentações:`, erro.message);
    throw erro;
  }
}

// Função auxiliar para extrair informações do colaborador da observação
function extrairColaboradorDaObservacao(observacao) {
  const match = observacao && observacao.match(/Realizado por: ([^)]+)/);
  return match ? match[1] : 'Não identificado';
}

// Função principal para executar os testes
async function executarTesteMovimentacoesReal() {
  try {
    console.log('🚀 Iniciando testes de movimentações com dados reais do sistema');
    
    // 1. Buscar dados reais do sistema
    const { categorias, colaboradores } = await buscarDadosReais();
    CATEGORIAS = categorias;
    COLABORADORES = colaboradores;
    
    // Logar informações sobre os dados encontrados
    console.log('\n=== CATEGORIAS ENCONTRADAS ===');
    CATEGORIAS.forEach((categoria, index) => {
      console.log(`Categoria ${index + 1}: ${categoria.name} (ID: ${categoria.id})`);
    });
    
    console.log('\n=== COLABORADORES ENCONTRADOS ===');
    COLABORADORES.forEach((colaborador, index) => {
      console.log(`Colaborador ${index + 1}: ${colaborador.name || 'Sem nome'} (ID: ${colaborador.id})`);
    });
    
    // 2. Criar produtos de teste com base nas categorias reais
    console.log('\n=== FASE 1: CRIAR PRODUTOS DE TESTE ===');
    const produtos = await criarProdutosTeste(2); // 2 produtos por categoria
    
    if (produtos.length === 0) {
      throw new Error('Nenhum produto foi criado para os testes');
    }
    
    // 3. Registrar movimentações de entrada e saída para cada produto
    console.log('\n=== FASE 2: REGISTRAR MOVIMENTAÇÕES ===');
    
    const movimentacoes = [];
    
    // Para cada produto, fazer movimentações com diferentes colaboradores
    for (let i = 0; i < produtos.length; i++) {
      const produto = produtos[i];
      
      // Selecionar um colaborador para cada movimentação
      const colaboradorEntrada = COLABORADORES[i % COLABORADORES.length];
      const colaboradorSaida = COLABORADORES[(i + 1) % COLABORADORES.length];
      
      // Registrar uma entrada
      const quantidadeEntrada = 50 * (i + 1);
      const movEntrada = await registrarMovimentacao(
        produto.id,
        'entrada',
        quantidadeEntrada,
        colaboradorEntrada.id,
        `Entrada para teste ${i + 1}`
      );
      movimentacoes.push(movEntrada);
      
      await consultarEstoque(produto.id);
      
      // Registrar uma saída
      const quantidadeSaida = 25 * (i + 1);
      const movSaida = await registrarMovimentacao(
        produto.id,
        'saida',
        quantidadeSaida,
        colaboradorSaida.id,
        `Saída para teste ${i + 1}`
      );
      movimentacoes.push(movSaida);
      
      await consultarEstoque(produto.id);
    }
    
    // 4. Registrar uma movimentação com erro e depois compensá-la
    console.log('\n=== FASE 3: TESTAR COMPENSAÇÕES ===');
    
    // Escolher um produto aleatório para teste de compensação
    const produtoParaErro = produtos[0];
    const colaboradorErro = COLABORADORES[0];
    const colaboradorCompensacao = COLABORADORES[1];
    
    // Registrar saída com quantidade errada
    console.log('\n>> Cenário 1: Registrar uma saída com quantidade incorreta');
    const movErrada = await registrarMovimentacao(
      produtoParaErro.id,
      'saida',
      200, // quantidade muito alta
      colaboradorErro.id,
      'Saída errada - quantidade excessiva'
    );
    
    await consultarEstoque(produtoParaErro.id);
    
    // Compensar a movimentação errada
    console.log('\n>> Compensar a movimentação errada');
    const compensacao = await compensarMovimentacao(
      movErrada.movimentacao.id,
      colaboradorCompensacao.id,
      'Compensação de quantidade errada'
    );
    
    await consultarEstoque(produtoParaErro.id);
    
    // Registrar a movimentação correta
    console.log('\n>> Registrar a movimentação correta após compensação');
    const movCorrecao = await registrarMovimentacao(
      produtoParaErro.id,
      'saida',
      50, // quantidade correta
      colaboradorCompensacao.id,
      'Saída correta após compensação'
    );
    
    await consultarEstoque(produtoParaErro.id);
    
    // 5. Consultar histórico de movimentações
    console.log('\n=== FASE 4: CONSULTAR HISTÓRICO ===');
    
    for (const produto of produtos) {
      const historico = await consultarHistoricoMovimentacoes(produto.id);
      
      console.log(`\n>> Histórico de movimentações do produto ${produto.name}:`);
      historico.forEach((mov, idx) => {
        const nomeColaborador = mov.employees?.name || extrairColaboradorDaObservacao(mov.notes) || 'Colaborador não identificado';
        
        console.log(`   ${idx + 1}. ${mov.type} de ${mov.quantity} ${produto.unit} - ${mov.notes} (${mov.created_at})`);
      });
    }
    
    // 6. Gerar relatório
    console.log('\n=== FASE 5: GERAÇÃO DO RELATÓRIO ===');
    
    // Verificar estoque final de todos os produtos
    for (const produto of produtos) {
      await consultarEstoque(produto.id);
    }
    
    // Gerar relatório de resultados
    const relatorio = {
      timestamp: new Date().toISOString(),
      categorias: CATEGORIAS,
      colaboradores: COLABORADORES,
      resultados: {
        produtos: registroOperacoes.produtos,
        movimentacoes: registroOperacoes.movimentacoes,
        compensacoes: registroOperacoes.compensacoes,
        erros: registroOperacoes.erros
      }
    };
    
    // Salvar relatório em arquivo
    const dataHora = new Date().toISOString().replace(/:/g, '-');
    fs.writeFileSync(
      `teste_movimentacoes_real_${dataHora}.json`,
      JSON.stringify(relatorio, null, 2)
    );
    
    console.log(`\n💾 Resultados salvos em teste_movimentacoes_real_${dataHora}.json`);
    console.log('\n✅ Testes de movimentações concluídos com sucesso!');
    
  } catch (erro) {
    console.error(`\n❌ ERRO durante os testes:`, erro.message);
    throw erro;
  }
}

// Executar a função principal
executarTesteMovimentacoesReal()
  .then(() => {
    console.log('\n🎉 Script finalizado com sucesso!');
  })
  .catch((erro) => {
    console.error('\n💥 Falha na execução do script:', erro.message);
    process.exit(1);
  }); 