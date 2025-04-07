import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

// Funções de conversão (copiadas do ModernMovementDialog.tsx)
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

const normalizeQuantityForComparison = (
  value,
  fromUnit,
  toUnit
) => {
  // Normalizar unidades
  const fromUnitNormalized = normalizeUnit(fromUnit);
  const toUnitNormalized = normalizeUnit(toUnit);
  
  console.log(`DEBUG - normalizeQuantityForComparison - Início:`, {
      value,
      fromUnit,
      toUnit,
      fromUnitNormalized,
      toUnitNormalized
  });
  
  // Se as unidades são iguais, não é necessário converter
  if (fromUnitNormalized === toUnitNormalized || fromUnit === 'default') {
      console.log(`DEBUG - normalizeQuantityForComparison - Sem conversão (unidades iguais)`);
      return Number(value.toFixed(3)); // Limitar a 3 casas decimais
  }
  
  let convertedValue;
  
  // ml para L (0.09L = 90ml)
  if (fromUnitNormalized === 'ml' && toUnitNormalized === 'l') {
      convertedValue = value * CONVERSION_FACTORS.ML_TO_LITERS;
      console.log(`DEBUG - normalizeQuantityForComparison - ml para L: ${value} ml = ${convertedValue} L`);
  }
  
  // L para ml
  else if (fromUnitNormalized === 'l' && toUnitNormalized === 'ml') {
      convertedValue = value * CONVERSION_FACTORS.LITERS_TO_ML;
      console.log(`DEBUG - normalizeQuantityForComparison - L para ml: ${value} L = ${convertedValue} ml`);
  }
  
  // g para kg (0.09kg = 90g)
  else if (fromUnitNormalized === 'g' && toUnitNormalized === 'kg') {
      convertedValue = value * CONVERSION_FACTORS.GRAMS_TO_KG;
      console.log(`DEBUG - normalizeQuantityForComparison - g para kg: ${value} g = ${convertedValue} kg`);
  }
  
  // kg para g
  else if (fromUnitNormalized === 'kg' && toUnitNormalized === 'g') {
      convertedValue = value * CONVERSION_FACTORS.KG_TO_GRAMS;
      console.log(`DEBUG - normalizeQuantityForComparison - kg para g: ${value} kg = ${convertedValue} g`);
  }
  else {
      // Nenhuma conversão específica encontrada
      convertedValue = value;
      console.log(`DEBUG - normalizeQuantityForComparison - Nenhuma conversão específica: ${value} ${fromUnit} (convertido para ${toUnit})`);
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

  console.log("\nValidação de estoque:");
  console.log(`Produto tem: ${productQuantity} ${productUnit}`);
  console.log(`Solicitado: ${requestedQuantity} ${requestedUnit}`);
  console.log(`Convertido: ${convertedQuantity} ${productUnit}`);

  // Verificação simplificada - comparamos sempre na unidade base do produto
  // Tolerância de 0.01 para evitar problemas de precisão com decimais
  if (convertedQuantity > (productQuantity + 0.01)) {
      console.log("❌ Estoque insuficiente");
      return {
          valid: false,
          message: 'Quantidade não pode ser maior que o estoque disponível'
      };
  }

  console.log("✅ Estoque suficiente");
  return {
      valid: true,
      message: null
  };
};

// Função para testar uma conversão específica
const testConversion = (fromValue, fromUnit, toUnit) => {
  console.log(`\n=== TESTE DE CONVERSÃO: ${fromValue} ${fromUnit} -> ${toUnit} ===`);
  const result = normalizeQuantityForComparison(fromValue, fromUnit, toUnit);
  console.log(`RESULTADO: ${fromValue} ${fromUnit} = ${result} ${toUnit}`);
  return result;
};

// Função principal com cenários de teste mais detalhados
async function main() {
  try {
    console.log("======== TESTE DETALHADO DE CONVERSÃO DE UNIDADES ========\n");

    // ============ TESTES DE CONVERSÃO SIMPLES ============
    console.log("\n1. TESTES DE CONVERSÃO SIMPLES:");
    
    // Volume: litros e mililitros
    testConversion(1, 'l', 'ml');
    testConversion(1, 'L', 'ml');
    testConversion(1, 'litro', 'ml');
    testConversion(1, 'Litros', 'ml');
    
    testConversion(1000, 'ml', 'l');
    testConversion(500, 'ml', 'l');
    testConversion(100, 'ml', 'L');
    testConversion(10, 'mililitros', 'litros');
    
    // Peso: quilos e gramas
    testConversion(1, 'kg', 'g');
    testConversion(1, 'Kg', 'g');
    testConversion(1, 'quilo', 'g');
    testConversion(1, 'Quilos', 'g');
    testConversion(0.5, 'kg', 'g');
    
    testConversion(1000, 'g', 'kg');
    testConversion(500, 'g', 'kg');
    testConversion(100, 'g', 'KG');
    testConversion(10, 'gramas', 'quilos');

    // ============ VALORES DECIMAIS E ARREDONDAMENTOS ============
    console.log("\n2. TESTES COM VALORES DECIMAIS E ARREDONDAMENTOS:");
    
    // Valores decimais pequenos
    testConversion(0.001, 'l', 'ml');
    testConversion(0.0005, 'l', 'ml'); // Deve resultar em 0.5ml
    testConversion(0.00025, 'l', 'ml'); // Verifica arredondamento
    
    testConversion(0.001, 'kg', 'g');
    testConversion(0.0005, 'kg', 'g'); // Deve resultar em 0.5g
    
    // Grandes valores com muitas casas decimais
    testConversion(123.456789, 'l', 'ml'); // Deve limitar a 3 casas decimais
    testConversion(987.654321, 'kg', 'g'); // Deve limitar a 3 casas decimais
    
    // De unidade menor para maior com muitas casas
    testConversion(123.456789, 'ml', 'l'); // Deve resultar em ~0.123
    testConversion(987.654321, 'g', 'kg'); // Deve resultar em ~0.988

    // ============ TESTES DE VALIDAÇÃO DE ESTOQUE ============
    console.log("\n3. TESTES DE VALIDAÇÃO DE ESTOQUE COM VALORES DECIMAIS:");
    
    // Produto com quantidade decimal em litros
    const produtoLitros = {
      id: 'test-l',
      name: 'Produto Teste em Litros',
      quantity: 2.75, // 2,75 litros
      unit: 'l'
    };
    
    // Produto com quantidade decimal em kg
    const produtoKg = {
      id: 'test-kg',
      name: 'Produto Teste em Quilos',
      quantity: 1.25, // 1,25 kg
      unit: 'kg'
    };
    
    // Testes com produto em litros
    console.log("\n3.1 Testes com produto em litros (estoque: 2.75 l):");
    
    // Mesma unidade - valores válidos
    validateStock(produtoLitros.quantity, 1, 'l', produtoLitros.unit);
    validateStock(produtoLitros.quantity, 2.5, 'l', produtoLitros.unit);
    validateStock(produtoLitros.quantity, 2.75, 'l', produtoLitros.unit);  // Exatamente o estoque
    
    // Mesma unidade - valor inválido
    validateStock(produtoLitros.quantity, 2.76, 'l', produtoLitros.unit);  // Acima do estoque
    validateStock(produtoLitros.quantity, 3, 'l', produtoLitros.unit);
    
    // Conversão de ml para l - valores válidos
    validateStock(produtoLitros.quantity, 100, 'ml', produtoLitros.unit);  // 0.1 l
    validateStock(produtoLitros.quantity, 2750, 'ml', produtoLitros.unit); // 2.75 l - exatamente o estoque
    
    // Conversão de ml para l - valores inválidos
    validateStock(produtoLitros.quantity, 2751, 'ml', produtoLitros.unit); // 2.751 l - pouco acima
    validateStock(produtoLitros.quantity, 3000, 'ml', produtoLitros.unit); // 3 l - acima
    
    // Testes com unidades de escrita diferentes
    validateStock(produtoLitros.quantity, 2.5, 'litros', produtoLitros.unit);
    validateStock(produtoLitros.quantity, 2500, 'mililitros', produtoLitros.unit);
    
    // Testes com produto em kg
    console.log("\n3.2 Testes com produto em quilos (estoque: 1.25 kg):");
    
    // Mesma unidade - valores válidos
    validateStock(produtoKg.quantity, 1, 'kg', produtoKg.unit);
    validateStock(produtoKg.quantity, 1.2, 'kg', produtoKg.unit);
    validateStock(produtoKg.quantity, 1.25, 'kg', produtoKg.unit);  // Exatamente o estoque
    
    // Mesma unidade - valor inválido
    validateStock(produtoKg.quantity, 1.26, 'kg', produtoKg.unit);  // Acima do estoque
    validateStock(produtoKg.quantity, 2, 'kg', produtoKg.unit);
    
    // Conversão de g para kg - valores válidos
    validateStock(produtoKg.quantity, 100, 'g', produtoKg.unit);    // 0.1 kg
    validateStock(produtoKg.quantity, 1250, 'g', produtoKg.unit);   // 1.25 kg - exatamente o estoque
    
    // Conversão de g para kg - valores inválidos
    validateStock(produtoKg.quantity, 1251, 'g', produtoKg.unit);   // 1.251 kg - pouco acima
    validateStock(produtoKg.quantity, 1500, 'g', produtoKg.unit);   // 1.5 kg - acima
    
    // Testes com unidades de escrita diferentes
    validateStock(produtoKg.quantity, 1.2, 'quilos', produtoKg.unit);
    validateStock(produtoKg.quantity, 1200, 'gramas', produtoKg.unit);
    
    // ============ TESTES COM CASO LIMITE DE TOLERÂNCIA ============
    console.log("\n4. TESTES COM CASOS LIMITE (TOLERÂNCIA DE 0.01):");
    
    // Produto com quantidade exata
    const produtoExato = {
      id: 'test-exact',
      name: 'Produto Teste Exato',
      quantity: 10, 
      unit: 'l'
    };
    
    // Testes próximos do limite (tolerância de 0.01)
    validateStock(produtoExato.quantity, 10, 'l', produtoExato.unit);       // Exatamente igual
    validateStock(produtoExato.quantity, 10.005, 'l', produtoExato.unit);   // Um pouco acima, mas dentro da tolerância
    validateStock(produtoExato.quantity, 10.01, 'l', produtoExato.unit);    // No limite da tolerância
    validateStock(produtoExato.quantity, 10.011, 'l', produtoExato.unit);   // Acima da tolerância

  } catch (err) {
    console.error("Erro durante o teste:", err);
  }
}

// Executar o script
main(); 