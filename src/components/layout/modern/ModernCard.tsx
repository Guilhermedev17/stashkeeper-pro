import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModernCardProps {
    /** Conteúdo do card */
    children: ReactNode;
    /** Classes adicionais para o container do card */
    className?: string;
    /** Define se o card terá um fundo gradiente */
    gradient?: boolean;
    /** Define a cor primária do gradiente (somente quando gradient=true) */
    gradientFrom?: string;
    /** Define a cor secundária do gradiente (somente quando gradient=true) */
    gradientTo?: string;
}

/**
 * Componente de card com design moderno, utilizado em todo o sistema
 * para manter consistência visual. Suporta variantes com ou sem gradiente.
 */
const ModernCard = ({
    children,
    className = '',
    gradient = false,
    gradientFrom = 'from-blue-50',
    gradientTo = 'to-indigo-50'
}: ModernCardProps) => {
    return (
        <div
            className={cn(
                'rounded-xl shadow-sm',
                'border',
                'border-gray-100 dark:border-gray-800',
                gradient
                    ? `bg-gradient-to-br ${gradientFrom} ${gradientTo} dark:from-blue-950/20 dark:to-indigo-950/20`
                    : 'bg-white dark:bg-card',
                'p-4',
                'relative overflow-hidden',
                className
            )}
        >
            {children}
        </div>
    );
};

export default ModernCard; 