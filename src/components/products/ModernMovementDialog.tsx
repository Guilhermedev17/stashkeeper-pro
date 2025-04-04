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

    // Resolver atualizado quando o tipo muda
    const resolver = zodResolver(createFormSchema(type));

    // Inicializa o formulário
    const form = useForm<FormValues>({
        resolver,
        defaultValues: {
            quantity: 1,
            notes: '',
            employee_id: '',
        },
    });

    // Reset do formulário quando o produto ou tipo muda
    useEffect(() => {
        if (open) {
            form.reset({
                quantity: 1,
                notes: '',
                employee_id: '',
            });

            // Revalidar o formulário quando o tipo muda para aplicar a validação condicional
            form.clearErrors();
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
            // 1. Registra a movimentação
            const { error: movementError } = await supabase
                .from('movements')
                .insert({
                    product_id: product.id,
                    type: type,
                    quantity: values.quantity,
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
                ? currentQuantity + values.quantity
                : currentQuantity - values.quantity;

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

            // Exibe mensagem de sucesso e fecha o diálogo
            toast({
                title: `${type === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso`,
                description: type === 'entrada'
                    ? `Entrada de ${values.quantity} ${getFullUnitName(product.unit)} de ${product.name} registrada.`
                    : `Saída de ${values.quantity} ${getFullUnitName(product.unit)} de ${product.name} registrada para ${employeeName}.`,
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
            <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden border-none max-h-[90vh] overflow-y-auto">
                {/* Cabeçalho colorido baseado no tipo */}
                <div className={cn(
                    "p-4 sm:p-6 flex items-center gap-3",
                    type === 'entrada'
                        ? "bg-primary text-primary-foreground"
                        : "bg-blue-600 text-white"
                )}>
                    <div className="rounded-full p-1.5 sm:p-2 bg-white/20">
                        {type === 'entrada'
                            ? <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5" />
                            : <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
                        }
                    </div>
                    <div>
                        <DialogTitle className="text-lg sm:text-xl font-semibold">
                            Registrar {type === 'entrada' ? 'Entrada' : 'Saída'}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm mt-1 text-white/80">
                            {type === 'entrada'
                                ? 'Registre a entrada de produtos no estoque.'
                                : 'Registre a saída de produtos do estoque.'}
                        </DialogDescription>
                    </div>
                </div>

                {/* Detalhes do produto */}
                {product ? (
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center gap-2 sm:gap-3 bg-background">
                        <div className="bg-muted/50 p-1.5 sm:p-2 rounded-md">
                            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm sm:text-base">{product.name}</p>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                                <Badge variant="outline" className="font-mono text-xs">
                                    {product.code}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                    {getFullUnitName(product.unit)}
                                </Badge>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-background">
                        <div className="p-2 sm:p-3 rounded-md bg-destructive/10 text-center">
                            <span className="text-xs sm:text-sm text-destructive font-medium">
                                Nenhum produto selecionado
                            </span>
                        </div>
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 sm:p-6 bg-background space-y-4 sm:space-y-6">
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
                                                min="1"
                                                step="1"
                                                inputMode="numeric"
                                                {...field}
                                                className="text-right border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 rounded-none text-sm"
                                            />
                                            <div className="bg-muted flex items-center justify-center px-2 sm:px-3 text-xs sm:text-sm font-medium text-muted-foreground border-l">
                                                {product ? getFullUnitName(product.unit) : 'unidades'}
                                            </div>
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
                                        <FormLabel className="text-xs sm:text-sm font-medium flex items-center">
                                            Colaborador Responsável
                                            <span className="text-destructive ml-1">*</span>
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full text-xs sm:text-sm">
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
                                                        <SelectItem key={employee.id} value={employee.id} className="text-xs sm:text-sm">
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
                                    <FormLabel className="text-xs sm:text-sm font-medium">
                                        Observações
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Informações adicionais sobre esta movimentação"
                                            className="resize-none min-h-[60px] sm:min-h-[80px] text-xs sm:text-sm"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="w-full sm:w-auto order-2 sm:order-1 text-xs sm:text-sm"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className={cn(
                                    "w-full sm:w-auto order-1 sm:order-2 text-xs sm:text-sm",
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