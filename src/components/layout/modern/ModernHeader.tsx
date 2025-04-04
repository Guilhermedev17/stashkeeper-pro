import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModernHeaderProps {
    /** Título principal da página */
    title: string;
    /** Subtítulo ou descrição da página */
    subtitle?: string;
    /** Elementos adicionais para serem exibidos ao lado direito do cabeçalho */
    actions?: ReactNode;
    /** Classes adicionais para o container */
    className?: string;
}

/**
 * Componente de cabeçalho padronizado para todas as páginas do sistema.
 * Mantém consistência visual e fornece espaço para título, descrição e ações.
 * Suporta tema claro e escuro automaticamente.
 */
const ModernHeader = ({
    title,
    subtitle,
    actions,
    className = ''
}: ModernHeaderProps) => {
    return (
        <div className={cn(
            'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6 shrink-0',
            className
        )}>
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                {subtitle && (
                    <p className="text-muted-foreground text-sm sm:text-base">
                        {subtitle}
                    </p>
                )}
            </div>

            {actions && (
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default ModernHeader; 