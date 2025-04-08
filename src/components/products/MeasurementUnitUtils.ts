// Importar funções existentes
import { isDecimalUnit as isDecimalUnitBase } from '@/lib/utils';

// Constantes para fatores de conversão
export const CONVERSION_FACTORS = {
  GRAMS_TO_KG: 0.001,    // 1g = 0.001kg
  KG_TO_GRAMS: 1000,     // 1kg = 1000g
  ML_TO_LITERS: 0.001,   // 1ml = 0.001L
  LITERS_TO_ML: 1000,    // 1L = 1000ml
};

/**
 * Normaliza a unidade de medida para um formato padrão
 * @param unit Unidade de medida a ser normalizada
 * @returns Unidade normalizada (l, ml, kg, g)
 */
export const normalizeUnit = (unit: string): string => {
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

/**
 * Retorna as unidades relacionadas a uma unidade específica (ex: para 'l', retorna ['ml'])
 * @param unit Unidade de medida
 * @returns Array de unidades relacionadas
 */
export const getRelatedUnits = (unit: string): string[] => {
  const normalizedUnit = normalizeUnit(unit);
  
  switch (normalizedUnit) {
    case 'l':
      return ['ml'];
    case 'ml':
      return ['l'];
    case 'kg':
      return ['g'];
    case 'g':
      return ['kg'];
    default:
      return [];
  }
};

/**
 * Verifica se a unidade pode trabalhar com valores fracionados
 * Reexporta a função do utils.ts com implementação consistente
 * @param unit Unidade de medida
 * @returns true se a unidade aceita valores fracionados
 */
export const isDecimalUnit = (unit: string): boolean => {
  return isDecimalUnitBase(unit);
};

/**
 * Converte um valor para a unidade base (ml ou g) para comparação de estoque
 * Arredonda para inteiros apenas quando necessário para validação
 * @param value Valor a ser convertido
 * @param unit Unidade do valor
 * @returns Objeto com valor convertido para unidade base
 */
export const convertToBaseUnit = (
  value: number,
  unit: string
): { value: number; unit: string } => {
  const normalizedUnit = normalizeUnit(unit);
  
  // Para litros, converter para mililitros
  if (normalizedUnit === 'l') {
    return {
      value: Math.round(value * CONVERSION_FACTORS.LITERS_TO_ML),
      unit: 'ml'
    };
  }
  
  // Para quilos, converter para gramas
  if (normalizedUnit === 'kg') {
    return {
      value: Math.round(value * CONVERSION_FACTORS.KG_TO_GRAMS),
      unit: 'g'
    };
  }
  
  // Para mililitros e gramas, apenas arredondar
  return {
    value: Math.round(value),
    unit: normalizedUnit
  };
};

/**
 * Converte a quantidade entre unidades com precisão exata (sem arredondamento)
 * Utilizada para cálculos de estoque que precisam manter precisão total
 * @param value Valor a ser convertido
 * @param fromUnit Unidade de origem
 * @param toUnit Unidade de destino
 * @returns Valor convertido com precisão exata
 */
export const convertQuantityExact = (
  value: number,
  fromUnit: string,
  toUnit: string
): number => {
  const fromUnitNormalized = normalizeUnit(fromUnit);
  const toUnitNormalized = normalizeUnit(toUnit);
  
  // Se as unidades são iguais, não há conversão necessária
  if (fromUnitNormalized === toUnitNormalized || fromUnit === 'default') {
    return value;
  }
  
  // ml para L
  if (fromUnitNormalized === 'ml' && toUnitNormalized === 'l') {
    return value * CONVERSION_FACTORS.ML_TO_LITERS;
  }
  
  // L para ml
  if (fromUnitNormalized === 'l' && toUnitNormalized === 'ml') {
    return value * CONVERSION_FACTORS.LITERS_TO_ML;
  }
  
  // g para kg
  if (fromUnitNormalized === 'g' && toUnitNormalized === 'kg') {
    return value * CONVERSION_FACTORS.GRAMS_TO_KG;
  }
  
  // kg para g
  if (fromUnitNormalized === 'kg' && toUnitNormalized === 'g') {
    return value * CONVERSION_FACTORS.KG_TO_GRAMS;
  }
  
  // Sem conversão específica disponível
  return value;
};

/**
 * Converte a quantidade de uma unidade para outra para fins de comparação
 * Mantida por compatibilidade com código existente
 * @param value Valor a ser convertido
 * @param fromUnit Unidade de origem
 * @param toUnit Unidade de destino
 * @returns Valor convertido
 */
export const normalizeQuantityForComparison = (
  value: number,
  fromUnit: string,
  toUnit: string
): number => {
  // Usar a nova função de conversão exata
  return convertQuantityExact(value, fromUnit, toUnit);
};

/**
 * Valida se a quantidade solicitada não excede o estoque disponível
 * Usa unidades base (ml, g) para validação com precisão inteira
 * @param productQuantity Quantidade disponível no estoque
 * @param requestedQuantity Quantidade solicitada
 * @param requestedUnit Unidade da quantidade solicitada
 * @param productUnit Unidade do produto no estoque
 * @returns Objeto com a validação (valid e message)
 */
export const validateStock = (
  productQuantity: number, 
  requestedQuantity: number, 
  requestedUnit: string, 
  productUnit: string
): { valid: boolean; message: string | null } => {
  const normalizedProductUnit = normalizeUnit(productUnit);
  const normalizedRequestedUnit = normalizeUnit(requestedUnit === 'default' ? productUnit : requestedUnit);
  
  // Verificar compatibilidade de unidades (volume vs peso)
  const isVolumeCompatible = 
    (normalizedProductUnit === 'l' || normalizedProductUnit === 'ml') && 
    (normalizedRequestedUnit === 'l' || normalizedRequestedUnit === 'ml');
  
  const isWeightCompatible = 
    (normalizedProductUnit === 'kg' || normalizedProductUnit === 'g') && 
    (normalizedRequestedUnit === 'kg' || normalizedRequestedUnit === 'g');
  
  if (!isVolumeCompatible && !isWeightCompatible && 
      normalizedProductUnit !== normalizedRequestedUnit) {
    return {
      valid: false,
      message: `Unidades incompatíveis: ${normalizedProductUnit} e ${normalizedRequestedUnit}`
    };
  }

  // Converter para unidades base (ml, g) para comparação precisa
  const productBase = convertToBaseUnit(productQuantity, productUnit);
  const requestedBase = convertToBaseUnit(requestedQuantity, normalizedRequestedUnit);
  
  // Verificar estoque (comparação com valores inteiros)
  if (requestedBase.value > productBase.value) {
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

/**
 * Retorna o nome completo da unidade de medida
 * @param unit Unidade de medida abreviada
 * @returns Nome completo da unidade
 */
export const getFullUnitName = (unit: string): string => {
  const normalizedUnit = normalizeUnit(unit);
  
  switch (normalizedUnit) {
    case 'l':
      return 'litro(s)';
    case 'ml':
      return 'mililitro(s)';
    case 'kg':
      return 'quilo(s)';
    case 'g':
      return 'grama(s)';
    case 'un':
      return 'unidade(s)';
    case 'cx':
      return 'caixa(s)';
    default:
      return unit;
  }
};

/**
 * Retorna instruções específicas para a unidade, como uso de valores fracionados
 * @param unit Unidade de medida
 * @returns Texto com instruções para a unidade
 */
export const getUnitInstruction = (unit: string): string | null => {
  const normalizedUnit = normalizeUnit(unit);
  
  if (['l', 'ml', 'kg', 'g'].includes(normalizedUnit)) {
    return 'Valores fracionados são permitidos (ex: 1.5)';
  }
  
  return null;
};

/**
 * Formata um número de acordo com a unidade
 * - Para ml e g: exibe números inteiros (sem decimais)
 * - Para l e kg: exibe com até 2 casas decimais (remove zeros desnecessários)
 * - Para outras unidades: mantém o formato padrão com 2 casas decimais
 * 
 * @param value O valor a ser formatado
 * @param unit A unidade (ml, l, g, kg, etc)
 * @returns String formatada de acordo com a unidade
 */
export const formatNumberByUnit = (value: number, unit: string): string => {
  const normalizedUnit = normalizeUnit(unit);
  
  // Para ml e g, mostra números inteiros
  if (normalizedUnit === 'ml' || normalizedUnit === 'g') {
    return Math.round(value).toString();
  }
  
  // Para l e kg, mostra até 2 casas decimais (remove zeros desnecessários)
  if (normalizedUnit === 'l' || normalizedUnit === 'kg') {
    // Limita a 2 casas decimais e remove zeros no final
    return parseFloat(value.toFixed(2)).toString().replace('.', ',');
  }
  
  // Para outras unidades
  return value.toFixed(2).replace('.', ',');
}; 