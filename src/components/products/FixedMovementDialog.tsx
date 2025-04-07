/**
 * Este é um arquivo temporário para substituir apenas a lógica de validação de quantidade
 * no arquivo ModernMovementDialog.tsx. Use este código para substituir as funções
 * correspondentes no arquivo original.
 */

/**
 * Função para validação de quantidade para saídas (a ser usada em onSubmit e handleSubmitButtonClick)
 * Retorna { valid: boolean, message: string | null }
 */
const validateQuantityForMovement = (
    type, // 'entrada' ou 'saida'
    product, 
    parsedValue, // valor numérico inserido
    selectedUnitType, // unidade selecionada (ou default)
    form // referência ao formulário para gerenciar erros
) => {
    // Ignorar verificação para entradas
    if (type !== 'saida' || !product) {
        return { valid: true, message: null };
    }

    // Log detalhado do produto
    console.log("DEBUG - VALIDAÇÃO DE QUANTIDADE:", {
        id: product.id,
        name: product.name,
        code: product.code,
        unit: product.unit,
        quantity: product.quantity,
        selectedUnitType,
        parsedValue
    });
    
    // Converter para unidade do produto para comparação
    const convertedValue = normalizeQuantityForComparison(
        parsedValue,
        selectedUnitType,
        product.unit
    );
    
    console.log("DEBUG - Conversão:", {
        original: parsedValue,
        convertedValue,
        productQuantity: product.quantity
    });
    
    // ========= LÓGICA DE VALIDAÇÃO =========
    
    // Se a unidade selecionada for a mesma do produto, comparar diretamente
    if (selectedUnitType === 'default' || normalizeUnit(selectedUnitType) === normalizeUnit(product.unit)) {
        console.log("Comparação direta (mesmas unidades)");
        if (parsedValue > (product.quantity + 0.01)) {
            console.log("❌ Estoque insuficiente (unidades iguais)");
            
            return { 
                valid: false, 
                message: 'Quantidade não pode ser maior que o estoque disponível'
            };
        }
    } 
    // Unidades diferentes, usar o valor convertido
    else {
        console.log("Comparação com valor convertido (unidades diferentes)");
        if (convertedValue > (product.quantity + 0.01)) {
            console.log("❌ Estoque insuficiente (após conversão)");
            
            return { 
                valid: false, 
                message: 'Quantidade não pode ser maior que o estoque disponível'
            };
        }
    }
    
    console.log("✅ Estoque suficiente");
    return { valid: true, message: null };
};

/**
 * COMO USAR:
 * 
 * 1. No método onSubmit, substitua o bloco de verificação de estoque por:
 * 
 *    // Verificar estoque (apenas para saídas)
 *    if (type === 'saida' && product) {
 *        // Unidade selecionada no formulário (ou unidade padrão do produto)
 *        const selectedUnitType = form.watch('unitType') === 'default' ? product.unit : form.watch('unitType');
 *        
 *        const validationResult = validateQuantityForMovement(
 *            type,
 *            product,
 *            parsedValue,
 *            selectedUnitType,
 *            form
 *        );
 *        
 *        if (!validationResult.valid) {
 *            form.setError('quantity', { 
 *                type: 'manual', 
 *                message: validationResult.message 
 *            });
 *            return;
 *        }
 *    }
 * 
 * 2. Faça a mesma substituição no método handleSubmitButtonClick
 */ 