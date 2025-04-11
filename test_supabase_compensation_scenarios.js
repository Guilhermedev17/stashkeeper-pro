// Criar produto de teste
const productName = `Produto Teste ${scenario.name} ${new Date().getTime()}`;
const productData = {
  name: productName,
  code: `TEST-${Math.floor(Math.random() * 10000)}`,
  unit: scenario.productUnit,
  quantity: scenario.initialQuantity
  // Removido o campo min_stock que não existe na tabela
}; 