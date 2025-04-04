import { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowDownUp, ArrowDown, ArrowUp, Package, User, PlusCircle, MinusCircle, Loader2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseMovements } from '@/hooks/useSupabaseMovements';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  categoryName: string;
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

// Define o schema de validação para o formulário
const formSchema = z.object({
  quantity: z.coerce.number().positive({ message: 'A quantidade deve ser maior que zero' }),
  notes: z.string().optional(),
  employee_id: z.string().optional(),
  reason: z.string().optional(),
  customReason: z.string().optional(),
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

interface MovementDialogProps {
  product: Product | null;
  type: 'entrada' | 'saida';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MovementDialog = ({ product, type, open, onOpenChange }: MovementDialogProps) => {
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
      reason: '',
      customReason: '',
    },
  });

  // Reset do formulário quando o produto ou tipo muda
  useEffect(() => {
    if (open) {
      form.reset({
        quantity: 1,
        notes: '',
        employee_id: '',
        reason: '',
        customReason: '',
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            {type === 'entrada'
              ? <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              : <MinusCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            }
            {type === 'entrada' ? 'Adicionar Estoque' : 'Remover Estoque'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {type === 'entrada'
              ? 'Registre a entrada de produtos no estoque.'
              : 'Registre a saída de produtos do estoque.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {product ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center p-2 sm:p-3 rounded-md bg-muted">
                <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                  <p className="font-medium text-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {product.code}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {product.categoryName}
                    </span>
                  </div>
                </div>
                <div className="w-full sm:w-auto text-left sm:text-right">
                  <p className="text-sm text-muted-foreground">Estoque atual</p>
                  <p className="font-medium">
                    {product.quantity} {product.unit}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">Quantidade</Label>
                  <div className="flex gap-2">
                    <Input
                      id="quantity"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={form.watch('quantity')}
                      onChange={(e) => form.setValue('quantity', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <div className="bg-muted text-muted-foreground px-3 py-2 rounded flex items-center text-sm">
                      {product.unit}
                    </div>
                  </div>
                  {form.formState.errors.quantity && (
                    <p className="text-destructive text-xs sm:text-sm">
                      {type === 'saida' && 'Quantidade não pode ser maior que o estoque disponível.'}
                      {type !== 'saida' && 'Quantidade deve ser maior que zero.'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm font-medium">Motivo</Label>
                  <Select
                    value={form.watch('reason') as string}
                    onValueChange={(value) => form.setValue('reason', value, { shouldValidate: true })}
                  >
                    <SelectTrigger id="reason" className="w-full">
                      <SelectValue placeholder="Selecione um motivo" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 overflow-auto">
                      {type === 'entrada' ? (
                        <>
                          <SelectItem value="reposicao">Reposição de estoque</SelectItem>
                          <SelectItem value="devolucao">Devolução</SelectItem>
                          <SelectItem value="transferencia">Transferência entre unidades</SelectItem>
                          <SelectItem value="estorno">Estorno</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="venda">Venda</SelectItem>
                          <SelectItem value="consumo">Consumo interno</SelectItem>
                          <SelectItem value="perda">Perda/Extravio</SelectItem>
                          <SelectItem value="devolucao">Devolução ao fornecedor</SelectItem>
                          <SelectItem value="transferencia">Transferência entre unidades</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {(form.watch('reason') as string) === 'outro' && (
                  <div className="space-y-2">
                    <Label htmlFor="customReason" className="text-sm font-medium">Especifique o motivo</Label>
                    <Input
                      id="customReason"
                      value={form.watch('customReason') as string}
                      onChange={(e) => form.setValue('customReason', e.target.value, { shouldValidate: true })}
                      placeholder="Informe o motivo da movimentação"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={form.watch('notes')}
                    onChange={(e) => form.setValue('notes', e.target.value)}
                    placeholder="Observações adicionais sobre esta movimentação"
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Produto não encontrado.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end mt-4">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              form.reset();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={!form.formState.isValid || isSubmitting}
            className={cn(
              "gap-1 w-full sm:w-auto",
              type === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processando...
              </>
            ) : (
              <>
                {type === 'entrada' ? (
                  <><ArrowDownCircle className="h-4 w-4" /> Registrar Entrada</>
                ) : (
                  <><ArrowUpCircle className="h-4 w-4" /> Registrar Saída</>
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MovementDialog;
