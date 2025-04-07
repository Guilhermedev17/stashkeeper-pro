// Script para buscar todas as categorias do Supabase
import { createClient } from '@supabase/supabase-js';

// Usar as mesmas credenciais que estão definidas no projeto
const SUPABASE_URL = "https://nugerdxawqqxpfjrtikh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2VyZHhhd3FxeHBmanJ0aWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NTkwMDcsImV4cCI6MjA1ODQzNTAwN30.sSFyTG_RZo2ojgcDnFBLtZ2uQN8pCsD5SHfW3e-1ojE";

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function fetchCategories() {
  try {
    // Buscar todas as categorias
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return;
    }

    // Exibir dados brutos para debug
    console.log('\nDados brutos das categorias:');
    console.log(JSON.stringify(data, null, 2));
    console.log('====================\n');
    
    // Exibir os resultados formatados
    console.log('\nCategorias cadastradas:');
    console.log('====================\n');
    
    if (data && data.length > 0) {
      data.forEach((category, index) => {
        console.log(`[${index + 1}] ID: ${category.id}`);
        console.log(`    Nome: "${category.name}"`);
        console.log(`    Descrição: "${category.description || ''}"`);
        console.log(`    Data de Criação: ${category.created_at}`);
        console.log('--------------------');
      });
      console.log(`Total: ${data.length} categoria(s) encontrada(s)`);
    } else {
      console.log('Nenhuma categoria cadastrada.');
    }
  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

// Executar a busca
fetchCategories(); 