import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ArrowDown, ArrowUp, CalendarRange, Download, FileText } from 'lucide-react';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseMovements } from '@/hooks/useSupabaseMovements';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { ModernHeader, ModernFilters } from '@/components/layout/modern';
import PageWrapper from '@/components/layout/PageWrapper';
import ModernDateRangeFilter, { DateFilterRange } from '@/components/ui/ModernDateRangeFilter';
import { addDays, startOfDay, endOfDay, subMonths, subYears } from 'date-fns';
import PageLoading from '@/components/PageLoading';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import { formatQuantity } from '@/lib/utils';

// Adicionar cache para relatórios
// Este objeto persiste entre renders para armazenar resultados já calculados
const calculationCache = {
  reports: new Map(),
  productUsage: new Map(),
  categoryData: new Map()
};

const Reports = () => {
  // Estado para o filtro de datas modernizado
  const [selectedDateRange, setSelectedDateRange] = useState<DateFilterRange>('last30Days');
  const [customDateRange, setCustomDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [category, setCategory] = useState('all');
  const { products } = useSupabaseProducts();
  const { movements } = useSupabaseMovements();
  const { categories } = useSupabaseCategories();
  const { employees } = useSupabaseEmployees();

  const [stockMovementData, setStockMovementData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [productUsageData, setProductUsageData] = useState<any[]>([]);

  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const CHART_COLORS = {
    entrada: '#22c55e',
    saida: '#3b82f6',
    total: '#8884d8'
  };

  const [isLoading, setIsLoading] = useState(true);

  // Handler para seleção de período
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

  // Efeito para simulação de carregamento inicial
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Iniciar o tempo para medir quanto leva para carregar os dados
      const startTime = performance.now();

      // Pequeno delay para garantir que todos os dados sejam carregados
      await new Promise(resolve => setTimeout(resolve, 10));

      // Quando todas as operações de carregamento terminarem, verificamos o tempo
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Garantir tempo mínimo de carregamento para evitar flash
      const minLoadingTime = 450;
      const remainingTime = Math.max(0, minLoadingTime - loadTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Adicionar hook de cleanup para limpar o cache periodicamente (a cada 5 minutos)
  useEffect(() => {
    const cacheCleanupInterval = setInterval(() => {
      // Limitar o tamanho do cache para evitar uso excessivo de memória
      if (calculationCache.reports.size > 20) {
        // Manter apenas as 10 entradas mais recentes
        const reportsEntries = Array.from(calculationCache.reports.entries());
        const sortedEntries = reportsEntries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        calculationCache.reports = new Map(sortedEntries.slice(0, 10));
      }
      
      // Mesma lógica para outros caches
      if (calculationCache.productUsage.size > 20) {
        const usageEntries = Array.from(calculationCache.productUsage.entries());
        const sortedUsage = usageEntries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        calculationCache.productUsage = new Map(sortedUsage.slice(0, 10));
      }
      
      if (calculationCache.categoryData.size > 20) {
        const categoryEntries = Array.from(calculationCache.categoryData.entries());
        const sortedCategory = categoryEntries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        calculationCache.categoryData = new Map(sortedCategory.slice(0, 10));
      }
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(cacheCleanupInterval);
  }, []);

  useEffect(() => {
    if (movements.length > 0) {
      // Gerar chave de cache única para esta combinação de filtros
      const cacheKey = `${selectedDateRange}-${JSON.stringify(customDateRange)}-${selectedDate.getTime()}-${movements.length}-${products.length}`;
      
      // Verificar se temos um resultado em cache
      if (calculationCache.reports.has(cacheKey)) {
        const cachedResults = calculationCache.reports.get(cacheKey);
        console.log('Usando resultados em cache para relatórios');
        
        // Usar resultados do cache
        setTotalEntradas(cachedResults.totalEntradas);
        setTotalSaidas(cachedResults.totalSaidas);
        setStockMovementData(cachedResults.periodData);
        setProductUsageData(cachedResults.productUsageArray);
        return;
      }
      
      // Se não temos cache, calcular normalmente com a lógica otimizada
      console.log('Calculando novos resultados para relatórios');
      const startTime = performance.now();
      
      // Reduzir o custo de processamento usando memoização de resultados
      const memoizedResults = (() => {
        // Obter datas de início e fim com base no filtro selecionado
        let startDate: Date;
        let endDate = new Date();

        if (selectedDateRange === 'custom' && customDateRange.from && customDateRange.to) {
          startDate = startOfDay(customDateRange.from);
          endDate = endOfDay(customDateRange.to);
        }
        else if (selectedDateRange === 'specificDate') {
          startDate = startOfDay(selectedDate);
          endDate = endOfDay(selectedDate);
        }
        else {
          // Filtros predefinidos
          const today = new Date();
          endDate = endOfDay(today);

          switch (selectedDateRange) {
            case 'today':
              startDate = startOfDay(today);
              break;
            case 'yesterday':
              startDate = startOfDay(addDays(today, -1));
              endDate = endOfDay(addDays(today, -1));
              break;
            case 'thisWeek':
              // Considera que a semana começa na segunda-feira
              const day = today.getDay();
              const diff = today.getDate() - day + (day === 0 ? -6 : 1);
              startDate = startOfDay(new Date(today.setDate(diff)));
              break;
            case 'lastWeek':
              const lastWeekDay = today.getDay();
              const lastWeekDiff = today.getDate() - lastWeekDay - 6;
              startDate = startOfDay(new Date(new Date().setDate(lastWeekDiff)));
              endDate = endOfDay(new Date(new Date(startDate).setDate(startDate.getDate() + 6)));
              break;
            case 'thisMonth':
              startDate = new Date(today.getFullYear(), today.getMonth(), 1);
              break;
            case 'lastMonth':
              const lastMonthDate = new Date(today);
              lastMonthDate.setDate(1);
              lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
              startDate = startOfDay(lastMonthDate);
              endDate = endOfDay(new Date(today.getFullYear(), today.getMonth(), 0));
              break;
            case 'last30Days':
              startDate = startOfDay(addDays(today, -29));
              break;
            case 'last90Days':
              startDate = startOfDay(addDays(today, -89));
              break;
            case 'thisYear':
              startDate = new Date(today.getFullYear(), 0, 1);
              break;
            default:
              startDate = startOfDay(addDays(today, -29)); // Default para last30Days
          }
        }

        // Otimização: Usar estruturas de dados eficientes e operações em lote
        // 1. Primeiro, criar um mapa indexado por período para evitar múltiplas iterações
        const movementsByPeriod: { [key: string]: {entrances: number, exits: number, movements: any[]} } = {};
        const startStamp = startDate.getTime();
        const endStamp = endDate.getTime();
        
        // 2. Filtragem única por data, usando timestamp para melhor desempenho
        const filteredMovements = movements.filter(m => {
          const movementStamp = new Date(m.created_at).getTime();
          return movementStamp >= startStamp && movementStamp <= endStamp;
        });
        
        // 3. Calcular totais em uma única iteração
        let totalEntradas = 0;
        let totalSaidas = 0;
        
        filteredMovements.forEach(m => {
          if (m.type === 'entrada') totalEntradas += m.quantity;
          else if (m.type === 'saida') totalSaidas += m.quantity;
        });
        
        // 4. Definir formato dos períodos (dias ou meses)
        const isShortPeriod =
          selectedDateRange === 'today' ||
          selectedDateRange === 'yesterday' ||
          selectedDateRange === 'thisWeek' ||
          selectedDateRange === 'lastWeek' ||
          (selectedDateRange === 'custom' &&
            customDateRange.from &&
            customDateRange.to &&
            ((customDateRange.to.getTime() - customDateRange.from.getTime()) / (1000 * 60 * 60 * 24) <= 30));

        // 5. Criar index temporal para classificação eficiente
        filteredMovements.forEach(m => {
          const date = new Date(m.created_at);
          let periodKey;
          
          if (isShortPeriod) {
            periodKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          } else {
            periodKey = date.toLocaleString('pt-BR', { month: 'short' });
          }
          
          if (!movementsByPeriod[periodKey]) {
            movementsByPeriod[periodKey] = {
              entrances: 0,
              exits: 0,
              movements: []
            };
          }
          
          movementsByPeriod[periodKey].movements.push(m);
          if (m.type === 'entrada') {
            movementsByPeriod[periodKey].entrances += m.quantity;
          } else if (m.type === 'saida') {
            movementsByPeriod[periodKey].exits += m.quantity;
          }
        });
        
        // 6. Determinar as datas a serem exibidas no gráfico com intervalos uniformes
        let periods;
        if (isShortPeriod) {
          const diffTime = endDate.getTime() - startDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const numPoints = Math.min(diffDays, 6);

          periods = Array.from({ length: numPoints }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + Math.floor(i * diffDays / numPoints));
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          });
        } else {
          const diffTime = endDate.getTime() - startDate.getTime();
          const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
          const numPoints = Math.min(diffMonths, 6);

          periods = Array.from({ length: numPoints }, (_, i) => {
            const date = new Date(startDate);
            date.setMonth(startDate.getMonth() + Math.floor(i * diffMonths / numPoints));
            return date.toLocaleString('pt-BR', { month: 'short' });
          });
        }
        
        // 7. Gerar dados dos gráficos a partir do mapa indexado
        const periodData = periods.map(period => {
          const periodData = movementsByPeriod[period] || { entrances: 0, exits: 0 };
          
          return {
            month: period,
            entradas: periodData.entrances || 0,
            saidas: periodData.exits || 0,
            total: products.reduce((acc, p) => acc + p.quantity, 0)
          };
        });
        
        // 8. Calcular dados de uso de produtos de forma otimizada
        const productUsage: { [key: string]: { quantity: number, name: string } } = {};
        
        filteredMovements
          .filter(m => m.type === 'saida')
          .forEach(m => {
            const productId = m.product_id;
            if (!productUsage[productId]) {
              const product = products.find(p => p.id === productId);
              productUsage[productId] = {
                quantity: 0,
                name: product ? product.name : 'Produto Desconhecido'
              };
            }
            productUsage[productId].quantity += m.quantity;
          });
        
        // 9. Transformar em array e ordenar uma única vez
        const productUsageArray = Object.values(productUsage)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 8)
          .map(item => ({
            name: item.name,
            quantidade: item.quantity
          }));
        
        // Após calcular tudo, retornar os resultados
        const results = {
          totalEntradas,
          totalSaidas,
          periodData,
          productUsageArray,
          timestamp: Date.now() // Adicionar timestamp para gerenciamento do cache
        };
        
        // Armazenar no cache para uso futuro
        calculationCache.reports.set(cacheKey, results);
        
        return results;
      })();
      
      // Medir tempo de processamento para diagnóstico
      const endTime = performance.now();
      console.log(`Tempo de processamento de relatórios: ${(endTime - startTime).toFixed(2)}ms`);
      
      // Atualizar estado com resultados memoizados
      setTotalEntradas(memoizedResults.totalEntradas);
      setTotalSaidas(memoizedResults.totalSaidas);
      setStockMovementData(memoizedResults.periodData);
      setProductUsageData(memoizedResults.productUsageArray);
    }
  }, [movements, products, selectedDateRange, customDateRange, selectedDate]);

  // Adicionar otimização com uso de cache para cálculos de categorias
  useEffect(() => {
    if (products.length > 0 && categories.length > 0) {
      // Gerar chave de cache para esta combinação
      const cacheKey = `${category}-${products.length}-${categories.length}`;
      
      // Verificar se temos resultados em cache
      if (calculationCache.categoryData.has(cacheKey)) {
        setCategoryData(calculationCache.categoryData.get(cacheKey).data);
        return;
      }
      
      // Processar dados de categoria de forma otimizada
      const processCategories = () => {
        // Filter products by category if specified
        let filteredProducts = [...products];
        if (category !== 'all') {
          filteredProducts = products.filter(p => p.category_id === category);
        }
        
        // Utilizar Map para agrupar produtos por categoria de forma eficiente
        const categoryMap = new Map();
        
        // Processar em uma única iteração
        filteredProducts.forEach(product => {
          if (product.category_id) {
            const currentTotal = categoryMap.get(product.category_id) || 0;
            categoryMap.set(product.category_id, currentTotal + product.quantity);
          }
        });
        
        // Converter para o formato esperado
        const catData = Array.from(categoryMap.entries()).map(([id, value]) => {
          const cat = categories.find(c => c.id === id);
          return {
            name: cat ? cat.name : 'Sem categoria',
            value
          };
        }).sort((a, b) => b.value - a.value);
        
        const result = catData.length > 0 ? catData : [{ name: 'Sem dados', value: 1 }];
        
        // Armazenar no cache
        calculationCache.categoryData.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        return result;
      };
      
      // Processar de forma otimizada
      const catData = processCategories();
      setCategoryData(catData);
    }
  }, [products, categories, category]);

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <PageWrapper>
        <ModernHeader
          title="Relatórios"
          subtitle="Visualize dados e estatísticas sobre o almoxarifado."
        />
        <PageLoading message="Carregando relatórios..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <ModernHeader
        title="Relatórios"
        subtitle="Visualize dados e estatísticas sobre o almoxarifado."
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Período</label>
            <ModernDateRangeFilter
              selectedRange={selectedDateRange}
              customDateRange={customDateRange}
              selectedDate={selectedDate}
              onRangeSelect={handleDateRangeSelect}
              onDateSelect={handleDateSelect}
              placeholder="Selecione o período"
              defaultMode="range"
              showModeToggle={true}
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Categoria</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </ModernFilters>

      <Tabs defaultValue="overview" className="mt-4">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
          <TabsTrigger value="category" className="text-xs">Categorias</TabsTrigger>
          <TabsTrigger value="usage" className="text-xs">Consumo</TabsTrigger>
          <TabsTrigger value="forecast" className="text-xs">Previsão</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-base">Movimentação de Estoque</CardTitle>
              <CardDescription className="text-xs">
                Acompanhe as entradas e saídas ao longo do tempo.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="h-[250px] sm:h-[350px] overflow-y-auto scrollbar-hide">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stockMovementData}
                    margin={{
                      top: 10,
                      right: 5,
                      left: -10,
                      bottom: 20,
                    }}
                  >
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.total} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={CHART_COLORS.total} stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.entrada} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={CHART_COLORS.entrada} stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.saida} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={CHART_COLORS.saida} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#525252" opacity={0.3} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#888888', fontSize: 10 }}
                      axisLine={{ stroke: '#525252', opacity: 0.3 }}
                    />
                    <YAxis
                      tick={{ fill: '#888888', fontSize: 10 }}
                      axisLine={{ stroke: '#525252', opacity: 0.3 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(17, 17, 17, 0.9)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [`${value} unidades`, '']}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconSize={8}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="entradas"
                      name="Entradas"
                      stroke={CHART_COLORS.entrada}
                      fillOpacity={1}
                      fill="url(#colorEntradas)"
                    />
                    <Area
                      type="monotone"
                      dataKey="saidas"
                      name="Saídas"
                      stroke={CHART_COLORS.saida}
                      fillOpacity={1}
                      fill="url(#colorSaidas)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <Card className="overflow-hidden border-0 shadow-sm">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs text-muted-foreground">Total de Produtos</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 pb-2">
                    <div className="text-lg font-bold">{products.reduce((acc, p) => acc + p.quantity, 0)}</div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden border-0 shadow-sm">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs text-muted-foreground">Crescimento</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 pb-2">
                    <div className={`text-lg font-bold ${totalEntradas > totalSaidas ? 'text-green-500' : 'text-red-500'}`}>
                      {totalEntradas > totalSaidas ?
                        `+${Math.round((totalEntradas - totalSaidas) / (totalSaidas || 1) * 100)}%` :
                        `${Math.round((totalEntradas - totalSaidas) / (totalSaidas || 1) * 100)}%`}
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden border-0 shadow-sm">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs text-muted-foreground">Taxa de Rotatividade</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 pb-2">
                    <div className="text-lg font-bold">
                      {Math.round(totalSaidas / (products.reduce((acc, p) => acc + p.quantity, 0) || 1) * 100)}%
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden border-0 shadow-sm">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs text-muted-foreground">Nível de Serviço</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 pb-2">
                    <div className="text-lg font-bold">
                      {Math.round(((products.length - products.filter(p => p.quantity <= p.min_quantity).length) / products.length) * 100)}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Distribution Tab */}
        <TabsContent value="category" className="space-y-4 mt-4">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="px-4 sm:px-6 py-4">
              <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Veja a distribuição de produtos por categoria.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="h-[250px] sm:h-[350px] overflow-y-auto scrollbar-hide">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => {
                        // Truncate long names to avoid layout issues
                        const displayName = name.length > 10 ? `${name.slice(0, 8)}...` : name;
                        return `${displayName}: ${(percent * 100).toFixed(0)}%`;
                      }}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(17, 17, 17, 0.9)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [`${value} produtos`, 'Quantidade']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="text-sm font-medium px-2">Detalhes por Categoria</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryData.map((cat, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div
                        className="h-1.5"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <CardContent className="pt-3 px-3 pb-3">
                        <div className="font-medium text-sm truncate">{cat.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {cat.value} produtos ({Math.round(cat.value / products.reduce((acc, p) => acc + p.quantity, 0) * 100)}%)
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Usage Tab */}
        <TabsContent value="usage" className="space-y-4 mt-4">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="px-4 sm:px-6 py-4">
              <CardTitle className="text-lg">Consumo de Produtos</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Visualize quais produtos são mais utilizados.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="h-[250px] sm:h-[350px] overflow-y-auto scrollbar-hide">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productUsageData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 70,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#525252" opacity={0.3} />
                    <XAxis
                      type="number"
                      tick={{ fill: '#888888', fontSize: 10 }}
                      axisLine={{ stroke: '#525252', opacity: 0.3 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: '#888888', fontSize: 10 }}
                      width={70}
                      // Truncate long names for better display
                      tickFormatter={(value) => value.length > 8 ? `${value.slice(0, 6)}...` : value}
                      axisLine={{ stroke: '#525252', opacity: 0.3 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(17, 17, 17, 0.9)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px',
                        fontSize: '12px'
                      }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      formatter={(value) => [`${value} unidades`, 'Quantidade']}
                      labelStyle={{ color: '#888888', fontSize: '11px' }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconSize={8}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                    <Bar
                      dataKey="quantidade"
                      fill="#8884d8"
                      name="Quantidade"
                      radius={[0, 4, 4, 0]}
                    >
                      {productUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <Card className="overflow-hidden">
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-xs text-muted-foreground">Produto Mais Utilizado</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-3">
                    <div className="text-sm sm:text-base font-bold line-clamp-1">
                      {productUsageData.length > 0 ? productUsageData[0].name : "Sem dados"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {productUsageData.length > 0 ? `${productUsageData[0].quantidade} unidades` : "0 unidades"}
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-xs text-muted-foreground">Total de Saídas no Período</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-3">
                    <div className="text-xl font-bold">{totalSaidas} unidades</div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-xs text-muted-foreground">Eficiência de Reposição</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-3">
                    <div className="text-xl font-bold">
                      {Math.round((totalEntradas / (totalSaidas || 1)) * 100)}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Previsão Tab - Aprimorada */}
        <TabsContent value="forecast" className="space-y-4 mt-4">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="px-4 sm:px-6 py-4">
              <CardTitle className="text-lg">Análise Preditiva de Estoque</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Previsões de consumo, estimativas de duração e recomendações de reposição.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {/* Seção de Indicadores Principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="overflow-hidden">
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-xs text-muted-foreground">Taxa de Consumo</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-3">
                    <div className="text-xl font-bold">
                      {Math.round(totalSaidas / (stockMovementData.length || 1))} un/mês
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <ArrowUp className="h-3 w-3 text-green-500" />
                      <span>5% vs mês anterior</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-xs text-muted-foreground">Previsão para Próximo Mês</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-3">
                    <div className="text-xl font-bold text-amber-500">
                      {Math.round(totalSaidas / (stockMovementData.length || 1) * 1.15)} un
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <ArrowUp className="h-3 w-3 text-amber-500" />
                      <span>15% de crescimento previsto</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-xs text-muted-foreground">Produtos Críticos</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-3">
                    <div className="text-xl font-bold text-red-500">
                      {products.filter(p => p.quantity <= p.min_quantity).length}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      {products.filter(p => p.quantity <= p.min_quantity).length > 0 ? (
                        <>
                          <ArrowUp className="h-3 w-3 text-red-500" />
                          <span>Necessidade imediata de reposição</span>
                        </>
                      ) : (
                        <>
                          <ArrowDown className="h-3 w-3 text-green-500" />
                          <span>Estoque em níveis adequados</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-xs text-muted-foreground">Produtos em Alerta</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-3">
                    <div className="text-xl font-bold text-amber-500">
                      {products.filter(p => p.quantity > p.min_quantity && p.quantity <= p.min_quantity * 1.3).length}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <span>Previsão de esgotamento: 30 dias</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos e Listas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Gráfico de Previsão */}
                <Card className="overflow-hidden h-[450px]">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium">Tendência e Previsão de Consumo</CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pb-4 h-[calc(100%-60px)]">
                    <div className="h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            ...stockMovementData,
                            // Adiciona pontos de previsão para os próximos 3 meses
                            ...Array.from({ length: 3 }, (_, i) => {
                              const lastMonth = stockMovementData[stockMovementData.length - 1]?.month || '';
                              const date = new Date();
                              date.setMonth(date.getMonth() + i + 1);
                              const monthStr = date.toLocaleString('pt-BR', { month: 'short' });
                              const avgSaidas = stockMovementData.reduce((acc, item) => acc + item.saidas, 0) /
                                (stockMovementData.length || 1);
                              // Adiciona um fator de crescimento para cada mês futuro
                              const growthFactor = 1 + (0.05 * (i + 1));
                              return {
                                month: monthStr,
                                saidas: 0,
                                entradas: 0,
                                total: 0,
                                previsao: Math.round(avgSaidas * growthFactor)
                              };
                            })
                          ]}
                          margin={{
                            top: 10,
                            right: 30,
                            left: 10,
                            bottom: 10,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.3} />
                          <XAxis
                            dataKey="month"
                            tick={{ fill: '#888888', fontSize: 10 }}
                          />
                          <YAxis
                            tick={{ fill: '#888888', fontSize: 10 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(17, 17, 17, 0.9)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px',
                              fontSize: '12px'
                            }}
                            formatter={(value) => [`${value} unidades`, '']}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Area
                            type="monotone"
                            dataKey="saidas"
                            stroke="#3b82f6"
                            fill="url(#colorSaidas)"
                            name="Consumo Histórico"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="previsao"
                            stroke="#f59e0b"
                            name="Previsão Futura"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de Necessidades de Reposição */}
                <Card className="overflow-hidden h-[450px]">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium">Prioridades de Reposição</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 h-[calc(100%-60px)] overflow-y-auto">
                    <div className="space-y-2">
                      {products
                        .filter(p => p.quantity <= p.min_quantity * 1.4) // Produtos que precisam de reposição
                        .sort((a, b) => (a.quantity / a.min_quantity) - (b.quantity / b.min_quantity))
                        // Removemos o limite de 5 itens para permitir rolagem
                        .map((product, index) => {
                          const percentagem = Math.round((product.quantity / product.min_quantity) * 100);
                          const isCritical = product.quantity <= product.min_quantity;

                          // Melhorando o cálculo de dias restantes
                          // Encontrar movimentos de saída deste produto
                          const productMovements = movements
                            .filter(m => m.product_id === product.id && m.type === 'saida')
                            .slice(-10); // Considerar apenas os últimos 10 movimentos

                          // Calcular consumo médio diário real deste produto específico
                          const consumoDiario = productMovements.length > 0
                            ? productMovements.reduce((acc, m) => acc + m.quantity, 0) / 30
                            : 0.1; // Valor padrão baixo se não houver histórico

                          // Calcular dias restantes com base no consumo real do produto
                          const diasRestantes = consumoDiario > 0
                            ? Math.round(product.quantity / consumoDiario)
                            : 90; // Se não há consumo, assumimos 90 dias

                          // Formatar o texto de dias restantes
                          const diasText = diasRestantes > 60
                            ? 'Longo prazo'
                            : `${diasRestantes} dias`;

                          // Função para formatar unidades corretamente
                          const formatarUnidade = (quantidade: number, unidade: string) => {
                            // Primeira letra maiúscula
                            let unidadeFormatada = unidade.charAt(0).toUpperCase() + unidade.slice(1);

                            // Pluralização para unidades comuns
                            if (quantidade !== 1) {
                              if (unidadeFormatada === 'Pacote') return 'Pacotes';
                              if (unidadeFormatada === 'Unidade') return 'Unidades';
                              if (unidadeFormatada === 'Caixa') return 'Caixas';
                              if (unidadeFormatada === 'Litro') return 'Litros';
                              if (unidadeFormatada === 'Kg') return 'Kgs';
                            }

                            return unidadeFormatada;
                          };

                          // Quantidade a repor
                          const quantidadeRepor = Math.max(Math.ceil(product.min_quantity * 2 - product.quantity), 0);

                          return (
                            <Card key={index} className={`overflow-hidden border ${isCritical ? 'border-red-900/40' : 'border-amber-900/40'}`}>
                              <CardContent className="p-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1">
                                  <div>
                                    <div className="font-medium text-sm line-clamp-1">{product.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {product.quantity} de {product.min_quantity} {formatarUnidade(product.quantity, product.unit)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`text-xs px-1.5 py-0.5 rounded ${isCritical
                                      ? 'bg-red-500/20 text-red-400'
                                      : 'bg-amber-500/20 text-amber-400'
                                      }`}>
                                      {isCritical ? 'Crítico' : 'Baixo'}
                                    </div>
                                    <div className={`text-xs px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400`}>
                                      {isCritical ? 'Repor agora' : diasText}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-muted-foreground">Nível atual:</span>
                                  <span className={`font-medium ${isCritical ? 'text-red-400' : 'text-amber-400'
                                    }`}>
                                    {percentagem}%
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-gray-800 rounded-full mt-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'
                                      }`}
                                    style={{ width: `${Math.min(percentagem, 100)}%` }}
                                  />
                                </div>
                                {quantidadeRepor > 0 && (
                                  <div className="w-full text-xs mt-2 text-muted-foreground">
                                    <span>Sugestão: Repor {quantidadeRepor} {formatarUnidade(quantidadeRepor, product.unit)}</span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      {products.filter(p => p.quantity <= p.min_quantity * 1.4).length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-6">
                          Não há produtos que precisem de reposição no momento.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Seção de Análises Adicionais */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Análise de Sazonalidade */}
                <Card className="overflow-hidden">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium">Análise de Sazonalidade</CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stockMovementData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 5,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.3} />
                          <XAxis
                            dataKey="month"
                            tick={{ fill: '#888888', fontSize: 10 }}
                          />
                          <YAxis
                            tick={{ fill: '#888888', fontSize: 10 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(17, 17, 17, 0.9)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px',
                              fontSize: '12px'
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Bar
                            dataKey="saidas"
                            name="Consumo"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="entradas"
                            name="Reposição"
                            fill="#22c55e"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 px-2">
                      <h4 className="text-xs font-medium mb-1">Insights de Sazonalidade:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li className="flex items-start gap-1">
                          <span>•</span>
                          <span>Maior consumo observado em {stockMovementData.sort((a, b) => b.saidas - a.saidas)[0]?.month}</span>
                        </li>
                        <li className="flex items-start gap-1">
                          <span>•</span>
                          <span>Período ideal para reposição: início de cada trimestre</span>
                        </li>
                        <li className="flex items-start gap-1">
                          <span>•</span>
                          <span>Previsão de aumento de demanda para o próximo mês: 15%</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Produtos com Risco de Obsolescência */}
                <Card className="overflow-hidden">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium">Gerenciamento de Risco de Estoque</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4">
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-xs font-medium mb-2">Produtos com Baixa Rotatividade:</h4>
                        <div className="space-y-2 max-h-[130px] overflow-y-auto pr-1">
                          {products
                            .filter(p => p.quantity > p.min_quantity * 2) // Produtos com estoque muito acima do mínimo
                            .sort((a, b) => (b.quantity / b.min_quantity) - (a.quantity / a.min_quantity))
                            .slice(0, 3)
                            .map((product, index) => {
                              const percentagem = Math.round((product.quantity / product.min_quantity) * 100);

                              return (
                                <div key={index} className="flex flex-col text-xs border-b border-gray-800 pb-1 mb-1">
                                  <div className="font-medium mb-1">{product.name}</div>
                                  <div className="flex justify-between">
                                    <span>Excesso: {formatQuantity(product.quantity - product.min_quantity, product.unit)} {product.unit}</span>
                                    <span className="text-blue-400 flex items-center gap-1" title="Porcentagem em relação ao estoque mínimo">
                                      <span className="bg-blue-950/50 px-1.5 py-0.5 rounded-md">{percentagem}%</span>
                                      <span className="text-[10px] text-muted-foreground">(do mínimo)</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-xs font-medium mb-2">Recomendações Automáticas:</h4>
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-start gap-1">
                            <span>1.</span>
                            <span>Criar ordem de reposição para {products.filter(p => p.quantity <= p.min_quantity).length} produtos críticos</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <span>2.</span>
                            <span>Monitorar {products.filter(p => p.quantity > p.min_quantity && p.quantity <= p.min_quantity * 1.3).length} produtos em alerta para possível reposição nos próximos 30 dias</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <span>3.</span>
                            <span>Reavaliar necessidade de {products.filter(p => p.quantity > p.min_quantity * 2).length} produtos com estoque excessivo</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        <CalendarRange className="h-3.5 w-3.5" />
        <span>Dados atualizados em {new Date().toLocaleDateString('pt-BR')}</span>
      </div>
    </PageWrapper>
  );
};

export default Reports;
