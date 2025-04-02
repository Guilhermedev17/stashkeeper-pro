import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, CalendarDays, Clock, Download, FileText, Search, User, Calendar as CalendarIcon } from 'lucide-react';
import { useSupabaseMovements } from '@/hooks/useSupabaseMovements';
import DateRangeFilter from '@/components/ui/DateRangeFilter';
import CustomDateRangePicker from '@/components/ui/CustomDateRangePicker';
import { addDays, startOfToday, startOfWeek, startOfMonth, startOfYear, isWithinInterval } from 'date-fns';
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'year' | undefined>();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<'predefined' | 'custom'>('predefined');
  
  const { movements, loading } = useSupabaseMovements();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  
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
  
  const filteredHistory = historyItems.filter(item => {
    const matchSearch = 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchType = typeFilter === 'all' || item.type === typeFilter;
    
    let matchDate = true;
    const itemDate = new Date(item.date);

    // Filtro por intervalo personalizado
    if (startDate && endDate) {
      // Ajustar endDate para incluir o final do dia
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      
      matchDate = itemDate >= startDate && itemDate <= adjustedEndDate;
    }
    // Filtro por data específica
    else if (selectedDate) {
      matchDate = itemDate.toDateString() === selectedDate.toDateString();
    } 
    // Filtro por intervalo predefinido
    else if (dateRange) {
      const today = startOfToday();
      let start: Date;
      let end = new Date();

      switch (dateRange) {
        case 'day':
          start = today;
          break;
        case 'week':
          start = startOfWeek(today, { weekStartsOn: 1 });
          break;
        case 'month':
          start = startOfMonth(today);
          break;
        case 'year':
          start = startOfYear(today);
          break;
        default:
          start = today;
      }

      matchDate = isWithinInterval(itemDate, { start, end });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Histórico</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Visualize todo o histórico de movimentações do almoxarifado.
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="gap-1.5 flex-1 sm:flex-auto justify-center">
            <Download className="h-4 w-4" />
            <span className="hidden xs:inline">Exportar</span>
          </Button>
          <Button variant="outline" className="gap-1.5 flex-1 sm:flex-auto justify-center">
            <FileText className="h-4 w-4" />
            <span className="hidden xs:inline">PDF</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="relative col-span-1 sm:col-span-4 md:col-span-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar no histórico..."
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 col-span-1 sm:col-span-4 md:col-span-2 gap-2">
          <div className="col-span-1">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-1 flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant={dateRange ? "default" : "outline"}
                  size="sm" 
                  className="gap-1 flex-1"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="truncate">Rápido</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <DateRangeFilter
                  date={selectedDate}
                  dateRange={dateRange}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    setDateRange(undefined);
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                  onDateRangeSelect={(range) => {
                    setDateRange(range);
                    setSelectedDate(undefined);
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                  onClearFilter={() => {
                    setSelectedDate(undefined);
                    setDateRange(undefined);
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                  className="w-full border-0"
                  placeholder="Filtro rápido"
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant={startDate && endDate ? "default" : "outline"}
                  size="sm" 
                  className="gap-1 flex-1"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="truncate">Período</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <CustomDateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onRangeChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                    setSelectedDate(undefined);
                    setDateRange(undefined);
                  }}
                  placeholder="Período específico"
                  className="w-full border-0"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {(dateRange || selectedDate || startDate || endDate) && (
            <div className="col-span-2 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-destructive"
                onClick={() => {
                  setSelectedDate(undefined);
                  setDateRange(undefined);
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-6">
        {loading ? (
          <Card>
            <CardContent className="h-24 flex flex-col items-center justify-center text-muted-foreground">
              <p>Carregando histórico...</p>
            </CardContent>
          </Card>
        ) : Object.keys(groupedHistory).length === 0 ? (
          <Card>
            <CardContent className="h-24 flex flex-col items-center justify-center text-muted-foreground">
              <CalendarDays className="h-8 w-8 mb-2" />
              <p>Nenhum registro encontrado</p>
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
              <Card key={date}>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    {date}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-1 sm:px-6">
                  <div className="overflow-x-auto -mx-1 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Horário</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-center w-[60px]">Tipo</TableHead>
                          <TableHead className="text-center w-[40px]">Qtd.</TableHead>
                          <TableHead className="hidden sm:table-cell">Colaborador</TableHead>
                          <TableHead className="hidden md:table-cell">Observações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items
                          .sort((a, b) => b.date.getTime() - a.date.getTime())
                          .map(item => (
                            <TableRow key={item.id}>
                              <TableCell className="whitespace-nowrap px-1 sm:px-4">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  {item.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </TableCell>
                              <TableCell className="px-1 sm:px-4">
                                <div className="font-medium text-sm line-clamp-1">{item.productName}</div>
                                <div className="text-xs bg-secondary/40 dark:bg-secondary/20 px-2 py-0.5 rounded border border-border/50 inline-block mt-1 font-mono">
                                  {item.productCode}
                                </div>
                                <div className="text-xs sm:hidden flex flex-col mt-1">
                                  {item.type === 'saida' && item.employeeName && (
                                    <span className="text-xs mt-1 text-muted-foreground">
                                      Colab: <span className="font-medium">{item.employeeName}</span>
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center px-1 sm:px-4">
                                {item.type === 'entrada' ? (
                                  <div className="flex items-center justify-center">
                                    <ArrowDown className="h-4 w-4 text-green-500" />
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center">
                                    <ArrowUp className="h-4 w-4 text-blue-500" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-center px-1 sm:px-4">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell px-1 sm:px-4">
                                <div className="space-y-1">
                                  {item.type === 'saida' && item.employeeName && (
                                    <div className="flex items-start gap-1.5">
                                      <div className="space-y-0.5">
                                        <div className="text-xs">Colab: <span className="font-medium">{item.employeeName}</span></div>
                                        {item.employeeCode && (
                                          <div className="text-xs text-muted-foreground font-mono">{item.employeeCode}</div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell px-1 sm:px-4 text-sm text-muted-foreground">
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
    </div>
  );
};

export default History;
