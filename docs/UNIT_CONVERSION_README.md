# Documentação de Conversão de Unidades

## Visão Geral

O sistema StashKeeper Pro implementa suporte completo para conversão automática entre diferentes unidades de medida nas operações de estoque. Esta funcionalidade permite que movimentações (entradas e saídas) sejam registradas em unidades diferentes das configuradas para os produtos, com conversão automática das quantidades.

## Unidades de Medida Suportadas

O sistema suporta as seguintes categorias de unidades e conversões:

### Unidades de Peso
- Quilograma (kg)
- Grama (g)
- Conversão: 1kg = 1000g

### Unidades de Volume
- Litro (L, l)
- Mililitro (mL, ml)
- Conversão: 1L = 1000mL

### Unidades de Comprimento
- Metro (m)
- Centímetro (cm)
- Conversão: 1m = 100cm

### Unidades Discretas
- Unidade (un.)
- Caixa (cx.)
- Pacote (pct.)
- Par (par)
- *Nota: Não há conversão entre estas unidades discretas*

## Como Funciona a Conversão

O processo de conversão ocorre no banco de dados através de um trigger SQL e envolve as seguintes etapas:

1. **Registro da Movimentação**: Quando uma movimentação é registrada, o sistema armazena tanto a quantidade quanto a unidade utilizada.

2. **Normalização das Unidades**: As unidades são normalizadas para formatos padrão (kg, g, l, ml, m, cm) para facilitar a conversão.

3. **Detecção de Diferença de Unidades**: O sistema verifica se a unidade da movimentação é diferente da unidade configurada para o produto.

4. **Aplicação da Conversão**: Se as unidades forem diferentes, o sistema aplica o fator de conversão apropriado:
   - De g para kg: multiplica por 0.001
   - De kg para g: multiplica por 1000
   - De ml para l: multiplica por 0.001
   - De l para ml: multiplica por 1000
   - De cm para m: multiplica por 0.01
   - De m para cm: multiplica por 100

5. **Atualização do Estoque**: O estoque do produto é atualizado com a quantidade convertida.

## Exemplos Práticos

### Exemplo 1: Entrada em gramas para produto em quilogramas
- Produto: Açúcar (unidade: kg, estoque inicial: 10kg)
- Movimento: Entrada de 500g
- Conversão: 500g → 0.5kg
- Estoque final: 10.5kg

### Exemplo 2: Saída em mililitros para produto em litros
- Produto: Óleo (unidade: L, estoque inicial: 25L)
- Movimento: Saída de 750mL
- Conversão: 750mL → 0.75L
- Estoque final: 24.25L

### Exemplo 3: Entrada em centímetros para produto em metros
- Produto: Cabo (unidade: m, estoque inicial: 50m)
- Movimento: Entrada de 80cm
- Conversão: 80cm → 0.8m
- Estoque final: 50.8m

## Compensações Automáticas

O sistema também lida automaticamente com compensações quando movimentações são:

1. **Excluídas**: Reverte o efeito da movimentação no estoque, aplicando a conversão inversa.

2. **Atualizadas**: Remove o efeito da movimentação original e aplica o efeito da movimentação atualizada, considerando as conversões necessárias.

3. **Marcadas como deletadas**: Trata como uma exclusão, revertendo o efeito da movimentação no estoque.

## Implementação Técnica

A implementação técnica desta funcionalidade inclui:

1. **Tabela `movements`**: Inclui uma coluna `unit` que armazena a unidade usada na movimentação.

2. **Função SQL `convert_units()`**: Função auxiliar que realiza as conversões entre unidades.

3. **Trigger `update_product_quantity()`**: Trigger que é acionado após inserções, atualizações ou exclusões na tabela `movements` e atualiza o estoque dos produtos, considerando as conversões necessárias.

## Limitações e Considerações

- A conversão só é aplicada entre unidades da mesma categoria (peso, volume, comprimento).
- Não há conversão entre categorias diferentes (ex: de peso para volume).
- Unidades discretas (unidade, caixa, pacote, par) não são convertidas entre si.
- A precisão das conversões é limitada à precisão numérica do tipo NUMERIC no PostgreSQL.

## Testes e Validação

A funcionalidade de conversão de unidades foi extensivamente testada usando o script `test_trigger_estoque.js`, que verifica:

- Conversões em todas as direções para cada categoria (kg→g, g→kg, l→ml, ml→l, m→cm, cm→m)
- Combinações de entradas e saídas com diferentes unidades
- Compensações automáticas para exclusões e atualizações

Todos os testes foram bem-sucedidos, confirmando a robustez da implementação.

## Conclusão

O suporte a conversão de unidades melhora significativamente a usabilidade do sistema, permitindo que os usuários registrem movimentações nas unidades mais convenientes para cada situação, independentemente da unidade configurada para o produto. As conversões são tratadas automaticamente pelo sistema, garantindo a consistência e precisão do controle de estoque. 