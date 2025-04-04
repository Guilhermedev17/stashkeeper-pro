import React, { useState, useEffect } from 'react';
import { Package, MoreHorizontal, Edit, Trash2, ArrowDown, ArrowUp, CheckSquare, Square, Trash, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface ModernProductListProps {
    products: Product[];
    getCategoryName: (id: string) => string;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onDeleteMultiple?: (productIds: string[]) => void;
    onMovement: (product: Product, type: 'entrada' | 'saida') => void;
    selectMode?: boolean;
    onToggleSelectMode?: () => void;
}

/**
 * Componente modernizado para exibição de produtos em formato de tabela ou cards
 * com suporte a seleção múltipla, ações em lote e melhor visualização em dispositivos móveis.
 */
const ModernProductList: React.FC<ModernProductListProps> = ({
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
            case 'g': return 'G';
            case 'ml': return 'ML';
            case 'caixa': return 'CX';
            case 'pacote': return 'PCT';
            case 'rolo': return 'RL';
            case 'metros':
            case 'm': return 'M';
            case 'cm': return 'CM';
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

    const getStatusBadge = (product: Product) => {
        if (product.quantity <= product.min_quantity) {
            return (
                <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Crítico
                </Badge>
            );
        } else if (product.quantity <= product.min_quantity * 1.5) {
            return (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                    Baixo
                </Badge>
            );
        } else {
            return (
                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                    Normal
                </Badge>
            );
        }
    };

    // Renderizar visualização em cards para dispositivos móveis
    const renderMobileCards = () => {
        if (products.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground dark:text-gray-400">
                    <Package className="h-10 w-10 mb-3 text-gray-400 dark:text-gray-500" />
                    <p className="font-medium text-gray-600 dark:text-gray-300">Nenhum produto encontrado</p>
                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">Use os filtros para buscar um produto específico</p>
                </div>
            );
        }

        return (
            <div className="space-y-3 p-2">
                {products.map(product => (
                    <Card
                        key={product.id}
                        className={cn(
                            "overflow-hidden",
                            selectedProducts.includes(product.id) ? "bg-primary/5 border-primary" : "",
                            product.quantity <= product.min_quantity ? "border-red-200" : ""
                        )}
                    >
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

                                    {selectMode ? (
                                        <Checkbox
                                            checked={selectedProducts.includes(product.id)}
                                            onCheckedChange={() => toggleSelectProduct(product.id)}
                                            className="mt-1"
                                        />
                                    ) : (
                                        getStatusBadge(product)
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex gap-3">
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground">Estoque</div>
                                            <div className={cn(
                                                "font-medium text-sm",
                                                product.quantity <= product.min_quantity ? "text-red-600" :
                                                    product.quantity <= product.min_quantity * 1.5 ? "text-amber-600" : ""
                                            )}>
                                                {product.quantity} {getUnitAbbreviation(product.unit)}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground">Mínimo</div>
                                            <div className="font-medium text-sm">
                                                {product.min_quantity} {getUnitAbbreviation(product.unit)}
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
                                            className="gap-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300"
                                        >
                                            <ArrowDown className="h-3.5 w-3.5" />
                                            <span>Entrada</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onMovement(product, 'saida')}
                                            className="gap-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
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

    // Renderizar visualização em tabela para desktop
    const renderDesktopTable = () => {
        if (products.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-16 text-muted-foreground dark:text-gray-400">
                    <Package className="h-12 w-12 mb-4 text-gray-400 dark:text-gray-500" />
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Nenhum produto encontrado</p>
                    <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">Use os filtros para buscar um produto específico</p>
                </div>
            );
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        {selectMode && (
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={selectAll}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                        )}
                        <TableHead className="max-w-[120px]">Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-center">Quantidade</TableHead>
                        <TableHead className="text-center">Mínimo</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map(product => (
                        <TableRow
                            key={product.id}
                            className={cn(
                                selectedProducts.includes(product.id) && "bg-primary/5 dark:bg-primary/15",
                                product.quantity <= product.min_quantity && "bg-red-50/50 dark:bg-red-950/40"
                            )}
                        >
                            {selectMode && (
                                <TableCell className="p-2">
                                    <Checkbox
                                        checked={selectedProducts.includes(product.id)}
                                        onCheckedChange={() => toggleSelectProduct(product.id)}
                                    />
                                </TableCell>
                            )}
                            <TableCell className="font-mono text-sm">{product.code}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{getCategoryName(product.category_id)}</TableCell>
                            <TableCell className={cn(
                                "text-center",
                                product.quantity <= product.min_quantity ? "text-red-600 dark:text-red-300 font-semibold" :
                                    product.quantity <= product.min_quantity * 1.5 ? "text-amber-600 dark:text-amber-300" : ""
                            )}>
                                {product.quantity} {getUnitAbbreviation(product.unit)}
                            </TableCell>
                            <TableCell className="text-center">
                                {product.min_quantity} {getUnitAbbreviation(product.unit)}
                            </TableCell>
                            <TableCell className="text-center">
                                {getStatusBadge(product)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Registrar entrada"
                                        onClick={() => onMovement(product, 'entrada')}
                                        className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300"
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Registrar saída"
                                        onClick={() => onMovement(product, 'saida')}
                                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Editar produto"
                                        onClick={() => onEdit(product)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Excluir produto"
                                        onClick={() => onDelete(product)}
                                        className="text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <div className="relative">
            {selectMode && selectedProducts.length > 0 && (
                <div className="absolute top-0 left-0 w-full">
                    <Alert variant="default" className="bg-primary text-primary-foreground shadow-md">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                                <CheckSquare className="h-4 w-4 mr-2" />
                                <AlertTitle className="mr-2">{selectedProducts.length} {selectedProducts.length === 1 ? 'produto selecionado' : 'produtos selecionados'}</AlertTitle>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={confirmDeleteSelected}
                                    className="bg-white text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                >
                                    <Trash className="h-4 w-4 mr-1" />
                                    Excluir
                                </Button>
                                {onToggleSelectMode && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onToggleSelectMode}
                                        className="bg-white text-primary border-white hover:bg-white/90"
                                    >
                                        Cancelar
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Alert>
                </div>
            )}

            <div className={cn(
                "transition-all",
                selectMode && selectedProducts.length > 0 ? "pt-[64px]" : ""
            )}>
                {isMobileView ? renderMobileCards() : renderDesktopTable()}
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Excluir {selectedProducts.length} {selectedProducts.length === 1 ? 'produto' : 'produtos'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente
                            {selectedProducts.length === 1
                                ? ' o produto selecionado.'
                                : ` ${selectedProducts.length} produtos selecionados.`
                            }
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

export default ModernProductList; 