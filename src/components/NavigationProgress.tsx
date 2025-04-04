import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useRouteTransition } from '@/contexts/RouteTransitionContext';

const NavigationProgress = () => {
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(0);
    const location = useLocation();
    const { isTransitioning } = useRouteTransition();

    useEffect(() => {
        // Quando a rota muda, mostrar a barra de progresso
        setVisible(true);
        setProgress(30);

        // Simular progresso
        const timer1 = setTimeout(() => {
            setProgress(60);
        }, 80);

        const timer2 = setTimeout(() => {
            setProgress(80);
        }, 150);

        const timer3 = setTimeout(() => {
            setProgress(100);
        }, 300);

        // Esconder a barra após a animação de completude
        const timer4 = setTimeout(() => {
            setVisible(false);
        }, 600);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    }, [location.pathname]);

    if (!visible) return null;

    return (
        <div
            className="fixed top-0 left-0 h-1 z-50 bg-primary"
            style={{
                width: `${progress}%`,
                transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: progress === 100 ? '0' : '1',
                transitionDelay: progress === 100 ? '150ms' : '0ms',
                boxShadow: '0 1px 4px 0 rgba(var(--primary), 0.5)'
            }}
        />
    );
};

export default NavigationProgress; 