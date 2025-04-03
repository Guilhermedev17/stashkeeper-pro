import React, { useState } from 'react';
import { Package, MoreHorizontal, Edit, Trash2, ArrowDown, ArrowUp, CheckSquare, Square, Trash } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  onDeleteMultiple?: (productIds: string[]) => void;
  onMovement: (product: Product, type: 'entrada' | 'saida') => void;
  selectMode?: boolean;
  onToggleSelectMode?: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products, 
  getCategoryName, 
  onEdit, 
  onDelete,
  onDeleteMultiple,
  onMovement,
  selectMode = false,
  onToggleSelectMode
}) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
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
  
  const toggleSelectAll = () => {
    if (selectAll) {
      // Desmarcar todos
      setSelectedProducts([]);
    } else {
      // Marcar todos
      setSelectedProducts(products.map(product => product.id));
    }
    setSelectAll(!selectAll);
  };
  
  const toggleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      // Remover da seleção
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
      setSelectAll(false);
    } else {
      // Adicionar à seleção
      setSelectedProducts([...selectedProducts, productId]);
      // Verificar se todos estão selecionados
      if (selectedProducts.length + 1 === products.length) {
        setSelectAll(true);
      }
    }
  };
  
  const handleDeleteSelected = () => {
    if (selectedProducts.length > 0 && onDeleteMultiple) {
      onDeleteMultiple(selectedProducts);
      setSelectedProducts([]);
      setSelectAll(false);
      if (onToggleSelectMode) onToggleSelectMode();
      setIsDeleteDialogOpen(false);
    }
  };
  
  const confirmDeleteSelected = () => {
    if (selectedProducts.length > 0) {
      setIsDeleteDialogOpen(true);
    }
  };
  
  // Limpar seleções quando sair do modo de seleção
  React.useEffect(() => {
    if (!selectMode) {
      setSelectedProducts([]);
      setSelectAll(false);
    }
  }, [selectMode]);
  
  return (
    <div className="rounded-md overflow-hidden w-full zoom-stable">
      {selectMode && (
        <div className="bg-muted/20 p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={selectAll}
              onCheckedChange={toggleSelectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Selecionar todos
            </label>
            <span className="text-xs text-muted-foreground ml-2">
              ({selectedProducts.length} selecionados)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={confirmDeleteSelected}
              disabled={selectedProducts.length === 0}
              className="gap-1"
            >
              <Trash className="h-4 w-4" />
              Excluir selecionados
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onToggleSelectMode}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto w-full">
        <Table className="w-full">
          <TableHeader className="bg-secondary/50">
            <TableRow>
              {selectMode && (
                <TableHead className="w-[40px]"></TableHead>
              )}
              <TableHead className="font-medium w-[80px] sm:w-[100px]">Código</TableHead>
              <TableHead className="font-medium">Produto</TableHead>
              <TableHead className="font-medium hidden md:table-cell">Categoria</TableHead>
              <TableHead className="font-medium text-center w-[80px]">Qtd.</TableHead>
              <TableHead className="font-medium text-center w-[80px] hidden sm:table-cell">Mín.</TableHead>
              <TableHead className="font-medium text-center w-[90px]">Status</TableHead>
              <TableHead className="font-medium text-right w-[100px] sm:w-[120px]">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectMode ? 8 : 7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Package className="h-8 w-8 mb-2" />
                    <p>Nenhum produto encontrado</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map(product => (
                <TableRow 
                  key={product.id} 
                  className={`hover:bg-muted/30 ${selectedProducts.includes(product.id) ? 'bg-muted/30' : ''}`}
                  onClick={selectMode ? () => toggleSelectProduct(product.id) : undefined}
                  style={{ cursor: selectMode ? 'pointer' : 'default' }}
                >
                  {selectMode && (
                    <TableCell className="px-0 sm:px-4 py-0 sm:py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleSelectProduct(product.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-mono text-xs px-2 sm:px-4 py-2 sm:py-4">
                    {product.code}
                  </TableCell>
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-4">
                    <div 
                      className="font-medium text-sm line-clamp-2" 
                      title={product.name}
                    >
                      {product.name}
                    </div>
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
                  <TableCell className="text-right px-2 sm:px-4 py-2 sm:py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {!selectMode && (
                        <>
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
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão em lote</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedProducts.length} produto(s). Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductList;
