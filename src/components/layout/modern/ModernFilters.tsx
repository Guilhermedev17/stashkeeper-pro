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
            'flex flex-col w-full mb-4 sm:mb-5 gap-3',
            className
        )}>
            {children}
        </div>
    );
};

export default ModernFilters;
