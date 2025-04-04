import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Check, Info, AlertTriangle, CheckCircle, AlertCircle, X, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';

const NotificationDropdown = () => {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
    const [open, setOpen] = useState(false);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'info':
                return <Info className="h-4 w-4 text-blue-500" />;
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const handleNotificationClick = (notification) => {
        if (notification.link) {
            navigate(notification.link);
        }
        markAsRead(notification.id);
        setOpen(false);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="relative w-9 h-9 rounded-full overflow-hidden transition-all duration-300 border-muted-foreground/20 hover:bg-muted hover:text-accent-foreground"
                >
                    <Bell className="h-[1.2rem] w-[1.2rem]" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between p-4">
                    <DropdownMenuLabel className="font-semibold p-0">Notificações</DropdownMenuLabel>
                    {notifications.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => markAllAsRead()}
                        >
                            <CheckCheck className="mr-1 h-3 w-3" />
                            Marcar todas como lidas
                        </Button>
                    )}
                </div>

                <DropdownMenuSeparator />

                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Não há notificações no momento</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "flex items-start p-3 hover:bg-muted/50 relative group cursor-pointer",
                                    !notification.read && "bg-muted/30"
                                )}
                            >
                                <div className="mr-3 mt-0.5">
                                    {getNotificationIcon(notification.type)}
                                </div>

                                <div className="flex-1" onClick={() => handleNotificationClick(notification)}>
                                    <p className={cn("text-sm mb-1", !notification.read && "font-medium")}>
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(notification.timestamp), {
                                            addSuffix: true,
                                            locale: ptBR
                                        })}
                                    </p>
                                </div>

                                <div className="flex space-x-1">
                                    {!notification.read && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notification.id);
                                            }}
                                        >
                                            <Check className="h-3 w-3" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeNotification(notification.id);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationDropdown; 