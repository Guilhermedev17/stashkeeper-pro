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
            case 'normal': return 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800';
            case 'baixo': return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800';
            case 'critico': return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800';
            default: return '';
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[280px] max-w-full sm:max-w-[420px]">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                        placeholder="Buscar por nome, código ou descrição..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 pr-10 h-10 border-input/70 shadow-sm dark:bg-secondary/30 focus:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/30"
                    />
                    {searchTerm && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute inset-y-0 right-0 h-full px-3 py-0 hover:bg-transparent"
                            onClick={() => onSearchChange('')}
                        >
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                    )}
                </div>

                <Select
                    value={selectedCategory}
                    onValueChange={onCategoryChange}
                >
                    <SelectTrigger
                        className="h-10 w-[170px] border-input/70 shadow-sm dark:bg-secondary/30 focus:border-primary/40 hover:border-primary/30"
                    >
                        <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <SelectValue placeholder="Categoria" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Categorias</SelectLabel>
                            <SelectItem value="all">Todas as Categorias</SelectItem>
                            {categories.map(category => (
                                <SelectItem key={category.id} value={category.id}>
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
                    <SelectTrigger
                        className={cn(
                            "h-10 w-[140px] border-input/70 shadow-sm dark:bg-secondary/30 focus:border-primary/40 hover:border-primary/30",
                            selectedStatus !== 'all' && getStatusColor(selectedStatus)
                        )}
                    >
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Status de Estoque</SelectLabel>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="normal" className="text-green-600 dark:text-green-400">Normal</SelectItem>
                            <SelectItem value="baixo" className="text-amber-600 dark:text-amber-400">Estoque Baixo</SelectItem>
                            <SelectItem value="critico" className="text-red-600 dark:text-red-400">Estoque Crítico</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>

                <Button
                    variant={selectMode ? "default" : "outline"}
                    onClick={onToggleSelectMode}
                    className={cn(
                        "h-10 flex items-center justify-center gap-1.5 px-4 w-[130px] border-input/70 shadow-sm",
                        !selectMode && "dark:bg-secondary/30 hover:border-primary/30",
                        selectMode && "border-primary/30 bg-primary/10 hover:bg-primary/20"
                    )}
                    title={selectMode ? "Cancelar seleção" : "Selecionar múltiplos produtos"}
                >
                    {selectMode ? (
                        <X className="h-4 w-4 flex-shrink-0" />
                    ) : (
                        <CheckSquare className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="text-sm">{selectMode ? "Cancelar" : "Selecionar"}</span>
                </Button>
            </div>

            {/* Mostrar filtros ativos como badges */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Filter className="h-3.5 w-3.5" />
                        <span>Filtros:</span>
                    </div>

                    {selectedCategory !== 'all' && getSelectedCategoryName() && (
                        <Badge variant="outline" className="gap-1.5 pl-2 pr-1.5 py-1 h-7">
                            <span>Categoria: {getSelectedCategoryName()}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-1 p-0"
                                onClick={() => onCategoryChange('all')}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}

                    {selectedStatus !== 'all' && (
                        <Badge
                            variant="outline"
                            className={cn(
                                "gap-1.5 pl-2 pr-1.5 py-1 h-7",
                                getStatusColor(selectedStatus)
                            )}
                        >
                            <span>Status: {getStatusName(selectedStatus)}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-1 p-0"
                                onClick={() => onStatusChange('all')}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
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