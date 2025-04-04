import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import ModernCard from './ModernCard';

interface ModernTableProps {
    /** Título da tabela */
    title?: string;
    /** Conteúdo da tabela */
    children: ReactNode;
    /** Ações extras para exibir no cabeçalho */
    actions?: ReactNode;
    /** Classes adicionais para o container */
    className?: string;
    /** Se verdadeiro, remove o padding interno da tabela */
    noPadding?: boolean;
}

/**
 * Container de tabela com design moderno, para padronizar
 * a exibição de dados tabulares em todo o sistema.
 */
const ModernTable = ({
    title,
    children,
    actions,
    className = '',
    noPadding = false
}: ModernTableProps) => {
    return (
        <ModernCard className={cn('flex flex-col overflow-hidden', className)}>
            {(title || actions) && (
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>}
                    {actions && <div className="flex items-center space-x-2">{actions}</div>}
                </div>
            )}

            <div className={cn(
                'w-full overflow-auto flex-1',
                !noPadding && 'p-1 sm:p-2'
            )}>
                {children}
            </div>
        </ModernCard>
    );
};

export default ModernTable; 