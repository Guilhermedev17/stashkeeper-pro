import { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowDownUp, Package } from 'lucide-react';
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
  const [activeEmployees, setActiveEmployees] = useState([]);

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
          ? `Entrada de ${values.quantity} ${product.unit} de ${product.name} registrada.`
          : `Saída de ${values.quantity} ${product.unit} de ${product.name} registrada para ${employeeName}.`,
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
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 w-[95vw] overflow-hidden border-none bg-background">
        {/* Cabeçalho colorido baseado no tipo */}
        <div className={`p-6 flex items-center gap-3 ${
          type === 'entrada' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-blue-600 text-white'
        }`}>
          <div className={`rounded-full p-2 bg-white/20`}>
            {type === 'entrada' 
              ? <ArrowDownUp className="h-5 w-5" /> 
              : <ArrowDownUp className="h-5 w-5" />
            }
          </div>
          <div>
            <DialogTitle className="text-xl font-bold">
              {type === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
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
          <div className="px-6 py-4 border-b flex items-center gap-3">
            <div className="bg-muted/50 p-2 rounded-md">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{product.name}</p>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <span className="text-xs bg-secondary/40 dark:bg-secondary/20 px-1.5 py-0.5 rounded border border-border/50 font-mono max-w-[150px] truncate">
                  {product.code}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 font-medium">
                  Unidade: {product.unit}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 border-b">
            <div className="p-3 rounded-md bg-destructive/10 text-center">
              <span className="text-sm text-destructive font-medium">Nenhum produto selecionado</span>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4">
            <div className="space-y-5">
              {/* Campo de quantidade */}
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Quantidade ({product?.unit || 'unidade'})
                    </FormLabel>
                    <FormControl>
                      <div className="flex rounded-md overflow-hidden border border-input focus-within:ring-2 focus-within:ring-ring/70 focus-within:border-accent/50 transition-all duration-200">
                        <Input 
                          type="number"
                          min="1" 
                          step="1" 
                          {...field} 
                          className="text-right border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 rounded-none" 
                        />
                        <div className="bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center px-3 text-sm font-medium text-indigo-700 dark:text-indigo-400 border-l border-input">
                          {product?.unit || 'unidade(s)'}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
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
                      <FormLabel className="text-sm font-medium">
                        Colaborador Responsável <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-[42px]">
                            <SelectValue placeholder="Selecione um colaborador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeEmployees.length === 0 ? (
                            <SelectItem value="empty" disabled>
                              Nenhum colaborador cadastrado
                            </SelectItem>
                          ) : (
                            activeEmployees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.name} {employee.code && `(${employee.code})`}
                              </SelectItem>
                            ))
                          )}
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
                    <FormLabel className="text-sm font-medium">
                      Observações
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais sobre esta movimentação"
                        className="resize-none min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Rodapé com botão de ação */}
            <div className="mt-8 flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting || !product}
                className={`w-full ${
                  type === 'entrada' 
                    ? '' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                variant={type === 'entrada' ? 'default' : 'custom-blue'}
              >
                {isSubmitting 
                  ? "Processando..." 
                  : type === 'entrada' 
                    ? "Registrar Entrada" 
                    : "Registrar Saída"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MovementDialog;
