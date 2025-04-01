import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface NewProduct {
  name: string;
  description: string;
  categoryId: string;
  quantity: number;
  minQuantity: number;
  code: string;
  unit: string;
}

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  newProduct: NewProduct;
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onOpenChange,
  categories,
  newProduct,
  onChange,
  onSubmit
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 w-[95vw] max-h-[95vh] overflow-hidden">
        <DialogHeader className="px-4 pt-5 pb-2 sm:px-6">
          <DialogTitle className="text-lg sm:text-xl">Adicionar Produto</DialogTitle>
          <DialogDescription className="text-sm">
            Preencha os detalhes do novo produto, incluindo o código.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-4 pb-5 sm:px-6 overflow-y-auto max-h-[calc(95vh-10rem)]">
          <ProductForm 
            product={newProduct}
            isNew={true}
            categories={categories}
            onChange={onChange}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
