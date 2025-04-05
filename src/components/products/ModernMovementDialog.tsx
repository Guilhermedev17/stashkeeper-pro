import { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowDown, ArrowUp, Package, User } from 'lucide-react';
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

export interface Product {
    id: string;
    code: string;
    name: string;
    description: string;
    unit: string;
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
    const unitLower = unit.toLowerCase();

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

    // Unidades de volume
    else if (unitLower === 'l') {
        return [
            { value: 'default', label: 'L (padrão)', conversionFactor: 1 },
            { value: 'ml', label: 'ml (mililitros)', conversionFactor: 1000 }
        ];
    }
    else if (unitLower === 'ml') {
        return [
            { value: 'default', label: 'ml (padrão)', conversionFactor: 1 },
            { value: 'l', label: 'L (litros)', conversionFactor: 0.001 }
        ];
    }

    // Unidades para rolos/etiquetas
    else if (unitLower === 'rl') {
        return [
            { value: 'default', label: 'Rolo (padrão)', conversionFactor: 1 },
            { value: 'un', label: 'Etiquetas', conversionFactor: 100 } // Assumindo 100 etiquetas por rolo
        ];
    }

    // Para outras unidades, retorna apenas a padrão
    return [
        { value: 'default', label: `${unit} (padrão)`, conversionFactor: 1 }
    ];
};

/**
 * Diálogo modernizado para registrar movimentações de entrada e saída de produtos.
 * Suporta adição de detalhes como quantidade, responsável e observações.
 */
export function ModernMovementDialog({
    product,
    type,
    open,
    onOpenChange
}: ModernMovementDialogProps) {
    const { fetchProducts } = useSupabaseProducts();
    const { fetchMovements } = useSupabaseMovements();
    const { employees } = useSupabaseEmployees();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
    const [unitOptions, setUnitOptions] = useState<{ value: string, label: string, conversionFactor: number }[]>([]);
    const [selectedConversionFactor, setSelectedConversionFactor] = useState(1);

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
            form.reset({
                quantity: null,
                notes: '',
                employee_id: '',
                unitType: 'default'
            });

            // Revalidar o formulário quando o tipo muda para aplicar a validação condicional
            form.clearErrors();

            // Definir opções de unidade baseadas no produto selecionado
            if (product) {
                const options = getRelatedUnits(product.unit);
                setUnitOptions(options);
                setSelectedConversionFactor(options[0]?.conversionFactor || 1);
            }
        }
    }, [open, form, product, type]);

    useEffect(() => {
        setActiveEmployees(employees.filter(emp => emp.status === 'active'));
    }, [employees]);

    // Função para registrar a movimentação
    const onSubmit = async (values: FormValues) => {
        if (!product) return;

        setIsSubmitting(true);

        try {
            // Converter quantidade para a unidade padrão do produto
            const finalQuantity = values.unitType === 'default'
                ? values.quantity
                : values.quantity / selectedConversionFactor;

            // 1. Registra a movimentação
            const { error: movementError } = await supabase
                .from('movements')
                .insert({
                    product_id: product.id,
                    type: type,
                    quantity: finalQuantity,
                    notes: values.notes || null,
                    employee_id: type === 'saida' ? values.employee_id : null,
                });

            if (movementError) throw movementError;

            // 2. Busca o produto atual para obter a quantidade atualizada
            const { data: productData, error: productFetchError } = await supabase
                .from('products')
                .select('quantity')
                .eq('id', product.id)
                .single();

            if (productFetchError) throw productFetchError;

            // 3. Calcula a nova quantidade
            const currentQuantity = productData.quantity || 0;
            const newQuantity = type === 'entrada'
                ? currentQuantity + finalQuantity
                : currentQuantity - finalQuantity;

            // Verifica se há quantidade suficiente para saída
            if (type === 'saida' && newQuantity < 0) {
                throw new Error('Quantidade insuficiente em estoque');
            }

            // 4. Atualiza a quantidade do produto
            const { error: updateError } = await supabase
                .from('products')
                .update({ quantity: newQuantity })
                .eq('id', product.id);

            if (updateError) throw updateError;

            // Identifica o nome do colaborador, se aplicável
            let employeeName = '';
            if (type === 'saida' && values.employee_id) {
                const employee = activeEmployees.find(emp => emp.id === values.employee_id);
                employeeName = employee ? employee.name : '';
            }

            // Obtém o nome da unidade usada para exibição
            const selectedUnit = unitOptions.find(opt => opt.value === values.unitType);
            const displayUnitLabel = selectedUnit
                ? selectedUnit.label.split(' ')[0].toUpperCase()
                : product.unit.toUpperCase();

            // Exibe mensagem de sucesso e fecha o diálogo
            toast({
                title: `${type === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso`,
                description: type === 'entrada'
                    ? `Entrada de ${values.quantity} ${getFullUnitName(product.unit).toUpperCase()} de ${product.name} registrada.`
                    : `Saída de ${values.quantity} ${displayUnitLabel} de ${product.name} registrada para ${employeeName}.`,
                variant: 'default',
            });

            // Atualiza os dados
            fetchProducts();
            fetchMovements();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: 'Erro ao registrar movimentação',
                description: error.message || 'Ocorreu um erro ao registrar a movimentação.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            Registrar {type === 'entrada' ? 'Entrada' : 'Saída'}
                        </DialogTitle>
                        <DialogDescription className="text-sm mt-1 text-white/80">
                            {type === 'entrada'
                                ? 'Registre a entrada de produtos no estoque.'
                                : 'Registre a saída de produtos do estoque.'}
                        </DialogDescription>
                    </div>
                </div>

                {/* Detalhes do produto */}
                {product ? (
                    <div className="px-5 sm:px-6 py-4 border-b flex items-center gap-3 sm:gap-4 bg-background">
                        <div className="bg-muted/50 p-2 sm:p-2.5 rounded-md">
                            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-base sm:text-lg">{product.name}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <Badge variant="outline" className="font-mono text-sm px-1.5 py-0.5">
                                    {product.code}
                                </Badge>
                                <Badge variant="secondary" className="text-sm px-1.5 py-0.5">
                                    {getFullUnitName(product.unit).toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-5 sm:px-6 py-4 border-b bg-background">
                        <div className="p-2 sm:p-3 rounded-md bg-destructive/10 text-center">
                            <span className="text-xs sm:text-sm text-destructive font-medium">
                                Nenhum produto selecionado
                            </span>
                        </div>
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 sm:p-6 bg-background space-y-4 sm:space-y-6">
                        {/* Campo de quantidade */}
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs sm:text-sm font-medium">
                                        Quantidade
                                    </FormLabel>
                                    <FormControl>
                                        <div className="flex rounded-md overflow-hidden border focus-within:ring-2 focus-within:ring-ring/70 transition-all duration-200">
                                            <Input
                                                type="number"
                                                min="0.001"
                                                step="any"
                                                inputMode="decimal"
                                                placeholder="0"
                                                {...field}
                                                value={field.value === null ? '' : field.value}
                                                className="text-right border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 rounded-none text-sm h-10"
                                            />
                                            {type === 'saida' && unitOptions.length > 1 ? (
                                                <Select
                                                    onValueChange={(value) => {
                                                        form.setValue('unitType', value);
                                                        const selectedOption = unitOptions.find(opt => opt.value === value);
                                                        if (selectedOption) {
                                                            setSelectedConversionFactor(selectedOption.conversionFactor);
                                                        }
                                                    }}
                                                    defaultValue="default"
                                                >
                                                    <SelectTrigger className="min-w-[100px] w-[120px] border-0 border-l border-input rounded-none focus:ring-0 h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {unitOptions.map(option => (
                                                            <SelectItem key={option.value} value={option.value} className="text-sm">
                                                                {option.label.split(' ')[0].toUpperCase()}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="bg-muted flex items-center justify-center px-3 sm:px-4 text-sm font-medium text-muted-foreground border-l h-10 min-w-[100px] w-[120px]">
                                                    {product ? getFullUnitName(product.unit).toUpperCase() : 'UNIDADES'}
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Campo de colaborador (apenas para saída) */}
                        {type === 'saida' && (
                            <FormField
                                control={form.control}
                                name="employee_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium flex items-center">
                                            Colaborador Responsável
                                            <span className="text-destructive ml-1">*</span>
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full text-sm h-10">
                                                    <SelectValue placeholder="Selecione um colaborador" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent position="popper" className="max-h-60 overflow-auto">
                                                {activeEmployees.length === 0 ? (
                                                    <SelectItem value="empty" disabled>
                                                        Nenhum colaborador cadastrado
                                                    </SelectItem>
                                                ) : (
                                                    activeEmployees.map((employee) => (
                                                        <SelectItem key={employee.id} value={employee.id} className="text-sm">
                                                            {employee.name} {employee.code && `(${employee.code})`}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-xs" />
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
                                    <FormLabel className="text-sm font-medium">
                                        Observações
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Informações adicionais sobre esta movimentação"
                                            className="resize-none min-h-[80px] sm:min-h-[100px] text-sm"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="w-full sm:w-auto order-2 sm:order-1 text-sm h-10"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className={cn(
                                    "w-full sm:w-auto order-1 sm:order-2 text-sm h-10",
                                    type === 'entrada'
                                        ? "bg-primary hover:bg-primary/90"
                                        : "bg-blue-600 hover:bg-blue-700"
                                )}
                            >
                                {isSubmitting ? 'Aguarde...' : `Registrar ${type === 'entrada' ? 'Entrada' : 'Saída'}`}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default ModernMovementDialog; 