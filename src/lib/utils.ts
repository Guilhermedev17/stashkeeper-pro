import { clsx, type ClassValue } from "clsx"
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
  const unitLower = unit.toLowerCase();
  // Unidades que tipicamente usam valores fracionados
  return ['kg', 'g', 'l', 'ml', 'litro', 'litros', 'quilograma', 'quilogramas', 'gramas', 'mililitros'].includes(unitLower);
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
 * Para unidades que trabalham com frações (kg, g, L, ml), usa casas decimais
 * Para outras unidades (un, cx, etc), usa número inteiro
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
  
  // Para unidades com decimais (kg, g, L, ml)
  if (isDecimalUnit(unit)) {
    return numberValue.toFixed(2).replace('.', ',');
  }
  
  // Para outras unidades, sem decimais
  return Math.round(numberValue).toString();
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
