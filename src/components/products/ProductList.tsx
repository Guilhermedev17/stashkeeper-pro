
import React from 'react';
import { Package, MoreHorizontal, Edit, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

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

interface ProductListProps {
  products: Product[];
  getCategoryName: (id: string) => string;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onMovement: (product: Product, type: 'entrada' | 'saida') => void;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products, 
  getCategoryName, 
  onEdit, 
  onDelete,
  onMovement
}) => {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-center">Quantidade</TableHead>
            <TableHead className="text-center">Mínimo</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Package className="h-8 w-8 mb-2" />
                  <p>Nenhum produto encontrado</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            products.map(product => (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-sm">
                  {product.code}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {product.description}
                  </div>
                </TableCell>
                <TableCell>
                  {getCategoryName(product.categoryId)}
                </TableCell>
                <TableCell className="text-center">
                  {product.quantity} {product.unit === 'unidade' ? 'UN' :
                    product.unit === 'L' ? 'L' :
                    product.unit === 'kg' ? 'KG' :
                    product.unit === 'caixa' ? 'CX' :
                    product.unit === 'pacote' ? 'PCT' :
                    product.unit === 'rolo' ? 'RL' :
                    product.unit === 'metros' ? 'MT' :
                    product.unit || 'UN'}
                </TableCell>
                <TableCell className="text-center">
                  {product.minQuantity} {product.unit === 'unidade' ? 'UN' :
                    product.unit === 'L' ? 'L' :
                    product.unit === 'kg' ? 'KG' :
                    product.unit === 'caixa' ? 'CX' :
                    product.unit === 'pacote' ? 'PCT' :
                    product.unit === 'rolo' ? 'RL' :
                    product.unit === 'metros' ? 'MT' :
                    product.unit || 'UN'}
                </TableCell>
                <TableCell className="text-center">
                  {product.quantity <= product.minQuantity ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Crítico
                    </span>
                  ) : product.quantity <= product.minQuantity * 1.5 ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Baixo
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Normal
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onMovement(product, 'entrada')}
                      title="Registrar entrada"
                      className="text-green-600 hover:text-green-700 hover:bg-green-100"
                    >
                      <ArrowDown className="h-4 w-4" />
                      <span className="sr-only">Entrada</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onMovement(product, 'saida')}
                      title="Registrar saída"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                    >
                      <ArrowUp className="h-4 w-4" />
                      <span className="sr-only">Saída</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onEdit(product)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete(product)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductList;
