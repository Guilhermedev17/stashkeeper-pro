import { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowDown, ArrowUp, Package, User, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseMovements } from '@/hooks/useSupabaseMovements';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatQuantity, parseDecimal } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface Product {
    id: string;
    code: string;
    name: string;
    description: string;
    unit: string;
    quantity: number;
    categoryName?: string;
}

// Interface para a movimentação a ser editada
export interface MovementData {
    id: string;
    product_id: string;
    type: 'entrada' | 'saida';
    quantity: number;
    created_at: string;
    employee_name?: string;
    employee_id?: string;
    notes?: string;
}

// Define o schema de validação para o formulário
const formSchema = z.object({
    quantity: z.coerce.number().positive({ message: 'A quantidade deve ser maior que zero' }),
    notes: z.string().optional(),
    employee_id: z.string().optional(),
    unitType: z.string().default('default'), // Nova propriedade para a unidade de medida
});

// Tipo condicional para tornar employee_id obrigatório para saídas
const createFormSchema = (type: 'entrada' | 'saida') => {
    if (type === 'saida') {
        return formSchema.refine(
            (data) => !!data.employee_id,
            {
                message: 'Selecione um colaborador responsável',
                path: ['employee_id'],
            }
        );
    }
    return formSchema;
};

type FormValues = z.infer<typeof formSchema>;

interface ModernMovementDialogProps {
    product: Product | null;
    type: 'entrada' | 'saida';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editMode?: boolean;
    movementToEdit?: MovementData | null;
}

// Função para obter o nome completo da unidade
const getFullUnitName = (unitCode: string): string => {
    const unitMap: Record<string, string> = {
        'un': 'unidades',
        'kg': 'quilogramas',
        'g': 'gramas',
        'mg': 'miligramas',
        'l': 'litros',
        'ml': 'mililitros',
        'm': 'metros',
        'cm': 'centímetros',
        'mm': 'milímetros',
        'cx': 'caixas',
        'pct': 'pacotes',
        'rl': 'rolos',
        'par': 'pares',
        'conj': 'conjuntos'
    };

    return unitMap[unitCode.toLowerCase()] || unitCode;
};

// Função para obter as unidades relacionadas para conversão
const getRelatedUnits = (unit: string): { value: string, label: string, conversionFactor: number }[] => {
    // Normalizar para minúsculo para comparação
    const unitLower = unit.toLowerCase();
    
    console.log(`Detectando unidades relacionadas para: ${unit} (normalizado: ${unitLower})`);

    // Unidades de peso
    if (unitLower === 'kg') {
        return [
            { value: 'default', label: 'kg (padrão)', conversionFactor: 1 },
            { value: 'g', label: 'g (gramas)', conversionFactor: 1000 }
        ];
    }
    else if (unitLower === 'g') {
        return [
            { value: 'default', label: 'g (padrão)', conversionFactor: 1 },
            { value: 'kg', label: 'kg (quilogramas)', conversionFactor: 0.001 }
        ];
    }

    // Unidades de volume - checar 'l' ou 'L'
    else if (unitLower === 'l' || unitLower === 'litro' || unitLower === 'litros') {
        return [
            { value: 'default', label: 'L (padrão)', conversionFactor: 1 },
            { value: 'ml', label: 'ml (mililitros)', conversionFactor: 1000 }
        ];
    }
    else if (unitLower === 'ml' || unitLower === 'mililitro' || unitLower === 'mililitros') {
        return [
            { value: 'default', label: 'ml (padrão)', conversionFactor: 1 },
            { value: 'l', label: 'L (litros)', conversionFactor: 0.001 }
        ];
    }

    // Unidades para rolos/etiquetas
    else if (unitLower === 'rl' || unitLower === 'rolo' || unitLower === 'rolos') {
        return [
            { value: 'default', label: 'Rolo (padrão)', conversionFactor: 1 },
            { value: 'un', label: 'Etiquetas', conversionFactor: 100 } // Assumindo 100 etiquetas por rolo
        ];
    }

    // Para outras unidades, retorna apenas a padrão
    console.log(`Unidade não reconhecida para conversão: ${unit}, usando padrão`);
    return [
        { value: 'default', label: `${unit} (padrão)`, conversionFactor: 1 }
    ];
};

// Função para obter a explicação com base na unidade selecionada
const getUnitExplanation = (unitType: string, baseUnit: string): string => {
    // Unidades de peso
    if (baseUnit.toLowerCase() === 'kg' && unitType === 'g') {
        return "Digite diretamente em gramas. Exemplo: 90g = digite 90";
    } 
    else if (baseUnit.toLowerCase() === 'g' && unitType === 'kg') {
        return "Digite em quilogramas. Exemplo: 90g = digite 0,090";
    }
    // Unidades de volume
    else if (baseUnit.toLowerCase() === 'l' && unitType === 'ml') {
        return "Digite diretamente em mililitros. Exemplo: 500ml = digite 500";
    }
    else if (baseUnit.toLowerCase() === 'ml' && unitType === 'l') {
        return "Digite em litros. Exemplo: 500ml = digite 0,5";
    }
    
    return "";
};

// Para depuração
const DEBUG = true;

/**
 * Função auxiliar para converter valores entre unidades
 * Garante consistência na conversão em todos os pontos do componente
 */
const convertQuantityBetweenUnits = (
    value: number, 
    fromUnitType: string, 
    toUnitType: string, 
    conversionFactor: number
): number => {
    // Se as unidades são iguais ou já estamos na unidade padrão, não há conversão necessária
    if (fromUnitType === toUnitType || fromUnitType === 'default') {
        console.log(`Sem conversão: ${value} (unidades iguais ou padrão)`);
        return value;
    }
    
    let result = value;
    
    // Cenários específicos de conversão
    if (conversionFactor === 1000) {
        // Caso ml para L ou g para kg (unidade menor para maior)
        result = value / conversionFactor;
        console.log(`Convertendo de unidade menor para maior: ${value} / ${conversionFactor} = ${result}`);
    } 
    else if (conversionFactor === 0.001) {
        // Caso L para ml ou kg para g (unidade maior para menor)
        result = value * 1000; // Equivalente a value / conversionFactor
        console.log(`Convertendo de unidade maior para menor: ${value} * 1000 = ${result}`);
    }
    else {
        // Caso genérico utilizando o fator de conversão
        if (conversionFactor > 1) {
            result = value / conversionFactor;
            console.log(`Conversão genérica (divisão): ${value} / ${conversionFactor} = ${result}`);
        } else {
            result = value * (1 / conversionFactor);
            console.log(`Conversão genérica (multiplicação): ${value} * (1/${conversionFactor}) = ${result}`);
        }
    }
    
    console.log(`FINAL: Convertido ${value} na unidade ${fromUnitType} para ${result} na unidade ${toUnitType}`);
    return result;
};

/**
 * Converte um valor para a unidade base do produto para comparação de estoque
 * com limitação de casas decimais para evitar problemas de arredondamento
 */
const normalizeQuantityForComparison = (
    value: number,
    fromUnit: string,
    toUnit: string
): number => {
    // Normalizar unidades para minúsculas
    const fromUnitLower = fromUnit.toLowerCase();
    const toUnitLower = toUnit.toLowerCase();
    
    // Se as unidades são iguais, não é necessário converter
    if (fromUnitLower === toUnitLower || fromUnit === 'default') {
        return Number(value.toFixed(3)); // Limitar a 3 casas decimais
    }
    
    let convertedValue;
    
    // ml para L (0.09L = 90ml)
    if (fromUnitLower === 'ml' && toUnitLower === 'l') {
        convertedValue = value / 1000;
        return Number(convertedValue.toFixed(3)); // Limitar a 3 casas decimais
    }
    
    // L para ml
    if (fromUnitLower === 'l' && toUnitLower === 'ml') {
        convertedValue = value * 1000;
        return Number(convertedValue.toFixed(3)); // Limitar a 3 casas decimais
    }
    
    // g para kg (0.09kg = 90g)
    if (fromUnitLower === 'g' && toUnitLower === 'kg') {
        convertedValue = value / 1000;
        return Number(convertedValue.toFixed(3)); // Limitar a 3 casas decimais
    }
    
    // kg para g
    if (fromUnitLower === 'kg' && toUnitLower === 'g') {
        convertedValue = value * 1000;
        return Number(convertedValue.toFixed(3)); // Limitar a 3 casas decimais
    }
    
    // Nenhuma conversão específica encontrada
    return Number(value.toFixed(3)); // Limitar a 3 casas decimais
};

/**
 * Diálogo modernizado para registrar movimentações de entrada e saída de produtos.
 * Suporta adição de detalhes como quantidade, responsável e observações.
 */
export function ModernMovementDialog({
    product,
    type,
    open,
    onOpenChange,
    editMode = false,
    movementToEdit = null
}: ModernMovementDialogProps) {
    const { fetchProducts } = useSupabaseProducts();
    const { fetchMovements } = useSupabaseMovements();
    const { employees } = useSupabaseEmployees();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
    const [unitOptions, setUnitOptions] = useState<{ value: string, label: string, conversionFactor: number }[]>([]);
    const [selectedConversionFactor, setSelectedConversionFactor] = useState(1);
    const [quantityInput, setQuantityInput] = useState(''); // Estado para controlar o input de quantidade com vírgula

    // Resolver atualizado quando o tipo muda
    const resolver = zodResolver(createFormSchema(type));

    // Inicializa o formulário
    const form = useForm<FormValues>({
        resolver,
        defaultValues: {
            quantity: null,
            notes: '',
            employee_id: '',
            unitType: 'default'
        },
    });

    // Reset do formulário quando o produto ou tipo muda
    useEffect(() => {
        if (open) {
            // Valores padrão para nova movimentação
            let defaultValues = {
                notes: '',
                employee_id: '',
                unitType: 'default'
            };

            // Se estiver em modo de edição e houver uma movimentação para editar
            if (editMode && movementToEdit) {
                defaultValues = {
                    ...defaultValues,
                    notes: movementToEdit.notes || '',
                    employee_id: movementToEdit.employee_id || '',
                    unitType: 'default'
                };
                // Atualizar o input de quantidade formatado
                setQuantityInput(movementToEdit.quantity.toString().replace('.', ','));
            } else {
                // Preservar o valor da quantidade se já existir, caso contrário limpar
                const currentQuantity = quantityInput;
                if (!currentQuantity || currentQuantity === '') {
                    setQuantityInput('');
                }
            }

            form.reset(defaultValues);

            // Revalidar o formulário quando o tipo muda para aplicar a validação condicional
            form.clearErrors();

            // Definir opções de unidade baseadas no produto selecionado
            if (product) {
                const options = getRelatedUnits(product.unit);
                setUnitOptions(options);
                setSelectedConversionFactor(options[0]?.conversionFactor || 1);

                // Preservar o valor da quantidade no formulário, se existir
                const numericValue = quantityInput.replace(',', '.');
                const parsedValue = parseFloat(numericValue);
                if (!isNaN(parsedValue)) {
                    form.setValue('quantity', parsedValue);
                }
            }
        }
    }, [open, form, product, type, editMode, movementToEdit]);

    useEffect(() => {
        setActiveEmployees(employees.filter(emp => emp.status === 'active'));
    }, [employees]);

    // Função para lidar com mudanças no input de quantidade
    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        
        // Permitir apenas números, vírgula e ponto como separador decimal
        const isValidInput = /^[\d.,]*$/.test(value);
        if (!isValidInput && value !== '') return;
        
        setQuantityInput(value);
        
        // Atualizar o valor no formulário, convertendo para número se possível
        const numericValue = value.replace(',', '.');
        const parsedValue = parseFloat(numericValue);
        
        if (!isNaN(parsedValue)) {
            // Limitar a 3 casas decimais para evitar problemas de comparação
            const roundedValue = Number(parsedValue.toFixed(3));
            form.setValue('quantity', roundedValue);
        } else {
            form.setValue('quantity', null);
        }
    };

    // Função para registrar a movimentação
    const onSubmit = async (values: FormValues) => {
        console.log("[ModernMovementDialog] Tentando submeter formulário");
        if (!product) return;

        // Validar quantidade explicitamente antes de prosseguir
        const numericValue = quantityInput.replace(',', '.');
        const parsedValue = parseFloat(numericValue);
        
        // Verificar se é um número válido
        if (isNaN(parsedValue) || parsedValue <= 0) {
            form.setError('quantity', { 
                type: 'manual', 
                message: 'Quantidade deve ser maior que zero' 
            });
            return;
        }
        
        // Verificar estoque (apenas para saídas)
        if (type === 'saida' && product) {
            // Unidade selecionada no formulário (ou unidade padrão do produto)
            const selectedUnitType = form.watch('unitType') === 'default' ? product.unit : form.watch('unitType');
            
            // Converter para unidade do produto para comparação com arredondamento
            const convertedValue = normalizeQuantityForComparison(
                parsedValue,
                selectedUnitType,
                product.unit
            );
            
            // Adicionar uma pequena tolerância para evitar problemas de arredondamento
            const TOLERANCE = 0.001; // Tolerância de 0.001 unidades
            
            // Verificar se a quantidade convertida é maior que o estoque disponível
            if (convertedValue > (product.quantity + TOLERANCE)) {
                form.setError('quantity', { 
                    type: 'manual', 
                    message: 'Quantidade não pode ser maior que o estoque disponível' 
                });
                return;
            }
        }
        
        // Se chegou aqui, o valor é válido
        form.clearErrors('quantity');
        
        // Obter os valores do formulário e adicionar a quantidade manualmente
        const finalValues = {
            ...values,
            quantity: parsedValue
        };
        
        setIsSubmitting(true);

        try {
            // Converter o valor inserido para a unidade base do produto, se necessário
            let finalQuantity = Number(parsedValue.toFixed(3)); // Limitar a 3 casas decimais
            
            if (form.watch('unitType') !== 'default') {
                // Unidade selecionada no formulário
                const selectedUnitType = form.watch('unitType');
                
                // Converter para unidade do produto para armazenar com limitação de casas decimais
                finalQuantity = normalizeQuantityForComparison(
                    parsedValue,
                    selectedUnitType,
                    product.unit
                );
            }

            // Buscar o produto atual para obter a quantidade atualizada
            const { data: productData, error: productFetchError } = await supabase
                .from('products')
                .select('quantity')
                .eq('id', product.id)
                .single();

            if (productFetchError) throw productFetchError;

            let currentQuantity = productData.quantity || 0;
            let newQuantity = currentQuantity;

            // Se estiver editando uma movimentação existente
            if (editMode && movementToEdit) {
                // 1. Primeiro reverter a movimentação antiga
                if (movementToEdit.type === 'entrada') {
                    // Se a entrada original for revertida, diminuir do estoque
                    newQuantity = currentQuantity - movementToEdit.quantity;
                } else {
                    // Se a saída original for revertida, adicionar ao estoque
                    newQuantity = currentQuantity + movementToEdit.quantity;
                }

                // 2. Verifica se podemos continuar após a reversão
                if (newQuantity < 0) {
                    throw new Error('Não é possível reverter a movimentação original, pois deixaria o estoque negativo.');
                }

                // 3. Agora aplicar a nova movimentação
                newQuantity = type === 'entrada'
                    ? newQuantity + finalQuantity
                    : newQuantity - finalQuantity;

                // 4. Verificar se há quantidade suficiente para a nova saída
                if (newQuantity < 0) {
                    throw new Error('Quantidade insuficiente em estoque para a nova saída');
                }

                // 5. Atualizar a movimentação existente
                const { error: updateMovementError } = await supabase
                    .from('movements')
                    .update({
                        type,
                        quantity: finalQuantity,
                        notes: finalValues.notes || null,
                        employee_id: type === 'saida' ? finalValues.employee_id : null,
                    })
                    .eq('id', movementToEdit.id);

                if (updateMovementError) throw updateMovementError;
            } else {
                // Fluxo para nova movimentação
                // 1. Calcular a nova quantidade
                newQuantity = type === 'entrada'
                    ? currentQuantity + finalQuantity
                    : currentQuantity - finalQuantity;

                // Verifica se há quantidade suficiente para saída
                if (type === 'saida' && newQuantity < 0) {
                    throw new Error('Quantidade insuficiente em estoque');
                }

                // 2. Registrar a nova movimentação
                const { error: movementError } = await supabase
                    .from('movements')
                    .insert({
                        product_id: product.id,
                        type: type,
                        quantity: finalQuantity,
                        notes: finalValues.notes || null,
                        employee_id: type === 'saida' ? finalValues.employee_id : null,
                    });

                if (movementError) throw movementError;
            }

            // Atualizar a quantidade do produto
            const { error: updateError } = await supabase
                .from('products')
                .update({ quantity: newQuantity })
                .eq('id', product.id);

            if (updateError) throw updateError;

            // Atualizar dados
            await fetchMovements();
            await fetchProducts();

            // Fechar o diálogo e mostrar mensagem de sucesso
            onOpenChange(false);
            
            toast({
                title: editMode ? "Movimentação atualizada" : "Movimentação registrada",
                description: editMode 
                    ? "A movimentação foi atualizada com sucesso e o estoque foi ajustado."
                    : `${type === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso.`,
                duration: 3000
            });
        } catch (error) {
            console.error('Erro ao processar movimentação:', error);
            toast({
                title: "Erro",
                description: error instanceof Error ? error.message : "Ocorreu um erro ao processar a movimentação.",
                variant: "destructive",
                duration: 5000
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Button onClick handler
    const handleSubmitButtonClick = (e: React.MouseEvent) => {
        e.preventDefault();
        
        // Validar a quantidade diretamente aqui
        const numericValue = quantityInput.replace(',', '.');
        const parsedValue = parseFloat(numericValue);
        
        // Verificar se é um número válido
        if (isNaN(parsedValue) || parsedValue <= 0) {
            form.setError('quantity', { 
                type: 'manual', 
                message: 'Quantidade deve ser maior que zero' 
            });
            return;
        }
        
        // Para saídas, verificar se há estoque suficiente
        if (type === 'saida' && product) {
            // Unidade selecionada no formulário (ou unidade padrão do produto)
            const selectedUnitType = form.watch('unitType') === 'default' ? product.unit : form.watch('unitType');
            
            // Converter para unidade do produto para comparação com arredondamento
            const convertedValue = normalizeQuantityForComparison(
                parsedValue,
                selectedUnitType,
                product.unit
            );
            
            // Adicionar uma pequena tolerância para evitar problemas de arredondamento
            const TOLERANCE = 0.001; // Tolerância de 0.001 unidades
            
            // Verificar se a quantidade convertida é maior que o estoque disponível
            if (convertedValue > (product.quantity + TOLERANCE)) {
                form.setError('quantity', { 
                    type: 'manual', 
                    message: 'Quantidade não pode ser maior que o estoque disponível' 
                });
                return;
            }
        }
        
        // Se chegou aqui, o valor é válido
        form.clearErrors('quantity');
        
        // Obter os valores do formulário e adicionar a quantidade manualmente
        const values = form.getValues() as FormValues;
        values.quantity = Number(parsedValue.toFixed(3)); // Limitar a 3 casas decimais
        
        // Chamar onSubmit com os valores combinados
        onSubmit(values);
    };

    // Quando a unidade de medida é alterada, atualizar o fator de conversão
    const handleUnitTypeChange = (value: string) => {
        form.setValue('unitType', value);
        const selectedUnit = unitOptions.find(unit => unit.value === value);
        setSelectedConversionFactor(selectedUnit?.conversionFactor || 1);
    };

    if (!product) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] md:max-w-[650px] p-0 gap-0 overflow-hidden border-none max-h-[90vh] overflow-y-auto">
                {/* Cabeçalho colorido baseado no tipo */}
                <div className={cn(
                    "p-5 sm:p-6 flex items-center gap-4",
                    type === 'entrada'
                        ? "bg-primary text-primary-foreground"
                        : "bg-blue-600 text-white"
                )}>
                    <div className="rounded-full p-2 sm:p-2.5 bg-white/20">
                        {type === 'entrada'
                            ? <ArrowDown className="h-5 w-5 sm:h-6 sm:w-6" />
                            : <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6" />
                        }
                    </div>
                    <div>
                        <DialogTitle className="text-xl sm:text-2xl font-semibold">
                            {editMode 
                                ? `Editar ${type === 'entrada' ? 'Entrada' : 'Saída'}`
                                : `Registrar ${type === 'entrada' ? 'Entrada' : 'Saída'}`
                            }
                        </DialogTitle>
                        <DialogDescription className="text-sm mt-1 text-white/80">
                            {type === 'entrada'
                                ? editMode ? 'Edite a entrada de produtos no estoque.' : 'Registre a entrada de produtos no estoque.'
                                : editMode ? 'Edite a saída de produtos do estoque.' : 'Registre a saída de produtos do estoque.'
                            }
                        </DialogDescription>
                    </div>
                </div>

                {/* Detalhes do produto */}
                <div className="p-5 sm:p-6 bg-card">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h4 className="font-medium text-base">{product.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="font-mono text-xs border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                                    {product.code}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{getFullUnitName(product.unit)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Formulário de registro de movimentação */}
                    <Form {...form}>
                        <form className="space-y-4">
                            {/* Campo de quantidade */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="quantity" className="text-sm font-medium">Quantidade</Label>
                                    <Input
                                        id="quantity"
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="Insira a quantidade"
                                        value={quantityInput}
                                        onChange={handleQuantityChange}
                                        className="mt-1.5 w-full"
                                        autoComplete="off"
                                    />
                                    {form.formState.errors.quantity && (
                                        <p className="text-destructive text-xs mt-1">
                                            {form.formState.errors.quantity.message}
                                        </p>
                                    )}
                                </div>

                                {/* Seção de unidade de medida */}
                                <FormField
                                    control={form.control}
                                    name="unitType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel htmlFor="unitType">Unidade de Medida</FormLabel>
                                            <Select
                                                onValueChange={handleUnitTypeChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger id="unitType">
                                                        <SelectValue placeholder="Selecione a unidade" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {unitOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                            {getUnitExplanation(form.watch('unitType'), product.unit) && (
                                                <div className="mt-1.5 py-1.5 px-2 text-xs rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 flex items-center">
                                                    <Info className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-blue-500" />
                                                    <span>{getUnitExplanation(form.watch('unitType'), product.unit)}</span>
                                                </div>
                                            )}
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Seleção de colaborador para saídas */}
                            {type === 'saida' && (
                                <FormField
                                    control={form.control}
                                    name="employee_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel htmlFor="employee_id">Colaborador Responsável</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger id="employee_id" className="flex items-center">
                                                        <SelectValue placeholder="Selecione o colaborador" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {activeEmployees.map((employee) => (
                                                        <SelectItem key={employee.id} value={employee.id}>
                                                            {employee.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Campo de observações */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="notes">Observações (opcional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                id="notes"
                                                placeholder="Adicione observações sobre esta movimentação"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </div>

                {/* Botões de confirmação/cancelamento */}
                <DialogFooter className="px-5 sm:px-6 py-4 border-t border-border flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmitButtonClick}
                        disabled={isSubmitting}
                        className={cn(
                            "gap-1.5",
                            type === 'entrada' ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                <span>Processando...</span>
                            </>
                        ) : (
                            <>
                                {type === 'entrada' ? (
                                    <ArrowDown className="h-4 w-4" />
                                ) : (
                                    <ArrowUp className="h-4 w-4" />
                                )}
                                <span>{editMode ? 'Atualizar' : 'Confirmar'}</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ModernMovementDialog; 