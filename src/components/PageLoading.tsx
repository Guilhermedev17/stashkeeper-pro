import React from 'react';

interface PageLoadingProps {
    message?: string;
}

const PageLoading: React.FC<PageLoadingProps> = ({ message = 'Carregando dados...' }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 h-[200px]">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-ping opacity-75 w-3 h-3 rounded-full bg-primary"></div>
                </div>
            </div>
            <p className="text-muted-foreground mt-4 text-sm animate-pulse">{message}</p>
        </div>
    );
};

export default PageLoading; 