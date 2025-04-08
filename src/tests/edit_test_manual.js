// Teste Manual para Edição de Movimentações

/*
Passos de teste manual para verificar a funcionalidade de transações de edição:

1. Acesse a página de movimentações em http://localhost:5173/movements

2. Encontre um produto com estoque suficiente (ex: "teste kg")

3. Crie uma nova movimentação:
   - Clique no botão "Nova Entrada" ou "Nova Saída"
   - Selecione o produto "teste kg"
   - Insira uma quantidade (ex: 5)
   - Adicione uma observação identificável "Teste transação manual"
   - Clique em "Confirmar"

4. Edite a movimentação recém-criada:
   - Clique no ícone de edição (lápis) na linha da movimentação
   - Modifique a quantidade para um valor diferente (ex: 10)
   - Modifique a observação para "Teste editado com transação"
   - Clique em "Atualizar"

5. Verifique os logs no console do navegador:
   - Abra as ferramentas de desenvolvedor (F12 ou Ctrl+Shift+I)
   - Observe os logs com prefixo "[TESTE-EDIÇÃO]"
   - Verifique se todas as etapas da transação estão sendo executadas:
     * Reversão da movimentação original
     * Aplicação da nova quantidade
     * Transação manual concluída com sucesso

6. Verifique se o estoque do produto foi atualizado corretamente:
   - Vá para a página de produtos
   - Verifique se a quantidade do produto reflete a mudança (original + diferença da edição)

7. Resultados esperados:
   - Nenhum erro no console
   - Estoque atualizado corretamente
   - Movimentação exibida com os novos valores
   - Logs indicando que a transação foi completada com sucesso

*/

// Este arquivo serve como guia para o teste manual e documentação da funcionalidade. 