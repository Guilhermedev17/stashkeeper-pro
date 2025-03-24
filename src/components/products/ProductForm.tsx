
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  createdAt: Date;
}

interface ProductFormProps {
  product: Partial<Product>;
  isNew?: boolean;
  categories: Category[];
  onSubmit: () => void;
  onCancel: () => void;
  onChange: (field: string, value: any) => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  product, 
  isNew = true,
  categories, 
  onSubmit, 
  onCancel,
  onChange 
}) => {
  return (
    <div className="grid gap-4 py-4">
      {!isNew && (
        <div className="space-y-2">
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            value={product.code}
            readOnly
            disabled
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          value={product.name || ''}
          onChange={e => onChange('name', e.target.value)}
          placeholder="Nome do produto"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          value={product.description || ''}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Descrição do produto"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="category">Categoria</Label>
        <Select
          value={product.categoryId || ''}
          onValueChange={value => onChange('categoryId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            value={product.quantity === 0 && isNew ? '' : product.quantity || ''}
            onChange={e => onChange('quantity', e.target.value === '' ? 0 : Number(e.target.value))}
            placeholder="0"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="minQuantity">Quantidade Mínima</Label>
          <Input
            id="minQuantity"
            type="number"
            min="0"
            value={product.minQuantity === 0 && isNew ? '' : product.minQuantity || ''}
            onChange={e => onChange('minQuantity', e.target.value === '' ? 0 : Number(e.target.value))}
            placeholder="0"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSubmit}>
          {isNew ? 'Adicionar' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
};

export default ProductForm;
