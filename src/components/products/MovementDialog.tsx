
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface MovementDialogProps {
  product: Product | null;
  type: 'entrada' | 'saida';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MovementDialog: React.FC<MovementDialogProps> = ({
  product,
  type,
  open,
  onOpenChange
}) => {
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addMovement } = useSupabaseProducts();
  const { user } = useAuth();
  
  const handleMovement = async () => {
    if (!product || !quantity) return;
    
    setIsLoading(true);
    
    try {
      const result = await addMovement({
        product_id: product.id,
        type,
        quantity: Number(quantity),
        user_id: user?.id || null,
        notes: notes.trim() || null
      });
      
      if (result.success) {
        resetForm();
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setQuantity(1);
    setNotes('');
  };
  
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '') {
      setQuantity('');
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        setQuantity(numValue);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
          </DialogTitle>
          <DialogDescription>
            {type === 'entrada' 
              ? 'Adicionar itens ao estoque do produto selecionado.' 
              : 'Remover itens do estoque do produto selecionado.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {product && (
          <div className="py-4 space-y-4">
            <div>
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-muted-foreground">{product.code}</div>
              <div className="text-sm text-muted-foreground">{product.description}</div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                placeholder="Quantidade"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Motivo ou detalhes da movimentação"
                rows={3}
              />
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleMovement} 
            disabled={!quantity || isLoading}
            variant={type === 'entrada' ? 'default' : 'destructive'}
          >
            {isLoading ? 'Processando...' : type === 'entrada' ? 'Confirmar Entrada' : 'Confirmar Saída'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MovementDialog;
