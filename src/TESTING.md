# Testes de Movimentação de Estoque

Este diretório contém scripts para testar as operações de movimentação de estoque (entradas e saídas) do sistema StashKeeper.

## Propósito dos Testes

Os scripts de teste foram criados para validar as correções implementadas no sistema de registro de movimentações, especialmente o problema de atualização dupla de estoque que estava causando inconsistências nos dados.

## Configuração

Antes de executar os testes, certifique-se de configurar as variáveis de ambiente necessárias:

```bash
# Configurar URL do Supabase
export NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"

# Configurar chave anônima do Supabase
export NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anonima-aqui"
```

## Scripts de Teste Disponíveis

### 1. Teste de Saída de Produtos

Este teste verifica se as operações de saída de produtos funcionam corretamente, atualizando o estoque de forma adequada.

```bash
node src/test-output-movement.js
```

O script irá:
1. Buscar produtos disponíveis no banco
2. Selecionar um produto com estoque > 0
3. Registrar uma saída para esse produto 
4. Verificar se o estoque foi reduzido corretamente

### 2. Teste de Entrada de Produtos

Este teste verifica se as operações de entrada de produtos funcionam corretamente, atualizando o estoque de forma adequada.

```bash
node src/test-input-movement.js
```

O script irá:
1. Buscar produtos disponíveis no banco
2. Selecionar um produto
3. Registrar uma entrada de 10 unidades para esse produto
4. Verificar se o estoque foi aumentado corretamente

### 3. Teste de Estresse

Este teste é mais complexo e simula várias operações de entrada e saída em sequência, para verificar a robustez do sistema e a consistência do estoque em condições de uso intenso.

```bash
node src/test-stress-movements.js
```

O script irá:
1. Buscar produtos com estoque suficiente (>30 unidades)
2. Para cada produto, realizar 10 operações alternadas de entrada e saída
3. Verificar se o estoque final está correto após todas as operações

## Interpretação dos Resultados

Os scripts exibirão mensagens detalhadas sobre cada operação executada e o resultado da verificação final do estoque. 

- ✅ indica uma operação bem-sucedida ou um estoque final correto
- ❌ indica uma falha na operação ou inconsistência no estoque final

## Solução Implementada

A correção implementada para resolver o problema de registro de saídas consistiu em:

1. **Remover a atualização manual do estoque**: Os componentes `ModernMovementDialog.tsx` e `MovementDialog.tsx` foram modificados para não atualizarem manualmente a tabela `products`. Em vez disso, apenas registram o movimento na tabela `movements`.

2. **Adicionar o campo unit**: Foi adicionado o campo `unit` no registro de movimentações para garantir que o trigger SQL tenha todas as informações necessárias para fazer as conversões de unidade corretamente.

3. **Confiar no trigger SQL**: A atualização do estoque agora é feita exclusivamente pelo trigger `update_product_quantity` no banco de dados.

Estas alterações garantem que não haja "corrida" entre as atualizações de estoque, evitando inconsistências. 