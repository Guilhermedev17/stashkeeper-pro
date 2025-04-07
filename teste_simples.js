// Função para normalizar unidades
function normalizeUnit(unit) {
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

// Função para formatar números por unidade (versão atualizada)
function formatQuantity(value, unit) {
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

// TESTE ESPECÍFICO PARA O CASO MENCIONADO
console.log("Teste com valor exato como na imagem:");
console.log("1833,966 L formatado -> " + formatQuantity(1833.966, 'l') + " L");

// SIMULAÇÃO DE SAÍDA
const estoqueInicial = 1833.966;
const saidaML = 34;
const saidaEmLitros = saidaML * 0.001;
const estoqueNovo = estoqueInicial - saidaEmLitros;

console.log("\nSimulação de saída de 34ml:");
console.log("Estoque inicial: " + formatQuantity(estoqueInicial, 'l') + " L");
console.log("Saída: " + saidaML + " ml (" + formatQuantity(saidaEmLitros, 'l') + " L)");
console.log("Estoque após saída: " + formatQuantity(estoqueNovo, 'l') + " L");

// MAIS TESTES
console.log("\nOutros exemplos:");
console.log("1834 L -> " + formatQuantity(1834, 'l') + " L");
console.log("1834,001 L -> " + formatQuantity(1834.001, 'l') + " L");
console.log("1834,01 L -> " + formatQuantity(1834.01, 'l') + " L");
console.log("1834,1 L -> " + formatQuantity(1834.1, 'l') + " L");
console.log("1834,12 L -> " + formatQuantity(1834.12, 'l') + " L");
console.log("1834,123 L -> " + formatQuantity(1834.123, 'l') + " L");
console.log("1834,966 L -> " + formatQuantity(1834.966, 'l') + " L"); 