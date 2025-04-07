// Script para verificar resultados da edição de movimentações
import fetch from 'node-fetch';

// Configuração do Supabase
const supabaseUrl = 'https://jsdxpfzwvwkejvwlvofd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZHhwZnp3dndlanZ3bHZvZmQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMjU5OTg1MCwiZXhwIjoyMDI4MTc1ODUwfQ.xfm2X6RRXG9TWVcyGxzP6QfnNdWJj7TNFhsxLLJ4Jko';

// Parâmetros de verificação
const TARGET_PRODUCT = 'teste kg';
const NOTES_PATTERN = 'Teste%25'; // URL-encode % como %25 para API REST

async function verifyEditResults() {
  try {
    console.log("=== VERIFICAÇÃO DOS RESULTADOS DE EDIÇÃO DE MOVIMENTAÇÃO ===\n");
    
    // 1. Buscar produto de teste
    const productResponse = await fetch(
      `${supabaseUrl}/rest/v1/products?name=eq.${TARGET_PRODUCT}&select=id,name,unit,quantity`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    
    if (!productResponse.ok) throw new Error(`Erro ao buscar produto: ${productResponse.statusText}`);
    const products = await productResponse.json();
    
    if (!products || products.length === 0) throw new Error("Produto de teste não encontrado");
    const product = products[0];
    
    console.log(`Produto: ${product.name}`);
    console.log(`Estoque atual: ${product.quantity} ${product.unit}`);
    
    // 2. Buscar movimentações relacionadas ao teste (sem filtro de observações para ver tudo)
    const movementsResponse = await fetch(
      `${supabaseUrl}/rest/v1/movements?product_id=eq.${product.id}&order=created_at.desc&limit=10`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!movementsResponse.ok) throw new Error(`Erro ao buscar movimentações: ${movementsResponse.statusText}`);
    const allMovements = await movementsResponse.json();
    
    // Filtrar apenas movimentações com "Teste" nas observações
    const movements = allMovements.filter(m => m.notes && m.notes.includes('Teste'));
    
    console.log(`\nMovimentações encontradas (${movements.length}):`);
    
    if (movements.length === 0) {
      console.log("Nenhuma movimentação de teste encontrada. Execute o teste manual primeiro.");
      console.log("\nTodas as movimentações recentes para este produto:");
      
      // Mostrar todas as movimentações para ajudar no diagnóstico
      allMovements.slice(0, 5).forEach((m, i) => {
        console.log(`\n[${i+1}] Movimentação ID: ${m.id}`);
        console.log(`  Tipo: ${m.type}`);
        console.log(`  Quantidade: ${m.quantity}`);
        console.log(`  Data: ${new Date(m.created_at).toLocaleString()}`);
        console.log(`  Observação: ${m.notes || '(nenhuma)'}`);
        console.log(`  Excluída: ${m.deleted ? 'Sim' : 'Não'}`);
      });
    } else {
      movements.forEach((m, i) => {
        console.log(`\n[${i+1}] Movimentação ID: ${m.id}`);
        console.log(`  Tipo: ${m.type}`);
        console.log(`  Quantidade: ${m.quantity}`);
        console.log(`  Data: ${new Date(m.created_at).toLocaleString()}`);
        console.log(`  Observação: ${m.notes}`);
        console.log(`  Excluída: ${m.deleted ? 'Sim' : 'Não'}`);
      });
      
      console.log("\nVerifique se os valores correspondem às alterações feitas durante o teste manual.");
      
      if (movements.length >= 2) {
        // Comparar se houve edição (verificando movimentações semelhantes)
        const recent = movements[0];
        const older = movements[1];
        
        if (recent.notes && older.notes && 
            recent.notes.includes('editado') && older.notes.includes('Teste')) {
          console.log("\n✅ Detectada sequência de criação e edição!");
          console.log(`- Original: ${older.quantity} ${product.unit}`);
          console.log(`- Editada: ${recent.quantity} ${product.unit}`);
          console.log(`- Diferença: ${recent.quantity - older.quantity} ${product.unit}`);
        }
      }
    }
    
  } catch (error) {
    console.error("\n❌ ERRO:", error.message);
  }
}

// Executar a verificação
verifyEditResults().then(() => console.log("\nVerificação concluída.")); 