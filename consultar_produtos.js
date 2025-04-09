// Script para consultar produtos cadastrados na Supabase
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

// Carregar variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nugerdxawqqxpfjrtikh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2VyZHhhd3FxeHBmanJ0aWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjg1OTAwNywiZXhwIjoyMDU4NDM1MDA3fQ.LoOzortwYrVj6Vma37SGcqtRFlmmR7OrK1gm4RzWIww';

// Inicializar cliente Supabase com a service key para ter acesso completo
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function consultarProdutos() {
  try {
    console.log('Conectando à Supabase...');
    
    // Consultar produtos
    const { data: produtos, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    console.log('Produtos recuperados com sucesso!');
    console.log(`Total de produtos: ${produtos.length}`);
    
    // Exibir produtos formatados no console
    console.log('\n=== PRODUTOS CADASTRADOS ===');
    produtos.forEach((produto, index) => {
      console.log(`\n[${index + 1}] ${produto.name} (${produto.code})`);
      console.log(`Descrição: ${produto.description || 'Sem descrição'}`);
      console.log(`Quantidade: ${produto.quantity} ${produto.unit || 'unid.'}`);
      console.log(`Quantidade mínima: ${produto.min_quantity} ${produto.unit || 'unid.'}`);
      console.log(`Data de criação: ${new Date(produto.created_at).toLocaleString('pt-BR')}`);
      console.log(`ID: ${produto.id}`);
      console.log('-----------------------------------');
    });
    
    // Salvando resultados em um arquivo JSON para referência
    const dataHora = new Date().toISOString().replace(/:/g, '-');
    fs.writeFileSync(
      `produtos_${dataHora}.json`,
      JSON.stringify(produtos, null, 2)
    );
    
    console.log(`\nResultados salvos em produtos_${dataHora}.json`);
    
    return produtos;
  } catch (erro) {
    console.error('Erro ao consultar produtos:', erro.message);
    throw erro;
  }
}

// Executar a função principal
consultarProdutos()
  .then(() => {
    console.log('Consulta concluída com sucesso!');
  })
  .catch((erro) => {
    console.error('Falha na consulta:', erro.message);
    process.exit(1);
  }); 