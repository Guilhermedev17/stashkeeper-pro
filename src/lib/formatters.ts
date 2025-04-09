/**
 * Converte unidades para suas abreviações padronizadas.
 * 
 * @param unit A unidade de medida a ser convertida para abreviação
 * @returns A abreviação padronizada da unidade
 */
export const getUnitAbbreviation = (unit: string): string => {
  if (!unit) return '';
  
  switch (unit.toLowerCase()) {
    case 'un': return 'UN';
    case 'unidade': return 'UN';
    case 'kg': return 'KG';
    case 'g': return 'G';
    case 'gramas': return 'G';
    case 'l': return 'L';
    case 'litros': return 'L';
    case 'ml': return 'ML';
    case 'cx': return 'CX';
    case 'caixa': return 'CX';
    case 'pct': return 'PCT';
    case 'pacote': return 'PCT';
    case 'rl': return 'RL';
    case 'rolo': return 'RL';
    case 'par': return 'PAR';
    case 'm': return 'M';
    case 'metros': return 'M';
    case 'cm': return 'CM';
    default: return unit.toUpperCase();
  }
}; 