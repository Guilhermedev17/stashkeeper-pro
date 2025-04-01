import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseMovements } from '@/hooks/useSupabaseMovements';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  Package as PackageIcon, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  ArrowRight,
  Percent,
  PackageOpen,
  ArrowDown,
  ArrowUp,
  ArrowDownUp,
  Share2,
  BarChart2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend,
  LineChart,
  Line
} from 'recharts';

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category_id: string;
  category_name?: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  status?: 'active' | 'inactive';
}

export interface Movement {
  id: string;
  product_id: string;
  type: 'entrada' | 'saida';
  quantity: number;
  created_at: string;
}

const Dashboard = () => {
  const { products, loading: loadingProducts, fetchProducts } = useSupabaseProducts();
  const { movements, loading: loadingMovements, fetchMovements } = useSupabaseMovements();
  const { categories } = useSupabaseCategories();
  const { user } = useAuth();
  const [categoryCounts, setCategoryCounts] = useState<{[key: string]: number}>({});
  const [unitData, setUnitData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    // Conta produtos por categoria
    const counts: {[key: string]: number} = {};
    products.forEach(product => {
      if (product.category_id) {
        counts[product.category_id] = (counts[product.category_id] || 0) + 1;
      } else {
        counts['uncategorized'] = (counts['uncategorized'] || 0) + 1;
      }
    });
    setCategoryCounts(counts);
  }, [products]);

  // Produtos com estoque baixo
  const lowStockProducts = products
    .filter(product => {
      // Considera estoque baixo quando:
      // 1. Quantidade está abaixo do mínimo (crítico)
      // 2. Quantidade está até 30% acima do mínimo (baixo)
      return product.quantity <= product.min_quantity * 1.3;
    })
    .sort((a, b) => {
      // Calcula porcentagem do estoque em relação ao mínimo
      const aPercentage = a.quantity / a.min_quantity;
      const bPercentage = b.quantity / b.min_quantity;
      return aPercentage - bPercentage; // Ordena do mais crítico para o menos crítico
    });
  
  // Produtos críticos (abaixo do mínimo)
  const criticalProducts = products.filter(p => p.quantity <= p.min_quantity);
  
  // Produtos com estoque baixo (até 30% acima do mínimo)
  const lowProducts = products.filter(p => p.quantity > p.min_quantity && p.quantity <= p.min_quantity * 1.3);
  
  // Cria uma lista com produtos críticos e baixos para mostrar
  let displayProducts: typeof products = [];
  
  // Adiciona todos os produtos críticos
  if (criticalProducts.length > 0) {
    displayProducts = displayProducts.concat(criticalProducts);
  }
  
  // Se ainda não atingiu 5 produtos, adiciona alguns com estoque baixo
  if (displayProducts.length < 5 && lowProducts.length > 0) {
    const remainingCount = 5 - displayProducts.length;
    displayProducts = displayProducts.concat(lowProducts.slice(0, remainingCount));
  }
  
  // Ordenar por nível de criticidade (mais crítico primeiro)
  displayProducts.sort((a, b) => {
    const aPercentage = a.quantity / a.min_quantity;
    const bPercentage = b.quantity / b.min_quantity;
    return aPercentage - bPercentage;
  });
  
  // Dados para gráfico de movimentações por dia
  const movementsByDay = movements.reduce((acc: {[key: string]: {entradas: number, saidas: number}}, movement) => {
    const date = new Date(movement.created_at).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        entradas: 0,
        saidas: 0
      };
    }
    
    if (movement.type === 'entrada') {
      acc[date].entradas += 1;
          } else {
      acc[date].saidas += 1;
    }
    
    return acc;
  }, {});
  
  // Converte para o formato que o gráfico espera
  const chartData = Object.keys(movementsByDay).sort().slice(-7).map(date => {
    const formattedDate = new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return {
      name: formattedDate,
      entradas: movementsByDay[date].entradas,
      saidas: movementsByDay[date].saidas
        };
      });
  
  // Estatísticas gerais
  const totalProducts = products.length;
  const totalEntradas = movements.filter(m => m.type === 'entrada').reduce((acc, m) => acc + m.quantity, 0);
  const totalSaidas = movements.filter(m => m.type === 'saida').reduce((acc, m) => acc + m.quantity, 0);
  const criticalCount = products.filter(p => p.quantity <= p.min_quantity).length;
  const lowStockCount = products.filter(p => p.quantity <= p.min_quantity * 1.3).length;
  const totalCategories = categories.length;
  
  // Cálculo de movimentações recentes (últimos 7 dias)
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  
  const recentMovementsData = movements
    .filter(m => new Date(m.created_at) >= last7Days)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  
  // Encontra os detalhes dos produtos das movimentações recentes
  const recentMovementsWithProducts = recentMovementsData.map(movement => {
    const product = products.find(p => p.id === movement.product_id);
    return {
      ...movement,
      productName: product?.name || 'Produto não encontrado',
      productCode: product?.code || '',
      unit: product?.unit || ''
    };
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const userName = user?.user_metadata?.name || user?.email || 'Usuário';

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Visão geral e estatísticas do sistema de estoque.
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full sm:w-[400px]">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Analíticos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
                  Em {totalCategories} categorias diferentes
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
                  {lowStockCount > 0 ? `${criticalCount} em nível crítico` : 'Todos os produtos em níveis adequados'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Entradas Recentes</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">
                  {movements.filter(m => m.type === 'entrada' && new Date(m.created_at) >= last7Days).length}
                </div>
            <p className="text-xs text-muted-foreground">
                  Nos últimos 7 dias
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Saídas Recentes</CardTitle>
                <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">
                  {movements.filter(m => m.type === 'saida' && new Date(m.created_at) >= last7Days).length}
                </div>
            <p className="text-xs text-muted-foreground">
                  Nos últimos 7 dias
            </p>
          </CardContent>
        </Card>
      </div>

          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-7 mt-4 md:mt-6">
            <Card className="lg:col-span-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Movimentações Recentes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full h-[300px] sm:h-[340px]">
                  {/* Gráfico de movimentações recentes */}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="entradas" name="Entradas" fill="#22c55e" />
                      <Bar dataKey="saidas" name="Saídas" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Últimas Movimentações</CardTitle>
              </CardHeader>
              <CardContent>
                {recentMovementsWithProducts.length > 0 ? (
                  <div className="space-y-4">
                    {recentMovementsWithProducts.map((movement) => (
                      <div key={movement.id} className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          movement.type === 'entrada' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none flex items-center gap-1">
                            {movement.productName}
                            <Badge variant="outline" className="text-[10px] ml-1 py-0 px-2 h-4">
                              {movement.type === 'entrada' ? 'Entrada' : 'Saída'}
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {movement.quantity} {movement.unit} em {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-1">
                      <Button variant="ghost" size="sm" className="gap-1 w-full justify-center" onClick={() => window.location.href = '/movements'}>
                        <span>Ver todas movimentações</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    <p>Nenhuma movimentação recente encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-7 mt-4 md:mt-6">
            <Card className="lg:col-span-3 bg-black/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>Produtos com Estoque Baixo</span>
                    <Badge variant="destructive" className="bg-red-600 rounded-full" title="Total de produtos com estoque baixo">
                      {lowStockCount}
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Produtos que precisam de reposição (críticos ou com estoque baixo)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {displayProducts.length > 0 ? (
                  <div className="space-y-2.5">
                    {displayProducts.map((product) => {
                      const isCritical = product.quantity <= product.min_quantity;
                      const percentage = Math.round((product.quantity / product.min_quantity) * 100);
                      
                      // Função para pluralizar a unidade corretamente
                      const formatUnit = (quantity: number, unit: string) => {
                        // Unidades que precisam de pluralização
                        const pluralRules: Record<string, string> = {
                          'pacote': 'pacotes',
                          'rolo': 'rolos',
                          'caixa': 'caixas',
                          'peça': 'peças',
                          'unidade': 'unidades',
                          'garrafa': 'garrafas',
                          'litro': 'litros',
                          'metro': 'metros'
                        };
                        
                        // Algumas unidades não mudam no plural
                        const invariantUnits = ['kg', 'g', 'ml', 'L', 'm'];
                        
                        let result = unit;
                        
                        // Aplica pluralização se necessário
                        if (!invariantUnits.includes(unit)) {
                          result = quantity > 1 && pluralRules[unit] ? pluralRules[unit] : unit;
                        }
                        
                        // Capitaliza a primeira letra (exceto para unidades que são siglas)
                        if (!invariantUnits.includes(result)) {
                          result = result.charAt(0).toUpperCase() + result.slice(1);
                        }
                        
                        return result;
                      };
                      
                      return (
                        <div 
                          key={product.id} 
                          className={`flex items-start gap-3 p-3 rounded-md ${
                            isCritical 
                              ? 'bg-red-950/20 border border-red-900/30' 
                              : 'bg-amber-950/20 border border-amber-900/30'
                          }`}
                        >
                          <div className={`flex-shrink-0 ${isCritical ? 'text-red-500' : 'text-amber-500'}`}>
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-medium line-clamp-1">{product.code || ''}{product.code && product.name ? ' - ' : ''}{product.name}</p>
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] py-0.5 px-2 ${
                                  isCritical 
                                    ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                                    : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                                }`}
                              >
                                {isCritical ? 'Crítico' : 'Baixo'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                Estoque: <span className="text-white/90 font-medium">{product.quantity}</span> de {product.min_quantity} {formatUnit(product.min_quantity, product.unit)}
                              </p>
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] py-0 px-2 rounded-full ${
                                  isCritical 
                                    ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                                    : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                                }`}
                              >
                                {percentage}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1 w-full justify-center text-muted-foreground hover:text-primary hover:bg-transparent" 
                        onClick={() => window.location.href = '/products?status=baixo'}
                      >
                        <span>Ver todos produtos</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    <p>Nenhum produto com estoque baixo</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Produtos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-[300px] sm:h-[340px]">
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-primary/70" />
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{categoryCounts[category.id] || 0}</span>
                          <span className="text-xs text-muted-foreground">produtos</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t pt-3 mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                        <span className="text-sm">Sem categoria</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{categoryCounts['uncategorized'] || 0}</span>
                        <span className="text-xs text-muted-foreground">produtos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:gap-6 mt-4 md:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
          <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Distribuição de Produtos por Categoria</span>
                  </CardTitle>
            <CardDescription>
                    Visualização da distribuição percentual de produtos por categoria
            </CardDescription>
          </CardHeader>
                <CardContent>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                          data={categories.map(category => ({
                            name: category.name,
                            value: categoryCounts[category.id] || 0
                          })).concat([{
                            name: 'Sem categoria',
                            value: categoryCounts['uncategorized'] || 0
                          }])}
                          cx="50%"
                          cy="50%"
                          labelLine={{
                            stroke: '#888',
                            strokeWidth: 1
                          }}
                          outerRadius={110}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => {
                            // Limitar o comprimento do nome se for muito longo
                            const shortName = name.length > 10 ? name.substring(0, 10) + '...' : name;
                            return `${shortName}: ${(percent * 100).toFixed(0)}%`;
                          }}
                        >
                          {categories.map((category, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                          <Cell key="cell-uncategorized" fill="#718096" />
                </Pie>
                        <Tooltip formatter={(value) => [`${value} produtos`, 'Quantidade']} />
              </PieChart>
            </ResponsiveContainer>
                  </div>
          </CardContent>
        </Card>

              <Card>
          <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Tendência de Estoque</span>
                  </CardTitle>
            <CardDescription>
                    Análise da tendência de estoque nos últimos 7 dias
            </CardDescription>
          </CardHeader>
                <CardContent>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
                        <XAxis dataKey="name" stroke="#888888" />
                        <YAxis stroke="#888888" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} 
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="entradas" 
                          name="Entradas" 
                          stroke="#22c55e" 
                          activeDot={{ r: 8 }} 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="saidas" 
                          name="Saídas" 
                          stroke="#3b82f6" 
                          activeDot={{ r: 8 }} 
                          strokeWidth={2}
                        />
                      </LineChart>
            </ResponsiveContainer>
                  </div>
          </CardContent>
        </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
          <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Status de Estoque dos Produtos</span>
                  </CardTitle>
            <CardDescription>
                    Análise da distribuição de produtos por status de estoque
            </CardDescription>
          </CardHeader>
                <CardContent>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
              <BarChart
                        data={[
                          {
                            name: 'Status de Estoque',
                            crítico: criticalProducts.length,
                            baixo: lowProducts.length,
                            normal: products.length - lowStockCount
                          }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
                        <XAxis type="number" stroke="#888888" />
                        <YAxis dataKey="name" type="category" stroke="#888888" hide />
                <Tooltip
                          contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} 
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Bar dataKey="crítico" name="Crítico" fill="#ef4444" radius={[4, 4, 4, 4]} />
                        <Bar dataKey="baixo" name="Baixo" fill="#f59e0b" radius={[4, 4, 4, 4]} />
                        <Bar dataKey="normal" name="Normal" fill="#22c55e" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
                  </div>
          </CardContent>
        </Card>

              <Card>
          <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Produtos Mais Movimentados</span>
                  </CardTitle>
            <CardDescription>
                    Top 5 produtos com maior número de movimentações
            </CardDescription>
          </CardHeader>
                <CardContent>
                  {/* Calcular produtos mais movimentados */}
                  {(() => {
                    // Agrupar movimentações por produto
                    const movementsByProduct: Record<string, { productId: string, count: number, name: string }> = {};
                    
                    movements.forEach(movement => {
                      if (!movementsByProduct[movement.product_id]) {
                        const product = products.find(p => p.id === movement.product_id);
                        movementsByProduct[movement.product_id] = {
                          productId: movement.product_id,
                          count: 0,
                          name: product ? product.name : 'Produto não encontrado'
                        };
                      }
                      movementsByProduct[movement.product_id].count++;
                    });
                    
                    // Converter para array e ordenar
                    const topProducts = Object.values(movementsByProduct)
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 5);
                    
                    return (
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
              <BarChart
                            data={topProducts.map(product => ({
                              name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
                              movimentações: product.count
                            }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
                            <XAxis 
                              dataKey="name" 
                              stroke="#888888" 
                              angle={-45} 
                              textAnchor="end" 
                              height={80} 
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis stroke="#888888" />
                <Tooltip
                              contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} 
                              itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="movimentações" name="Movimentações" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
                      </div>
                    );
                  })()}
          </CardContent>
        </Card>
      </div>

            <Card>
          <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Métricas de Desempenho do Estoque</span>
                </CardTitle>
            <CardDescription>
                  Indicadores-chave de desempenho do seu sistema de estoque
            </CardDescription>
          </CardHeader>
          <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Taxa de Giro de Estoque */}
                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Taxa de Giro de Estoque</h3>
                      <div className="p-2 rounded-full bg-indigo-500/20">
                        <ArrowDownUp className="h-4 w-4 text-indigo-400" />
                      </div>
                    </div>
                    <div className="flex items-end space-x-1">
                      <span className="text-2xl font-bold">
                        {products.length > 0 
                          ? (totalSaidas / products.reduce((acc, p) => acc + p.quantity, 0)).toFixed(2) 
                          : '0.00'}
                      </span>
                      <span className="text-xs text-muted-foreground mb-1">vezes/período</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Razão entre saídas totais e estoque médio
                    </p>
                  </div>
                  
                  {/* Nível de Serviço */}
                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Nível de Serviço</h3>
                      <div className="p-2 rounded-full bg-green-500/20">
                        <Share2 className="h-4 w-4 text-green-400" />
                  </div>
                </div>
                    <div className="flex items-end space-x-1">
                      <span className="text-2xl font-bold">
                        {(((products.length - criticalProducts.length) / products.length) * 100).toFixed(0)}%
                      </span>
            </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Percentual de produtos em níveis adequados de estoque
                    </p>
                  </div>
                  
                  {/* Eficiência de Estoque */}
                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Eficiência de Estoque</h3>
                      <div className="p-2 rounded-full bg-amber-500/20">
                        <BarChart2 className="h-4 w-4 text-amber-400" />
                      </div>
                    </div>
                    <div className="flex items-end space-x-1">
                      <span className="text-2xl font-bold">
                        {(totalSaidas / (totalEntradas || 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Proporção entre saídas e entradas no período
                    </p>
                  </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
