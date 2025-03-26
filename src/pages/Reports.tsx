
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
  const [monthlyValueData, setMonthlyValueData] = useState<any[]>([]);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
      setMonthlyValueData(monthlyData.map(m => ({
        name: m.month,
        value: m.total * 100 // Simplified value calculation
      })));

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Visualize dados e estatísticas sobre o almoxarifado.
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
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowDown className="mr-2 h-4 w-4 text-green-500" />
              <div className="text-2xl font-bold">{totalEntradas}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              No período selecionado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowUp className="mr-2 h-4 w-4 text-blue-500" />
              <div className="text-2xl font-bold">{totalSaidas}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              No período selecionado
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="stock">Movimentação de Estoque</TabsTrigger>
          <TabsTrigger value="category">Distribuição por Categoria</TabsTrigger>
          <TabsTrigger value="usage">Consumo de Produtos</TabsTrigger>
          <TabsTrigger value="value">Valor do Estoque</TabsTrigger>
        </TabsList>
        
        {/* Stock Movement Tab */}
        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimentação de Estoque</CardTitle>
              <CardDescription>
                Visualize as entradas, saídas e o nível total de estoque ao longo do período selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stockMovementData}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '0.5rem',
                        borderColor: 'rgba(0,0,0,0.1)',
                        fontSize: '0.875rem',
                      }} 
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stackId="1" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      name="Estoque Total"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="entradas" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      name="Entradas"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="saidas" 
                      stroke="#ffc658" 
                      fill="#ffc658" 
                      name="Saídas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm text-muted-foreground">Total de Produtos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{products.reduce((acc, p) => acc + p.quantity, 0)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm text-muted-foreground">Crescimento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">
                      {totalEntradas > totalSaidas ? 
                        `+${Math.round((totalEntradas - totalSaidas) / (totalSaidas || 1) * 100)}%` : 
                        `${Math.round((totalEntradas - totalSaidas) / (totalSaidas || 1) * 100)}%`}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm text-muted-foreground">Taxa de Rotatividade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(totalSaidas / (products.reduce((acc, p) => acc + p.quantity, 0) || 1) * 100)}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Category Distribution Tab */}
        <TabsContent value="category" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Categoria</CardTitle>
              <CardDescription>
                Veja a distribuição de produtos por categoria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={100}
                      outerRadius={140}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} produtos`, 'Quantidade']}
                      contentStyle={{ 
                        borderRadius: '0.5rem',
                        borderColor: 'rgba(0,0,0,0.1)',
                        fontSize: '0.875rem',
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {categoryData.slice(0, 4).map((category, index) => (
                  <Card key={category.name}>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm text-muted-foreground">{category.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <div className="text-xl font-bold">{category.value}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Product Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consumo de Produtos</CardTitle>
              <CardDescription>
                Visualize quais produtos são mais utilizados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productUsageData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 100,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.2} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip 
                      formatter={(value) => [`${value} unidades`, 'Quantidade']}
                      contentStyle={{ 
                        borderRadius: '0.5rem',
                        borderColor: 'rgba(0,0,0,0.1)',
                        fontSize: '0.875rem',
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="quantidade" fill="#8884d8" name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm text-muted-foreground">Produto Mais Utilizado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {productUsageData.length > 0 ? productUsageData[0].name : "Sem dados"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {productUsageData.length > 0 ? `${productUsageData[0].quantidade} unidades` : "0 unidades"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm text-muted-foreground">Total de Saídas no Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{totalSaidas} unidades</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Stock Value Tab */}
        <TabsContent value="value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Valor do Estoque</CardTitle>
              <CardDescription>
                Acompanhe a evolução do valor total do estoque.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyValueData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor do Estoque']}
                      contentStyle={{ 
                        borderRadius: '0.5rem',
                        borderColor: 'rgba(0,0,0,0.1)',
                        fontSize: '0.875rem',
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0088FE" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                      name="Valor do Estoque"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm text-muted-foreground">Valor Atual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      R$ {(products.reduce((acc, p) => acc + p.quantity, 0) * 100).toLocaleString('pt-BR')}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm text-muted-foreground">Crescimento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-green-500">
                      {totalEntradas > totalSaidas ? 
                        `+${Math.round((totalEntradas - totalSaidas) / (totalSaidas || 1) * 100)}%` : 
                        `${Math.round((totalEntradas - totalSaidas) / (totalSaidas || 1) * 100)}%`}
                    </div>
                    <div className="text-sm text-muted-foreground">No período selecionado</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm text-muted-foreground">Média por Produto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      R$ {products.length > 0 ? 
                        ((products.reduce((acc, p) => acc + p.quantity, 0) * 100) / products.length).toLocaleString('pt-BR', {maximumFractionDigits: 2}) : 
                        "0"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-center gap-1 pt-4 text-sm text-muted-foreground">
        <CalendarRange className="h-4 w-4" />
        <span>Dados atualizados em {new Date().toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  );
};

export default Reports;
