import React from 'react';
import { Search, Tag, FileBox, CheckSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FilterButton } from '@/components/ui/filter-button';
import { cn } from '@/lib/utils';

interface FilterButtonsProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    onCategoryClick: () => void;
    onStatusClick: () => void;
    onSelectClick: () => void;
    categoryLabel?: string;
    statusLabel?: string;
    selectMode?: boolean;
    className?: string;
}

/**
 * Componente para exibir os botões de filtro na interface de produtos
 * com visual moderno e consistente
 */
const FilterButtons: React.FC<FilterButtonsProps> = ({
    searchValue,
    onSearchChange,
    onCategoryClick,
    onStatusClick,
    onSelectClick,
    categoryLabel = "Todas as Categorias",
    statusLabel = "Todos os Status",
    selectMode = false,
    className
}) => {
    return (
        <div className={cn("flex flex-wrap gap-2 w-full", className)}>
            <div className="relative min-w-[200px] flex-grow max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar produtos..."
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 h-10 bg-background/80 dark:bg-secondary/30 border-input/70 shadow-sm focus-visible:ring-1 focus-visible:ring-primary/40"
                />
            </div>

            <FilterButton
                icon={<Tag />}
                label={categoryLabel}
                onClick={onCategoryClick}
                className="flex-shrink-0"
            />

            <FilterButton
                icon={<FileBox />}
                label={statusLabel}
                onClick={onStatusClick}
                className="flex-shrink-0"
            />

            <FilterButton
                icon={<CheckSquare />}
                label={selectMode ? "Cancelar" : "Selecionar"}
                isActive={selectMode}
                onClick={onSelectClick}
                showChevron={false}
                className="flex-shrink-0"
            />
        </div>
    );
};

export default FilterButtons; 