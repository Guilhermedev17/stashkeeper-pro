import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import ModernCard from './ModernCard';

interface ModernStatsCardProps {
    /** Título do card de estatística */
    title: string;
    /** Valor principal da estatística */
    value: string | number;
    /** Informação adicional/complementar */
    info?: string;
    /** Ícone para acompanhar a estatística */
    icon: ReactNode;
    /** Cor de fundo do ícone */
    iconBgColor?: string;
    /** Cor do ícone */
    iconColor?: string;
    /** Classes adicionais para o card */
    className?: string;
}

/**
 * Componente de card de estatísticas com design moderno,
 * usado para exibir métricas, KPIs e números importantes no sistema.
 */
const ModernStatsCard = ({
    title,
    value,
    info,
    icon,
    iconBgColor = 'bg-blue-100',
    iconColor = 'text-blue-600',
    className = '',
}: ModernStatsCardProps) => {
    return (
        <ModernCard className={cn('p-3 sm:p-4', className)}>
            <div className="flex justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                    {info && <p className="text-xs text-gray-500 mt-1">{info}</p>}
                </div>
                <div className={cn('h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center', iconBgColor)}>
                    <div className={cn('h-5 w-5 sm:h-6 sm:w-6', iconColor)}>
                        {icon}
                    </div>
                </div>
            </div>
        </ModernCard>
    );
};

export default ModernStatsCard; 