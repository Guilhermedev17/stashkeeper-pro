import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

// Criar cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

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
  if (u === 'kg' || u === 'quilo' || u === 'quilos' || u === 'quilograma' || u === 'quilogramas') {
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
      convertedValue = value / 1000;
      console.log(`DEBUG - normalizeQuantityForComparison - ml para L: ${value} ml = ${convertedValue} L`);
      return Number(convertedValue.toFixed(3)); // Limitar a 3 casas decimais
  }
  
  // L para ml
  if (fromUnitNormalized === 'l' && toUnitNormalized === 'ml') {
      convertedValue = value * 1000;
      console.log(`DEBUG - normalizeQuantityForComparison - L para ml: ${value} L = ${convertedValue} ml`);
      return Number(convertedValue.toFixed(3)); // Limitar a 3 casas decimais
  }
  
  // g para kg (0.09kg = 90g)
  if (fromUnitNormalized === 'g' && toUnitNormalized === 'kg') {
      convertedValue = value / 1000;
      console.log(`DEBUG - normalizeQuantityForComparison - g para kg: ${value} g = ${convertedValue} kg`);
      return Number(convertedValue.toFixed(3)); // Limitar a 3 casas decimais
  }
  
  // kg para g
  if (fromUnitNormalized === 'kg' && toUnitNormalized === 'g') {
      convertedValue = value * 1000;
      console.log(`DEBUG - normalizeQuantityForComparison - kg para g: ${value} kg = ${convertedValue} g`);
      return Number(convertedValue.toFixed(3)); // Limitar a 3 casas decimais
  }
  
  // Nenhuma conversão específica encontrada
  console.log(`DEBUG - normalizeQuantityForComparison - Nenhuma conversão específica: ${value} ${fromUnit} (convertido para ${toUnit})`);
  return Number(value.toFixed(3)); // Limitar a 3 casas decimais
};

// Função para validar estoque
const validateStock = (productQuantity, requestedQuantity, requestedUnit, productUnit) => {
  // Converter a quantidade solicitada para a unidade do produto
  const convertedQuantity = normalizeQuantityForComparison(
      requestedQuantity,
      requestedUnit,
      productUnit
  );
  
  console.log("\nValidação de estoque:");
  console.log(`Produto tem: ${productQuantity} ${productUnit}`);
  console.log(`Solicitado: ${requestedQuantity} ${requestedUnit}`);
  console.log(`Convertido: ${convertedQuantity} ${productUnit}`);
  
  // Nova lógica de validação
  // Se a unidade selecionada for a mesma do produto, comparar diretamente
  if (normalizeUnit(requestedUnit) === normalizeUnit(productUnit)) {
      console.log("Comparação direta (mesmas unidades)");
      if (requestedQuantity > (productQuantity + 0.01)) {
          console.log("❌ Estoque insuficiente (unidades iguais)");
          return false;
      }
  } 
  // Unidades diferentes, usar o valor convertido
  else {
      console.log("Comparação com valor convertido (unidades diferentes)");
      if (convertedQuantity > (productQuantity + 0.01)) {
          console.log("❌ Estoque insuficiente (após conversão)");
          return false;
      }
  }
  
  console.log("✅ Estoque suficiente");
  return true;
};

// Função principal
async function main() {
  try {
    console.log("=== TESTE DE CONVERSÃO DE UNIDADES ===");
    
    // 1. Buscar os produtos de teste
    console.log("\n1. Buscando produtos de teste...");
    
    // Produto em litros
    const { data: produtoLitros } = await supabase
      .from('products')
      .select('*')
      .eq('code', '3424')  // TESTE LITROS
      .single();
      
    // Produto em kg
    const { data: produtoKg } = await supabase
      .from('products')
      .select('*')
      .eq('code', '121')  // teste kg
      .single();
    
    if (!produtoLitros || !produtoKg) {
      console.error("Produtos de teste não encontrados!");
      return;
    }
    
    console.log("\n2. Informações dos produtos encontrados:");
    console.log(`Produto litros: ${produtoLitros.name} - ${produtoLitros.quantity} ${produtoLitros.unit}`);
    console.log(`Produto kg: ${produtoKg.name} - ${produtoKg.quantity} ${produtoKg.unit}`);
    
    // 3. Teste de conversão para litros
    console.log("\n3. Teste de validação com produto litros:");
    
    // Teste 1: ml para litros - 90ml
    validateStock(produtoLitros.quantity, 90, 'ml', produtoLitros.unit);
    
    // Teste 2: ml para litros - 13000ml (deve falhar)
    validateStock(produtoLitros.quantity, 13000, 'ml', produtoLitros.unit);
    
    // Teste 3: litros para litros - 5l
    validateStock(produtoLitros.quantity, 5, 'l', produtoLitros.unit);
    
    // Teste 4: litros para litros - 15l (deve falhar)
    validateStock(produtoLitros.quantity, 15, 'l', produtoLitros.unit);
    
    // 4. Teste de conversão para kg
    console.log("\n4. Teste de validação com produto kg:");
    
    // Teste 1: g para kg - 90g
    validateStock(produtoKg.quantity, 90, 'g', produtoKg.unit);
    
    // Teste 2: g para kg - 220000g (deve falhar)
    validateStock(produtoKg.quantity, 220000, 'g', produtoKg.unit);
    
    // Teste 3: kg para kg - 5kg
    validateStock(produtoKg.quantity, 5, 'kg', produtoKg.unit);
    
    // Teste 4: kg para kg - 300kg (deve falhar)
    validateStock(produtoKg.quantity, 300, 'kg', produtoKg.unit);
    
  } catch (err) {
    console.error("Erro durante o teste:", err);
  }
}

// Executar o script
main(); 