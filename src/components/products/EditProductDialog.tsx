import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import ProductForm from './ProductForm';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  categoryId: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  createdAt: Date;
}

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onUpdate: () => void;
  onChange: (field: string, value: any) => void;
}

const EditProductDialog: React.FC<EditProductDialogProps> = ({
  product,
  open,
  onOpenChange,
  categories,
  onUpdate,
  onChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 w-[95vw] max-h-[95vh] overflow-hidden">
        <DialogHeader className="px-4 pt-5 pb-2 sm:px-6">
          <DialogTitle className="text-lg sm:text-xl">Editar Produto</DialogTitle>
          <DialogDescription className="text-sm">
            Atualize as informações do produto selecionado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-4 pb-5 sm:px-6 overflow-y-auto max-h-[calc(95vh-10rem)]">
          {product && (
            <ProductForm 
              product={product}
              isNew={false}
              categories={categories}
              onChange={onChange}
              onSubmit={onUpdate}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
