import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Verifica se uma unidade de medida trabalha com valores fracionados
 * @param unit - A unidade de medida
 * @returns boolean indicando se a unidade trabalha com frações
 */
export function isDecimalUnit(unit: string): boolean {
  if (!unit) return false;
  
  const normalizedUnit = unit.toLowerCase().trim();
  return ['kg', 'g', 'l', 'ml', 'litro', 'litros', 'quilo', 'quilos'].includes(normalizedUnit);
}

/**
 * Normaliza uma unidade para o formato padrão
 */
export function normalizeUnit(unit: string): string {
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
}

/**
 * Formata um número com vírgula como separador decimal (formato brasileiro)
 * @param value - O número a ser formatado
 * @param decimals - Quantidade de casas decimais (padrão: 2)
 * @returns String formatada com vírgula
 */
export function formatDecimal(value: number | string | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || value === '') return '0';
  
  // Converter para número caso seja string
  const numberValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  
  // Verificar se é um número válido
  if (isNaN(numberValue)) return '0';
  
  // Formatar com vírgula
  return numberValue.toFixed(decimals).replace('.', ',');
}

/**
 * Formata um número de acordo com a unidade de medida
 * - Para ml e g: exibe números inteiros (sem decimais)
 * - Para l e kg: exibe com até 3 casas decimais (remove zeros desnecessários)
 * - Para outras unidades: mantém o formato padrão com 2 casas decimais
 * 
 * @param value - O número a ser formatado
 * @param unit - A unidade de medida
 * @returns String formatada adequadamente
 */
export function formatQuantity(value: number | string | null | undefined, unit: string): string {
  if (value === null || value === undefined || value === '') return '0';
  
  // Converter para número caso seja string
  const numberValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  
  // Verificar se é um número válido
  if (isNaN(numberValue)) return '0';
  
  const normalizedUnit = normalizeUnit(unit);
  
  // Para ml e g, mostra números inteiros
  if (normalizedUnit === 'ml' || normalizedUnit === 'g') {
    return Math.round(numberValue).toString();
  }
  
  // Para l e kg, simplifica a exibição de decimais
  if (normalizedUnit === 'l' || normalizedUnit === 'kg') {
    // Verificar se o valor está próximo de um inteiro (diferença < 0.01)
    if (Math.abs(Math.round(numberValue) - numberValue) < 0.01) {
      return Math.round(numberValue).toString();
    }
    
    // Verificar se o valor está próximo de 1 ou 2 casas decimais
    const roundedTo2Dec = Math.round(numberValue * 100) / 100;
    if (Math.abs(roundedTo2Dec - numberValue) < 0.001) {
      return roundedTo2Dec.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1').replace('.', ',');
    }
    
    // Limita a 3 casas decimais e remove zeros no final
    return parseFloat(numberValue.toFixed(3)).toString().replace('.', ',');
  }
  
  // Para outras unidades
  return numberValue.toFixed(2).replace('.', ',');
}

/**
 * Converte uma string com vírgula como separador decimal para um número
 * @param value - String com formato brasileiro (vírgula)
 * @returns Número convertido
 */
export function parseDecimal(value: string | null | undefined): number {
  if (!value) return 0;
  
  try {
    // Substituir vírgula por ponto e converter para número
    const numericValue = value.replace(',', '.');
    const parsedValue = parseFloat(numericValue);
    
    // Verificar se é um número válido
    return isNaN(parsedValue) ? 0 : parsedValue;
  } catch (error) {
    console.error('Erro ao converter valor decimal:', value, error);
    return 0;
  }
}

/**
 * Formata uma unidade de medida (abreviada e em maiúsculo)
 * @param unit - A unidade de medida
 * @returns Unidade formatada em maiúsculo ou sua abreviação padronizada
 */
export function formatUnit(unit: string): string {
  // Mapeamento de unidades comuns para suas abreviações padronizadas em maiúsculo
  const unitMap: Record<string, string> = {
    // Unidades
    'unidade': 'UN',
    'un': 'UN',
    'unidades': 'UN',
    // Volume
    'litro': 'L',
    'litros': 'L',
    'l': 'L',
    'mililitro': 'ML',
    'mililitros': 'ML',
    'ml': 'ML',
    // Comprimento
    'metro': 'M',
    'metros': 'M',
    'm': 'M',
    'centímetro': 'CM',
    'centimetros': 'CM',
    'centímetros': 'CM',
    'cm': 'CM',
    'milímetro': 'MM',
    'milimetro': 'MM',
    'milímetros': 'MM',
    'milimetros': 'MM',
    'mm': 'MM',
    // Peso
    'tonelada': 'TON',
    'toneladas': 'TON',
    'ton': 'TON',
    't': 'TON',
    'quilograma': 'KG',
    'quilogramas': 'KG',
    'kg': 'KG',
    'kilograma': 'KG',
    'kilogramas': 'KG',
    'kilo': 'KG',
    'kilos': 'KG',
    'grama': 'G',
    'gramas': 'G',
    'g': 'G',
    'miligrama': 'MG',
    'miligramas': 'MG',
    'mg': 'MG',
    // Embalagens
    'pacote': 'PCT',
    'pacotes': 'PCT',
    'pct': 'PCT',
    'caixa': 'CX',
    'caixas': 'CX',
    'cx': 'CX',
    'peça': 'PÇ',
    'peças': 'PÇ',
    'pç': 'PÇ',
    'peca': 'PÇ',
    'pecas': 'PÇ',
    'pc': 'PÇ',
    'pcs': 'PÇ',
    'par': 'PAR',
    'pares': 'PAR',
    'fardo': 'FD',
    'fardos': 'FD',
    'fd': 'FD',
    'galão': 'GL',
    'galao': 'GL',
    'galões': 'GL',
    'galoes': 'GL',
    'gl': 'GL',
    'saco': 'SC',
    'sacos': 'SC',
    'sc': 'SC',
    'rolo': 'RL',
    'rolos': 'RL',
    'rl': 'RL',
    'lata': 'LT',
    'latas': 'LT',
    'lt': 'LT',
    'balde': 'BD',
    'baldes': 'BD',
    'bd': 'BD',
    'frasco': 'FR',
    'frascos': 'FR',
    'fr': 'FR',
    'ampola': 'AMP',
    'ampolas': 'AMP',
    'amp': 'AMP',
    'dúzia': 'DZ',
    'duzia': 'DZ',
    'dúzias': 'DZ',
    'duzias': 'DZ',
    'dz': 'DZ',
    // Área e volume
    'metro quadrado': 'M²',
    'metros quadrados': 'M²',
    'm2': 'M²',
    'm²': 'M²',
    'metro cúbico': 'M³',
    'metros cúbicos': 'M³',
    'm3': 'M³',
    'm³': 'M³',
  };

  // Converter para minúsculo para comparação
  const lowerUnit = unit.toLowerCase().trim();
  
  // Retornar a abreviação mapeada ou a unidade original convertida para maiúsculo
  return unitMap[lowerUnit] || unit.toUpperCase();
}
