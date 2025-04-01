import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  code: string;
}

interface DeleteProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const DeleteProductDialog: React.FC<DeleteProductDialogProps> = ({
  product,
  open,
  onOpenChange,
  onConfirm
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 w-[95vw] max-h-[95vh] overflow-hidden">
        <DialogHeader className="px-4 pt-5 pb-2 sm:px-6 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-amber-100 rounded-full dark:bg-amber-900/30">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <DialogTitle className="text-lg sm:text-xl">Excluir Produto</DialogTitle>
          <DialogDescription className="text-sm">
            Esta ação não pode ser desfeita. O produto será removido permanentemente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-4 py-4 sm:px-6 text-center">
          {product && (
            <div className="space-y-2 text-center">
              <p className="font-medium text-base">{product.name}</p>
              <p className="text-sm text-muted-foreground">Código: {product.code}</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="px-4 pb-5 pt-2 sm:px-6 border-t flex sm:justify-between gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            className="flex-1 sm:flex-none"
          >
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteProductDialog;
