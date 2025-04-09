// Script para testar movimentações avançadas com diferentes unidades de medida
// Testes de maior complexidade - conversões, validações e movimentações em lote
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

// Carregar variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nugerdxawqqxpfjrtikh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2VyZHhhd3FxeHBmanJ0aWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjg1OTAwNywiZXhwIjoyMDU4NDM1MDA3fQ.LoOzortwYrVj6Vma37SGcqtRFlmmR7OrK1gm4RzWIww';

// Inicializar cliente Supabase com a service key para ter acesso completo
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Fatores de conversão entre unidades de medida
const CONVERSOES = {
  // Volume
  'l_to_ml': 1000,
  'ml_to_l': 0.001,
  // Massa
  'kg_to_g': 1000,
  'g_to_kg': 0.001,
};

// Configuração de testes
const config = {
  logs: true,
  salvarArquivos: true,
  validarEstoqueNegativo: true,
  registrarHistorico: true
};

// Histórico de operações para análise posterior
const historico = {
  produtos: [],
  movimentacoes: [],
  conversoes: [],
  erros: []
};

// Função para criar um novo produto com uma unidade específica
async function criarProdutoTeste(nome, codigo, unidade, quantidade = 0, quantidadeMinima = 0, categoria = null) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: nome,
        code: codigo,
        description: `Produto de teste avançado para movimentação (${unidade})`,
        quantity: quantidade,
        min_quantity: quantidadeMinima,
        unit: unidade,
        category_id: categoria
      }])
      .select()
      .single();

    if (error) throw error;
    
    log(`✅ Produto criado: ${nome} (${codigo}) - ${unidade}`);
    
    if (config.registrarHistorico) {
      historico.produtos.push({
        id: data.id,
        nome,
        codigo,
        unidade,
        quantidade_inicial: quantidade,
        timestamp: new Date().toISOString()
      });
    }
    
    return data;
  } catch (erro) {
    log(`❌ Erro ao criar produto ${nome}:`, erro.message, 'error');
    
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
    
    if (config.registrarHistorico) {
      historico.erros.push({
        operacao: 'criar_produto',
        dados: { nome, codigo, unidade },
        erro: erro.message,
        timestamp: new Date().toISOString()
      });
    }
    
    throw erro;
  }
}

// Função para registrar uma movimentação (entrada ou saída) e atualizar estoque
async function registrarMovimentacaoEAtualizar(produtoId, tipo, quantidade, observacao = null) {
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
      
      // Validar estoque negativo se configurado
      if (config.validarEstoqueNegativo && novaQuantidade < 0) {
        log(`⚠️ Atenção: Estoque de ${produto.name} ficaria negativo (${novaQuantidade}). Ajustando para zero.`, null, 'warn');
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
        user_id: null
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
    
    log(`✅ Movimentação: ${tipo} de ${quantidade} ${produto.unit} para ${produto.name}`);
    log(`   Estoque anterior: ${produto.quantity} ${produto.unit}`);
    log(`   Estoque atual: ${novaQuantidade} ${produto.unit}`);
    
    if (config.registrarHistorico) {
      historico.movimentacoes.push({
        produto_id: produtoId,
        produto_nome: produto.name,
        tipo,
        quantidade,
        unidade: produto.unit,
        estoque_anterior: produto.quantity,
        estoque_atual: novaQuantidade,
        observacao,
        timestamp: new Date().toISOString()
      });
    }
    
    return { movimentacao, produtoAtualizado };
  } catch (erro) {
    log(`❌ Erro ao registrar movimentação:`, erro.message, 'error');
    
    if (config.registrarHistorico) {
      historico.erros.push({
        operacao: 'registrar_movimentacao',
        dados: { produtoId, tipo, quantidade },
        erro: erro.message,
        timestamp: new Date().toISOString()
      });
    }
    
    throw erro;
  }
}

// Função para converter quantidades entre unidades de medida
async function converterUnidades(produtoOrigemId, produtoDestinoId, quantidade, fatorConversao = null) {
  try {
    // 1. Buscar informações dos produtos
    const { data: produtoOrigem, error: erroOrigem } = await supabase
      .from('products')
      .select('*')
      .eq('id', produtoOrigemId)
      .single();
    
    if (erroOrigem) throw erroOrigem;
    
    const { data: produtoDestino, error: erroDestino } = await supabase
      .from('products')
      .select('*')
      .eq('id', produtoDestinoId)
      .single();
    
    if (erroDestino) throw erroDestino;
    
    // 2. Determinar fator de conversão (se não informado)
    if (!fatorConversao) {
      const chaveConversao = `${produtoOrigem.unit}_to_${produtoDestino.unit}`;
      fatorConversao = CONVERSOES[chaveConversao];
      
      if (!fatorConversao) {
        throw new Error(`Não foi possível determinar um fator de conversão de ${produtoOrigem.unit} para ${produtoDestino.unit}`);
      }
    }
    
    // 3. Calcular a quantidade convertida
    const quantidadeConvertida = quantidade * fatorConversao;
    
    log(`🔄 Conversão: ${quantidade} ${produtoOrigem.unit} de ${produtoOrigem.name} → ${quantidadeConvertida} ${produtoDestino.unit} de ${produtoDestino.name}`);
    log(`   Fator de conversão: 1 ${produtoOrigem.unit} = ${fatorConversao} ${produtoDestino.unit}`);
    
    // 4. Registrar saída da origem (se houver estoque suficiente)
    if (produtoOrigem.quantity < quantidade && config.validarEstoqueNegativo) {
      throw new Error(`Estoque insuficiente para conversão: necessário ${quantidade} ${produtoOrigem.unit}, disponível ${produtoOrigem.quantity}`);
    }
    
    await registrarMovimentacaoEAtualizar(
      produtoOrigemId, 
      'saida', 
      quantidade, 
      `Saída para conversão em ${produtoDestino.name}`
    );
    
    // 5. Registrar entrada no destino
    await registrarMovimentacaoEAtualizar(
      produtoDestinoId, 
      'entrada', 
      quantidadeConvertida, 
      `Entrada por conversão de ${produtoOrigem.name}`
    );
    
    if (config.registrarHistorico) {
      historico.conversoes.push({
        origem_id: produtoOrigemId,
        origem_nome: produtoOrigem.name,
        origem_unidade: produtoOrigem.unit,
        origem_quantidade: quantidade,
        destino_id: produtoDestinoId,
        destino_nome: produtoDestino.name,
        destino_unidade: produtoDestino.unit,
        destino_quantidade: quantidadeConvertida,
        fator_conversao: fatorConversao,
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      origem: produtoOrigem,
      destino: produtoDestino,
      quantidade_origem: quantidade,
      quantidade_destino: quantidadeConvertida,
      fator_conversao: fatorConversao
    };
  } catch (erro) {
    log(`❌ Erro ao converter unidades:`, erro.message, 'error');
    
    if (config.registrarHistorico) {
      historico.erros.push({
        operacao: 'converter_unidades',
        dados: { produtoOrigemId, produtoDestinoId, quantidade, fatorConversao },
        erro: erro.message,
        timestamp: new Date().toISOString()
      });
    }
    
    throw erro;
  }
}

// Função para processar um lote de movimentações
async function processarLoteMovimentacoes(movimentacoes) {
  const resultados = {
    sucesso: [],
    falha: []
  };
  
  log(`🔄 Iniciando processamento de lote com ${movimentacoes.length} movimentações`);
  
  for (const mov of movimentacoes) {
    try {
      const resultado = await registrarMovimentacaoEAtualizar(
        mov.produto_id,
        mov.tipo,
        mov.quantidade,
        mov.observacao || `Movimentação em lote - ${new Date().toISOString()}`
      );
      
      resultados.sucesso.push({
        movimento: mov,
        resultado
      });
    } catch (erro) {
      log(`❌ Falha na movimentação em lote para produto ${mov.produto_id}:`, erro.message, 'error');
      
      resultados.falha.push({
        movimento: mov,
        erro: erro.message
      });
    }
  }
  
  log(`✅ Processamento de lote concluído: ${resultados.sucesso.length} sucessos, ${resultados.falha.length} falhas`);
  return resultados;
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
    log(`❌ Erro ao consultar estoque:`, erro.message, 'error');
    throw erro;
  }
}

// Função auxiliar de log
function log(mensagem, detalhes = null, tipo = 'info') {
  if (!config.logs) return;
  
  const prefixos = {
    info: 'ℹ️',
    error: '❌',
    warn: '⚠️',
    success: '✅'
  };
  
  const prefixo = prefixos[tipo] || prefixos.info;
  
  console.log(`${prefixo} ${mensagem}`);
  if (detalhes) console.log(`   ${detalhes}`);
}

// Função principal de testes
async function executarTesteMovimentacoesAvancadas() {
  try {
    log('🚀 Iniciando testes avançados de movimentações com diferentes unidades de medida');
    
    // 1. Criar produtos de teste para cada unidade de medida
    const timestamp = Date.now();
    
    // Produtos com unidades diferentes para o mesmo tipo de item (para teste de conversão)
    const agua_l = await criarProdutoTeste(`Água em Litros (${timestamp})`, `AL${timestamp.toString().slice(-4)}`, 'l', 100, 20);
    const agua_ml = await criarProdutoTeste(`Água em Mililitros (${timestamp})`, `AML${timestamp.toString().slice(-4)}`, 'ml', 2000, 500);
    
    const arroz_kg = await criarProdutoTeste(`Arroz em Kg (${timestamp})`, `AK${timestamp.toString().slice(-4)}`, 'kg', 50, 10);
    const arroz_g = await criarProdutoTeste(`Arroz em Gramas (${timestamp})`, `AG${timestamp.toString().slice(-4)}`, 'g', 5000, 1000);
    
    // Produto para teste de validação
    const limitado = await criarProdutoTeste(`Item Limitado (${timestamp})`, `IL${timestamp.toString().slice(-4)}`, 'unidade', 5, 2);
    
    // Produtos para teste de lote
    const produtos_lote = [];
    for (let i = 1; i <= 3; i++) {
      const p = await criarProdutoTeste(
        `Produto Lote ${i} (${timestamp})`, 
        `PL${i}${timestamp.toString().slice(-4)}`, 
        'unidade', 
        50, 
        10
      );
      produtos_lote.push(p);
    }
    
    log('\n=== 🧪 TESTE 1: CONVERSÃO ENTRE UNIDADES DE VOLUME ===');
    // Converter 5 litros de água para mililitros
    await converterUnidades(agua_l.id, agua_ml.id, 5, CONVERSOES.l_to_ml);
    await consultarEstoque(agua_l.id);
    await consultarEstoque(agua_ml.id);
    
    log('\n=== 🧪 TESTE 2: CONVERSÃO ENTRE UNIDADES DE MASSA ===');
    // Converter 2 kg de arroz para gramas
    await converterUnidades(arroz_kg.id, arroz_g.id, 2, CONVERSOES.kg_to_g);
    await consultarEstoque(arroz_kg.id);
    await consultarEstoque(arroz_g.id);
    
    log('\n=== 🧪 TESTE 3: VALIDAÇÃO DE ESTOQUE NEGATIVO ===');
    // Tentar retirar mais do que existe em estoque
    await registrarMovimentacaoEAtualizar(limitado.id, 'saida', 10, 'Tentativa de saída maior que o estoque');
    await consultarEstoque(limitado.id);
    
    log('\n=== 🧪 TESTE 4: MOVIMENTAÇÕES EM LOTE ===');
    // Preparar lote de movimentações
    const loteMovimentacoes = [
      { produto_id: produtos_lote[0].id, tipo: 'entrada', quantidade: 20, observacao: 'Entrada em lote - teste 1' },
      { produto_id: produtos_lote[1].id, tipo: 'saida', quantidade: 10, observacao: 'Saída em lote - teste 1' },
      { produto_id: produtos_lote[2].id, tipo: 'entrada', quantidade: 15, observacao: 'Entrada em lote - teste 2' },
      // Caso de erro proposital (produto inexistente)
      { produto_id: 'id-inexistente', tipo: 'entrada', quantidade: 5, observacao: 'Erro esperado' }
    ];
    
    // Processar lote
    const resultadoLote = await processarLoteMovimentacoes(loteMovimentacoes);
    
    log('\n=== 🧪 TESTE 5: ESTOQUE APÓS OPERAÇÕES EM LOTE ===');
    for (const produto of produtos_lote) {
      await consultarEstoque(produto.id);
    }
    
    log('\n=== 🧪 TESTE 6: OPERAÇÕES COM DECIMAIS PRECISOS ===');
    // Movimentações com decimais precisos
    await registrarMovimentacaoEAtualizar(agua_l.id, 'entrada', 1.753, 'Teste com decimal preciso');
    await registrarMovimentacaoEAtualizar(arroz_kg.id, 'saida', 0.125, 'Teste com decimal preciso');
    
    await consultarEstoque(agua_l.id);
    await consultarEstoque(arroz_kg.id);
    
    // Exportar resultado dos testes e histórico para arquivos
    if (config.salvarArquivos) {
      const dataHora = new Date().toISOString().replace(/:/g, '-');
      
      // Relatório de teste
      const relatorio = {
        timestamp: new Date().toISOString(),
        configuracao: config,
        resultado_lote: resultadoLote,
        historico
      };
      
      fs.writeFileSync(
        `teste_movimentacoes_avancado_${dataHora}.json`,
        JSON.stringify(relatorio, null, 2)
      );
      
      log(`\n💾 Resultados salvos em teste_movimentacoes_avancado_${dataHora}.json`);
    }
    
    log('\n✅ Testes avançados de movimentações concluídos com sucesso!');
    
  } catch (erro) {
    log('\n❌ ERRO durante os testes avançados de movimentações:', erro.message, 'error');
    throw erro;
  }
}

// Executar a função principal
executarTesteMovimentacoesAvancadas()
  .then(() => {
    log('\n🎉 Script finalizado com sucesso!');
  })
  .catch((erro) => {
    console.error('\n💥 Falha na execução do script:', erro.message);
    process.exit(1);
  }); 