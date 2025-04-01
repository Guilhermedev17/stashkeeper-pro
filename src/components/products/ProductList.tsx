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
import { Card, CardContent } from '@/components/ui/card';

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category_id: string;
  quantity: number;
  min_quantity: number;
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
  const getUnitAbbreviation = (unit: string) => {
    switch(unit) {
      case 'unidade': return 'UN';
      case 'L': return 'L';
      case 'kg': return 'KG';
      case 'caixa': return 'CX';
      case 'pacote': return 'PCT';
      case 'rolo': return 'RL';
      case 'metros': return 'MT';
      default: return unit.toUpperCase();
    }
  };
  
  return (
    <div className="rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead className="font-medium w-[80px] sm:w-[100px]">Código</TableHead>
              <TableHead className="font-medium">Produto</TableHead>
              <TableHead className="font-medium hidden md:table-cell">Categoria</TableHead>
              <TableHead className="font-medium text-center w-[80px]">Qtd.</TableHead>
              <TableHead className="font-medium text-center w-[80px] hidden sm:table-cell">Mín.</TableHead>
              <TableHead className="font-medium text-center w-[90px]">Status</TableHead>
              <TableHead className="font-medium text-right w-[100px] sm:w-[120px]">Ações</TableHead>
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
                  <TableCell className="font-mono text-xs px-2 sm:px-4 py-2 sm:py-4">
                    {product.code}
                  </TableCell>
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-4">
                    <div className="font-medium text-sm line-clamp-1">{product.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {product.description}
                    </div>
                    <div className="text-xs text-muted-foreground md:hidden line-clamp-1">
                      {getCategoryName(product.category_id)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-4">
                    {getCategoryName(product.category_id)}
                  </TableCell>
                  <TableCell className="text-center px-2 sm:px-4 py-2 sm:py-4">
                    <span className="whitespace-nowrap text-sm">
                      {product.quantity} {getUnitAbbreviation(product.unit)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center px-2 sm:px-4 py-2 sm:py-4 hidden sm:table-cell">
                    <span className="whitespace-nowrap text-sm">
                      {product.min_quantity} {getUnitAbbreviation(product.unit)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center px-2 sm:px-4 py-2 sm:py-4">
                    {product.quantity <= product.min_quantity ? (
                      <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Crítico
                      </span>
                    ) : product.quantity <= product.min_quantity * 1.5 ? (
                      <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Baixo
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Normal
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onMovement(product, 'entrada')}
                        title="Registrar entrada"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                        <span className="sr-only">Entrada</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onMovement(product, 'saida')}
                        title="Registrar saída"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                        <span className="sr-only">Saída</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-3.5 w-3.5" />
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
    </div>
  );
};

export default ProductList;
