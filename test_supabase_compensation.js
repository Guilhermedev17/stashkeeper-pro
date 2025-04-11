import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuração do ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não encontradas.');
  process.exit(1);
}

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função de utilidade para esperar um tempo específico
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para formatar valores numéricos
function formatNumber(value) {
  return Number(value).toFixed(4);
}

// Testes de compensação automática e conversão de unidades
async function runTests() {
  console.log('Iniciando testes de compensação automática e conversão de unidades no Supabase');
  
  try {
    // Teste 1: Criar produto de teste
    const productName = `Produto Teste ${new Date().getTime()}`;
    const productData = {
      name: productName,
      code: `TEST-${Math.floor(Math.random() * 10000)}`,
      unit: 'kg',
      quantity: 10
      // Removido o campo min_stock que não existe na tabela
    };
    
    console.log(`\nTeste 1: Criando produto de teste "${productName}"...`);
    
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
    
    if (productError) {
      throw new Error(`Erro ao criar produto: ${productError.message}`);
    }
    
    console.log(`✓ Produto criado com sucesso: ${newProduct.name}, ID: ${newProduct.id}`);
    console.log(`  Quantidade inicial: ${newProduct.quantity} ${newProduct.unit}`);
    
    // Teste 2: Registrar entrada em kg
    console.log('\nTeste 2: Registrando entrada em kg...');
    
    const entryData = {
      product_id: newProduct.id,
      type: 'entrada',
      quantity: 5,
      unit: 'kg',
      notes: 'Teste de entrada em kg'
    };
    
    const { data: newEntry, error: entryError } = await supabase
      .from('movements')
      .insert(entryData)
      .select()
      .single();
    
    if (entryError) {
      throw new Error(`Erro ao registrar entrada: ${entryError.message}`);
    }
    
    // Verificar se o estoque foi atualizado
    await sleep(1000); // Aguardar o trigger ser executado
    
    const { data: updatedProduct1, error: fetchError1 } = await supabase
      .from('products')
      .select('*')
      .eq('id', newProduct.id)
      .single();
    
    if (fetchError1) {
      throw new Error(`Erro ao buscar produto atualizado: ${fetchError1.message}`);
    }
    
    console.log(`✓ Entrada registrada: ${newEntry.quantity} ${newEntry.unit}`);
    console.log(`  Estoque atualizado: ${updatedProduct1.quantity} ${updatedProduct1.unit}`);
    console.log(`  Esperado: ${Number(newProduct.quantity) + Number(entryData.quantity)} ${newProduct.unit}`);
    
    const isEntryCorrect = Math.abs(updatedProduct1.quantity - (Number(newProduct.quantity) + Number(entryData.quantity))) < 0.0001;
    if (!isEntryCorrect) {
      console.error(`✗ Teste falhou: Estoque não atualizado corretamente após entrada`);
    } else {
      console.log(`✓ Teste passou: Estoque atualizado corretamente após entrada`);
    }
    
    // Teste 3: Registrar entrada em gramas (conversão)
    console.log('\nTeste 3: Registrando entrada em gramas (conversão)...');
    
    const entryGramData = {
      product_id: newProduct.id,
      type: 'entrada',
      quantity: 500,
      unit: 'g',
      notes: 'Teste de entrada em g com conversão'
    };
    
    const { data: newEntryGram, error: entryGramError } = await supabase
      .from('movements')
      .insert(entryGramData)
      .select()
      .single();
    
    if (entryGramError) {
      throw new Error(`Erro ao registrar entrada em gramas: ${entryGramError.message}`);
    }
    
    // Verificar se o estoque foi atualizado com conversão
    await sleep(1000); // Aguardar o trigger ser executado
    
    const { data: updatedProduct2, error: fetchError2 } = await supabase
      .from('products')
      .select('*')
      .eq('id', newProduct.id)
      .single();
    
    if (fetchError2) {
      throw new Error(`Erro ao buscar produto atualizado: ${fetchError2.message}`);
    }
    
    const expectedQtyAfterGrams = Number(updatedProduct1.quantity) + (Number(entryGramData.quantity) / 1000);
    
    console.log(`✓ Entrada em gramas registrada: ${newEntryGram.quantity} ${newEntryGram.unit}`);
    console.log(`  Estoque atualizado: ${updatedProduct2.quantity} ${updatedProduct2.unit}`);
    console.log(`  Esperado: ${formatNumber(expectedQtyAfterGrams)} ${newProduct.unit}`);
    
    const isEntryGramCorrect = Math.abs(updatedProduct2.quantity - expectedQtyAfterGrams) < 0.0001;
    if (!isEntryGramCorrect) {
      console.error(`✗ Teste falhou: Conversão de unidades não funcionou corretamente`);
    } else {
      console.log(`✓ Teste passou: Conversão de unidades funcionou corretamente`);
    }
    
    // Teste 4: Registrar saída em kg
    console.log('\nTeste 4: Registrando saída em kg...');
    
    const exitData = {
      product_id: newProduct.id,
      type: 'saida',
      quantity: 2,
      unit: 'kg',
      notes: 'Teste de saída em kg'
    };
    
    const { data: newExit, error: exitError } = await supabase
      .from('movements')
      .insert(exitData)
      .select()
      .single();
    
    if (exitError) {
      throw new Error(`Erro ao registrar saída: ${exitError.message}`);
    }
    
    // Verificar se o estoque foi atualizado
    await sleep(1000); // Aguardar o trigger ser executado
    
    const { data: updatedProduct3, error: fetchError3 } = await supabase
      .from('products')
      .select('*')
      .eq('id', newProduct.id)
      .single();
    
    if (fetchError3) {
      throw new Error(`Erro ao buscar produto atualizado: ${fetchError3.message}`);
    }
    
    const expectedQtyAfterExit = Number(updatedProduct2.quantity) - Number(exitData.quantity);
    
    console.log(`✓ Saída registrada: ${newExit.quantity} ${newExit.unit}`);
    console.log(`  Estoque atualizado: ${updatedProduct3.quantity} ${updatedProduct3.unit}`);
    console.log(`  Esperado: ${formatNumber(expectedQtyAfterExit)} ${newProduct.unit}`);
    
    const isExitCorrect = Math.abs(updatedProduct3.quantity - expectedQtyAfterExit) < 0.0001;
    if (!isExitCorrect) {
      console.error(`✗ Teste falhou: Estoque não atualizado corretamente após saída`);
    } else {
      console.log(`✓ Teste passou: Estoque atualizado corretamente após saída`);
    }
    
    // Teste 5: Testar compensação automática (exclusão de movimento)
    console.log('\nTeste 5: Testando compensação automática (exclusão lógica)...');
    
    // Marcar a saída como excluída (deleted = true)
    const { data: updatedMovement, error: updateMovementError } = await supabase
      .from('movements')
      .update({ deleted: true })
      .eq('id', newExit.id)
      .select()
      .single();
    
    if (updateMovementError) {
      throw new Error(`Erro ao atualizar movimento: ${updateMovementError.message}`);
    }
    
    // Verificar se o estoque foi compensado
    await sleep(1000); // Aguardar o trigger ser executado
    
    const { data: updatedProduct4, error: fetchError4 } = await supabase
      .from('products')
      .select('*')
      .eq('id', newProduct.id)
      .single();
    
    if (fetchError4) {
      throw new Error(`Erro ao buscar produto atualizado: ${fetchError4.message}`);
    }
    
    const expectedQtyAfterCompensation = Number(updatedProduct3.quantity) + Number(exitData.quantity);
    
    console.log(`✓ Movimento marcado como excluído: ${newExit.id}`);
    console.log(`  Estoque atualizado: ${updatedProduct4.quantity} ${updatedProduct4.unit}`);
    console.log(`  Esperado: ${formatNumber(expectedQtyAfterCompensation)} ${newProduct.unit}`);
    
    const isCompensationCorrect = Math.abs(updatedProduct4.quantity - expectedQtyAfterCompensation) < 0.0001;
    if (!isCompensationCorrect) {
      console.error(`✗ Teste falhou: Compensação automática não funcionou corretamente`);
    } else {
      console.log(`✓ Teste passou: Compensação automática funcionou corretamente`);
    }
    
    // Teste 6: Testar atualização de movimento com mudança de unidade
    console.log('\nTeste 6: Testando atualização de movimento com mudança de unidade...');
    
    // Atualizar a entrada em kg para usar gramas
    const updatedEntryData = {
      quantity: 3000,
      unit: 'g',
      notes: 'Entrada atualizada para gramas'
    };
    
    const { data: updatedEntry, error: updateEntryError } = await supabase
      .from('movements')
      .update(updatedEntryData)
      .eq('id', newEntry.id)
      .select()
      .single();
    
    if (updateEntryError) {
      throw new Error(`Erro ao atualizar entrada: ${updateEntryError.message}`);
    }
    
    // Verificar se o estoque foi compensado corretamente
    await sleep(1000); // Aguardar o trigger ser executado
    
    const { data: updatedProduct5, error: fetchError5 } = await supabase
      .from('products')
      .select('*')
      .eq('id', newProduct.id)
      .single();
    
    if (fetchError5) {
      throw new Error(`Erro ao buscar produto atualizado: ${fetchError5.message}`);
    }
    
    // Cálculo esperado: quantidade atual + (novaQtd em kg - antigaQtd em kg)
    // Onde novaQtd em kg = 3000g / 1000 = 3kg, e antigaQtd = 5kg
    // Ou seja: estoque atual + (3 - 5) = estoque atual - 2
    const expectedQtyAfterUpdate = Number(updatedProduct4.quantity) + ((updatedEntryData.quantity / 1000) - entryData.quantity);
    
    console.log(`✓ Entrada atualizada: ${updatedEntry.quantity} ${updatedEntry.unit} (anteriormente ${entryData.quantity} ${entryData.unit})`);
    console.log(`  Estoque atualizado: ${updatedProduct5.quantity} ${updatedProduct5.unit}`);
    console.log(`  Esperado: ${formatNumber(expectedQtyAfterUpdate)} ${newProduct.unit}`);
    
    const isUpdateCorrect = Math.abs(updatedProduct5.quantity - expectedQtyAfterUpdate) < 0.0001;
    if (!isUpdateCorrect) {
      console.error(`✗ Teste falhou: Atualização com mudança de unidade não funcionou corretamente`);
    } else {
      console.log(`✓ Teste passou: Atualização com mudança de unidade funcionou corretamente`);
    }
    
    // Resumo dos testes
    console.log('\n===== Resumo dos Testes =====');
    console.log(`Produto: ${newProduct.name}`);
    console.log(`Quantidade inicial: ${newProduct.quantity} ${newProduct.unit}`);
    console.log(`Quantidade final: ${updatedProduct5.quantity} ${updatedProduct5.unit}`);
    
    // Limpeza - remover produto e movimentos de teste
    console.log('\nLimpando dados de teste...');
    
    const { error: deleteMovementsError } = await supabase
      .from('movements')
      .delete()
      .eq('product_id', newProduct.id);
    
    if (deleteMovementsError) {
      console.warn(`Aviso: Não foi possível excluir movimentos: ${deleteMovementsError.message}`);
    }
    
    const { error: deleteProductError } = await supabase
      .from('products')
      .delete()
      .eq('id', newProduct.id);
    
    if (deleteProductError) {
      console.warn(`Aviso: Não foi possível excluir produto: ${deleteProductError.message}`);
    }
    
    console.log('Testes concluídos com sucesso!');
    
  } catch (error) {
    console.error(`Erro durante os testes: ${error.message}`);
  }
}

// Executar os testes
runTests(); 