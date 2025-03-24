
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, CalendarDays, Clock, Download, FileText, Search, User } from 'lucide-react';
import { useSupabaseMovements } from '@/hooks/useSupabaseMovements';

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
  const [dateFilter, setDateFilter] = useState('all');
  
  const { movements, loading } = useSupabaseMovements();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  
  // Converter movimentos do Supabase para o formato da interface HistoryItem
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
      // Usar dados de mock como fallback
      setHistoryItems(MOCK_HISTORY);
    }
  }, [movements]);
  
  // Filter history based on filters
  const filteredHistory = historyItems.filter(item => {
    // Search term filter
    const matchSearch = 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Type filter
    const matchType = typeFilter === 'all' || item.type === typeFilter;
    
    // Date filter
    let matchDate = true;
    const today = new Date();
    const itemDate = new Date(item.date);
    
    if (dateFilter === 'today') {
      matchDate = 
        itemDate.getDate() === today.getDate() &&
        itemDate.getMonth() === today.getMonth() &&
        itemDate.getFullYear() === today.getFullYear();
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      matchDate = itemDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(today.getMonth() - 1);
      matchDate = itemDate >= monthAgo;
    }
    
    return matchSearch && matchType && matchDate;
  });
  
  // Group history by date
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
        
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o Período</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mês</SelectItem>
          </SelectContent>
        </Select>
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
              // Sort by date (most recent first)
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
                        .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by time (most recent first)
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

// Mock data para fallback
const MOCK_HISTORY: HistoryItem[] = [
  {
    id: '1',
    productCode: 'PRD47X29',
    productName: 'Notebook Dell',
    type: 'entrada',
    quantity: 3,
    user: 'Carlos Silva',
    date: new Date('2023-07-15T10:30:00'),
    notes: 'Compra de novos equipamentos',
  },
  {
    id: '2',
    productCode: 'PRD81Y36',
    productName: 'Papel A4',
    type: 'saida',
    quantity: 5,
    user: 'Ana Oliveira',
    date: new Date('2023-07-14T14:45:00'),
    notes: 'Requisição do departamento de RH',
  },
  {
    id: '3',
    productCode: 'PRD24Z51',
    productName: 'Cadeira Ergonômica',
    type: 'entrada',
    quantity: 2,
    user: 'Carlos Silva',
    date: new Date('2023-07-13T09:15:00'),
  },
  {
    id: '4',
    productCode: 'PRD63W18',
    productName: 'Projetor',
    type: 'saida',
    quantity: 1,
    user: 'Mariana Santos',
    date: new Date('2023-07-12T16:20:00'),
    notes: 'Requisição para sala de reuniões',
  },
  {
    id: '5',
    productCode: 'PRD47X29',
    productName: 'Notebook Dell',
    type: 'saida',
    quantity: 1,
    user: 'João Pereira',
    date: new Date('2023-07-11T11:00:00'),
    notes: 'Requisição para novo funcionário',
  },
  {
    id: '6',
    productCode: 'PRD81Y36',
    productName: 'Papel A4',
    type: 'entrada',
    quantity: 20,
    user: 'Carlos Silva',
    date: new Date('2023-07-10T09:30:00'),
    notes: 'Reposição de estoque',
  },
  {
    id: '7',
    productCode: 'PRD24Z51',
    productName: 'Cadeira Ergonômica',
    type: 'saida',
    quantity: 1,
    user: 'Ana Oliveira',
    date: new Date('2023-07-10T15:45:00'),
    notes: 'Requisição do departamento de TI',
  },
  {
    id: '8',
    productCode: 'PRD63W18',
    productName: 'Projetor',
    type: 'entrada',
    quantity: 1,
    user: 'Carlos Silva',
    date: new Date('2023-07-09T10:00:00'),
    notes: 'Devolução do departamento de Marketing',
  },
  {
    id: '9',
    productCode: 'PRD47X29',
    productName: 'Notebook Dell',
    type: 'entrada',
    quantity: 5,
    user: 'Carlos Silva',
    date: new Date('2023-07-08T10:30:00'),
    notes: 'Compra de novos equipamentos',
  },
  {
    id: '10',
    productCode: 'PRD81Y36',
    productName: 'Papel A4',
    type: 'saida',
    quantity: 3,
    user: 'João Pereira',
    date: new Date('2023-07-07T13:15:00'),
    notes: 'Requisição do departamento Financeiro',
  },
];

export default History;
