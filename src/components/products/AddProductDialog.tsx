
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
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
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Produto</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do novo produto. O código será gerado automaticamente.
          </DialogDescription>
        </DialogHeader>
        
        <ProductForm 
          product={newProduct}
          isNew={true}
          categories={categories}
          onChange={onChange}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
