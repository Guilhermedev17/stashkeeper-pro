import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';

interface ModernDialogProps {
    /** Título do diálogo */
    title: string;
    /** Descrição ou subtítulo do diálogo */
    description?: string;
    /** Conteúdo principal do diálogo */
    children: ReactNode;
    /** Ações de rodapé (botões) */
    footer?: ReactNode;
    /** Se o diálogo está aberto */
    open: boolean;
    /** Callback quando o estado de abertura muda */
    onOpenChange: (open: boolean) => void;
    /** Largura máxima do diálogo */
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Classes adicionais para o contêiner do diálogo */
    className?: string;
    /** Se verdadeiro, remove o padding do conteúdo */
    noPadding?: boolean;
}

/**
 * Componente de diálogo padronizado com visual moderno.
 * Usado para criar modais, formulários e confirmações consistentes.
 */
const ModernDialog = ({
    title,
    description,
    children,
    footer,
    open,
    onOpenChange,
    maxWidth = 'sm',
    className = '',
    noPadding = false
}: ModernDialogProps) => {
    // Mapeia as opções de largura para classes Tailwind
    const maxWidthClasses = {
        xs: 'sm:max-w-[425px]',
        sm: 'sm:max-w-[540px]',
        md: 'sm:max-w-[640px]',
        lg: 'sm:max-w-[768px]',
        xl: 'sm:max-w-[1024px]',
        full: 'sm:max-w-[95vw]'
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                maxWidthClasses[maxWidth],
                noPadding && 'p-0',
                className
            )}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className={cn(
                    'flex-1',
                    !noPadding && 'py-4'
                )}>
                    {children}
                </div>

                {footer && (
                    <DialogFooter>
                        {footer}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ModernDialog; 