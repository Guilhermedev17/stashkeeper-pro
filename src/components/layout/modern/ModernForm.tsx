import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModernFormProps {
    /** Conteúdo do formulário */
    children: ReactNode;
    /** Classes adicionais para o container do formulário */
    className?: string;
    /** Função a ser chamada quando o formulário é submetido */
    onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
    /** Se verdadeiro, impedirá o comportamento padrão de submissão do formulário */
    preventDefaultSubmit?: boolean;
}

/**
 * Componente de formulário com design moderno, utilizado para
 * criar formulários visualmente consistentes em todo o sistema.
 */
const ModernForm = ({
    children,
    className = '',
    onSubmit,
    preventDefaultSubmit = false
}: ModernFormProps) => {
    return (
        <form
            className={cn(
                'grid gap-4',
                className
            )}
            onSubmit={(e) => {
                // Sempre prevenir o comportamento padrão se preventDefaultSubmit for true
                if (preventDefaultSubmit) {
                    e.preventDefault();
                }

                // Chamar o manipulador onSubmit se definido
                if (onSubmit) {
                    onSubmit(e);
                }
            }}
        >
            {children}
        </form>
    );
};

/**
 * Grupo de campos de formulário com layout padronizado
 */
const FormGroup = ({
    children,
    className = ''
}: {
    children: ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn('grid gap-2', className)}>
            {children}
        </div>
    );
};

/**
 * Campo individual do formulário com layout padronizado
 */
const FormField = ({
    children,
    className = ''
}: {
    children: ReactNode;
    className?: string;
}) => {
    return (
        <div className={className}>
            {children}
        </div>
    );
};

/**
 * Container para os botões do formulário com layout padronizado
 */
const FormActions = ({
    children,
    className = ''
}: {
    children: ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn(
            'flex flex-row-reverse sm:justify-end gap-2 pt-2',
            className
        )}>
            {children}
        </div>
    );
};

// Exportando componentes aninhados
ModernForm.Group = FormGroup;
ModernForm.Field = FormField;
ModernForm.Actions = FormActions;

export default ModernForm; 