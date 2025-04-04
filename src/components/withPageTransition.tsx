import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageLoading from './PageLoading';

interface WithPageTransitionOptions {
    loadingDelay?: number; // Tempo mínimo de exibição do loading em ms
    loadingMessage?: string;
}

export function withPageTransition<P extends object>(
    Component: React.ComponentType<P>,
    options: WithPageTransitionOptions = {}
) {
    const { loadingDelay = 300, loadingMessage = 'Carregando dados...' } = options;

    const WithTransition: React.FC<P> = (props) => {
        const location = useLocation();
        const [isLoading, setIsLoading] = useState(true);
        const [loadingStartTime, setLoadingStartTime] = useState(0);

        useEffect(() => {
            const now = Date.now();
            setLoadingStartTime(now);
            setIsLoading(true);

            // Garante um tempo mínimo de exibição do loading para evitar flashes
            const timerId = setTimeout(() => {
                const elapsedTime = Date.now() - now;
                const remainingTime = Math.max(0, loadingDelay - elapsedTime);

                setTimeout(() => {
                    setIsLoading(false);
                }, remainingTime);
            }, 100); // Pequeno atraso para dar tempo de iniciar o carregamento real

            return () => clearTimeout(timerId);
        }, [location.pathname]);

        if (isLoading) {
            return <PageLoading message={loadingMessage} />;
        }

        return <Component {...props} />;
    };

    WithTransition.displayName = `withPageTransition(${Component.displayName || Component.name || 'Component'})`;

    return WithTransition;
}

export default withPageTransition; 