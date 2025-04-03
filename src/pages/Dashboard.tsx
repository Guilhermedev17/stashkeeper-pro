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
    <div className="zoom-stable w-full h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Visão geral e ações necessárias para o estoque.
          </p>
        </div>
      </div>

      <div className="space-y-6 w-full">
        {/* Cards de ações imediatas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
          <Card className="hover:shadow-lg transition-all duration-300 border-destructive/10 hover:bg-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Ações Necessárias</CardTitle>
              <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
                Produtos precisando de reposição
            </p>
          </CardContent>
        </Card>
        
          <Card className="hover:shadow-lg transition-all duration-300 border-blue-500/10 hover:bg-blue-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Taxa de Saída</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <ArrowUp className="h-4 w-4 text-blue-500" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold">
                {movements.filter(m => m.type === 'saida' && new Date(m.created_at) >= last7Days).length}
              </div>
            <p className="text-xs text-muted-foreground">
                Saídas nos últimos 7 dias
            </p>
          </CardContent>
        </Card>
        
          <Card className="hover:shadow-lg transition-all duration-300 border-green-500/10 hover:bg-green-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Taxa de Entradas</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <ArrowDown className="h-4 w-4 text-green-500" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold">
                {movements.filter(m => m.type === 'entrada' && new Date(m.created_at) >= last7Days).length}
              </div>
            <p className="text-xs text-muted-foreground">
                Entradas nos últimos 7 dias
            </p>
          </CardContent>
        </Card>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full">
          <Card className="h-full border-destructive/10 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span>Estoque Crítico - Ação Imediata</span>
                </div>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Produtos abaixo do nível mínimo que necessitam reposição urgente
            </CardDescription>
          </CardHeader>
            <CardContent>
              {criticalProducts.length > 0 ? (
                <div className="space-y-2.5">
                  {criticalProducts.slice(0, 5).map((product) => {
                    const percentage = Math.round((product.quantity / product.min_quantity) * 100);
                    
                    return (
                      <div 
                        key={product.id} 
                        className="flex items-start gap-3 p-3 rounded-md transform hover:scale-[1.01] hover:shadow-md transition-all duration-200 bg-destructive/5 border border-destructive/20"
                      >
                        <div className="flex-shrink-0 text-destructive">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium line-clamp-1">{product.code || ''}{product.code && product.name ? ' - ' : ''}{product.name}</p>
                            <Badge 
                              variant="outline" 
                              className="text-[10px] py-0.5 px-2 bg-destructive/10 text-destructive border-destructive/30"
                            >
                              Crítico
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              <span className="text-destructive font-medium">{product.quantity}</span> / {product.min_quantity} {product.unit}
                            </p>
                            <Badge 
                              variant="outline" 
                              className="text-[10px] py-0 px-2 rounded-full bg-destructive/10 text-destructive border-destructive/30"
                            >
                              {percentage}%
                            </Badge>
                          </div>
                          
                          <div className="mt-2 pt-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1 mt-2 border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive" 
                              onClick={() => window.location.href = `/movements?product=${product.id}&type=entrada`}
                            >
                              <span>Registrar Entrada</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {criticalProducts.length > 5 && (
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1 w-full justify-center border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive" 
                        onClick={() => window.location.href = '/products?status=critico'}
                      >
                        <span>Ver todos produtos críticos ({criticalProducts.length})</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="bg-green-500/10 rounded-full p-3 mb-3">
                    <PackageOpen className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="text-sm font-medium">Nenhum produto com estoque crítico</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Todos os produtos estão com estoque acima do nível mínimo
                  </p>
                </div>
              )}
          </CardContent>
        </Card>

          <Card className="h-full border-amber-500/10 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownUp className="h-4 w-4 text-blue-500" />
                  <span>Movimentações Recentes</span>
                </div>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Últimas movimentações de estoque realizadas no sistema
            </CardDescription>
          </CardHeader>
            <CardContent>
              {recentMovementsWithProducts.length > 0 ? (
                <div className="space-y-3">
                  {recentMovementsWithProducts.map((movement) => (
                    <div key={movement.id} className="flex items-center p-2 rounded-md hover:bg-accent/50 transition-colors">
                      <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                        movement.type === 'entrada' ? 'bg-green-500/10' : 'bg-blue-500/10'
                      }`}>
                        {movement.type === 'entrada' ? 
                          <ArrowDown className="h-3.5 w-3.5 text-green-500" /> : 
                          <ArrowUp className="h-3.5 w-3.5 text-blue-500" />
                        }
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none flex items-center gap-1">
                          {movement.productName}
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ml-1 py-0 px-2 h-4 ${
                              movement.type === 'entrada' ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                            }`}
                          >
                            {movement.type === 'entrada' ? 'Entrada' : 'Saída'}
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {movement.quantity} {movement.unit} em {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 w-[48%] justify-center border-blue-500/20 text-blue-600 hover:bg-blue-500/5 hover:text-blue-700" 
                      onClick={() => window.location.href = '/movements?type=saida&open=true'}
                    >
                      <span>Registrar Saída</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 w-[48%] justify-center border-green-500/20 text-green-600 hover:bg-green-500/5 hover:text-green-700" 
                      onClick={() => window.location.href = '/movements?type=entrada&open=true'}
                    >
                      <span>Registrar Entrada</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="bg-blue-500/10 rounded-full p-3 mb-3">
                    <ArrowDownUp className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium">Nenhuma movimentação recente</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registre entradas e saídas para visualizar aqui
                  </p>
                  <div className="flex justify-between pt-4 w-full max-w-xs">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-[48%]"
                      onClick={() => window.location.href = '/movements?type=saida&open=true'}
                    >
                      Registrar Saída
                    </Button>
                    <Button 
                      size="sm" 
                      className="w-[48%]"
                      onClick={() => window.location.href = '/movements?type=entrada&open=true'}
                    >
                      Registrar Entrada
                    </Button>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 w-full">
          <Card className="h-full border-primary/10 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackageIcon className="h-4 w-4 text-primary" />
                  <span>Ações Recomendadas</span>
                </div>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Ações sugeridas com base na situação atual do estoque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {criticalProducts.length > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-md bg-destructive/5 border border-destructive/20">
                    <div className="flex-shrink-0 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium">Repor produtos em nível crítico</p>
                      <p className="text-xs text-muted-foreground">
                        Existem {criticalProducts.length} produtos abaixo do estoque mínimo
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1 mt-2 border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive" 
                        onClick={() => window.location.href = '/products?status=critico'}
                      >
                        <span>Ver produtos críticos</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {lowProducts.length > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-md bg-amber-500/5 border border-amber-500/20">
                    <div className="flex-shrink-0 text-amber-500">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium">Planejar reposição de produtos com estoque baixo</p>
                      <p className="text-xs text-muted-foreground">
                        {lowProducts.length} produtos estão com estoque abaixo do ideal
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1 mt-2 border-amber-500/20 text-amber-600 hover:bg-amber-500/5 hover:text-amber-700" 
                        onClick={() => window.location.href = '/products?status=baixo'}
                      >
                        <span>Ver produtos com estoque baixo</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {movements.length === 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-md bg-blue-500/5 border border-blue-500/20">
                    <div className="flex-shrink-0 text-blue-500">
                      <ArrowDownUp className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium">Registrar movimentações de estoque</p>
                      <p className="text-xs text-muted-foreground">
                        Nenhuma movimentação encontrada - registre entradas e saídas
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1 mt-2 border-blue-500/20 text-blue-600 hover:bg-blue-500/5 hover:text-blue-700" 
                        onClick={() => window.location.href = '/movements'}
                      >
                        <span>Ir para movimentações</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                </div>
            </div>
                )}
                
                {products.length === 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-md bg-primary/5 border border-primary/20">
                    <div className="flex-shrink-0 text-primary">
                      <PackageIcon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium">Cadastrar produtos no sistema</p>
                      <p className="text-xs text-muted-foreground">
                        Nenhum produto encontrado - comece cadastrando seus itens
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1 mt-2 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary" 
                        onClick={() => window.location.href = '/products'}
                      >
                        <span>Cadastrar produtos</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {categories.length === 0 && products.length > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-md bg-purple-500/5 border border-purple-500/20">
                    <div className="flex-shrink-0 text-purple-500">
                      <Percent className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium">Organizar produtos em categorias</p>
                      <p className="text-xs text-muted-foreground">
                        Crie categorias para melhor organização do estoque
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1 mt-2 border-purple-500/20 text-purple-600 hover:bg-purple-500/5 hover:text-purple-700" 
                        onClick={() => window.location.href = '/settings'}
                      >
                        <span>Ir para configurações</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {criticalProducts.length === 0 && lowProducts.length === 0 && products.length > 0 && movements.length > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-md bg-green-500/5 border border-green-500/20">
                    <div className="flex-shrink-0 text-green-500">
                      <RefreshCw className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium">Estoque em níveis saudáveis</p>
                      <p className="text-xs text-muted-foreground">
                        Todos os produtos estão com níveis adequados de estoque
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1 mt-2 border-green-500/20 text-green-600 hover:bg-green-500/5 hover:text-green-700" 
                        onClick={() => window.location.href = '/reports'}
                      >
                        <span>Ver relatórios detalhados</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                  </div>
                </div>
                )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
