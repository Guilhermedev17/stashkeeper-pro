// Salvar resultados em arquivo JSON
const resultsDir = path.join(process.cwd(), 'resultados');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

const resultsFile = path.join(resultsDir, `anonymous_access_results_${new Date().toISOString().replace(/:/g, '-')}.json`);
fs.writeFileSync(
  resultsFile, 
  JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    summary: generateSecuritySummary(results)
  }, null, 2)
);

console.log(`\n\x1b[36mResultados salvos em ${resultsFile}\x1b[0m`);

// Relatório em Markdown
generateMarkdownReport(results);

// Gerar relatório em Markdown
function generateMarkdownReport(results) {
  const reportContent = `# Relatório de Segurança - Acesso Anônimo

## Resumo de Proteções para Usuários Não Autenticados

Este relatório apresenta as permissões atuais para usuários não autenticados (anônimos) nas tabelas principais do sistema.

Data do teste: ${new Date().toLocaleString()}

## Proteções por Tabela

${tables.map(table => `
### Tabela: ${table}

| Operação | Status | Descrição |
|----------|--------|-----------|
${operations.map(op => {
  const result = results[table][op.name];
  let status, description;
  
  if (result) {
    if (result.allowed === true) {
      status = '⚠️ NÃO PROTEGIDO';
      description = `Usuários anônimos podem ${op.description.toLowerCase()}`;
    } else if (result.allowed === false) {
      status = '✅ PROTEGIDO';
      description = `Usuários anônimos NÃO podem ${op.description.toLowerCase()}`;
    } else {
      status = '❓ NÃO TESTADO';
      description = result.message || 'Não foi possível realizar o teste';
    }
  } else {
    status = '❓ NÃO TESTADO';
    description = 'Resultado não disponível';
  }
  
  return `| ${op.name} | ${status} | ${description} |`;
}).join('\n')}
`).join('\n')}

## Recomendações de Segurança

1. **Proteção de SELECT**: Dados sensíveis não devem ser acessíveis por usuários anônimos.
2. **Proteção de INSERT/UPDATE/DELETE**: Operações de escrita devem sempre exigir autenticação.
3. **Implementação de RLS**: Use Row Level Security para filtrar dados com base no usuário autenticado.

## Conclusão

${Object.values(generateSecuritySummary(results)).every(s => s.isSecure) 
  ? 'Todas as tabelas possuem proteção adequada contra acesso anônimo.' 
  : 'Existem vulnerabilidades que precisam ser corrigidas para garantir a segurança do sistema.'}

---

*Relatório gerado automaticamente.*
`;

  const reportFile = path.join(process.cwd(), 'resultados', `anonymous_access_report_${new Date().toISOString().replace(/:/g, '-')}.md`);
  fs.writeFileSync(reportFile, reportContent);
  
  console.log(`\x1b[36mRelatório em Markdown gerado: ${reportFile}\x1b[0m`);
} 