import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, CalendarDays, Clock, Download, FileText, Search, User } from 'lucide-react';
import { useSupabaseMovements } from '@/hooks/useSupabaseMovements';
import DateRangeFilter from '@/components/ui/DateRangeFilter';
import { addDays, startOfToday, startOfWeek, startOfMonth, startOfYear, isWithinInterval } from 'date-fns';

interface HistoryItem {
  id: string;
  productCode: string;
  productName: string;
  type: 'entrada' | 'saida';
  quantity: number;
  user: string;
  date: Date;
  notes?: string;
}

const History = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'year' | undefined>();
  
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
        notes: m.notes || undefined
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

    if (selectedDate) {
      matchDate = itemDate.toDateString() === selectedDate.toDateString();
    } else if (dateRange) {
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico</h1>
          <p className="text-muted-foreground">
            Visualize todo o histórico de movimentações do almoxarifado.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Gerar PDF
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar no histórico..."
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-row flex-wrap gap-4 items-center">
          
          <div className="flex flex-row gap-4 items-center">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Movimentação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
              </SelectContent>
            </Select>
            
            <DateRangeFilter
              date={selectedDate}
              dateRange={dateRange}
              onDateSelect={(date) => {
                setSelectedDate(date);
                setDateRange(undefined);
              }}
              onDateRangeSelect={(range) => {
                setDateRange(range);
                setSelectedDate(undefined);
              }}
              onClearFilter={() => {
                setSelectedDate(undefined);
                setDateRange(undefined);
              }}
              className="w-[180px]"
              placeholder="Filtrar por data"
            />
          </div>
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
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Horário</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-[100px] text-center">Tipo</TableHead>
                        <TableHead className="w-[100px] text-center">Qtd.</TableHead>
                        <TableHead className="w-[150px]">Usuário</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items
                        .sort((a, b) => b.date.getTime() - a.date.getTime())
                        .map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                {item.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {item.productCode}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.type === 'entrada' ? (
                                <div className="flex items-center justify-center gap-1">
                                  <ArrowDown className="h-3.5 w-3.5 text-green-500" />
                                  <span className="text-sm">Entrada</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <ArrowUp className="h-3.5 w-3.5 text-blue-500" />
                                  <span className="text-sm">Saída</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.quantity}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{item.user}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
};

export default History;
