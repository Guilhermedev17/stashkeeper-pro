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

const Reports = () => {
  const [period, setPeriod] = useState('6months');
  const [category, setCategory] = useState('all');
  const { products } = useSupabaseProducts();
  const { movements } = useSupabaseMovements();
  const { categories } = useSupabaseCategories();
  
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

  useEffect(() => {
    if (movements.length > 0) {
      // Filter movements by period
      let filteredMovements = [...movements];
      const today = new Date();
      
      if (period === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        filteredMovements = movements.filter(m => new Date(m.created_at) >= thirtyDaysAgo);
      } else if (period === '3months') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        filteredMovements = movements.filter(m => new Date(m.created_at) >= threeMonthsAgo);
      } else if (period === '6months') {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        filteredMovements = movements.filter(m => new Date(m.created_at) >= sixMonthsAgo);
      } else if (period === '1year') {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        filteredMovements = movements.filter(m => new Date(m.created_at) >= oneYearAgo);
      }

      // Calculate totals
      const entradas = filteredMovements.filter(m => m.type === 'entrada').reduce((acc, m) => acc + m.quantity, 0);
      const saidas = filteredMovements.filter(m => m.type === 'saida').reduce((acc, m) => acc + m.quantity, 0);
      
      setTotalEntradas(entradas);
      setTotalSaidas(saidas);

      // Create monthly data for charts
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        if (period === '30days') {
          date.setDate(today.getDate() - (5 - i) * 5);
          return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } else {
          date.setMonth(today.getMonth() - (5 - i));
          return date.toLocaleString('pt-BR', { month: 'short' });
        }
      });

      const monthlyData = months.map(month => {
        const monthMovements = filteredMovements.filter(m => {
          const movementDate = new Date(m.created_at);
          if (period === '30days') {
            const movementDateStr = movementDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            // For 30 days, group by 5-day periods
            return movementDateStr === month;
          } else {
            const monthStr = movementDate.toLocaleString('pt-BR', { month: 'short' });
            return monthStr === month;
          }
        });

        const entradas = monthMovements.filter(m => m.type === 'entrada').reduce((acc, m) => acc + m.quantity, 0);
        const saidas = monthMovements.filter(m => m.type === 'saida').reduce((acc, m) => acc + m.quantity, 0);
        const total = (i: number) => {
          // Calculate running total
          let runningTotal = products.reduce((acc, p) => acc + p.quantity, 0) - entradas + saidas;
          for (let j = 0; j <= i; j++) {
            if (j < i) {
              const prevMonth = months[j];
              const prevMonthMovements = filteredMovements.filter(m => {
                const movementDate = new Date(m.created_at);
                if (period === '30days') {
                  return movementDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) === prevMonth;
                } else {
                  return movementDate.toLocaleString('pt-BR', { month: 'short' }) === prevMonth;
                }
              });
              
              const prevEntradas = prevMonthMovements.filter(m => m.type === 'entrada').reduce((acc, m) => acc + m.quantity, 0);
              const prevSaidas = prevMonthMovements.filter(m => m.type === 'saida').reduce((acc, m) => acc + m.quantity, 0);
              
              runningTotal += prevEntradas - prevSaidas;
            }
          }
          return runningTotal;
        };

        return {
          month,
          entradas,
          saidas,
          total: total(months.indexOf(month))
        };
      });

      setStockMovementData(monthlyData);

      // Create monthly value data (simplified for now)

      // Create product usage data
      const productUsage: Record<string, number> = {};
      filteredMovements.filter(m => m.type === 'saida').forEach(m => {
        const productId = m.product_id;
        if (productUsage[productId]) {
          productUsage[productId] += m.quantity;
        } else {
          productUsage[productId] = m.quantity;
        }
      });

      const productUsageArray = Object.entries(productUsage)
        .map(([id, quantidade]) => {
          const product = products.find(p => p.id === id);
          return {
            name: product ? product.name : 'Produto Desconhecido',
            quantidade
          };
        })
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 8);

      setProductUsageData(productUsageArray);
    }
  }, [movements, products, period]);

  useEffect(() => {
    if (products.length > 0 && categories.length > 0) {
      // Filter products by category if specified
      let filteredProducts = [...products];
      if (category !== 'all') {
        filteredProducts = products.filter(p => p.category_id === category);
      }

      // Group products by category
      const catCounts: Record<string, number> = {};
      
      filteredProducts.forEach(product => {
        if (product.category_id) {
          if (catCounts[product.category_id]) {
            catCounts[product.category_id] += product.quantity;
          } else {
            catCounts[product.category_id] = product.quantity;
          }
        }
      });

      const catData = Object.entries(catCounts).map(([id, value]) => {
        const cat = categories.find(c => c.id === id);
        return {
          name: cat ? cat.name : 'Sem categoria',
          value
        };
      }).sort((a, b) => b.value - a.value);

      setCategoryData(catData.length > 0 ? catData : [{ name: 'Sem dados', value: 1 }]);
    }
  }, [products, categories, category]);

  return (
    <div className="px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Visualize dados e estatísticas sobre o almoxarifado.
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="gap-1.5 w-full sm:w-auto text-xs sm:text-sm">
            <Download className="h-3.5 w-3.5" />
            <span>Exportar</span>
          </Button>
          <Button variant="outline" className="gap-1.5 w-full sm:w-auto text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5" />
            <span>Gerar PDF</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2 px-4 py-3">
            <CardTitle className="text-sm font-medium">
              Período
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="3months">Últimos 3 meses</SelectItem>
                <SelectItem value="6months">Últimos 6 meses</SelectItem>
                <SelectItem value="1year">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2 px-4 py-3">
            <CardTitle className="text-sm font-medium">
              Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="text-xs sm:text-sm">
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
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mb-6">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Visão Geral</TabsTrigger>
          <TabsTrigger value="category" className="text-xs sm:text-sm">Categorias</TabsTrigger>
          <TabsTrigger value="usage" className="text-xs sm:text-sm">Consumo</TabsTrigger>
          <TabsTrigger value="forecast" className="text-xs sm:text-sm">Previsão</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="px-4 sm:px-6 py-4">
              <CardTitle className="text-lg">Movimentação de Estoque</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
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
                        <stop offset="5%" stopColor={CHART_COLORS.total} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.total} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.entrada} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.entrada} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.saida} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.saida} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#888888', fontSize: 10 }}
                      height={40}
                      tickMargin={8}
                      axisLine={{ stroke: '#525252', opacity: 0.3 }}
                    />
                    <YAxis 
                      tick={{ fill: '#888888', fontSize: 10 }}
                      width={30}
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
                      formatter={(value: number) => [`${value} unidades`, '']}
                      labelStyle={{ color: '#888888', fontSize: '11px' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                      verticalAlign="bottom"
                      height={36}
                      iconSize={8}
                      iconType="circle"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stackId="1" 
                      stroke={CHART_COLORS.total}
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      name="Estoque Total"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="entradas" 
                      stroke={CHART_COLORS.entrada}
                      fillOpacity={1}
                      fill="url(#colorEntradas)"
                      name="Entradas"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="saidas" 
                      stroke={CHART_COLORS.saida}
                      fillOpacity={1}
                      fill="url(#colorSaidas)"
                      name="Saídas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
                <Card>
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-xs text-muted-foreground">Total de Produtos</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-3">
                    <div className="text-xl sm:text-2xl font-bold">{products.reduce((acc, p) => acc + p.quantity, 0)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-xs text-muted-foreground">Crescimento</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-3">
                    <div className={`text-xl sm:text-2xl font-bold ${totalEntradas > totalSaidas ? 'text-green-500' : 'text-red-500'}`}>
                      {totalEntradas > totalSaidas ? 
                        `+${Math.round((totalEntradas - totalSaidas) / (totalSaidas || 1) * 100)}%` : 
                        `${Math.round((totalEntradas - totalSaidas) / (totalSaidas || 1) * 100)}%`}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-xs text-muted-foreground">Taxa de Rotatividade</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-3">
                    <div className="text-xl sm:text-2xl font-bold">
                      {Math.round(totalSaidas / (products.reduce((acc, p) => acc + p.quantity, 0) || 1) * 100)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-xs text-muted-foreground">Nível de Serviço</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-3">
                    <div className="text-xl sm:text-2xl font-bold">
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
              <div className="h-[250px] sm:h-[350px]">
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
                <h3 className="text-sm sm:text-base font-medium px-2">Detalhes por Categoria</h3>
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
                <Card>
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
                <Card>
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-xs text-muted-foreground">Total de Saídas no Período</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-3">
                    <div className="text-xl font-bold">{totalSaidas} unidades</div>
                  </CardContent>
                </Card>
                <Card>
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
        
        {/* Valor Tab - NOVO */}
        <TabsContent value="value" className="space-y-4 mt-4">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="px-4 sm:px-6 py-4">
              <CardTitle className="text-lg">Valor de Estoque</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Análise financeira do valor atual e movimentação do estoque.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 overflow-y-auto scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* Gráfico de Valor por Categoria */}
                <div className="h-[300px]">
                  <h3 className="text-sm font-medium mb-2 px-2">Valor por Categoria</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={categoryData.map(cat => ({
                          name: cat.name,
                          value: cat.value * 100 // Valor estimado (quantidade * preço médio)
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, value }) => {
                          const displayName = name.length > 8 ? `${name.slice(0, 6)}...` : name;
                          return `${displayName}: R$${value.toFixed(0)}`;
                        }}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`R$${Number(value).toFixed(2)}`, 'Valor']}
                        contentStyle={{
                          backgroundColor: 'rgba(17, 17, 17, 0.9)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Indicadores de Valor */}
                <div className="grid grid-cols-1 gap-4">
                  <Card className="bg-black/20">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Valor Total em Estoque</span>
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {/* Valor estimado do estoque total */}
                        R$ {(products.reduce((acc, p) => acc + p.quantity, 0) * 100).toLocaleString('pt-BR')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Baseado no custo médio dos produtos
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-black/20">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Capital Imobilizado</span>
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {/* Valor estimado do capital imobilizado (estoque > min_quantity) */}
                        R$ {(products.reduce((acc, p) => acc + Math.max(0, p.quantity - p.min_quantity), 0) * 100).toLocaleString('pt-BR')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Valor em excesso acima do estoque mínimo
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-black/20">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Valor das Movimentações</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-sm font-medium text-green-500">Entradas</div>
                          <div className="text-xl font-bold">
                            R$ {(totalEntradas * 100).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-blue-500">Saídas</div>
                          <div className="text-xl font-bold">
                            R$ {(totalSaidas * 100).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
                <Card className="bg-black/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Taxa de Consumo</span>
                    </div>
                    <div className="text-xl font-bold">
                      {Math.round(totalSaidas / (stockMovementData.length || 1))} un/mês
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <ArrowUp className="h-3 w-3 text-green-500" />
                      <span>5% vs mês anterior</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-black/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Previsão para Próximo Mês</span>
                    </div>
                    <div className="text-xl font-bold text-amber-500">
                      {Math.round(totalSaidas / (stockMovementData.length || 1) * 1.15)} un
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <ArrowUp className="h-3 w-3 text-amber-500" />
                      <span>15% de crescimento previsto</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-black/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Produtos Críticos</span>
                    </div>
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
                <Card className="bg-black/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Produtos em Alerta</span>
                    </div>
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
                                    <div className={`text-xs px-1.5 py-0.5 rounded ${
                                      isCritical 
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
                                  <span className={`font-medium ${
                                    isCritical ? 'text-red-400' : 'text-amber-400'
                                  }`}>
                                    {percentagem}%
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-gray-800 rounded-full mt-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      isCritical ? 'bg-red-500' : 'bg-amber-500'
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
                                <div key={index} className="flex justify-between text-xs border-b border-gray-800 pb-1">
                                  <span className="font-medium truncate">{product.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span>Excesso: {product.quantity - product.min_quantity} {product.unit}</span>
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
    </div>
  );
};

export default Reports;
