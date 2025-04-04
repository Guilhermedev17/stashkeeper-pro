import { useState } from 'react';
import ModernDateRangeFilter, { DateFilterRange } from '@/components/ui/ModernDateRangeFilter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageWrapper from '@/components/layout/PageWrapper';
import { ModernHeader } from '@/components/layout/modern';
import { Label } from '@/components/ui/label';

/**
 * Página de demonstração dos componentes modernizados de seleção de datas
 */
const DateComponentsDemo = () => {
    // Estado para o filtro
    const [selectedRange, setSelectedRange] = useState<DateFilterRange>('today');
    const [customDateRange, setCustomDateRange] = useState<{
        from?: Date;
        to?: Date;
    }>({});
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Handler para seleção de período ou data específica
    const handleRangeSelect = (range: DateFilterRange, dates?: { from?: Date; to?: Date }) => {
        setSelectedRange(range);

        if (range === 'custom' && dates) {
            setCustomDateRange(dates);
        } else if (range === 'specificDate' && dates?.from) {
            setSelectedDate(dates.from);
        }

        console.log('Range selected:', range, dates);
    };

    // Handler para seleção direta de data única
    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        console.log('Date selected:', date);
    };

    // Formatar datas para exibição
    const formatDate = (date?: Date) => {
        if (!date) return 'Não selecionada';
        return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    };

    return (
        <PageWrapper>
            <ModernHeader
                title="Componente de Seleção de Datas"
                subtitle="Demonstração do ModernDateRangeFilter com seleção integrada de intervalo ou data única"
            />

            <div className="grid grid-cols-1 gap-6 mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Filtro de Período/Data</CardTitle>
                        <CardDescription>
                            ModernDateRangeFilter com seleção integrada de intervalo ou data única
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ModernDateRangeFilter
                            selectedRange={selectedRange}
                            customDateRange={customDateRange}
                            selectedDate={selectedDate}
                            onRangeSelect={handleRangeSelect}
                            onDateSelect={handleDateSelect}
                            placeholder="Filtrar por período ou data"
                            defaultMode="range"
                        />

                        <Separator className="my-4" />

                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">Valores selecionados:</h3>
                            <div className="text-sm space-y-2">
                                <p><span className="font-medium">Período/Tipo:</span> {selectedRange}</p>

                                {selectedRange === 'custom' && (
                                    <>
                                        <p><span className="font-medium">Data inicial:</span> {formatDate(customDateRange.from)}</p>
                                        <p><span className="font-medium">Data final:</span> {formatDate(customDateRange.to)}</p>
                                    </>
                                )}

                                {selectedRange === 'specificDate' && (
                                    <p><span className="font-medium">Data selecionada:</span> {formatDate(selectedDate)}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Modo Predefinido: Intervalo</CardTitle>
                        <CardDescription>
                            ModernDateRangeFilter com modo padrão de intervalo e sem opção de troca
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ModernDateRangeFilter
                            selectedRange={selectedRange}
                            customDateRange={customDateRange}
                            onRangeSelect={handleRangeSelect}
                            placeholder="Filtrar por período"
                            defaultMode="range"
                            showModeToggle={false}
                        />
                        <div className="p-3 bg-muted rounded-md text-xs">
                            Exemplo com <code>defaultMode="range"</code> e <code>showModeToggle={false}</code>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Modo Predefinido: Data Única</CardTitle>
                        <CardDescription>
                            ModernDateRangeFilter com modo padrão de data única e sem opção de troca
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ModernDateRangeFilter
                            selectedRange={selectedRange}
                            selectedDate={selectedDate}
                            onRangeSelect={handleRangeSelect}
                            onDateSelect={handleDateSelect}
                            placeholder="Selecione uma data"
                            defaultMode="singleDate"
                            showModeToggle={false}
                        />
                        <div className="p-3 bg-muted rounded-md text-xs">
                            Exemplo com <code>defaultMode="singleDate"</code> e <code>showModeToggle={false}</code>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Exemplo de Uso</CardTitle>
                    <CardDescription>
                        Como usar o ModernDateRangeFilter com seleção integrada
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-muted rounded-md">
                        <pre className="text-xs overflow-x-auto">
                            {`import { useState } from 'react';
import ModernDateRangeFilter, { DateFilterRange } from '@/components/ui/ModernDateRangeFilter';

const MyFilterComponent = () => {
  const [selectedRange, setSelectedRange] = useState<DateFilterRange>('today');
  const [customDateRange, setCustomDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Handler para seleção de período ou data específica
  const handleRangeSelect = (range: DateFilterRange, dates?: { from?: Date; to?: Date }) => {
    setSelectedRange(range);
    
    if (range === 'custom' && dates) {
      setCustomDateRange(dates);
    } else if (range === 'specificDate' && dates?.from) {
      setSelectedDate(dates.from);
    }
  };

  // Handler para seleção direta de data única
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <ModernDateRangeFilter
      selectedRange={selectedRange}
      customDateRange={customDateRange}
      selectedDate={selectedDate}
      onRangeSelect={handleRangeSelect}
      onDateSelect={handleDateSelect}
      placeholder="Filtrar por período ou data"
      defaultMode="range" // ou "singleDate"
      showModeToggle={true} // se deseja mostrar opção de alternar modos
    />
  );
};`}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </PageWrapper>
    );
};

export default DateComponentsDemo; 