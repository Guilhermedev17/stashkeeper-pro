import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModernFiltersProps {
    /** Elementos de filtro a serem renderizados */
    children: ReactNode;
    /** Classes adicionais para personalização */
    className?: string;
}

/**
 * Container padrão para seções de filtros em todas as páginas do sistema.
 * Mantém consistência visual e organiza os componentes de filtro.
 * Otimizado para visualização em dispositivos móveis.
 */
const ModernFilters = ({
    children,
    className = ''
}: ModernFiltersProps) => {
    return (
        <div className={cn(
            'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6 shrink-0',
            className
        )}>
            {children}
        </div>
    );
};

export default ModernFilters;
