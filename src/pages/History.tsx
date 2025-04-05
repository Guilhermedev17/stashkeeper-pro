import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, CalendarDays, Clock, Download, FileText, Search, User } from 'lucide-react';
import { useSupabaseMovements } from '@/hooks/useSupabaseMovements';
import ModernDateRangeFilter, { DateFilterRange } from '@/components/ui/ModernDateRangeFilter';
import { addDays, startOfToday, startOfWeek, startOfMonth, startOfYear, isWithinInterval, format, startOfDay, endOfDay } from 'date-fns';
import { cn } from "@/lib/utils";
import { ModernHeader, ModernFilters } from '@/components/layout/modern';
import PageWrapper from '@/components/layout/PageWrapper';
import PageLoading from '@/components/PageLoading';

interface HistoryItem {
  id: string;
  productCode: string;
  productName: string;
  type: 'entrada' | 'saida';
  quantity: number;
  user: string;
  date: Date;
  notes?: string;
  employeeName?: string | null;
  employeeCode?: string | null;
}

const History = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Estados para o novo filtro de datas
  const [selectedDateRange, setSelectedDateRange] = useState<DateFilterRange>('thisMonth');
  const [customDateRange, setCustomDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { movements, loading } = useSupabaseMovements();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (movements.length > 0) {
      const items = movements.map(m => ({
        id: m.id,
        productCode: m.product_code || 'N/A',
        productName: m.product_name || 'Produto Desconhecido',
        type: m.type,
        quantity: m.quantity,
        user: m.user_name || 'Sistema',
        date: new Date(m.created_at),
        notes: m.notes || undefined,
        employeeName: m.employee_name,
        employeeCode: m.employee_code
      }));
      setHistoryItems(items);
    } else {
      setHistoryItems([]);
    }
  }, [movements]);

  // Adicionar efeito de carregamento inicial
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Iniciar o tempo para medir quanto leva para carregar os dados
      const startTime = performance.now();

      // Esperar pelo menos que os movimentos sejam carregados
      if (loading) {
        await new Promise(resolve => {
          const checkInterval = setInterval(() => {
            if (!loading) {
              clearInterval(checkInterval);
              resolve(true);
            }
          }, 50);
        });
      }

      // Quando todas as operações de carregamento terminarem, verificamos o tempo
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Garantir tempo mínimo de carregamento para evitar flash
      // Se os dados carregarem muito rápido, mostramos o loading por pelo menos 400ms
      // Se os dados demorarem mais que isso, não adicionamos atraso adicional
      const minLoadingTime = 400;
      const remainingTime = Math.max(0, minLoadingTime - loadTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setIsLoading(false);
    };

    loadData();
  }, [loading]);

  // Handler para o filtro de datas
  const handleDateRangeSelect = (range: DateFilterRange, dates?: { from?: Date; to?: Date }) => {
    setSelectedDateRange(range);

    if (range === 'custom' && dates) {
      setCustomDateRange({
        from: dates.from,
        to: dates.to
      });
    } else if (range === 'specificDate' && dates?.from) {
      setSelectedDate(dates.from);
    }
  };

  // Handler para seleção direta de data única
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const filteredHistory = historyItems.filter(item => {
    const matchSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchType = typeFilter === 'all' || item.type === typeFilter;

    let matchDate = true;
    const itemDate = new Date(item.date);

    // Filtragem com base no DateFilterRange selecionado
    if (selectedDateRange === 'custom' && customDateRange.from && customDateRange.to) {
      // Filtro por intervalo personalizado
      const start = startOfDay(customDateRange.from);
      const end = endOfDay(customDateRange.to);
      matchDate = itemDate >= start && itemDate <= end;
    }
    else if (selectedDateRange === 'specificDate') {
      // Filtro por data específica
      const start = startOfDay(selectedDate);
      const end = endOfDay(selectedDate);
      matchDate = itemDate >= start && itemDate <= end;
    }
    else {
      // Filtros predefinidos
      const today = new Date();
      let start: Date;
      let end = endOfDay(today);

      switch (selectedDateRange) {
        case 'today':
          start = startOfDay(today);
          break;
        case 'yesterday':
          start = startOfDay(addDays(today, -1));
          end = endOfDay(addDays(today, -1));
          break;
        case 'thisWeek':
          start = startOfWeek(today, { locale: { options: { weekStartsOn: 1 } } });
          break;
        case 'lastWeek':
          start = startOfWeek(addDays(today, -7), { locale: { options: { weekStartsOn: 1 } } });
          end = endOfDay(addDays(start, 6));
          break;
        case 'thisMonth':
          start = startOfMonth(today);
          break;
        case 'lastMonth':
          start = startOfMonth(addDays(startOfMonth(today), -1));
          end = endOfDay(addDays(startOfMonth(today), -1));
          break;
        case 'last30Days':
          start = startOfDay(addDays(today, -29));
          break;
        case 'last90Days':
          start = startOfDay(addDays(today, -89));
          break;
        case 'thisYear':
          start = startOfYear(today);
          break;
        default:
          start = startOfMonth(today); // Default para thisMonth
      }

      matchDate = itemDate >= start && itemDate <= end;
    }

    return matchSearch && matchType && matchDate;
  });

  const groupedHistory: Record<string, HistoryItem[]> = {};

  filteredHistory.forEach(item => {
    const dateStr = item.date.toLocaleDateString('pt-BR');
    if (!groupedHistory[dateStr]) {
      groupedHistory[dateStr] = [];
    }
    groupedHistory[dateStr].push(item);
  });

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <PageWrapper>
        <ModernHeader
          title="Histórico"
          subtitle="Visualize todo o histórico de movimentações do almoxarifado."
        />
        <PageLoading message="Carregando histórico..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <ModernHeader
        title="Histórico"
        subtitle="Visualize todo o histórico de movimentações do almoxarifado."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden xs:inline text-xs">Exportar</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden xs:inline text-xs">PDF</span>
            </Button>
          </div>
        }
      />

      <ModernFilters className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar no histórico..."
              className="pl-8 h-9 text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:col-span-2">
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <ModernDateRangeFilter
                selectedRange={selectedDateRange}
                customDateRange={customDateRange}
                selectedDate={selectedDate}
                onRangeSelect={handleDateRangeSelect}
                onDateSelect={handleDateSelect}
                placeholder="Filtrar por período"
                defaultMode="range"
                showModeToggle={true}
                className="h-9"
              />
            </div>
          </div>
        </div>
      </ModernFilters>

      <div className="space-y-4 mt-4">
        {loading ? (
          <Card className="shadow-sm">
            <CardContent className="h-24 flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-sm">Carregando histórico...</p>
            </CardContent>
          </Card>
        ) : Object.keys(groupedHistory).length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="h-24 flex flex-col items-center justify-center text-muted-foreground">
              <CalendarDays className="h-6 w-6 mb-2" />
              <p className="text-sm">Nenhum registro encontrado</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedHistory)
            .sort(([dateA], [dateB]) => {
              const dateAObj = new Date(dateA.split('/').reverse().join('-'));
              const dateBObj = new Date(dateB.split('/').reverse().join('-'));
              return dateBObj.getTime() - dateAObj.getTime();
            })
            .map(([date, items]) => (
              <Card key={date} className="shadow-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    {date}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-1 sm:px-4">
                  <div className="overflow-x-auto -mx-1 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px] text-xs">Horário</TableHead>
                          <TableHead className="text-xs">Produto</TableHead>
                          <TableHead className="text-center w-[60px] text-xs">Tipo</TableHead>
                          <TableHead className="text-center w-[40px] text-xs">Qtd.</TableHead>
                          <TableHead className="hidden sm:table-cell text-xs">Colaborador</TableHead>
                          <TableHead className="hidden md:table-cell text-xs">Observações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items
                          .sort((a, b) => b.date.getTime() - a.date.getTime())
                          .map(item => (
                            <TableRow key={item.id}>
                              <TableCell className="whitespace-nowrap px-1 sm:px-3 text-xs">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  {item.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </TableCell>
                              <TableCell className="px-1 sm:px-3">
                                <div className="font-medium text-xs line-clamp-1">{item.productName}</div>
                                <div className="text-xs bg-secondary/40 dark:bg-secondary/20 px-1.5 py-0.5 rounded border border-border/50 inline-block mt-1 font-mono text-[11px]">
                                  {item.productCode}
                                </div>
                                <div className="text-xs sm:hidden flex flex-col mt-1">
                                  {item.type === 'saida' && item.employeeName && (
                                    <span className="text-[11px] mt-1 text-muted-foreground">
                                      Colab: <span className="font-medium">{item.employeeName}</span>
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center px-1 sm:px-3">
                                {item.type === 'entrada' ? (
                                  <div className="flex items-center justify-center">
                                    <ArrowDown className="h-3.5 w-3.5 text-green-500" />
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center">
                                    <ArrowUp className="h-3.5 w-3.5 text-blue-500" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-center px-1 sm:px-3 text-xs">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell px-1 sm:px-3">
                                <div className="space-y-1">
                                  {item.type === 'saida' && item.employeeName && (
                                    <div className="flex items-start gap-1.5">
                                      <div className="space-y-0.5">
                                        <div className="text-xs">Colab: <span className="font-medium">{item.employeeName}</span></div>
                                        {item.employeeCode && (
                                          <div className="text-[11px] text-muted-foreground font-mono">{item.employeeCode}</div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell px-1 sm:px-3 text-xs text-muted-foreground">
                                {item.notes || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </PageWrapper>
  );
};

export default History;
