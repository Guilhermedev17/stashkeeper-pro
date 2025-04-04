import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteTransitionContextProps {
    isTransitioning: boolean;
    startTransition: () => void;
    endTransition: () => void;
    currentRoute: string;
    previousRoute: string | null;
}

const RouteTransitionContext = createContext<RouteTransitionContextProps | undefined>(undefined);

export const RouteTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [currentRoute, setCurrentRoute] = useState(location.pathname);
    const [previousRoute, setPreviousRoute] = useState<string | null>(null);

    // Detectar mudanças de rota
    useEffect(() => {
        if (location.pathname !== currentRoute) {
            setPreviousRoute(currentRoute);
            setCurrentRoute(location.pathname);
            startTransition();

            // Finalizar transição após um tempo
            const timer = setTimeout(() => {
                endTransition();
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [location.pathname]);

    const startTransition = useCallback(() => {
        setIsTransitioning(true);
    }, []);

    const endTransition = useCallback(() => {
        setIsTransitioning(false);
    }, []);

    return (
        <RouteTransitionContext.Provider
            value={{
                isTransitioning,
                startTransition,
                endTransition,
                currentRoute,
                previousRoute
            }}
        >
            {children}
        </RouteTransitionContext.Provider>
    );
};

export const useRouteTransition = () => {
    const context = useContext(RouteTransitionContext);
    if (context === undefined) {
        throw new Error('useRouteTransition must be used within a RouteTransitionProvider');
    }
    return context;
};

export default RouteTransitionProvider; 