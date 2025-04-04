import React, { useState, useEffect } from 'react';
import { Package, MoreHorizontal, Edit, Trash2, ArrowDown, ArrowUp, CheckSquare, Square, Trash, AlertTriangle, X } from 'lucide-react';
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

    // Renderizar barra de ações de seleção
    const renderSelectionActions = () => {
        if (!selectMode || selectedProducts.length === 0) return null;

        return (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background border border-input shadow-lg rounded-full py-2 px-4 flex items-center gap-3 z-50">
                <div className="flex items-center gap-2">
                    <div className="bg-primary h-6 w-6 flex items-center justify-center rounded-full text-primary-foreground text-xs font-medium">
                        {selectedProducts.length}
                    </div>
                    <span className="text-sm">selecionado{selectedProducts.length > 1 ? 's' : ''}</span>
                </div>
                <div className="h-4 w-px bg-border"></div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setSelectedProducts([]);
                        setSelectAll(false);
                    }}
                    className="text-xs h-8 px-2"
                >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Limpar
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={confirmDeleteSelected}
                    className="h-8 px-3 text-xs"
                >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Excluir
                </Button>
            </div>
        );
    };

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
                            product.quantity <= product.min_quantity ? "border-red-200" : "",
                            selectMode && "cursor-pointer hover:bg-muted/50"
                        )}
                        onClick={() => selectMode && toggleSelectProduct(product.id)}
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
                                            onClick={e => e.stopPropagation()}
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
                                    <div className="flex justify-end gap-1 mt-3 border-t pt-3" onClick={e => e.stopPropagation()}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onMovement(product, 'entrada')}
                                            className="h-8 gap-1 text-xs text-green-600 border-green-200"
                                        >
                                            <ArrowDown className="h-3.5 w-3.5" />
                                            Entrada
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onMovement(product, 'saida')}
                                            className="h-8 gap-1 text-xs text-red-600 border-red-200"
                                        >
                                            <ArrowUp className="h-3.5 w-3.5" />
                                            Saída
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(product)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Editar</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-50 focus:bg-red-600"
                                                    onClick={() => onDelete(product)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Excluir</span>
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

    // Renderizar tabela para desktop
    const renderDesktopTable = () => {
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
            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">
                                {selectMode ? (
                                    <Checkbox
                                        checked={selectAll}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Selecionar todos"
                                    />
                                ) : (
                                    <span className="sr-only">Status</span>
                                )}
                            </TableHead>
                            <TableHead className="w-[100px]">Código</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-center">Estoque</TableHead>
                            <TableHead className="text-center">Mínimo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map(product => (
                            <TableRow
                                key={product.id}
                                className={cn(
                                    selectedProducts.includes(product.id) ? "bg-primary/5" : "",
                                    selectMode && "cursor-pointer hover:bg-muted/50"
                                )}
                                onClick={() => selectMode && toggleSelectProduct(product.id)}
                            >
                                <TableCell className="w-[40px]" onClick={e => selectMode && e.stopPropagation()}>
                                    {selectMode ? (
                                        <Checkbox
                                            checked={selectedProducts.includes(product.id)}
                                            onCheckedChange={() => toggleSelectProduct(product.id)}
                                            aria-label={`Selecionar ${product.name}`}
                                        />
                                    ) : (
                                        <div className="w-4"></div>
                                    )}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{product.code}</TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-muted-foreground">{getCategoryName(product.category_id)}</TableCell>
                                <TableCell className="text-center">
                                    <span className={cn(
                                        product.quantity <= product.min_quantity ? "text-red-600" :
                                            product.quantity <= product.min_quantity * 1.5 ? "text-amber-600" : ""
                                    )}>
                                        {product.quantity} {getUnitAbbreviation(product.unit)}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">{product.min_quantity} {getUnitAbbreviation(product.unit)}</TableCell>
                                <TableCell>{getStatusBadge(product)}</TableCell>
                                <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                    {!selectMode && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0" title="Opções">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onEdit(product)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Editar</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onMovement(product, 'entrada')}>
                                                    <ArrowDown className="mr-2 h-4 w-4" />
                                                    <span>Registrar Entrada</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onMovement(product, 'saida')}>
                                                    <ArrowUp className="mr-2 h-4 w-4" />
                                                    <span>Registrar Saída</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-50 focus:bg-red-600"
                                                    onClick={() => onDelete(product)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Excluir</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <>
            {isMobileView ? renderMobileCards() : renderDesktopTable()}
            {renderSelectionActions()}

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir produtos selecionados</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir os {selectedProducts.length} produtos selecionados?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteSelected}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ModernProductList; 