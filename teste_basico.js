// Teste básico para verificar formatação
const valor1 = 1833.966;
const valor2 = 1834;
const valor3 = 0.034;

console.log('Valor 1 (original):', valor1);
console.log('Valor 1 (arredondado 2 casas):', valor1.toFixed(2));
console.log('Valor 1 (arredondado 0 casas):', Math.round(valor1));

console.log('\nValor 2 (original):', valor2);
console.log('Valor 2 (formatado 2 casas):', valor2.toFixed(2));

console.log('\nValor 3 (original):', valor3);
console.log('Valor 3 (formatado 3 casas):', valor3.toFixed(3));

// Formatação específica para litros
function formatarValorLitros(valor) {
  // Se a diferença para o inteiro mais próximo é muito pequena, arredonda
  if (Math.abs(Math.round(valor) - valor) < 0.01) {
    return Math.round(valor);
  }
  
  // Para valores próximos de 2 casas decimais
  const arredondado2Casas = Math.round(valor * 100) / 100;
  if (Math.abs(arredondado2Casas - valor) < 0.001) {
    return arredondado2Casas.toFixed(2).replace(/\.00$/, '');
  }
  
  // Para valores que precisam de mais precisão
  return valor.toFixed(3);
}

console.log('\n--- Formatação para litros ---');
console.log('1833.966 -> ' + formatarValorLitros(1833.966));
console.log('1834     -> ' + formatarValorLitros(1834));
console.log('1834.001 -> ' + formatarValorLitros(1834.001));
console.log('1834.01  -> ' + formatarValorLitros(1834.01));
console.log('1834.1   -> ' + formatarValorLitros(1834.1));
console.log('0.034    -> ' + formatarValorLitros(0.034)); 