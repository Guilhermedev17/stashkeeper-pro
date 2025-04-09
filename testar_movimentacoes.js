// Script para testar movimentações com diferentes unidades de medida
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

// Carregar variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nugerdxawqqxpfjrtikh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2VyZHhhd3FxeHBmanJ0aWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjg1OTAwNywiZXhwIjoyMDU4NDM1MDA3fQ.LoOzortwYrVj6Vma37SGcqtRFlmmR7OrK1gm4RzWIww';

// Inicializar cliente Supabase com a service key para ter acesso completo
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// IDs dos produtos de teste que criaremos (para referência posterior)
const produtosIds = {
  litros: null,
  kilos: null,
  gramas: null,
  mililitros: null,
  unidades: null
};

// Função para criar um novo produto com uma unidade específica
async function criarProdutoTeste(nome, codigo, unidade, quantidade = 0, quantidadeMinima = 0) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: nome,
        code: codigo,
        description: `Produto de teste para movimentação (${unidade})`,
        quantity: quantidade,
        min_quantity: quantidadeMinima,
        unit: unidade
      }])
      .select()
      .single();

    if (error) throw error;
    
    console.log(`✅ Produto criado: ${nome} (${codigo}) - ${unidade}`);
    return data;
  } catch (erro) {
    console.error(`❌ Erro ao criar produto ${nome}:`, erro.message);
    // Se o erro for de código duplicado, tentar buscar o produto existente
    if (erro.message.includes('duplicate key value') || erro.message.includes('unique constraint')) {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('code', codigo)
        .single();
      
      if (data) {
        console.log(`ℹ️ Produto ${codigo} já existe, usando o existente.`);
        return data;
      }
    }
    throw erro;
  }
}

// Função para registrar uma movimentação (entrada ou saída)
async function registrarMovimentacao(produtoId, tipo, quantidade, observacao = null) {
  try {
    const { data, error } = await supabase
      .from('movements')
      .insert([{
        product_id: produtoId,
        type: tipo, // 'entrada' ou 'saida'
        quantity: quantidade,
        notes: observacao,
        user_id: null // Opcional, usuário que fez a movimentação
      }])
      .select()
      .single();

    if (error) throw error;
    
    console.log(`✅ Movimentação registrada: ${tipo} de ${quantidade} para produto ${produtoId}`);
    return data;
  } catch (erro) {
    console.error(`❌ Erro ao registrar movimentação:`, erro.message);
    throw erro;
  }
}

// Função para atualizar a quantidade de um produto
async function atualizarQuantidade(produtoId, novaQuantidade) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ quantity: novaQuantidade })
      .eq('id', produtoId)
      .select()
      .single();

    if (error) throw error;
    
    console.log(`✅ Quantidade atualizada para ${novaQuantidade} no produto ${produtoId}`);
    return data;
  } catch (erro) {
    console.error(`❌ Erro ao atualizar quantidade:`, erro.message);
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
    
    console.log(`ℹ️ Estoque atual do produto ${data.name}: ${data.quantity} ${data.unit}`);
    return data;
  } catch (erro) {
    console.error(`❌ Erro ao consultar estoque:`, erro.message);
    throw erro;
  }
}

// Função principal de testes
async function executarTesteMovimentacoes() {
  try {
    console.log('🚀 Iniciando testes de movimentações com diferentes unidades de medida');
    
    // 1. Criar produtos de teste para cada unidade de medida
    const timestamp = Date.now();
    const produtoLitros = await criarProdutoTeste(`Água Mineral (${timestamp})`, `L${timestamp.toString().slice(-4)}`, 'l');
    const produtoKilos = await criarProdutoTeste(`Arroz (${timestamp})`, `K${timestamp.toString().slice(-4)}`, 'kg');
    const produtoGramas = await criarProdutoTeste(`Café (${timestamp})`, `G${timestamp.toString().slice(-4)}`, 'g');
    const produtoMililitros = await criarProdutoTeste(`Álcool Gel (${timestamp})`, `ML${timestamp.toString().slice(-4)}`, 'ml');
    const produtoUnidades = await criarProdutoTeste(`Caderno (${timestamp})`, `U${timestamp.toString().slice(-4)}`, 'unidade');
    
    // Armazenar IDs para uso posterior
    produtosIds.litros = produtoLitros.id;
    produtosIds.kilos = produtoKilos.id;
    produtosIds.gramas = produtoGramas.id;
    produtosIds.mililitros = produtoMililitros.id;
    produtosIds.unidades = produtoUnidades.id;
    
    console.log('\n📊 Produtos criados para teste:');
    console.log('- Litros:', produtoLitros.name, `(${produtoLitros.code})`);
    console.log('- Kilos:', produtoKilos.name, `(${produtoKilos.code})`);
    console.log('- Gramas:', produtoGramas.name, `(${produtoGramas.code})`);
    console.log('- Mililitros:', produtoMililitros.name, `(${produtoMililitros.code})`);
    console.log('- Unidades:', produtoUnidades.name, `(${produtoUnidades.code})`);
    
    // 2. Realizar movimentações de entrada
    console.log('\n⬆️ Testando movimentações de ENTRADA:');
    await registrarMovimentacao(produtoLitros.id, 'entrada', 20.5, 'Entrada inicial de água mineral');
    await registrarMovimentacao(produtoKilos.id, 'entrada', 50, 'Entrada inicial de arroz');
    await registrarMovimentacao(produtoGramas.id, 'entrada', 1000, 'Entrada inicial de café');
    await registrarMovimentacao(produtoMililitros.id, 'entrada', 500, 'Entrada inicial de álcool gel');
    await registrarMovimentacao(produtoUnidades.id, 'entrada', 30, 'Entrada inicial de cadernos');
    
    // 3. Consultar estoque após entradas
    console.log('\n📈 Consultando estoque após ENTRADAS:');
    await consultarEstoque(produtoLitros.id);
    await consultarEstoque(produtoKilos.id);
    await consultarEstoque(produtoGramas.id);
    await consultarEstoque(produtoMililitros.id);
    await consultarEstoque(produtoUnidades.id);
    
    // 4. Realizar movimentações de saída
    console.log('\n⬇️ Testando movimentações de SAÍDA:');
    await registrarMovimentacao(produtoLitros.id, 'saida', 5.5, 'Saída para consumo');
    await registrarMovimentacao(produtoKilos.id, 'saida', 12, 'Saída para consumo');
    await registrarMovimentacao(produtoGramas.id, 'saida', 250, 'Saída para consumo');
    await registrarMovimentacao(produtoMililitros.id, 'saida', 100, 'Saída para consumo');
    await registrarMovimentacao(produtoUnidades.id, 'saida', 10, 'Saída para consumo');
    
    // 5. Consultar estoque após saídas
    console.log('\n📉 Consultando estoque após SAÍDAS:');
    await consultarEstoque(produtoLitros.id);
    await consultarEstoque(produtoKilos.id);
    await consultarEstoque(produtoGramas.id);
    await consultarEstoque(produtoMililitros.id);
    await consultarEstoque(produtoUnidades.id);
    
    // 6. Testar movimentações com valores decimais
    console.log('\n🔢 Testando movimentações com valores DECIMAIS:');
    await registrarMovimentacao(produtoLitros.id, 'entrada', 2.75, 'Entrada com valor decimal');
    await registrarMovimentacao(produtoKilos.id, 'saida', 0.5, 'Saída com valor decimal');
    await registrarMovimentacao(produtoGramas.id, 'entrada', 125.5, 'Entrada com valor decimal');
    await registrarMovimentacao(produtoMililitros.id, 'saida', 33.3, 'Saída com valor decimal');
    
    // 7. Consultar estoque final
    console.log('\n🏁 Consultando estoque FINAL:');
    await consultarEstoque(produtoLitros.id);
    await consultarEstoque(produtoKilos.id);
    await consultarEstoque(produtoGramas.id);
    await consultarEstoque(produtoMililitros.id);
    await consultarEstoque(produtoUnidades.id);
    
    // 8. Exportar resultado dos testes para um arquivo
    const resultado = {
      dataHora: new Date().toISOString(),
      produtos: {
        litros: {
          id: produtoLitros.id,
          codigo: produtoLitros.code,
          nome: produtoLitros.name
        },
        kilos: {
          id: produtoKilos.id,
          codigo: produtoKilos.code,
          nome: produtoKilos.name
        },
        gramas: {
          id: produtoGramas.id,
          codigo: produtoGramas.code,
          nome: produtoGramas.name
        },
        mililitros: {
          id: produtoMililitros.id,
          codigo: produtoMililitros.code,
          nome: produtoMililitros.name
        },
        unidades: {
          id: produtoUnidades.id,
          codigo: produtoUnidades.code,
          nome: produtoUnidades.name
        }
      }
    };
    
    const dataHora = new Date().toISOString().replace(/:/g, '-');
    fs.writeFileSync(
      `teste_movimentacoes_${dataHora}.json`,
      JSON.stringify(resultado, null, 2)
    );
    
    console.log(`\n💾 Resultados salvos em teste_movimentacoes_${dataHora}.json`);
    console.log('✅ Testes de movimentações concluídos com sucesso!');
    
  } catch (erro) {
    console.error('\n❌ ERRO durante os testes de movimentações:', erro.message);
    throw erro;
  }
}

// Executar a função principal
executarTesteMovimentacoes()
  .then(() => {
    console.log('\n🎉 Script finalizado com sucesso!');
  })
  .catch((erro) => {
    console.error('\n💥 Falha na execução do script:', erro.message);
    process.exit(1);
  }); 