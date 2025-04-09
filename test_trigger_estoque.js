import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// Configuração do caminho para o arquivo .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não encontradas.');
  process.exit(1);
}

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Interface para input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Lista de unidades para testar
const UNIDADES_PARA_TESTAR = [
  'unidade', 
  'caixa', 
  'kg', 
  'g', 
  'l', 
  'ml', 
  'metro', 
  'cm', 
  'pacote', 
  'par'
];

// Configuração para testes de conversão entre unidades
const CONVERSOES_PARA_TESTAR = [
  { 
    nome: 'PESO (kg ↔ g)',
    produto: {
      nome: 'Produto Teste - Conversão de Peso',
      unidade: 'kg',
      quantidade_inicial: 10
    },
    testes: [
      { tipo: 'entrada', quantidade: 2, unidade: 'kg', equivalente: 2 },
      { tipo: 'entrada', quantidade: 500, unidade: 'g', equivalente: 0.5 },
      { tipo: 'saida', quantidade: 1.5, unidade: 'kg', equivalente: 1.5 },
      { tipo: 'saida', quantidade: 250, unidade: 'g', equivalente: 0.25 },
      // Testes complexos adicionais 
      { tipo: 'entrada', quantidade: 1000, unidade: 'g', equivalente: 1 },
      { tipo: 'saida', quantidade: 0.5, unidade: 'kg', equivalente: 0.5 },
      { tipo: 'entrada', quantidade: 750, unidade: 'g', equivalente: 0.75 },
      { tipo: 'saida', quantidade: 2000, unidade: 'g', equivalente: 2 }
    ]
  },
  { 
    nome: 'VOLUME (l ↔ ml)',
    produto: {
      nome: 'Produto Teste - Conversão de Volume',
      unidade: 'l',
      quantidade_inicial: 20
    },
    testes: [
      { tipo: 'entrada', quantidade: 5, unidade: 'l', equivalente: 5 },
      { tipo: 'entrada', quantidade: 750, unidade: 'ml', equivalente: 0.75 },
      { tipo: 'saida', quantidade: 2.5, unidade: 'l', equivalente: 2.5 },
      { tipo: 'saida', quantidade: 500, unidade: 'ml', equivalente: 0.5 },
      // Testes complexos adicionais
      { tipo: 'entrada', quantidade: 2500, unidade: 'ml', equivalente: 2.5 },
      { tipo: 'saida', quantidade: 0.25, unidade: 'l', equivalente: 0.25 },
      { tipo: 'entrada', quantidade: 1, unidade: 'l', equivalente: 1 },
      { tipo: 'saida', quantidade: 1250, unidade: 'ml', equivalente: 1.25 }
    ]
  },
  { 
    nome: 'COMPRIMENTO (m ↔ cm)',
    produto: {
      nome: 'Produto Teste - Conversão de Comprimento',
      unidade: 'm',
      quantidade_inicial: 50
    },
    testes: [
      { tipo: 'entrada', quantidade: 10, unidade: 'm', equivalente: 10 },
      { tipo: 'entrada', quantidade: 80, unidade: 'cm', equivalente: 0.8 },
      { tipo: 'saida', quantidade: 5, unidade: 'm', equivalente: 5 },
      { tipo: 'saida', quantidade: 60, unidade: 'cm', equivalente: 0.6 },
      // Testes complexos adicionais
      { tipo: 'entrada', quantidade: 250, unidade: 'cm', equivalente: 2.5 },
      { tipo: 'saida', quantidade: 1.75, unidade: 'm', equivalente: 1.75 },
      { tipo: 'entrada', quantidade: 2, unidade: 'm', equivalente: 2 },
      { tipo: 'saida', quantidade: 325, unidade: 'cm', equivalente: 3.25 }
    ]
  },
  // Teste adicional com produto em g
  { 
    nome: 'PESO INVERSO (g ↔ kg)',
    produto: {
      nome: 'Produto Teste - Conversão de Peso Inverso',
      unidade: 'g',
      quantidade_inicial: 5000
    },
    testes: [
      { tipo: 'entrada', quantidade: 2000, unidade: 'g', equivalente: 2000 },
      { tipo: 'entrada', quantidade: 1.5, unidade: 'kg', equivalente: 1500 },
      { tipo: 'saida', quantidade: 500, unidade: 'g', equivalente: 500 },
      { tipo: 'saida', quantidade: 0.75, unidade: 'kg', equivalente: 750 },
      { tipo: 'entrada', quantidade: 0.25, unidade: 'kg', equivalente: 250 },
      { tipo: 'saida', quantidade: 2, unidade: 'kg', equivalente: 2000 },
    ]
  },
  // Teste adicional com produto em ml
  { 
    nome: 'VOLUME INVERSO (ml ↔ l)',
    produto: {
      nome: 'Produto Teste - Conversão de Volume Inverso',
      unidade: 'ml',
      quantidade_inicial: 8000
    },
    testes: [
      { tipo: 'entrada', quantidade: 1500, unidade: 'ml', equivalente: 1500 },
      { tipo: 'entrada', quantidade: 2.5, unidade: 'l', equivalente: 2500 },
      { tipo: 'saida', quantidade: 800, unidade: 'ml', equivalente: 800 },
      { tipo: 'saida', quantidade: 1.2, unidade: 'l', equivalente: 1200 },
      { tipo: 'entrada', quantidade: 0.35, unidade: 'l', equivalente: 350 },
      { tipo: 'saida', quantidade: 3, unidade: 'l', equivalente: 3000 },
    ]
  },
  // Testes de compensação automática
  {
    nome: 'COMPENSAÇÃO - EXCLUSÃO (kg ↔ g)',
    produto: {
      nome: 'Produto Teste - Compensação por Exclusão',
      unidade: 'kg',
      quantidade_inicial: 20
    },
    testes: [
      { 
        tipo: 'entrada', 
        quantidade: 5, 
        unidade: 'kg', 
        equivalente: 5,
        testarExclusao: true   // Marcar para testar exclusão depois
      },
      { 
        tipo: 'entrada', 
        quantidade: 300, 
        unidade: 'g', 
        equivalente: 0.3
      },
      { 
        tipo: 'saida', 
        quantidade: 1.8, 
        unidade: 'kg', 
        equivalente: 1.8,
        testarExclusao: true   // Marcar para testar exclusão depois
      },
      { 
        tipo: 'saida', 
        quantidade: 400, 
        unidade: 'g', 
        equivalente: 0.4
      }
    ]
  },
  {
    nome: 'COMPENSAÇÃO - ATUALIZAÇÃO (l ↔ ml)',
    produto: {
      nome: 'Produto Teste - Compensação por Atualização',
      unidade: 'l',
      quantidade_inicial: 30
    },
    testes: [
      { 
        tipo: 'entrada', 
        quantidade: 3.5, 
        unidade: 'l', 
        equivalente: 3.5,
        testarAtualizacao: {
          novaQuantidade: 2.8,
          novaUnidade: 'l',
          novoEquivalente: 2.8
        }
      },
      { 
        tipo: 'entrada', 
        quantidade: 750, 
        unidade: 'ml', 
        equivalente: 0.75,
        testarAtualizacao: {
          novaQuantidade: 1250,
          novaUnidade: 'ml',
          novoEquivalente: 1.25
        }
      },
      { 
        tipo: 'saida', 
        quantidade: 2, 
        unidade: 'l', 
        equivalente: 2,
        testarAtualizacao: {
          novaQuantidade: 1500,
          novaUnidade: 'ml',
          novoEquivalente: 1.5
        }
      },
      { 
        tipo: 'saida', 
        quantidade: 500, 
        unidade: 'ml', 
        equivalente: 0.5,
        testarAtualizacao: {
          novaQuantidade: 0.7,
          novaUnidade: 'l',
          novoEquivalente: 0.7
        }
      }
    ]
  },
  {
    nome: 'COMPENSAÇÃO - MISTA (m ↔ cm)',
    produto: {
      nome: 'Produto Teste - Compensação Mista',
      unidade: 'm',
      quantidade_inicial: 50
    },
    testes: [
      { 
        tipo: 'entrada', 
        quantidade: 8, 
        unidade: 'm', 
        equivalente: 8,
        testarExclusao: true
      },
      { 
        tipo: 'entrada', 
        quantidade: 350, 
        unidade: 'cm', 
        equivalente: 3.5,
        testarAtualizacao: {
          novaQuantidade: 450,
          novaUnidade: 'cm',
          novoEquivalente: 4.5
        }
      },
      { 
        tipo: 'saida', 
        quantidade: 6.2, 
        unidade: 'm', 
        equivalente: 6.2
      },
      { 
        tipo: 'saida', 
        quantidade: 75, 
        unidade: 'cm', 
        equivalente: 0.75,
        testarExclusao: true
      }
    ]
  }
];

// Funções de conversão de unidades
const converterUnidades = (valor, unidadeOrigem, unidadeDestino) => {
  // Caso sejam iguais, não precisa converter
  if (unidadeOrigem === unidadeDestino) return valor;
  
  // Conversões de peso
  if (unidadeOrigem === 'g' && unidadeDestino === 'kg') return valor / 1000;
  if (unidadeOrigem === 'kg' && unidadeDestino === 'g') return valor * 1000;
  
  // Conversões de volume
  if (unidadeOrigem === 'ml' && unidadeDestino === 'l') return valor / 1000;
  if (unidadeOrigem === 'l' && unidadeDestino === 'ml') return valor * 1000;
  
  // Conversões de comprimento
  if (unidadeOrigem === 'cm' && unidadeDestino === 'm') return valor / 100;
  if (unidadeOrigem === 'm' && unidadeDestino === 'cm') return valor * 100;
  
  // Se não encontrou uma conversão, retorna o valor original
  console.log(`⚠️ Conversão de ${unidadeOrigem} para ${unidadeDestino} não suportada.`);
  return valor;
};

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Função para esperar um determinado tempo
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Formata o nome da unidade para exibição
 */
function formatarUnidade(unidade) {
  const mapeamento = {
    'unidade': 'un.',
    'caixa': 'cx.',
    'kg': 'kg',
    'g': 'g',
    'l': 'L',
    'ml': 'mL',
    'metro': 'm',
    'cm': 'cm',
    'pacote': 'pct.',
    'par': 'par'
  };
  
  return mapeamento[unidade] || unidade;
}

/**
 * Teste do trigger para um produto com uma unidade específica
 */
async function testarTriggerParaUnidade(unidade, categoryId, authData) {
  console.log(`\n\n🔍 TESTANDO TRIGGER COM UNIDADE: ${unidade.toUpperCase()} (${formatarUnidade(unidade)})`);
  console.log('=======================================================');
  
  try {
    // Criar um produto de teste com a unidade específica
    const productCode = `TESTE-${unidade.toUpperCase()}-${Date.now().toString().substring(6)}`;
    console.log(`📦 Criando produto de teste com unidade '${unidade}'...`);
    
    const { data: newProduct, error: newProductError } = await supabase
      .from('products')
      .insert({
        name: `Produto Teste - ${unidade.toUpperCase()}`,
        description: `Produto para teste do trigger com unidade ${unidade}`,
        code: productCode,
        quantity: 100, // Começar com estoque suficiente para testes
        min_quantity: 10,
        unit: unidade,
        category_id: categoryId
      })
      .select();
    
    if (newProductError) {
      throw new Error(`Erro ao criar produto: ${newProductError.message}`);
    }
    
    const testProduct = newProduct[0];
    console.log(`✅ Produto criado: ${testProduct.name} (Código: ${testProduct.code}, ID: ${testProduct.id})`);
    console.log(`🔢 Quantidade inicial: ${testProduct.quantity} ${formatarUnidade(testProduct.unit)}`);
    
    // TESTE 1: Criar movimentação de entrada e verificar atualização automática
    console.log('\n🔄 TESTE 1: Criando movimentação de ENTRADA...');
    const entradaQtd = 50;
    
    const { data: entryMovement, error: entryError } = await supabase
      .from('movements')
      .insert({
        product_id: testProduct.id,
        type: 'entrada',
        quantity: entradaQtd,
        unit: unidade,
        notes: `Teste do trigger - entrada (${unidade})`
      })
      .select();
    
    if (entryError) {
      throw new Error(`Erro ao criar movimentação de entrada: ${entryError.message}`);
    }
    
    console.log(`✅ Movimentação de entrada criada com sucesso! (ID: ${entryMovement[0].id})`);
    
    // Esperar um pouco para o trigger processar
    console.log('Aguardando processamento do trigger...');
    await sleep(300);
    
    // Verificar se o estoque foi atualizado automaticamente
    const { data: productAfterEntry, error: entryCheckError } = await supabase
      .from('products')
      .select('*')
      .eq('id', testProduct.id)
      .single();
      
    if (entryCheckError) {
      throw new Error(`Erro ao verificar produto após entrada: ${entryCheckError.message}`);
    }
    
    const expectedQtyAfterEntry = testProduct.quantity + entradaQtd;
    console.log(`📊 Quantidade após entrada: ${productAfterEntry.quantity} ${formatarUnidade(productAfterEntry.unit)}`);
    
    const successEntry = productAfterEntry.quantity === expectedQtyAfterEntry;
    if (successEntry) {
      console.log(`✅ TRIGGER FUNCIONOU! Quantidade aumentou automaticamente após entrada.`);
      console.log(`   Inicial: ${testProduct.quantity}, Adicionado: ${entradaQtd}, Final: ${productAfterEntry.quantity}`);
    } else {
      console.log(`❌ FALHA NO TRIGGER! Quantidade esperada: ${expectedQtyAfterEntry}, Atual: ${productAfterEntry.quantity}`);
    }
    
    // TESTE 2: Criar movimentação de saída e verificar atualização automática
    console.log('\n🔄 TESTE 2: Criando movimentação de SAÍDA...');
    const saidaQtd = 20;
    
    const { data: exitMovement, error: exitError } = await supabase
      .from('movements')
      .insert({
        product_id: testProduct.id,
        type: 'saida',
        quantity: saidaQtd,
        unit: unidade,
        notes: `Teste do trigger - saída (${unidade})`
      })
      .select();
    
    if (exitError) {
      throw new Error(`Erro ao criar movimentação de saída: ${exitError.message}`);
    }
    
    console.log(`✅ Movimentação de saída criada com sucesso! (ID: ${exitMovement[0].id})`);
    
    // Esperar um pouco para o trigger processar
    console.log('Aguardando processamento do trigger...');
    await sleep(300);
    
    // Verificar se o estoque foi atualizado automaticamente
    const { data: productAfterExit, error: exitCheckError } = await supabase
      .from('products')
      .select('*')
      .eq('id', testProduct.id)
      .single();
      
    if (exitCheckError) {
      throw new Error(`Erro ao verificar produto após saída: ${exitCheckError.message}`);
    }
    
    console.log(`📊 Quantidade após saída: ${productAfterExit.quantity} ${formatarUnidade(productAfterExit.unit)}`);
    
    const expectedQtyAfterExit = productAfterEntry.quantity - saidaQtd;
    const successExit = productAfterExit.quantity === expectedQtyAfterExit;
    
    if (successExit) {
      console.log(`✅ TRIGGER FUNCIONOU! Quantidade diminuiu automaticamente após saída.`);
      console.log(`   Anterior: ${productAfterEntry.quantity}, Subtraído: ${saidaQtd}, Final: ${productAfterExit.quantity}`);
    } else {
      console.log(`❌ FALHA NO TRIGGER! Quantidade esperada: ${expectedQtyAfterExit}, Atual: ${productAfterExit.quantity}`);
    }
    
    // Resultado do teste para esta unidade
    console.log(`\n📋 RESULTADO PARA UNIDADE ${unidade.toUpperCase()}:`);
    console.log(`✅ Teste de entrada: ${successEntry ? 'PASSOU' : 'FALHOU'}`);
    console.log(`✅ Teste de saída: ${successExit ? 'PASSOU' : 'FALHOU'}`);
    
    const allPassed = successEntry && successExit;
    if (allPassed) {
      console.log(`✅ O trigger está funcionando corretamente para a unidade ${unidade.toUpperCase()}!`);
    } else {
      console.log(`❌ Falhas detectadas para a unidade ${unidade.toUpperCase()}!`);
    }
    
    return {
      unidade,
      successEntry,
      successExit,
      allPassed
    };
    
  } catch (error) {
    console.error(`\n❌ ERRO DURANTE O TESTE DE ${unidade.toUpperCase()}:`, error.message);
    return {
      unidade,
      successEntry: false,
      successExit: false,
      allPassed: false,
      error: error.message
    };
  }
}

/**
 * Teste do trigger para conversões entre unidades de medida
 */
async function testarConversaoUnidades(conversao, categoryId, authData) {
  console.log(`\n\n🔍 TESTANDO CONVERSÃO: ${conversao.nome}`);
  console.log('=======================================================');
  
  try {
    // Criar um produto de teste com a unidade base
    const productCode = `TESTE-CONV-${Date.now().toString().substring(6)}`;
    const prodConfig = conversao.produto;
    
    console.log(`📦 Criando produto de teste com unidade '${prodConfig.unidade}'...`);
    
    const { data: newProduct, error: newProductError } = await supabase
      .from('products')
      .insert({
        name: prodConfig.nome,
        description: `Produto para teste de conversão de unidades`,
        code: productCode,
        quantity: prodConfig.quantidade_inicial,
        min_quantity: 1,
        unit: prodConfig.unidade,
        category_id: categoryId
      })
      .select();
    
    if (newProductError) {
      throw new Error(`Erro ao criar produto: ${newProductError.message}`);
    }
    
    const testProduct = newProduct[0];
    console.log(`✅ Produto criado: ${testProduct.name} (Código: ${testProduct.code}, ID: ${testProduct.id})`);
    console.log(`🔢 Quantidade inicial: ${testProduct.quantity} ${formatarUnidade(testProduct.unit)}`);
    
    let quantidadeAtual = testProduct.quantity;
    let testesPassados = 0;
    const totalTestes = conversao.testes.length;
    
    // Executar cada teste de conversão
    for (let i = 0; i < conversao.testes.length; i++) {
      const teste = conversao.testes[i];
      const tipoTexto = teste.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA';
      const operadorTexto = teste.tipo === 'entrada' ? '+' : '-';
      
      console.log(`\n🔄 TESTE ${i+1}: ${tipoTexto} de ${teste.quantidade} ${formatarUnidade(teste.unidade)}`);
      
      // Registrar movimentação
      const { data: movement, error: movementError } = await supabase
        .from('movements')
        .insert({
          product_id: testProduct.id,
          type: teste.tipo,
          quantity: teste.quantidade,
          unit: teste.unidade,
          notes: `Teste de conversão - ${teste.unidade} para ${testProduct.unit}`
        })
        .select();
      
      if (movementError) {
        throw new Error(`Erro ao criar movimentação: ${movementError.message}`);
      }
      
      console.log(`✅ Movimentação criada com sucesso! (ID: ${movement[0].id})`);
      
      // Esperar um pouco para o trigger processar
      console.log('Aguardando processamento do trigger...');
      await sleep(300);
      
      // Verificar se o estoque foi atualizado automaticamente e corretamente
      const { data: productAfterMovement, error: checkError } = await supabase
        .from('products')
        .select('*')
        .eq('id', testProduct.id)
        .single();
        
      if (checkError) {
        throw new Error(`Erro ao verificar produto após movimentação: ${checkError.message}`);
      }
      
      // Calcular a quantidade esperada após a conversão
      const variacao = teste.tipo === 'entrada' ? teste.equivalente : -teste.equivalente;
      const expectedQty = quantidadeAtual + variacao;
      
      console.log(`📊 Quantidade após ${tipoTexto}: ${productAfterMovement.quantity} ${formatarUnidade(productAfterMovement.unit)}`);
      console.log(`📝 Cálculo: ${quantidadeAtual} ${operadorTexto} ${teste.equivalente} = ${expectedQty}`);
      
      // Verificar com uma tolerância para números de ponto flutuante
      const tolerance = 0.0001;
      const diff = Math.abs(productAfterMovement.quantity - expectedQty);
      const success = diff < tolerance;
      
      if (success) {
        console.log(`✅ CONVERSÃO CORRETA! O trigger aplicou a conversão de unidades adequadamente.`);
        testesPassados++;
      } else {
        console.log(`❌ FALHA NA CONVERSÃO! Esperada: ${expectedQty}, Atual: ${productAfterMovement.quantity}`);
        console.log(`   Diferença: ${diff} (tolerância: ${tolerance})`);
      }
      
      // Atualizar a quantidade atual para o próximo teste
      quantidadeAtual = productAfterMovement.quantity;
    }
    
    // Resultado dos testes para esta conversão
    console.log(`\n📋 RESULTADO PARA CONVERSÃO ${conversao.nome}:`);
    console.log(`✅ Testes passados: ${testesPassados}/${totalTestes}`);
    
    const allPassed = testesPassados === totalTestes;
    if (allPassed) {
      console.log(`✅ As conversões de unidades estão funcionando corretamente!`);
    } else {
      console.log(`❌ Algumas conversões de unidades falharam. Verifique os detalhes acima.`);
    }
    
    return {
      nome: conversao.nome,
      testesPassados,
      totalTestes,
      allPassed
    };
    
  } catch (error) {
    console.error(`\n❌ ERRO DURANTE O TESTE DE CONVERSÃO ${conversao.nome}:`, error.message);
    return {
      nome: conversao.nome,
      testesPassados: 0,
      totalTestes: conversao.testes.length,
      allPassed: false,
      error: error.message
    };
  }
}

/**
 * Teste do trigger para compensações de alterações (update e delete)
 */
async function testarCompensacaoUnidades(conversao, categoryId, authData) {
  console.log(`\n\n🔍 TESTANDO COMPENSAÇÕES: ${conversao.nome}`);
  console.log('=======================================================');
  
  try {
    // Criar um produto de teste com a unidade base, similar ao testarConversaoUnidades
    const productCode = `TESTE-COMP-${Date.now().toString().substring(6)}`;
    const prodConfig = conversao.produto;
    
    console.log(`📦 Criando produto de teste com unidade '${prodConfig.unidade}'...`);
    
    const { data: newProduct, error: newProductError } = await supabase
      .from('products')
      .insert({
        name: prodConfig.nome,
        description: `Produto para teste de compensações`,
        code: productCode,
        quantity: prodConfig.quantidade_inicial,
        min_quantity: 1,
        unit: prodConfig.unidade,
        category_id: categoryId
      })
      .select();
    
    if (newProductError) {
      throw new Error(`Erro ao criar produto: ${newProductError.message}`);
    }
    
    const testProduct = newProduct[0];
    console.log(`✅ Produto criado: ${testProduct.name} (Código: ${testProduct.code}, ID: ${testProduct.id})`);
    console.log(`🔢 Quantidade inicial: ${testProduct.quantity} ${formatarUnidade(testProduct.unit)}`);
    
    let quantidadeAtual = testProduct.quantity;
    let testesPassados = 0;
    let totalTestes = 0;
    const movimentacoesParaCompensar = [];
    
    // Fase 1: Criar movimentações
    console.log(`\n📝 FASE 1: CRIAÇÃO DE MOVIMENTAÇÕES`);
    
    for (let i = 0; i < conversao.testes.length; i++) {
      const teste = conversao.testes[i];
      const tipoTexto = teste.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA';
      const operadorTexto = teste.tipo === 'entrada' ? '+' : '-';
      
      console.log(`\n🔄 MOVIMENTAÇÃO ${i+1}: ${tipoTexto} de ${teste.quantidade} ${formatarUnidade(teste.unidade)}`);
      
      // Registrar movimentação
      const { data: movement, error: movementError } = await supabase
        .from('movements')
        .insert({
          product_id: testProduct.id,
          type: teste.tipo,
          quantity: teste.quantidade,
          unit: teste.unidade,
          notes: `Teste de compensação - ${teste.unidade} para ${testProduct.unit}`
        })
        .select();
      
      if (movementError) {
        throw new Error(`Erro ao criar movimentação: ${movementError.message}`);
      }
      
      console.log(`✅ Movimentação criada com sucesso! (ID: ${movement[0].id})`);
      
      // Guardar movimento para teste de compensação posterior
      if (teste.testarExclusao || teste.testarAtualizacao) {
        movimentacoesParaCompensar.push({
          id: movement[0].id,
          teste: teste,
          indice: i
        });
      }
      
      // Esperar um pouco para o trigger processar
      console.log('Aguardando processamento do trigger...');
      await sleep(300);
      
      // Verificar se o estoque foi atualizado automaticamente e corretamente
      const { data: productAfterMovement, error: checkError } = await supabase
        .from('products')
        .select('*')
        .eq('id', testProduct.id)
        .single();
        
      if (checkError) {
        throw new Error(`Erro ao verificar produto após movimentação: ${checkError.message}`);
      }
      
      // Calcular a quantidade esperada após a conversão
      const variacao = teste.tipo === 'entrada' ? teste.equivalente : -teste.equivalente;
      const expectedQty = quantidadeAtual + variacao;
      
      console.log(`📊 Quantidade após ${tipoTexto}: ${productAfterMovement.quantity} ${formatarUnidade(productAfterMovement.unit)}`);
      console.log(`📝 Cálculo: ${quantidadeAtual} ${operadorTexto} ${teste.equivalente} = ${expectedQty}`);
      
      // Verificar com uma tolerância para números de ponto flutuante
      const tolerance = 0.0001;
      const diff = Math.abs(productAfterMovement.quantity - expectedQty);
      const success = diff < tolerance;
      
      if (success) {
        console.log(`✅ REGISTRADO CORRETAMENTE! O trigger aplicou a conversão de unidades adequadamente.`);
        testesPassados++;
      } else {
        console.log(`❌ FALHA NO REGISTRO! Esperada: ${expectedQty}, Atual: ${productAfterMovement.quantity}`);
        console.log(`   Diferença: ${diff} (tolerância: ${tolerance})`);
      }
      
      totalTestes++;
      
      // Atualizar a quantidade atual para o próximo teste
      quantidadeAtual = productAfterMovement.quantity;
    }
    
    // Fase 2: Testar compensações (exclusões e atualizações)
    if (movimentacoesParaCompensar.length > 0) {
      console.log(`\n📝 FASE 2: TESTANDO COMPENSAÇÕES`);
      
      for (const movimentacao of movimentacoesParaCompensar) {
        const teste = movimentacao.teste;
        const tipoTexto = teste.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA';
        const operadorTexto = teste.tipo === 'entrada' ? '-' : '+'; // Operador inverso para compensação
        
        // Testar exclusão de movimento
        if (teste.testarExclusao) {
          console.log(`\n🔄 EXCLUSÃO DA MOVIMENTAÇÃO ${movimentacao.indice + 1}: ${tipoTexto} de ${teste.quantidade} ${formatarUnidade(teste.unidade)}`);
          
          // Excluir a movimentação
          const { error: deleteError } = await supabase
            .from('movements')
            .delete()
            .eq('id', movimentacao.id);
          
          if (deleteError) {
            throw new Error(`Erro ao excluir movimentação: ${deleteError.message}`);
          }
          
          console.log(`✅ Movimentação excluída com sucesso! (ID: ${movimentacao.id})`);
          
          // Esperar um pouco para o trigger processar
          console.log('Aguardando processamento do trigger...');
          await sleep(300);
          
          // Verificar se o estoque foi compensado corretamente
          const { data: productAfterDelete, error: checkError } = await supabase
            .from('products')
            .select('*')
            .eq('id', testProduct.id)
            .single();
            
          if (checkError) {
            throw new Error(`Erro ao verificar produto após exclusão: ${checkError.message}`);
          }
          
          // Calcular a quantidade esperada após a compensação (reverter a movimentação)
          const variacao = teste.tipo === 'entrada' ? -teste.equivalente : teste.equivalente;
          const expectedQty = quantidadeAtual + variacao;
          
          console.log(`📊 Quantidade após EXCLUSÃO: ${productAfterDelete.quantity} ${formatarUnidade(productAfterDelete.unit)}`);
          console.log(`📝 Cálculo: ${quantidadeAtual} ${operadorTexto} ${teste.equivalente} = ${expectedQty}`);
          
          // Verificar com uma tolerância para números de ponto flutuante
          const tolerance = 0.0001;
          const diff = Math.abs(productAfterDelete.quantity - expectedQty);
          const success = diff < tolerance;
          
          if (success) {
            console.log(`✅ COMPENSAÇÃO CORRETA! O trigger reverteu a quantidade adequadamente após a exclusão.`);
            testesPassados++;
          } else {
            console.log(`❌ FALHA NA COMPENSAÇÃO! Esperada: ${expectedQty}, Atual: ${productAfterDelete.quantity}`);
            console.log(`   Diferença: ${diff} (tolerância: ${tolerance})`);
          }
          
          totalTestes++;
          
          // Atualizar a quantidade atual para o próximo teste
          quantidadeAtual = productAfterDelete.quantity;
        }
        
        // Testar atualização de movimento
        if (teste.testarAtualizacao) {
          const atualizacao = teste.testarAtualizacao;
          console.log(`\n🔄 ATUALIZAÇÃO DA MOVIMENTAÇÃO ${movimentacao.indice + 1}: ${tipoTexto} de ${teste.quantidade} ${formatarUnidade(teste.unidade)} -> ${atualizacao.novaQuantidade} ${formatarUnidade(atualizacao.novaUnidade)}`);
          
          // Atualizar a movimentação
          const { error: updateError } = await supabase
            .from('movements')
            .update({
              quantity: atualizacao.novaQuantidade,
              unit: atualizacao.novaUnidade
            })
            .eq('id', movimentacao.id);
          
          if (updateError) {
            throw new Error(`Erro ao atualizar movimentação: ${updateError.message}`);
          }
          
          console.log(`✅ Movimentação atualizada com sucesso! (ID: ${movimentacao.id})`);
          
          // Esperar um pouco para o trigger processar
          console.log('Aguardando processamento do trigger...');
          await sleep(300);
          
          // Verificar se o estoque foi compensado corretamente
          const { data: productAfterUpdate, error: checkError } = await supabase
            .from('products')
            .select('*')
            .eq('id', testProduct.id)
            .single();
            
          if (checkError) {
            throw new Error(`Erro ao verificar produto após atualização: ${checkError.message}`);
          }
          
          // Calcular a quantidade esperada após a compensação
          // Primeiro reverte o movimento original, depois aplica o novo
          const revertOriginal = teste.tipo === 'entrada' ? -teste.equivalente : teste.equivalente;
          const aplicarNovo = teste.tipo === 'entrada' ? atualizacao.novoEquivalente : -atualizacao.novoEquivalente;
          const expectedQty = quantidadeAtual + revertOriginal + aplicarNovo;
          
          console.log(`📊 Quantidade após ATUALIZAÇÃO: ${productAfterUpdate.quantity} ${formatarUnidade(productAfterUpdate.unit)}`);
          console.log(`📝 Cálculo: ${quantidadeAtual} + (${revertOriginal}) + (${aplicarNovo}) = ${expectedQty}`);
          
          // Verificar com uma tolerância para números de ponto flutuante
          const tolerance = 0.0001;
          const diff = Math.abs(productAfterUpdate.quantity - expectedQty);
          const success = diff < tolerance;
          
          if (success) {
            console.log(`✅ COMPENSAÇÃO CORRETA! O trigger ajustou a quantidade adequadamente após a atualização.`);
            testesPassados++;
          } else {
            console.log(`❌ FALHA NA COMPENSAÇÃO! Esperada: ${expectedQty}, Atual: ${productAfterUpdate.quantity}`);
            console.log(`   Diferença: ${diff} (tolerância: ${tolerance})`);
          }
          
          totalTestes++;
          
          // Atualizar a quantidade atual para o próximo teste
          quantidadeAtual = productAfterUpdate.quantity;
        }
      }
    }
    
    // Fase 3: Testar marcação como deleted (soft delete)
    if (movimentacoesParaCompensar.length > 0) {
      console.log(`\n📝 FASE 3: TESTANDO SOFT DELETE (DELETED = TRUE)`);
      
      // Obter movimentações não excluídas
      const { data: activeMovements, error: queryError } = await supabase
        .from('movements')
        .select('*')
        .eq('product_id', testProduct.id)
        .is('deleted', null);
      
      if (queryError) {
        throw new Error(`Erro ao consultar movimentações ativas: ${queryError.message}`);
      }
      
      if (activeMovements && activeMovements.length > 0) {
        // Testar com o primeiro movimento ativo encontrado
        const movimento = activeMovements[0];
        const tipoTexto = movimento.type === 'entrada' ? 'ENTRADA' : 'SAÍDA';
        const operadorTexto = movimento.type === 'entrada' ? '-' : '+'; // Operador inverso para compensação
        
        console.log(`\n🔄 SOFT DELETE (DELETED=TRUE) DA MOVIMENTAÇÃO: ${tipoTexto} de ${movimento.quantity} ${formatarUnidade(movimento.unit || testProduct.unit)}`);
        
        // Calcular o equivalente no produto
        let equivalente = movimento.quantity;
        if (movimento.unit && movimento.unit !== testProduct.unit) {
          // Simulando a conversão que o trigger fará
          equivalente = converterUnidades(movimento.quantity, movimento.unit, testProduct.unit);
        }
        
        // Marcar como deleted
        const { error: updateError } = await supabase
          .from('movements')
          .update({
            deleted: true
          })
          .eq('id', movimento.id);
        
        if (updateError) {
          throw new Error(`Erro ao marcar movimentação como deleted: ${updateError.message}`);
        }
        
        console.log(`✅ Movimentação marcada como deleted com sucesso! (ID: ${movimento.id})`);
        
        // Esperar um pouco para o trigger processar
        console.log('Aguardando processamento do trigger...');
        await sleep(300);
        
        // Verificar se o estoque foi compensado corretamente
        const { data: productAfterDelete, error: checkError } = await supabase
          .from('products')
          .select('*')
          .eq('id', testProduct.id)
          .single();
          
        if (checkError) {
          throw new Error(`Erro ao verificar produto após soft delete: ${checkError.message}`);
        }
        
        // Calcular a quantidade esperada após a compensação (reverter a movimentação)
        const variacao = movimento.type === 'entrada' ? -equivalente : equivalente;
        const expectedQty = quantidadeAtual + variacao;
        
        console.log(`📊 Quantidade após SOFT DELETE: ${productAfterDelete.quantity} ${formatarUnidade(productAfterDelete.unit)}`);
        console.log(`📝 Cálculo: ${quantidadeAtual} ${operadorTexto} ${equivalente} = ${expectedQty}`);
        
        // Verificar com uma tolerância para números de ponto flutuante
        const tolerance = 0.0001;
        const diff = Math.abs(productAfterDelete.quantity - expectedQty);
        const success = diff < tolerance;
        
        if (success) {
          console.log(`✅ COMPENSAÇÃO CORRETA! O trigger reverteu a quantidade adequadamente após o soft delete.`);
          testesPassados++;
        } else {
          console.log(`❌ FALHA NA COMPENSAÇÃO! Esperada: ${expectedQty}, Atual: ${productAfterDelete.quantity}`);
          console.log(`   Diferença: ${diff} (tolerância: ${tolerance})`);
        }
        
        totalTestes++;
      } else {
        console.log(`⚠️ Nenhuma movimentação ativa encontrada para testar soft delete.`);
      }
    }
    
    // Resultado dos testes para esta compensação
    console.log(`\n📋 RESULTADO PARA COMPENSAÇÕES ${conversao.nome}:`);
    console.log(`✅ Testes passados: ${testesPassados}/${totalTestes}`);
    
    const allPassed = testesPassados === totalTestes;
    if (allPassed) {
      console.log(`✅ Todas as compensações estão funcionando corretamente!`);
    } else {
      console.log(`❌ Algumas compensações falharam. Verifique os detalhes acima.`);
    }
    
    return {
      nome: conversao.nome,
      testesPassados,
      totalTestes,
      allPassed
    };
    
  } catch (error) {
    console.error(`\n❌ ERRO DURANTE O TESTE DE COMPENSAÇÃO ${conversao.nome}:`, error.message);
    return {
      nome: conversao.nome,
      testesPassados: 0,
      totalTestes: 0,
      allPassed: false,
      error: error.message
    };
  }
}

/**
 * Testa o trigger de atualização automática de estoque para todas as unidades e conversões
 */
async function testarTriggerEstoqueTodasUnidades() {
  console.log('🧪 TESTE DO TRIGGER DE ATUALIZAÇÃO AUTOMÁTICA DE ESTOQUE');
  console.log('=======================================================');
  
  try {
    // Autenticação
    console.log('\n🔑 AUTENTICAÇÃO NO SISTEMA...');
    
    // Pedir credenciais ao usuário
    const email = await promptUser("Digite seu email: ");
    const password = await promptUser("Digite sua senha: ");
    
    console.log('\nRealizando login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError) {
      throw new Error(`Erro ao fazer login: ${authError.message}`);
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log(`📊 Usuário: ${authData.user.email}`);

    // Verificar se existe categoria para teste
    console.log('\n📂 Verificando categorias...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);
    
    if (categoriesError) {
      throw new Error(`Erro ao consultar categorias: ${categoriesError.message}`);
    }
    
    let categoryId;
    
    if (categories.length === 0) {
      // Criar categoria se não existir
      const { data: newCategory, error: newCategoryError } = await supabase
        .from('categories')
        .insert({
          name: 'Categoria Testes',
          description: 'Categoria para testes automatizados'
        })
        .select();
      
      if (newCategoryError) {
        throw new Error(`Erro ao criar categoria: ${newCategoryError.message}`);
      }
      
      categoryId = newCategory[0].id;
      console.log(`✅ Categoria criada: ${newCategory[0].name} (ID: ${categoryId})`);
    } else {
      categoryId = categories[0].id;
      console.log(`✅ Usando categoria existente: ${categories[0].name} (ID: ${categoryId})`);
    }
    
    // Escolher o tipo de teste
    console.log('\n📝 ESCOLHA O TIPO DE TESTE:');
    console.log('1. Testar unidades individuais');
    console.log('2. Testar conversões entre unidades (kg ↔ g, l ↔ ml, m ↔ cm)');
    console.log('3. Testar compensações (exclusão e atualização de movimentações)');
    console.log('4. Testar tudo');
    
    const tipoTeste = await promptUser("Escolha uma opção (1/2/3/4, padrão: 2): ");
    
    const testarUnidades = ['1', '4'].includes(tipoTeste);
    const testarConversoes = ['2', '4'].includes(tipoTeste) || !tipoTeste || tipoTeste === '';
    const testarCompensacoes = ['3', '4'].includes(tipoTeste);
    
    const resultadosUnidades = [];
    const resultadosConversoes = [];
    const resultadosCompensacoes = [];
    
    // === TESTES DE UNIDADES INDIVIDUAIS ===
    if (testarUnidades) {
      console.log(`\n🔄 Iniciando testes para ${UNIDADES_PARA_TESTAR.length} unidades diferentes...`);
      
      // Perguntar quais unidades testar
      const resposta = await promptUser("Testar todas as unidades? (S/N, padrão: N, testar apenas unidade): ");
      
      let unidadesParaTestar = ['unidade']; // Padrão: testar apenas unidade
      
      if (resposta.toUpperCase() === 'S') {
        unidadesParaTestar = UNIDADES_PARA_TESTAR;
      } else {
        // Permitir escolher uma unidade específica
        const escolhaUnidade = await promptUser(`Escolha uma unidade para testar ${UNIDADES_PARA_TESTAR.join(', ')}: `);
        if (UNIDADES_PARA_TESTAR.includes(escolhaUnidade)) {
          unidadesParaTestar = [escolhaUnidade];
        }
      }
      
      for (const unidade of unidadesParaTestar) {
        const resultado = await testarTriggerParaUnidade(unidade, categoryId, authData);
        resultadosUnidades.push(resultado);
      }
    }
    
    // === TESTES DE CONVERSÃO ENTRE UNIDADES ===
    if (testarConversoes) {
      console.log(`\n🔄 Iniciando testes de conversão entre unidades...`);
      
      for (const conversao of CONVERSOES_PARA_TESTAR) {
        const resultado = await testarConversaoUnidades(conversao, categoryId, authData);
        resultadosConversoes.push(resultado);
      }
    }
    
    // === TESTES DE COMPENSAÇÃO ===
    if (testarCompensacoes) {
      console.log(`\n🔄 Iniciando testes de compensação de movimentações...`);
      
      // Testar apenas as conversões que têm opções de compensação
      const compensacoesParaTestar = CONVERSOES_PARA_TESTAR.filter(c => 
        c.nome.startsWith('COMPENSAÇÃO')
      );
      
      for (const compensacao of compensacoesParaTestar) {
        const resultado = await testarCompensacaoUnidades(compensacao, categoryId, authData);
        resultadosCompensacoes.push(resultado);
      }
    }
    
    // === RELATÓRIO FINAL ===
    console.log('\n\n📊 RELATÓRIO FINAL DOS TESTES:');
    console.log('=======================================================');
    
    // Relatório de unidades individuais
    if (testarUnidades && resultadosUnidades.length > 0) {
      console.log('\n📋 RESULTADO DOS TESTES DE UNIDADES INDIVIDUAIS:');
      
      for (const resultado of resultadosUnidades) {
        const status = resultado.allPassed ? '✅ PASSOU' : '❌ FALHOU';
        console.log(`${status} - ${resultado.unidade.toUpperCase()} (${formatarUnidade(resultado.unidade)})`);
        
        if (!resultado.allPassed && resultado.error) {
          console.log(`   Erro: ${resultado.error}`);
        }
      }
      
      const totalPassouUnidades = resultadosUnidades.filter(r => r.allPassed).length;
      console.log(`\n✅ Total de unidades testadas com sucesso: ${totalPassouUnidades}/${resultadosUnidades.length}`);
    }
    
    // Relatório de conversões entre unidades
    if (testarConversoes && resultadosConversoes.length > 0) {
      console.log('\n📋 RESULTADO DOS TESTES DE CONVERSÃO ENTRE UNIDADES:');
      
      for (const resultado of resultadosConversoes) {
        const status = resultado.allPassed ? '✅ PASSOU' : '❌ FALHOU';
        console.log(`${status} - ${resultado.nome}: ${resultado.testesPassados}/${resultado.totalTestes} testes`);
        
        if (!resultado.allPassed && resultado.error) {
          console.log(`   Erro: ${resultado.error}`);
        }
      }
      
      const totalPassouConversoes = resultadosConversoes.filter(r => r.allPassed).length;
      console.log(`\n✅ Total de conversões testadas com sucesso: ${totalPassouConversoes}/${resultadosConversoes.length}`);
    }
    
    // Relatório de compensações
    if (testarCompensacoes && resultadosCompensacoes.length > 0) {
      console.log('\n📋 RESULTADO DOS TESTES DE COMPENSAÇÃO:');
      
      for (const resultado of resultadosCompensacoes) {
        const status = resultado.allPassed ? '✅ PASSOU' : '❌ FALHOU';
        console.log(`${status} - ${resultado.nome}: ${resultado.testesPassados}/${resultado.totalTestes} testes`);
        
        if (!resultado.allPassed && resultado.error) {
          console.log(`   Erro: ${resultado.error}`);
        }
      }
      
      const totalPassouCompensacoes = resultadosCompensacoes.filter(r => r.allPassed).length;
      console.log(`\n✅ Total de compensações testadas com sucesso: ${totalPassouCompensacoes}/${resultadosCompensacoes.length}`);
    }
    
    // Resultado global
    const todosUnidadesPassaram = resultadosUnidades.every(r => r.allPassed);
    const todosConversoesPassaram = resultadosConversoes.every(r => r.allPassed);
    const todosCompensacoesPassaram = resultadosCompensacoes.every(r => r.allPassed);
    const todosPassaram = 
      (testarUnidades ? todosUnidadesPassaram : true) && 
      (testarConversoes ? todosConversoesPassaram : true) &&
      (testarCompensacoes ? todosCompensacoesPassaram : true);
    
    console.log('\n=======================================================');
    if (todosPassaram) {
      console.log('🎉 TODOS OS TESTES PASSARAM! O trigger está funcionando corretamente!');
      if (testarUnidades) {
        console.log('✅ A atualização automática de estoque funciona para todas as unidades testadas.');
      }
      if (testarConversoes) {
        console.log('✅ As conversões entre unidades estão funcionando corretamente.');
      }
      if (testarCompensacoes) {
        console.log('✅ As compensações automáticas (exclusão e atualização) estão funcionando corretamente.');
      }
    } else {
      console.log('⚠️ ALGUNS TESTES FALHARAM! Verifique os detalhes acima.');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO DURANTE OS TESTES:', error.message);
  } finally {
    rl.close();
  }
}

// Executar os testes
testarTriggerEstoqueTodasUnidades(); 