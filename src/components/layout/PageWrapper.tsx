import { ReactNode } from 'react';

interface PageWrapperProps {
    /** Conteúdo da página */
    children: ReactNode;
    /** Classes adicionais para o wrapper */
    className?: string;
    /** Define se o padding padrão deve ser desativado */
    noPadding?: boolean;
}

/**
 * Componente que garante que as páginas ocupem toda a altura disponível
 * e mantém uma aparência consistente em todo o aplicativo.
 * 
 * IMPORTANTE: Este componente deve ser usado como wrapper em TODAS as páginas
 * para garantir que o layout integrado funcione corretamente.
 * 
 * Exemplo de uso básico:
 * const MinhaPageina = () => <PageWrapper>Seu conteúdo aqui</PageWrapper>
 */
const PageWrapper = ({ children, className = '', noPadding = false }: PageWrapperProps) => {
    return (
        <div
            className={`w-full flex flex-col flex-1 ${noPadding ? '' : 'p-2 sm:p-3 md:p-4'} ${className}`}
            style={{ minHeight: '100%' }}
        >
            {children}
        </div>
    );
};

export default PageWrapper;