import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Simulação de notificações iniciais
const initialNotifications: Notification[] = [
    {
        id: '1',
        title: 'Estoque baixo',
        message: 'O produto "Papel A4" está com nível de estoque baixo',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
        read: false,
        type: 'warning',
        link: '/products?status=baixo'
    },
    {
        id: '2',
        title: 'Estoque crítico',
        message: 'O produto "Caneta Vermelha" está com estoque abaixo do mínimo',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hora atrás
        read: false,
        type: 'error',
        link: '/products?status=critico'
    },
    {
        id: '3',
        title: 'Nova movimentação',
        message: 'Entrada de 10 unidades de "Caneta Azul" registrada',
        timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 horas atrás
        read: false,
        type: 'info',
        link: '/movements'
    },
    {
        id: '4',
        title: 'Bem-vindo ao StashKeeper Pro',
        message: 'Conheça os recursos premium da nossa plataforma',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
        read: true,
        type: 'success',
    }
];

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Força a limpeza do localStorage de notificações na inicialização 
    // para garantir que as novas definições sejam usadas
    useEffect(() => {
        localStorage.removeItem('notifications');
    }, []);

    // Tenta carregar notificações do localStorage ou usa as iniciais
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

    // Calcula o número de notificações não lidas
    const unreadCount = notifications.filter(notification => !notification.read).length;

    // Salva notificações no localStorage quando mudarem
    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    // Adiciona uma nova notificação
    const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        // Corrige links para tipos específicos de notificações
        let link = notificationData.link;
        if (notificationData.title === 'Estoque baixo') {
            link = '/products?status=baixo';
        } else if (notificationData.title === 'Estoque crítico') {
            link = '/products?status=critico';
        }

        const newNotification: Notification = {
            ...notificationData,
            link,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false
        };

        setNotifications(prev => [newNotification, ...prev]);
    };

    // Marca uma notificação como lida
    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id ? { ...notification, read: true } : notification
            )
        );
    };

    // Marca todas as notificações como lidas
    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, read: true }))
        );
    };

    // Remove uma notificação
    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    // Remove todas as notificações
    const clearAllNotifications = () => {
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                removeNotification,
                clearAllNotifications
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export default NotificationContext; 