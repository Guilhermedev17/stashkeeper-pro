import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Configurar dotenv
dotenv.config();

// Criar cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Constantes para fatores de conversão
const CONVERSION_FACTORS = {
  GRAMS_TO_KG: 0.001,    // 1g = 0.001kg
  KG_TO_GRAMS: 1000,     // 1kg = 1000g
  ML_TO_LITERS: 0.001,   // 1ml = 0.001L
  LITERS_TO_ML: 1000,    // 1L = 1000ml
};

// Função para normalizar unidades
const normalizeUnit = (unit) => {
  const u = unit.toLowerCase().trim();
  
  // Normalizar unidades de litro
  if (u === 'l' || u === 'litro' || u === 'litros' || u === 'lt' || u === 'lts') {
      return 'l';
  }
  
  // Normalizar unidades de mililitro
  if (u === 'ml' || u === 'mililitro' || u === 'mililitros') {
      return 'ml';
  }
  
  // Normalizar unidades de quilograma
  if (u === 'kg' || u === 'quilo' || u === 'quilos' || u === 'quilograma' || u === 'quilogramas' || u === 'kilo' || u === 'kilos') {
      return 'kg';
  }
  
  // Normalizar unidades de grama
  if (u === 'g' || u === 'grama' || u === 'gramas') {
      return 'g';
  }
  
  return u;
};

// Função para converter quantidades
const normalizeQuantityForComparison = (value, fromUnit, toUnit) => {
  // Normalizar unidades
  const fromUnitNormalized = normalizeUnit(fromUnit);
  const toUnitNormalized = normalizeUnit(toUnit);
  
  // Se as unidades são iguais, não é necessário converter
  if (fromUnitNormalized === toUnitNormalized || fromUnit === 'default') {
      return Number(value.toFixed(3)); // Limitar a 3 casas decimais
  }
  
  let convertedValue;
  
  // ml para L
  if (fromUnitNormalized === 'ml' && toUnitNormalized === 'l') {
      convertedValue = value * CONVERSION_FACTORS.ML_TO_LITERS;
  }
  
  // L para ml
  else if (fromUnitNormalized === 'l' && toUnitNormalized === 'ml') {
      convertedValue = value * CONVERSION_FACTORS.LITERS_TO_ML;
  }
  
  // g para kg
  else if (fromUnitNormalized === 'g' && toUnitNormalized === 'kg') {
      convertedValue = value * CONVERSION_FACTORS.GRAMS_TO_KG;
  }
  
  // kg para g
  else if (fromUnitNormalized === 'kg' && toUnitNormalized === 'g') {
      convertedValue = value * CONVERSION_FACTORS.KG_TO_GRAMS;
  }
  else {
      // Nenhuma conversão específica encontrada
      convertedValue = value;
  }
  
  // Limitar a 3 casas decimais para evitar problemas de precisão
  return Number(convertedValue.toFixed(3));
};

// Função para validar estoque
const validateStock = (productQuantity, requestedQuantity, requestedUnit, productUnit) => {
  // Converter a quantidade solicitada para a unidade do produto
  const convertedQuantity = normalizeQuantityForComparison(
      requestedQuantity,
      requestedUnit === 'default' ? productUnit : requestedUnit,
      productUnit
  );

  // Verificação com tolerância de 0.01
  if (convertedQuantity > (productQuantity + 0.01)) {
      return {
          valid: false,
          message: 'Quantidade não pode ser maior que o estoque disponível'
      };
  }

  return {
      valid: true,
      message: null
  };
};

// Função para executar o teste e verificar se o resultado é o esperado
const testarConversao = (fromValue, fromUnit, toUnit, valorEsperado) => {
  const resultado = normalizeQuantityForComparison(fromValue, fromUnit, toUnit);
  const passou = Math.abs(resultado - valorEsperado) < 0.001; // Tolerância para comparação
  
  console.log(`${passou ? '✅' : '❌'} ${fromValue} ${fromUnit} → ${toUnit} = ${resultado} (esperado: ${valorEsperado})`);
  
  return passou;
};

// Função para executar o teste de validação de estoque
const testarValidacaoEstoque = (estoqueDisponivel, unidadeEstoque, quantidadeSolicitada, unidadeSolicitada, resultadoEsperado) => {
  const resultado = validateStock(estoqueDisponivel, quantidadeSolicitada, unidadeSolicitada, unidadeEstoque);
  const passou = resultado.valid === resultadoEsperado;
  
  console.log(`${passou ? '✅' : '❌'} Estoque: ${estoqueDisponivel} ${unidadeEstoque}, Solicitado: ${quantidadeSolicitada} ${unidadeSolicitada} → ${resultado.valid ? 'Válido' : 'Inválido'} (esperado: ${resultadoEsperado ? 'Válido' : 'Inválido'})`);
  
  return passou;
};

// Função principal com cenários de teste
async function main() {
  try {
    console.log("\n============ TESTES DE VERIFICAÇÃO DE CONVERSÃO ============\n");
    
    let totais = {
      testes: 0,
      aprovados: 0
    };
    
    console.log("1. CONVERSÕES DE VOLUME (L e ML):");
    
    // Testes de conversão de volume
    let passou = testarConversao(1, 'l', 'ml', 1000);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(1, 'litro', 'ml', 1000);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(2.5, 'L', 'ml', 2500);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(0.5, 'l', 'ml', 500);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(1000, 'ml', 'l', 1);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(500, 'ml', 'l', 0.5);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(250, 'ml', 'litros', 0.25);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    console.log("\n2. CONVERSÕES DE PESO (KG e G):");
    
    // Testes de conversão de peso
    passou = testarConversao(1, 'kg', 'g', 1000);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(1, 'quilo', 'g', 1000);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(2.5, 'kg', 'g', 2500);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(0.5, 'kg', 'g', 500);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(1000, 'g', 'kg', 1);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(500, 'g', 'kg', 0.5);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(250, 'g', 'quilos', 0.25);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    console.log("\n3. TESTES DE VALORES FRACIONADOS:");
    
    // Testes com valores fracionados
    passou = testarConversao(0.125, 'l', 'ml', 125);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(0.075, 'kg', 'g', 75);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(1.5, 'l', 'ml', 1500);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarConversao(0.333, 'kg', 'g', 333);
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    console.log("\n4. TESTES DE VALIDAÇÃO DE ESTOQUE:");
    
    // Testes de validação de estoque
    passou = testarValidacaoEstoque(10, 'l', 5, 'l', true); // Solicitação < estoque
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarValidacaoEstoque(10, 'l', 10, 'l', true); // Solicitação = estoque
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarValidacaoEstoque(10, 'l', 10.01, 'l', true); // Solicitação marginalmente maior (tolerância)
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarValidacaoEstoque(10, 'l', 10.02, 'l', false); // Solicitação acima da tolerância
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarValidacaoEstoque(10, 'l', 9000, 'ml', true); // 9000ml = 9l < 10l
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarValidacaoEstoque(10, 'l', 10000, 'ml', true); // 10000ml = 10l = estoque
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarValidacaoEstoque(10, 'l', 10010, 'ml', true); // 10010ml = 10.01l (dentro da tolerância)
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarValidacaoEstoque(10, 'l', 10020, 'ml', false); // 10020ml = 10.02l (acima da tolerância)
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarValidacaoEstoque(2.5, 'kg', 2000, 'g', true); // 2000g = 2kg < 2.5kg
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarValidacaoEstoque(2.5, 'kg', 2500, 'g', true); // 2500g = 2.5kg = estoque
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarValidacaoEstoque(2.5, 'kg', 2510, 'g', true); // 2510g = 2.51kg (dentro da tolerância)
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    passou = testarValidacaoEstoque(2.5, 'kg', 2520, 'g', false); // 2520g = 2.52kg (acima da tolerância)
    totais.testes++; totais.aprovados += passou ? 1 : 0;
    
    // Resumo dos testes
    console.log(`\n============ RESUMO ============`);
    console.log(`Total de testes: ${totais.testes}`);
    console.log(`Testes aprovados: ${totais.aprovados}`);
    console.log(`Taxa de sucesso: ${((totais.aprovados / totais.testes) * 100).toFixed(2)}%`);
    
    if (totais.aprovados === totais.testes) {
      console.log(`\n✅ TODOS OS TESTES PASSARAM COM SUCESSO! ✅`);
    } else {
      console.log(`\n❌ ATENÇÃO: ${totais.testes - totais.aprovados} TESTE(S) FALHOU(ARAM)! ❌`);
    }

  } catch (err) {
    console.error("Erro durante o teste:", err);
  }
}

// Executar o script
main(); 