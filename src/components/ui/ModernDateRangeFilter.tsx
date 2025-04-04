import { useState, useMemo } from "react";
import {
    format, startOfDay, endOfDay,
    startOfWeek, endOfWeek,
    startOfMonth, endOfMonth,
    startOfYear, endOfYear,
    subDays, subWeeks, subMonths, subYears
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Calendar as CalendarIcon,
    ChevronDown,
    Clock,
    Check,
    X,
    CalendarRange
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export type DateFilterRange = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'last30Days' | 'last90Days' | 'thisYear' | 'custom' | 'specificDate';

export interface DateRangeFilter {
    id: DateFilterRange;
    label: string;
    value: {
        from: Date;
        to: Date;
    };
}

interface ModernDateRangeFilterProps {
    selectedRange: DateFilterRange;
    customDateRange?: {
        from?: Date;
        to?: Date;
    };
    onRangeSelect: (range: DateFilterRange, dates?: { from?: Date; to?: Date }) => void;
    className?: string;
    placeholder?: string;
    align?: "start" | "center" | "end";
    defaultMode?: "range" | "singleDate";
    selectedDate?: Date;
    onDateSelect?: (date: Date) => void;
    showModeToggle?: boolean;
}

/**
 * Componente modernizado para filtro de período de datas com opções predefinidas.
 * Inclui opções comuns como "Hoje", "Esta semana", etc. e a possibilidade de selecionar 
 * um período personalizado ou uma data específica. Permite alternar entre selecionar um
 * intervalo de datas ou uma data única.
 */
const ModernDateRangeFilter = ({
    selectedRange,
    customDateRange,
    onRangeSelect,
    className,
    placeholder = "Filtrar por período",
    align = "start",
    defaultMode = "range",
    selectedDate,
    onDateSelect,
    showModeToggle = true
}: ModernDateRangeFilterProps) => {
    const [open, setOpen] = useState(false);
    const [tabValue, setTabValue] = useState<"predefined" | "custom">(
        selectedRange === 'custom' || selectedRange === 'specificDate'
            ? "custom"
            : "predefined"
    );

    // Estado para controlar o modo (intervalo ou data única)
    const [mode, setMode] = useState<"range" | "singleDate">(defaultMode);

    // Estado interno para o calendário de data personalizada
    const [selectedDates, setSelectedDates] = useState<{
        from?: Date;
        to?: Date;
    }>({
        from: customDateRange?.from,
        to: customDateRange?.to
    });

    // Estado para data única
    const [singleDate, setSingleDate] = useState<Date | undefined>(selectedDate);

    // Configurações de presets de data
    const today = new Date();

    // Gera as opções predefinidas de período
    const dateRanges = useMemo<DateRangeFilter[]>(() => [
        {
            id: 'today',
            label: 'Hoje',
            value: {
                from: startOfDay(today),
                to: endOfDay(today)
            }
        },
        {
            id: 'yesterday',
            label: 'Ontem',
            value: {
                from: startOfDay(subDays(today, 1)),
                to: endOfDay(subDays(today, 1))
            }
        },
        {
            id: 'thisWeek',
            label: 'Esta semana',
            value: {
                from: startOfWeek(today, { locale: ptBR }),
                to: endOfWeek(today, { locale: ptBR })
            }
        },
        {
            id: 'lastWeek',
            label: 'Semana passada',
            value: {
                from: startOfWeek(subWeeks(today, 1), { locale: ptBR }),
                to: endOfWeek(subWeeks(today, 1), { locale: ptBR })
            }
        },
        {
            id: 'thisMonth',
            label: 'Este mês',
            value: {
                from: startOfMonth(today),
                to: endOfMonth(today)
            }
        },
        {
            id: 'lastMonth',
            label: 'Mês passado',
            value: {
                from: startOfMonth(subMonths(today, 1)),
                to: endOfMonth(subMonths(today, 1))
            }
        },
        {
            id: 'last30Days',
            label: 'Últimos 30 dias',
            value: {
                from: subDays(today, 29),
                to: today
            }
        },
        {
            id: 'last90Days',
            label: 'Últimos 90 dias',
            value: {
                from: subDays(today, 89),
                to: today
            }
        },
        {
            id: 'thisYear',
            label: 'Este ano',
            value: {
                from: startOfYear(today),
                to: endOfYear(today)
            }
        }
    ], [today]);

    // Encontrar o nome do período selecionado
    const getSelectedRangeLabel = () => {
        if (selectedRange === 'specificDate' && selectedDate) {
            return format(selectedDate, "dd/MM/yyyy");
        }

        if (selectedRange === 'custom' && customDateRange?.from && customDateRange?.to) {
            return `${format(customDateRange.from, "dd/MM/yyyy")} - ${format(customDateRange.to, "dd/MM/yyyy")}`;
        }

        const rangeOption = dateRanges.find(option => option.id === selectedRange);
        return rangeOption ? rangeOption.label : placeholder;
    };

    // Limpar a seleção
    const handleClear = () => {
        if (mode === "singleDate") {
            setSingleDate(undefined);
            if (onDateSelect) onDateSelect(new Date()); // Reset para hoje
        } else {
            onRangeSelect('today'); // Redefine para hoje
        }
        setOpen(false);
    };

    // Aplicar a seleção de data personalizada
    const handleApplyCustomDate = () => {
        if (mode === "singleDate" && singleDate) {
            if (onDateSelect) onDateSelect(singleDate);
            onRangeSelect('specificDate', {
                from: startOfDay(singleDate),
                to: endOfDay(singleDate)
            });
            setOpen(false);
        } else if (selectedDates.from && selectedDates.to) {
            onRangeSelect('custom', {
                from: selectedDates.from,
                to: selectedDates.to
            });
            setOpen(false);
        }
    };

    // Selecionar um período predefinido
    const handleSelectPredefined = (range: DateFilterRange) => {
        onRangeSelect(range);
        setOpen(false);
    };

    // Alternar entre modos de intervalo e data única
    const handleModeToggle = (checked: boolean) => {
        setMode(checked ? "singleDate" : "range");
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full h-9 px-3 justify-start text-left font-normal",
                        !selectedRange && "text-muted-foreground",
                        className
                    )}
                >
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">
                                {getSelectedRangeLabel()}
                            </span>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto min-w-[300px] p-0 max-w-[calc(100vw-2rem)]"
                align={align}
            >
                <Tabs
                    value={tabValue}
                    onValueChange={(value) => setTabValue(value as "predefined" | "custom")}
                    className="w-full"
                >
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                        <TabsList className="grid w-[200px] grid-cols-2">
                            <TabsTrigger value="predefined" className="text-xs">
                                <Clock className="mr-1 h-3.5 w-3.5" />
                                Predefinidos
                            </TabsTrigger>
                            <TabsTrigger value="custom" className="text-xs">
                                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                                {mode === "singleDate" ? "Data Específica" : "Personalizado"}
                            </TabsTrigger>
                        </TabsList>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="h-7 px-2 text-xs"
                        >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Limpar
                        </Button>
                    </div>

                    {showModeToggle && (
                        <div className="flex items-center justify-between px-3 py-2 border-b">
                            <div className="flex items-center gap-2 text-sm">
                                <CalendarRange className="h-4 w-4 mr-1" />
                                <Label htmlFor="mode-toggle">Modo intervalo</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="mode-toggle"
                                    checked={mode === "singleDate"}
                                    onCheckedChange={handleModeToggle}
                                />
                                <Label htmlFor="mode-toggle" className="text-sm">Data única</Label>
                            </div>
                        </div>
                    )}

                    <TabsContent value="predefined" className="p-3 space-y-3">
                        <div className="grid grid-cols-1 gap-2">
                            {dateRanges.map((range) => (
                                <Button
                                    key={range.id}
                                    variant={selectedRange === range.id ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "justify-start text-left h-8",
                                        selectedRange === range.id ? "text-primary-foreground" : "text-foreground"
                                    )}
                                    onClick={() => handleSelectPredefined(range.id)}
                                >
                                    <div className="flex items-center w-full">
                                        <div className="flex-1">
                                            {range.label}
                                        </div>
                                        {selectedRange === range.id && (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="custom" className="p-3 pb-0 space-y-3">
                        {mode === "singleDate" ? (
                            // Calendário para seleção de data única
                            <Calendar
                                mode="single"
                                locale={ptBR}
                                selected={singleDate}
                                onSelect={(date) => setSingleDate(date || undefined)}
                                initialFocus
                                className="border rounded-md"
                            />
                        ) : (
                            // Calendário para seleção de intervalo de datas
                            <Calendar
                                mode="range"
                                locale={ptBR}
                                selected={{
                                    from: selectedDates.from || undefined,
                                    to: selectedDates.to || undefined
                                }}
                                onSelect={(range) => {
                                    setSelectedDates({
                                        from: range?.from,
                                        to: range?.to
                                    });
                                }}
                                initialFocus
                                className="border rounded-md"
                            />
                        )}

                        {mode === "singleDate" ? (
                            <div className="pb-2">
                                <Badge variant="outline" className="w-full py-1 px-2 justify-center">
                                    {singleDate
                                        ? format(singleDate, "dd/MM/yyyy", { locale: ptBR })
                                        : "Selecione uma data"
                                    }
                                </Badge>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 pb-2">
                                <div>
                                    <Badge variant="outline" className="w-full py-1 px-2 justify-center">
                                        {selectedDates.from
                                            ? format(selectedDates.from, "dd/MM/yyyy", { locale: ptBR })
                                            : "Data inicial"
                                        }
                                    </Badge>
                                </div>
                                <div>
                                    <Badge variant="outline" className="w-full py-1 px-2 justify-center">
                                        {selectedDates.to
                                            ? format(selectedDates.to, "dd/MM/yyyy", { locale: ptBR })
                                            : "Data final"
                                        }
                                    </Badge>
                                </div>
                            </div>
                        )}

                        <Separator className="my-2" />

                        <div className="flex justify-end gap-2 pb-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOpen(false)}
                                className="h-8"
                            >
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleApplyCustomDate}
                                disabled={mode === "singleDate" ? !singleDate : (!selectedDates.from || !selectedDates.to)}
                                className="h-8"
                            >
                                Aplicar
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
};

export default ModernDateRangeFilter; 