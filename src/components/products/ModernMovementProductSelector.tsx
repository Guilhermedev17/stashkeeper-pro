import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Package, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
    id: string;
    code: string;
    name: string;
    description: string;
    quantity: number;
    min_quantity: number;
    unit: string;
    category_id: string;
}

interface ModernMovementProductSelectorProps {
    products: Product[];
    selectedProductId: string | null;
    onProductSelect: (product: Product) => void;
    getCategoryName: (categoryId: string) => string;
}

/**
 * Componente modernizado para selecionar produtos em movimentações.
 * Fornece busca, destaque para produtos críticos e visualização detalhada.
 */
const ModernMovementProductSelector = ({
    products,
    selectedProductId,
    onProductSelect,
    getCategoryName
}: ModernMovementProductSelectorProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredProducts(products);
        } else {
            const lowercasedFilter = searchTerm.toLowerCase();
            const filtered = products.filter(product => {
                return (
                    product.name.toLowerCase().includes(lowercasedFilter) ||
                    product.code.toLowerCase().includes(lowercasedFilter) ||
                    product.description?.toLowerCase().includes(lowercasedFilter)
                );
            });
            setFilteredProducts(filtered);
        }
    }, [searchTerm, products]);

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const getStatusColor = (product: Product) => {
        if (product.quantity <= product.min_quantity) {
            return 'text-red-600';
        } else if (product.quantity <= product.min_quantity * 1.5) {
            return 'text-amber-600';
        }
        return 'text-green-600';
    };

    return (
        <div className="flex flex-col space-y-4">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar produto por nome ou código..."
                    className="pl-10 pr-10"
                />
                {searchTerm && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleClearSearch}
                        >
                            <X className="h-4 w-4 text-gray-400" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="text-sm text-muted-foreground">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
            </div>

            <ScrollArea className="h-[400px] rounded-md border p-1">
                <div className="space-y-2 p-1">
                    {filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                            <Package className="h-12 w-12 text-gray-300 mb-2" />
                            <p className="text-gray-500">Nenhum produto encontrado</p>
                            <p className="text-sm text-gray-400">Tente usar termos diferentes na busca</p>
                        </div>
                    ) : (
                        filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className={cn(
                                    "p-3 rounded-lg border cursor-pointer transition-all",
                                    selectedProductId === product.id
                                        ? "border-primary bg-primary/5"
                                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                                )}
                                onClick={() => onProductSelect(product)}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium truncate">{product.name}</h3>
                                            {product.quantity <= product.min_quantity && (
                                                <Badge variant="destructive" className="font-normal">
                                                    <AlertTriangle className="h-3 w-3 mr-1" /> Crítico
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <span className="truncate">Código: {product.code}</span>
                                        </div>
                                        <div className="flex gap-2 mt-1.5">
                                            <Badge variant="outline" className="font-normal">
                                                {getCategoryName(product.category_id)}
                                            </Badge>
                                            <Badge variant="secondary" className="font-normal">
                                                {product.unit}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={cn("font-semibold", getStatusColor(product))}>
                                            {product.quantity}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Min: {product.min_quantity}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

export default ModernMovementProductSelector; 