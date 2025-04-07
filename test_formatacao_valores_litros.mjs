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

// Função para formatar números por unidade (versão atualizada)
const formatQuantity = (value, unit) => {
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
};

// Função para imprimir resultados claramente
function printTest(title, value) {
  console.log(title + ': ' + value);
}

// Testes específicos para o problema mencionado
console.log('=== TESTE DE FORMATAÇÃO PARA VALORES EM LITROS ===');

// Testar o caso específico
const litrosProduto = 1833.966;
printTest('Valor original', litrosProduto + ' L');
printTest('Formatado (nova função)', formatQuantity(litrosProduto, 'l') + ' L');

// Testar outros casos próximos
console.log('\n=== OUTROS EXEMPLOS ===');
const exemplosLitros = [
  1833.966,
  1834,
  1834.01,
  1834.1,
  1834.12,
  1834.123
];

exemplosLitros.forEach(valor => {
  printTest(valor + ' L →', '"' + formatQuantity(valor, 'l') + '" L');
});

// Exemplo de conversão
console.log('\n=== SIMULAÇÃO DE SAÍDA DE 34ml ===');
const estoqueInicial = 1833.966;
const saidaML = 34;
const saidaEmLitros = saidaML * 0.001;
const estoqueNovo = estoqueInicial - saidaEmLitros;

printTest('Estoque inicial', formatQuantity(estoqueInicial, 'l') + ' L');
printTest('Saída', saidaML + ' ml (' + formatQuantity(saidaEmLitros, 'l') + ' L)');
printTest('Estoque após saída', formatQuantity(estoqueNovo, 'l') + ' L');

// Testar conversão de L para ml e vice-versa
console.log('\n=== CONVERSÕES ENTRE L e ml ===');
const valoresConversao = [
  { valorL: 1833.966, valorML: 1833966 },
  { valorL: 0.034, valorML: 34 },
  { valorL: 1.5, valorML: 1500 },
  { valorL: 0.999, valorML: 999 }
];

valoresConversao.forEach(exemplo => {
  printTest(formatQuantity(exemplo.valorL, 'l') + ' L =', formatQuantity(exemplo.valorML, 'ml') + ' ml');
});

// Para garantir que a saída seja impressa
setTimeout(() => {
  console.log('\nTeste de formatação concluído.');
}, 100); 