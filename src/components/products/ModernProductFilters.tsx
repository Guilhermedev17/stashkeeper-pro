import React from 'react';
import { Search, CheckSquare, X, Filter, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

interface Category {
    id: string;
    name: string;
}

interface ModernProductFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    categories: Category[];
    selectedCategory: string;
    onCategoryChange: (value: string) => void;
    selectedStatus: string;
    onStatusChange: (value: string) => void;
    onToggleSelectMode?: () => void;
    selectMode?: boolean;
}

/**
 * Componente modernizado para filtros de produtos, com melhor responsividade
 * e apresentação visual, incluindo indicadores de filtros ativos.
 */
const ModernProductFilters: React.FC<ModernProductFiltersProps> = ({
    searchTerm,
    onSearchChange,
    categories,
    selectedCategory,
    onCategoryChange,
    selectedStatus,
    onStatusChange,
    onToggleSelectMode,
    selectMode = false
}) => {
    // Verificar se há algum filtro ativo (além da busca)
    const hasActiveFilters = selectedCategory !== 'all' || selectedStatus !== 'all';

    // Limpar todos os filtros
    const clearAllFilters = () => {
        if (selectedCategory !== 'all') {
            onCategoryChange('all');
        }
        if (selectedStatus !== 'all') {
            onStatusChange('all');
        }
        if (searchTerm) {
            onSearchChange('');
        }
    };

    // Obter o nome da categoria selecionada
    const getSelectedCategoryName = () => {
        if (selectedCategory === 'all') return null;
        const category = categories.find(c => c.id === selectedCategory);
        return category ? category.name : null;
    };

    // Obter o nome do status selecionado
    const getStatusName = (status: string) => {
        switch (status) {
            case 'normal': return 'Normal';
            case 'baixo': return 'Estoque Baixo';
            case 'critico': return 'Estoque Crítico';
            default: return null;
        }
    };

    // Obter a cor do status
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'normal': return 'bg-green-50 text-green-600 border-green-200';
            case 'baixo': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'critico': return 'bg-red-50 text-red-600 border-red-200';
            default: return '';
        }
    };

    return (
        <div className="space-y-2 sm:space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:gap-4">
                <div className="relative sm:col-span-6 lg:col-span-5">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-2 sm:pl-3 pointer-events-none">
                        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                    <Input
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-9 sm:h-10 text-sm"
                    />
                    {searchTerm && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute inset-y-0 right-0 h-full px-2 sm:px-3 py-0"
                            onClick={() => onSearchChange('')}
                        >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        </Button>
                    )}
                </div>

                <div className="flex flex-wrap items-center sm:col-span-6 lg:col-span-7 gap-2">
                    <Select
                        value={selectedCategory}
                        onValueChange={onCategoryChange}
                    >
                        <SelectTrigger className="h-9 sm:h-10 min-w-[110px] sm:min-w-[135px] text-xs sm:text-sm">
                            <div className="flex items-center gap-1 sm:gap-2">
                                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                <SelectValue placeholder="Categoria" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel className="text-xs sm:text-sm">Categorias</SelectLabel>
                                <SelectItem value="all" className="text-xs sm:text-sm">Todas as Categorias</SelectItem>
                                {categories.map(category => (
                                    <SelectItem key={category.id} value={category.id} className="text-xs sm:text-sm">
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedStatus}
                        onValueChange={onStatusChange}
                    >
                        <SelectTrigger className={cn(
                            "h-9 sm:h-10 min-w-[100px] sm:min-w-[135px] text-xs sm:text-sm",
                            selectedStatus !== 'all' && getStatusColor(selectedStatus)
                        )}>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel className="text-xs sm:text-sm">Status de Estoque</SelectLabel>
                                <SelectItem value="all" className="text-xs sm:text-sm">Todos os Status</SelectItem>
                                <SelectItem value="normal" className="text-xs sm:text-sm text-green-600">Normal</SelectItem>
                                <SelectItem value="baixo" className="text-xs sm:text-sm text-amber-600">Estoque Baixo</SelectItem>
                                <SelectItem value="critico" className="text-xs sm:text-sm text-red-600">Estoque Crítico</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <Button
                        variant={selectMode ? "default" : "outline"}
                        onClick={onToggleSelectMode}
                        className="h-9 sm:h-10 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 ml-auto text-xs sm:text-sm"
                        title={selectMode ? "Cancelar seleção" : "Selecionar múltiplos produtos"}
                    >
                        <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{selectMode ? "Cancelar" : "Selecionar"}</span>
                    </Button>
                </div>
            </div>

            {/* Mostrar filtros ativos como badges */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-1.5">
                        <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>Filtros:</span>
                    </div>

                    {selectedCategory !== 'all' && getSelectedCategoryName() && (
                        <Badge variant="outline" className="gap-1 sm:gap-1.5 pl-1.5 sm:pl-2 pr-1 sm:pr-1.5 py-0.5 sm:py-1 h-6 sm:h-7 text-xs">
                            <span>Categoria: {getSelectedCategoryName()}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-1 p-0"
                                onClick={() => onCategoryChange('all')}
                            >
                                <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                        </Badge>
                    )}

                    {selectedStatus !== 'all' && (
                        <Badge
                            variant="outline"
                            className={cn(
                                "gap-1 sm:gap-1.5 pl-1.5 sm:pl-2 pr-1 sm:pr-1.5 py-0.5 sm:py-1 h-6 sm:h-7 text-xs",
                                getStatusColor(selectedStatus)
                            )}
                        >
                            <span>Status: {getStatusName(selectedStatus)}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-1 p-0"
                                onClick={() => onStatusChange('all')}
                            >
                                <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                        </Badge>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] sm:text-xs h-6 sm:h-7 px-1.5 sm:px-2"
                        onClick={clearAllFilters}
                    >
                        Limpar todos
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ModernProductFilters; 