
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import ProductForm from './ProductForm';

interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  categoryId: string;
  quantity: number;
  minQuantity: number;
  createdAt: Date;
}

interface Category {
  id: string;
  name: string;
}

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onUpdate: (product: Product) => void;
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do produto selecionado.
          </DialogDescription>
        </DialogHeader>
        
        {product && (
          <ProductForm 
            product={product}
            isNew={false}
            categories={categories}
            onChange={onChange}
            onSubmit={() => {
              if (product) onUpdate(product);
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
