# Solução para Precisão em Cálculos de Estoque

## Problema Original

O sistema apresentava problemas de precisão nas conversões entre unidades de medida, especialmente ao lidar com:
- Conversões entre litros (L) e mililitros (ml)
- Conversões entre quilogramas (kg) e gramas (g)

Isso resultava em situações onde validações de estoque falhavam incorretamente ou onde quantidades mínimas (como 250ml) não poderiam ser retiradas de quantidades grandes (como 214L).

## Abordagem da Solução

A solução implementada segue três princípios fundamentais:

1. **Cálculos com Precisão Exata**: Manter a precisão decimal completa em todos os cálculos internos, sem arredondamentos prematuros.

2. **Validação em Unidades Base**: Converter para unidades base (ml e g) e usar valores inteiros apenas para validação de estoque.

3. **Exibição Formatada**: Manter a exibição adequada para cada tipo de unidade (inteiros para ml/g, decimais para L/kg).

## Implementação

### 1. Novas Funções de Conversão

Foram criadas duas funções principais:

- **`convertToBaseUnit`**: Converte um valor para a unidade base (ml ou g) para fins de validação, arredondando para inteiros.
  ```typescript
  function convertToBaseUnit(value, unit): { value: number; unit: string }
  ```

- **`convertQuantityExact`**: Realiza conversões entre unidades mantendo a precisão exata (sem arredondamento).
  ```typescript
  function convertQuantityExact(value, fromUnit, toUnit): number
  ```

### 2. Nova Validação de Estoque

A função `validateStock` foi atualizada para usar as unidades base, garantindo validações precisas:

```typescript
function validateStock(
  productQuantity, 
  requestedQuantity, 
  requestedUnit, 
  productUnit
): { valid: boolean; message: string | null }
```

O processo de validação:
1. Verifica compatibilidade de unidades (volume vs peso)
2. Converte para unidades base (ml, g) para comparação
3. Realiza comparação com valores inteiros

### 3. Modificações nos Componentes

- **ModernMovementDialog.tsx**: Atualizado para usar as novas funções de conversão exata
- **MeasurementUnitUtils.ts**: Atualizado com as novas funções para centralizar a lógica de conversão

## Benefícios da Solução

1. **Precisão Garantida**: Cálculos internos mantêm precisão total sem arredondamentos desnecessários
2. **Validações Consistentes**: Comparações em unidades base (ml, g) garantem validações consistentes
3. **Compatibilidade**: Mantém retrocompatibilidade com o código existente
4. **Usabilidade**: Mantém a exibição formatada para o usuário conforme o tipo de unidade

## Exemplos de Casos Resolvidos

1. **Retirada de 250ml de um produto com 214L**:
   - Antes: Falhava na validação
   - Agora: Funciona corretamente (214L = 214000ml > 250ml)

2. **Retirada de 4567ml de um produto com 12L**:
   - Antes: Problemas de precisão afetavam a validação
   - Agora: Valida corretamente (12L = 12000ml > 4567ml)

3. **Múltiplas operações com kg/g**:
   - Agora: Mantém precisão exata nos cálculos, enquanto valida corretamente

## Conclusão

A implementação resolve o problema mantendo a precisão nos cálculos, facilitando as validações e oferecendo uma experiência consistente para o usuário, sem comprometer a lógica de negócio existente. 