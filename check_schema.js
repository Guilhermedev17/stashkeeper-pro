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

// Consultar um produto para ver a estrutura
async function checkSchema() {
  try {
    console.log('Verificando schema das tabelas no Supabase...');

    // Verificar tabela products
    console.log('\nConsultando a tabela products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (productsError) {
      console.error(`Erro ao consultar products: ${productsError.message}`);
    } else {
      console.log('Estrutura de um produto:');
      if (products && products.length > 0) {
        console.log(JSON.stringify(products[0], null, 2));
        console.log('\nCampos disponíveis:', Object.keys(products[0]).join(', '));
      } else {
        console.log('Nenhum produto encontrado. Criando um produto de teste...');
        
        // Tentar criar um produto com campos mínimos
        const { data: newProduct, error: createError } = await supabase
          .from('products')
          .insert({
            name: 'Produto Teste Schema',
            code: 'SCHEMA-TEST',
            unit: 'un',
            quantity: 0
          })
          .select()
          .single();
          
        if (createError) {
          console.error(`Erro ao criar produto: ${createError.message}`);
        } else {
          console.log('Produto criado com sucesso. Estrutura:');
          console.log(JSON.stringify(newProduct, null, 2));
          console.log('\nCampos disponíveis:', Object.keys(newProduct).join(', '));
          
          // Limpar o produto criado
          const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', newProduct.id);
            
          if (deleteError) {
            console.error(`Erro ao excluir produto de teste: ${deleteError.message}`);
          } else {
            console.log('Produto de teste excluído com sucesso.');
          }
        }
      }
    }

    // Verificar tabela movements
    console.log('\nConsultando a tabela movements...');
    const { data: movements, error: movementsError } = await supabase
      .from('movements')
      .select('*')
      .limit(1);

    if (movementsError) {
      console.error(`Erro ao consultar movements: ${movementsError.message}`);
    } else {
      console.log('Estrutura de um movimento:');
      if (movements && movements.length > 0) {
        console.log(JSON.stringify(movements[0], null, 2));
        console.log('\nCampos disponíveis:', Object.keys(movements[0]).join(', '));
      } else {
        console.log('Nenhum movimento encontrado.');
      }
    }

  } catch (error) {
    console.error(`Erro durante a verificação: ${error.message}`);
  }
}

// Executar verificação
checkSchema(); 