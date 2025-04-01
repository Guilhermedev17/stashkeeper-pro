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
import { Textarea } from '@/components/ui/textarea';

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
});

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
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializa o formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      notes: '',
    },
  });

  // Reset do formulário quando o produto ou tipo muda
  useEffect(() => {
    if (open) {
      form.reset({
        quantity: 1,
        notes: '',
      });
    }
  }, [open, form, product, type]);

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

      // Exibe mensagem de sucesso e fecha o diálogo
      toast({
        title: 'Movimentação registrada',
        description: `${type === 'entrada' ? 'Entrada' : 'Saída'} de ${values.quantity} ${product.unit} de ${product.name} registrada com sucesso.`,
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
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 w-[95vw] overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ArrowDownUp className="h-5 w-5" />
            {type === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {type === 'entrada' 
              ? 'Registre a entrada de produtos no estoque.' 
              : 'Registre a saída de produtos do estoque.'}
          </DialogDescription>
        </DialogHeader>

        {product ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
              <div className="p-4 sm:p-6 pt-2 sm:pt-4 space-y-4">
                <div className="p-3 sm:p-4 border rounded-md bg-muted/40 flex items-start gap-3">
                  <Package className="h-5 w-5 mt-1 text-muted-foreground shrink-0" />
                  <div className="space-y-1">
                    <div className="font-medium text-sm sm:text-base line-clamp-1">{product.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{product.code}</div>
                    {product.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2">{product.description}</div>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade ({product.unit})</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detalhes adicionais sobre esta movimentação" 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="p-4 sm:p-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className={type === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : type === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center h-[200px]">
            <Package className="h-10 w-10 mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              Nenhum produto selecionado.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MovementDialog;
