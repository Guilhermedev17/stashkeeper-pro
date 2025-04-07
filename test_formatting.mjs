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

// Função para formatar números por unidade
const formatNumberByUnit = (value, unit) => {
  const normalizedUnit = normalizeUnit(unit);
  
  // Para ml e g, mostra números inteiros
  if (normalizedUnit === 'ml' || normalizedUnit === 'g') {
    return Math.round(value).toString();
  }
  
  // Para l e kg, mostra até 3 casas decimais (remove zeros no final)
  if (normalizedUnit === 'l' || normalizedUnit === 'kg') {
    // Limita a 3 casas decimais e remove zeros no final
    return parseFloat(value.toFixed(3)).toString().replace('.', ',');
  }
  
  // Para outras unidades
  return value.toFixed(2).replace('.', ',');
};

// Casos de teste
const testCases = [
  { value: 1834, unit: 'ml', expected: '1834' },
  { value: 1834, unit: 'g', expected: '1834' },
  { value: 1.834, unit: 'l', expected: '1,834' },
  { value: 1.834, unit: 'kg', expected: '1,834' },
  { value: 1.8, unit: 'l', expected: '1,8' },
  { value: 1.8, unit: 'kg', expected: '1,8' },
  { value: 1, unit: 'l', expected: '1' },
  { value: 1, unit: 'kg', expected: '1' },
  { value: 1834.56, unit: 'ml', expected: '1835' },
  { value: 1834.56, unit: 'g', expected: '1835' },
  { value: 1.8349, unit: 'l', expected: '1,835' },
  { value: 1.8349, unit: 'kg', expected: '1,835' },
  { value: 0.75, unit: 'l', expected: '0,75' },
  { value: 750, unit: 'ml', expected: '750' },
  { value: 5, unit: 'un', expected: '5,00' },
];

// Executar os testes
console.log('=== TESTES DE FORMATAÇÃO POR UNIDADE ===');
console.log('Executando ' + testCases.length + ' casos de teste...');

let passedTests = 0;
testCases.forEach((test, index) => {
  const result = formatNumberByUnit(test.value, test.unit);
  const passed = result === test.expected;
  
  if (passed) passedTests++;
  
  console.log(`${passed ? '✅' : '❌'} Teste ${index + 1}: ${test.value} ${test.unit} → "${result}" (esperado: "${test.expected}")`);
});

console.log(`\nResultado: ${passedTests}/${testCases.length} testes passaram`);

// Aplicação prática
console.log('\n=== EXEMPLOS DE APLICAÇÃO ===');

// Produto em litros
const produto1 = { name: 'Álcool 70%', quantity: 1.834, unit: 'l' };
console.log(`Produto: ${produto1.name}`);
console.log(`Estoque: ${formatNumberByUnit(produto1.quantity, produto1.unit)} ${produto1.unit}`);

// Converter ml para litros
console.log('\nRegistrando entrada de 750ml:');
const entradaMl = 750;
const entradaConvertidaL = entradaMl * 0.001;
console.log(`Entrada: ${entradaMl} ml → ${formatNumberByUnit(entradaConvertidaL, 'l')} l`);
console.log(`Novo estoque: ${formatNumberByUnit(produto1.quantity + entradaConvertidaL, produto1.unit)} ${produto1.unit}`);

// Produto em unidades
const produto2 = { name: 'Luvas descartáveis', quantity: 5, unit: 'un' };
console.log(`\nProduto: ${produto2.name}`);
console.log(`Estoque: ${formatNumberByUnit(produto2.quantity, produto2.unit)} ${produto2.unit}`);

console.log('\n=== EXEMPLOS DO USUÁRIO ===');
console.log(`1890 ml → ${formatNumberByUnit(1890, 'ml')} ml`);
console.log(`1890 ml convertido para litros → ${formatNumberByUnit(1890 * 0.001, 'l')} l`);

// Forçar a saída do buffer
process.stdout.write('\n'); 