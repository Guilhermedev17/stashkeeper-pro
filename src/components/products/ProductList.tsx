import React, { useState, useEffect } from 'react';
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
import { cn } from '@/lib/utils';

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
  const [isMobileView, setIsMobileView] = useState(false);

  // Detectar se estamos em uma visualização móvel
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 640); // Breakpoint 'sm' do Tailwind
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);

    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  const getUnitAbbreviation = (unit: string) => {
    switch (unit) {
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

  // Renderizar visualização em cards para dispositivos móveis muito pequenos
  const renderMobileCards = () => {
    if (products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <Package className="h-10 w-10 mb-3" />
          <p>Nenhum produto encontrado</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 p-2">
        {products.map(product => (
          <Card key={product.id} className={cn(
            "overflow-hidden",
            selectedProducts.includes(product.id) ? "bg-muted/30 border-muted" : ""
          )}>
            <CardContent className="p-0">
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium line-clamp-1" title={product.name}>
                      {product.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <div className="bg-muted text-xs px-1.5 py-0.5 rounded font-mono">
                        {product.code}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getCategoryName(product.category_id)}
                      </div>
                    </div>
                  </div>

                  {selectMode && (
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleSelectProduct(product.id)}
                      className="mt-1"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-3">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Estoque</div>
                      <div className="font-medium text-sm">
                        {product.quantity} {getUnitAbbreviation(product.unit)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Mínimo</div>
                      <div className="font-medium text-sm">
                        {product.min_quantity} {getUnitAbbreviation(product.unit)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Status</div>
                      <div>
                        {getStatusBadge(product.quantity, product.min_quantity)}
                      </div>
                    </div>
                  </div>
                </div>

                {!selectMode && (
                  <div className="flex justify-end gap-1 mt-3 border-t pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMovement(product, 'entrada')}
                      className="gap-1 text-green-600"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                      <span>Entrada</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMovement(product, 'saida')}
                      className="gap-1 text-blue-600"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                      <span>Saída</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(product)}>
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
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const getStatusBadge = (quantity: number, minQuantity: number) => {
    if (quantity <= minQuantity * 0.5) {
      return (
        <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
          Crítico
        </span>
      );
    } else if (quantity <= minQuantity) {
      return (
        <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
          Baixo
        </span>
      );
    } else {
      return (
        <span className="px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300">
          OK
        </span>
      );
    }
  };

  return (
    <div className="rounded-md overflow-hidden w-full h-full flex flex-col zoom-stable">
      {selectMode && (
        <div className="bg-muted/20 p-2 flex items-center justify-between flex-wrap gap-2 shrink-0">
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
              <span className="hidden xs:inline">Excluir selecionados</span>
              <span className="inline xs:hidden">Excluir</span>
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

      {/* Visualização em cards para telas muito pequenas */}
      <div className={cn("sm:hidden flex-1 overflow-auto", isMobileView ? "block" : "hidden")}>
        {renderMobileCards()}
      </div>

      {/* Visualização em tabela para telas maiores */}
      <div className={cn("w-full flex-1 overflow-auto", isMobileView ? "hidden" : "block sm:block")}>
        <div className="overflow-x-auto w-full">
          <Table className="w-full">
            <TableHeader className="bg-secondary/50 dark:bg-secondary/30">
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
                    className={cn(
                      "hover:bg-muted/30 dark:hover:bg-muted/30",
                      selectedProducts.includes(product.id) && "bg-muted/30 dark:bg-muted/40"
                    )}
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
                      {getStatusBadge(product.quantity, product.min_quantity)}
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
