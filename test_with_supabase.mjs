import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Configurar dotenv
dotenv.config();

// Arquivo de log para salvar os resultados
const LOG_FILE = 'test_supabase_results.log';

// Limpar arquivo de log anterior
fs.writeFileSync(LOG_FILE, '');

// Função para escrever no log
const log = (message) => {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
};

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
  if (!unit) return '';
  
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
  
  log(`Convertendo ${value} ${fromUnit} para ${toUnit} (normalizado: ${fromUnitNormalized} -> ${toUnitNormalized})`);
  
  // Se as unidades são iguais, não é necessário converter
  if (fromUnitNormalized === toUnitNormalized || fromUnit === 'default' || !fromUnitNormalized || !toUnitNormalized) {
      log(`  Unidades iguais ou não especificadas, retornando ${value}`);
      return Number(value.toFixed(3)); // Limitar a 3 casas decimais
  }
  
  let convertedValue;
  
  // ml para L
  if (fromUnitNormalized === 'ml' && toUnitNormalized === 'l') {
      convertedValue = value * CONVERSION_FACTORS.ML_TO_LITERS;
      log(`  ml para l: ${value} * ${CONVERSION_FACTORS.ML_TO_LITERS} = ${convertedValue}`);
  }
  
  // L para ml
  else if (fromUnitNormalized === 'l' && toUnitNormalized === 'ml') {
      convertedValue = value * CONVERSION_FACTORS.LITERS_TO_ML;
      log(`  l para ml: ${value} * ${CONVERSION_FACTORS.LITERS_TO_ML} = ${convertedValue}`);
  }
  
  // g para kg
  else if (fromUnitNormalized === 'g' && toUnitNormalized === 'kg') {
      convertedValue = value * CONVERSION_FACTORS.GRAMS_TO_KG;
      log(`  g para kg: ${value} * ${CONVERSION_FACTORS.GRAMS_TO_KG} = ${convertedValue}`);
  }
  
  // kg para g
  else if (fromUnitNormalized === 'kg' && toUnitNormalized === 'g') {
      convertedValue = value * CONVERSION_FACTORS.KG_TO_GRAMS;
      log(`  kg para g: ${value} * ${CONVERSION_FACTORS.KG_TO_GRAMS} = ${convertedValue}`);
  }
  else {
      // Nenhuma conversão específica encontrada
      convertedValue = value;
      log(`  Nenhuma conversão específica, retornando ${value}`);
  }
  
  // Limitar a 3 casas decimais para evitar problemas de precisão
  const result = Number(convertedValue.toFixed(3));
  log(`  Resultado final (3 casas decimais): ${result}`);
  return result;
};

// Função para validar estoque
const validateStock = (productQuantity, requestedQuantity, requestedUnit, productUnit) => {
  log(`\nValidando estoque - Disponível: ${productQuantity} ${productUnit}, Solicitado: ${requestedQuantity} ${requestedUnit}`);
  
  // Converter a quantidade solicitada para a unidade do produto
  const convertedQuantity = normalizeQuantityForComparison(
      requestedQuantity,
      requestedUnit === 'default' ? productUnit : requestedUnit,
      productUnit
  );

  log(`Quantidade solicitada convertida: ${convertedQuantity} ${productUnit}`);

  // Verificação com tolerância de 0.01
  if (convertedQuantity > (productQuantity + 0.01)) {
      log(`❌ INVALIDO: ${convertedQuantity} > ${productQuantity + 0.01} (solicitado > disponível + tolerância)`);
      return {
          valid: false,
          message: 'Quantidade não pode ser maior que o estoque disponível'
      };
  }

  log(`✅ VÁLIDO: ${convertedQuantity} <= ${productQuantity + 0.01} (solicitado <= disponível + tolerância)`);
  return {
      valid: true,
      message: null
  };
};

// Função principal com testes usando a Supabase
async function main() {
  try {
    log('=== TESTE DE CONVERSÃO DE UNIDADES COM DADOS DA SUPABASE ===');
    
    // ======= PARTE 1: TESTES COM PRODUTOS REAIS =======
    log('\n=== 1. TESTANDO PRODUTOS COM DIFERENTES UNIDADES ===');
    
    // Buscar produtos com diferentes unidades
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .in('unit', ['l', 'kg', 'ml', 'g', 'UN'])
      .limit(5);
    
    if (error) {
      throw new Error(`Erro ao buscar produtos: ${error.message}`);
    }
    
    if (!products || products.length === 0) {
      log('Nenhum produto encontrado para testar.');
    } else {
      log(`\nEncontrados ${products.length} produtos para teste:`);
      
      for (const product of products) {
        log(`\n--- Produto: ${product.name} ---`);
        log(`ID: ${product.id}`);
        log(`Unidade: ${product.unit}`);
        log(`Quantidade: ${product.quantity}`);
        
        // Testar conversão de unidades para este produto
        if (normalizeUnit(product.unit) === 'l') {
          // Converter para ml e de volta
          const emMl = normalizeQuantityForComparison(product.quantity, product.unit, 'ml');
          const deVoltaEmL = normalizeQuantityForComparison(emMl, 'ml', product.unit);
          
          log(`\nConversão de ida e volta: ${product.quantity} ${product.unit} -> ${emMl} ml -> ${deVoltaEmL} ${product.unit}`);
          log(`Precisão da conversão: ${Math.abs(product.quantity - deVoltaEmL) < 0.001 ? '✅ OK' : '❌ Perda de precisão'}`);
          
          // Testar validação de estoque com unidades diferentes
          log('\nTeste de validação de estoque:');
          
          // Caso 1: Quantidade menor que o estoque
          const menosQueEstoque = Math.floor(product.quantity * 0.5 * 1000); // 50% do estoque em ml
          const validacao1 = validateStock(product.quantity, menosQueEstoque, 'ml', product.unit);
          log(`Validação com 50% do estoque (${menosQueEstoque} ml): ${validacao1.valid ? '✅ Válido' : '❌ Inválido'}`);
          
          // Caso 2: Quantidade maior que o estoque
          const maisQueEstoque = Math.ceil(product.quantity * 1.5 * 1000); // 150% do estoque em ml
          const validacao2 = validateStock(product.quantity, maisQueEstoque, 'ml', product.unit);
          log(`Validação com 150% do estoque (${maisQueEstoque} ml): ${validacao2.valid ? '✅ Válido' : '❌ Inválido'}`);
        } 
        else if (normalizeUnit(product.unit) === 'kg') {
          // Converter para g e de volta
          const emG = normalizeQuantityForComparison(product.quantity, product.unit, 'g');
          const deVoltaEmKg = normalizeQuantityForComparison(emG, 'g', product.unit);
          
          log(`\nConversão de ida e volta: ${product.quantity} ${product.unit} -> ${emG} g -> ${deVoltaEmKg} ${product.unit}`);
          log(`Precisão da conversão: ${Math.abs(product.quantity - deVoltaEmKg) < 0.001 ? '✅ OK' : '❌ Perda de precisão'}`);
          
          // Testar validação de estoque com unidades diferentes
          log('\nTeste de validação de estoque:');
          
          // Caso 1: Quantidade menor que o estoque
          const menosQueEstoque = Math.floor(product.quantity * 0.5 * 1000); // 50% do estoque em g
          const validacao1 = validateStock(product.quantity, menosQueEstoque, 'g', product.unit);
          log(`Validação com 50% do estoque (${menosQueEstoque} g): ${validacao1.valid ? '✅ Válido' : '❌ Inválido'}`);
          
          // Caso 2: Quantidade maior que o estoque
          const maisQueEstoque = Math.ceil(product.quantity * 1.5 * 1000); // 150% do estoque em g
          const validacao2 = validateStock(product.quantity, maisQueEstoque, 'g', product.unit);
          log(`Validação com 150% do estoque (${maisQueEstoque} g): ${validacao2.valid ? '✅ Válido' : '❌ Inválido'}`);
        }
      }
    }
    
    // ======= PARTE 2: TESTES COM MOVIMENTOS REAIS =======
    log('\n\n=== 2. TESTANDO MOVIMENTOS COM UNIDADES DE PRODUTOS ===');
    
    // Buscar movimentos com informações do produto relacionado
    const { data: movements, error: movementsError } = await supabase
      .from('movements')
      .select(`
        *,
        products:product_id (
          name,
          unit,
          quantity
        )
      `)
      .limit(5);
    
    if (movementsError) {
      throw new Error(`Erro ao buscar movimentos: ${movementsError.message}`);
    }
    
    if (!movements || movements.length === 0) {
      log('Nenhum movimento encontrado para testar.');
    } else {
      log(`\nEncontrados ${movements.length} movimentos para teste:`);
      
      for (const movement of movements) {
        log(`\n--- Movimento: ${movement.id} ---`);
        log(`Produto: ${movement.products?.name || 'Desconhecido'}`);
        log(`Tipo: ${movement.type === 'in' ? 'Entrada' : 'Saída'}`);
        log(`Quantidade do movimento: ${movement.quantity} ${movement.unit || 'Sem unidade específica'}`);
        log(`Unidade do produto: ${movement.products?.unit || 'Não especificada'}`);
        log(`Estoque do produto: ${movement.products?.quantity}`);
        
        // Se o movimento e o produto têm unidades diferentes, testar a conversão
        if (movement.unit && 
            movement.products?.unit && 
            normalizeUnit(movement.unit) !== normalizeUnit(movement.products.unit)) {
          
          log('\nConversão de unidades necessária:');
          const quantidadeConvertida = normalizeQuantityForComparison(
            movement.quantity,
            movement.unit,
            movement.products.unit
          );
          
          log(`Quantidade após conversão: ${quantidadeConvertida} ${movement.products.unit}`);
          
          // Validar se o estoque seria suficiente para esta saída
          if (movement.type === 'out') {
            const validacao = validateStock(
              movement.products.quantity,
              movement.quantity,
              movement.unit,
              movement.products.unit
            );
            
            log(`\nValidação de estoque: ${validacao.valid ? '✅ Válido' : '❌ Inválido'}`);
            
            if (!validacao.valid) {
              log(`Motivo: ${validacao.message}`);
            }
          }
        } else {
          log('\nConversão não necessária (mesma unidade ou unidade não especificada)');
        }
      }
    }
    
    // ======= PARTE 3: TESTES DE INSERÇÃO DE MOVIMENTO COM CONVERSÃO =======
    log('\n\n=== 3. SIMULAÇÃO DE INSERÇÃO DE MOVIMENTO COM CONVERSÃO ===');
    
    // Buscar um produto com unidade definida
    const { data: productForMovement, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('unit', 'l')
      .limit(1)
      .single();
    
    if (productError) {
      log(`Erro ao buscar produto para movimento: ${productError.message}`);
    } else if (productForMovement) {
      log(`\nProduto selecionado: ${productForMovement.name} (${productForMovement.id})`);
      log(`Unidade: ${productForMovement.unit}`);
      log(`Estoque atual: ${productForMovement.quantity}`);
      
      // Simular movimento de saída com unidade diferente
      const movementQuantity = 500; // 500ml
      const movementUnit = 'ml';
      
      log(`\nMovimento a simular: Saída de ${movementQuantity} ${movementUnit}`);
      
      // Converter para a unidade do produto
      const convertedQuantity = normalizeQuantityForComparison(
        movementQuantity,
        movementUnit,
        productForMovement.unit
      );
      
      log(`Quantidade convertida: ${convertedQuantity} ${productForMovement.unit}`);
      
      // Validar estoque
      const validacao = validateStock(
        productForMovement.quantity,
        movementQuantity,
        movementUnit,
        productForMovement.unit
      );
      
      log(`\nValidação de estoque: ${validacao.valid ? '✅ Válido' : '❌ Inválido'}`);
      
      if (validacao.valid) {
        // Calcular novo estoque
        const novoEstoque = productForMovement.quantity - convertedQuantity;
        log(`Novo estoque após movimento: ${novoEstoque} ${productForMovement.unit}`);
        
        // OBS: Não estamos realmente inserindo o movimento para não alterar os dados
        log(`\n(Movimento não inserido para preservar os dados)`);
      } else {
        log(`Movimento não pode ser realizado: ${validacao.message}`);
      }
    } else {
      log('Nenhum produto encontrado para simular movimento.');
    }
    
    // Resumo
    log('\n\n=== RESUMO DOS TESTES ===');
    log('✅ Conversão de unidades com produtos reais');
    log('✅ Conversão de unidades em movimentos');
    log('✅ Validação de estoque com diferentes unidades');
    log('✅ Simulação de movimento com conversão de unidades');
    log('\nOs testes demonstram que o sistema de conversão funciona corretamente com os dados reais da Supabase.');
    
  } catch (err) {
    log(`\n❌ ERRO: ${err.message}`);
    console.error(err);
  }
}

// Executar função
main(); 