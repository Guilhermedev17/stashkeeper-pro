import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Column {
    accessorKey: string;
    header: string | React.ReactNode;
    cell?: (info: any) => React.ReactNode;
    className?: string;
}

interface ResponsiveTableProps {
    data: any[];
    columns: Column[];
    cardKey?: string;
    cardTitle?: string;
    emptyMessage?: string;
    emptyIcon?: React.ReactNode;
    onRowClick?: (row: any) => void;
    rowClassName?: (row: any) => string;
    cardVariant?: 'default' | 'modern';
    cardTitleAccessor?: string;
    cardSubtitleAccessor?: string;
}

/**
 * Componente de tabela responsiva que se adapta a diferentes tamanhos de tela
 * Em telas maiores, exibe uma tabela tradicional
 * Em telas menores, transforma cada linha em um cartão vertical
 */
const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
    data,
    columns,
    cardKey = 'id',
    cardTitle,
    emptyMessage = 'Nenhum dado encontrado',
    emptyIcon,
    onRowClick,
    rowClassName,
    cardVariant = 'default',
    cardTitleAccessor,
    cardSubtitleAccessor
}) => {
    const [isMobile, setIsMobile] = useState(false);

    // Detectar viewport
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);

        return () => {
            window.removeEventListener('resize', checkIsMobile);
        };
    }, []);

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground dark:text-gray-400">
                {emptyIcon}
                <p className="font-medium text-gray-600 dark:text-gray-300 mt-3">{emptyMessage}</p>
            </div>
        );
    }

    // Renderização em formato tabela para desktop
    if (!isMobile) {
        return (
            <div className="w-full overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead key={column.accessorKey} className={column.className}>
                                    {column.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, index) => (
                            <TableRow
                                key={row[cardKey] || index}
                                className={cn(
                                    onRowClick && 'cursor-pointer hover:bg-muted/60',
                                    rowClassName && rowClassName(row)
                                )}
                                onClick={() => onRowClick && onRowClick(row)}
                            >
                                {columns.map((column) => (
                                    <TableCell key={column.accessorKey} className={column.className}>
                                        {column.cell
                                            ? column.cell(row)
                                            : row[column.accessorKey]
                                        }
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    // Renderização em formato cartão para mobile
    return (
        <div className="space-y-3">
            {data.map((row, index) => (
                <Card
                    key={row[cardKey] || index}
                    className={cn(
                        'overflow-hidden',
                        onRowClick && 'cursor-pointer hover:bg-muted/10',
                        rowClassName && rowClassName(row)
                    )}
                    onClick={() => onRowClick && onRowClick(row)}
                >
                    <CardContent className="p-0">
                        <div className="p-3">
                            {/* Cabeçalho do cartão */}
                            {(cardTitleAccessor || cardTitle) && (
                                <div className="mb-2">
                                    <h3 className="font-medium text-sm text-foreground">
                                        {cardTitleAccessor ? row[cardTitleAccessor] : cardTitle}
                                    </h3>
                                    {cardSubtitleAccessor && (
                                        <p className="text-xs text-muted-foreground">{row[cardSubtitleAccessor]}</p>
                                    )}
                                </div>
                            )}

                            {/* Conteúdo do cartão */}
                            <div className="space-y-2">
                                {columns.map((column) => (
                                    <div key={column.accessorKey} className="flex justify-between items-center py-1 border-b border-border/50 last:border-b-0">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {typeof column.header === 'string' ? column.header : column.accessorKey}
                                        </span>
                                        <div className="text-sm text-right">
                                            {column.cell
                                                ? column.cell(row)
                                                : row[column.accessorKey]
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default ResponsiveTable; 