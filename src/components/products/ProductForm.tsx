import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  id?: string;
  code: string;
  name: string;
  description: string;
  categoryId: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  createdAt?: Date;
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
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="code" className="text-sm font-medium">Código</Label>
        <Input
          id="code"
          value={product.code || ''}
          onChange={e => onChange('code', e.target.value)}
          placeholder="Código do produto"
          disabled={!isNew}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">Nome</Label>
        <Input
          id="name"
          value={product.name || ''}
          onChange={e => onChange('name', e.target.value)}
          placeholder="Nome do produto"
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
        <Textarea
          id="description"
          value={product.description || ''}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Descrição do produto"
          className="w-full min-h-[80px] resize-none"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium">Categoria</Label>
        <Select
          value={product.categoryId || ''}
          onValueChange={value => onChange('categoryId', value)}
        >
          <SelectTrigger className="w-full">
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
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-sm font-medium">Quantidade</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            value={product.quantity === 0 && isNew ? '' : product.quantity || ''}
            onChange={e => onChange('quantity', e.target.value === '' ? 0 : Number(e.target.value))}
            placeholder="0"
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="minQuantity" className="text-sm font-medium">Quantidade Mínima</Label>
          <Input
            id="minQuantity"
            type="number"
            min="0"
            value={product.minQuantity === 0 && isNew ? '' : product.minQuantity || ''}
            onChange={e => onChange('minQuantity', e.target.value === '' ? 0 : Number(e.target.value))}
            placeholder="0"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit" className="text-sm font-medium">Unidade</Label>
          <Select
            value={product.unit || 'unidade'}
            onValueChange={value => onChange('unit', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unidade">Unidade</SelectItem>
              <SelectItem value="caixa">Caixa</SelectItem>
              <SelectItem value="pacote">Pacote</SelectItem>
              <SelectItem value="rolo">Rolo</SelectItem>
              <SelectItem value="metros">Metros</SelectItem>
              <SelectItem value="L">Litro (L)</SelectItem>
              <SelectItem value="kg">Quilograma (kg)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t mt-2">
        <Button variant="outline" onClick={onCancel} size="sm" className="w-24">
          Cancelar
        </Button>
        <Button onClick={onSubmit} size="sm" className="w-24">
          {isNew ? 'Adicionar' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
};

export default ProductForm;
