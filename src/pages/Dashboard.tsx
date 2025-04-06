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
  BarChart2,
  AlertCircle,
  Plus,
  Flame,
  ChevronRight,
  Layers,
  Zap,
  HelpCircle,
  Calendar,
  BarChart4,
  CircleDollarSign,
  Mail,
  RefreshCcw,
  CheckSquare2
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
  Line,
  AreaChart,
  Area
} from 'recharts';
import PageWrapper from '@/components/layout/PageWrapper';
import PageLoading from '@/components/PageLoading';
import { formatQuantity } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({});
  const [unitData, setUnitData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    // Conta produtos por categoria
    const counts: { [key: string]: number } = {};
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
  const movementsByDay = movements.reduce((acc: { [key: string]: { entradas: number, saidas: number } }, movement) => {
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

  // Dados para gráfico de movimentações ao longo do tempo
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const movementsByDayLong = last30Days.map(day => {
    const dayData = {
      date: day,
      entradas: 0,
      saidas: 0
    };

    movements.forEach(movement => {
      const moveDate = new Date(movement.created_at).toISOString().split('T')[0];
      if (moveDate === day) {
        if (movement.type === 'entrada') {
          dayData.entradas += movement.quantity;
        } else {
          dayData.saidas += movement.quantity;
        }
      }
    });

    return dayData;
  });

  const chartDataLong = movementsByDayLong.map(day => ({
    name: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    Entradas: day.entradas,
    Saídas: day.saidas
  }));

  // Análise dos dados de estoque
  const stockSummary = {
    healthy: products.filter(p => p.quantity > p.min_quantity * 1.3).length,
    low: lowProducts.length,
    critical: criticalProducts.length
  };

  const stockData = [
    { name: 'Saudável', value: stockSummary.healthy, color: '#10b981' },
    { name: 'Baixo', value: stockSummary.low, color: '#f59e0b' },
    { name: 'Crítico', value: stockSummary.critical, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Dados de distribuição por categoria
  const categoryDistributionData = categories
    .map(category => {
      const count = products.filter(p => p.category_id === category.id).length;
      return {
        name: category.name,
        value: count,
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
      };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Limitar a 6 categorias para melhor visualização

  // Dados a serem exibidos no gráfico com base na aba ativa
  const chartDisplayData = activeTab === 'categories' ? categoryDistributionData : stockData;

  // Recupera o nome do usuário para exibição personalizada
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';

  // Dia da semana e data atual para exibição
  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calcula quantidade de entradas e saídas nos últimos 7 dias
  const entriesLastWeek = movements
    .filter(m => m.type === 'entrada' && new Date(m.created_at) >= last7Days)
    .reduce((sum, m) => sum + m.quantity, 0);

  const exitsLastWeek = movements
    .filter(m => m.type === 'saida' && new Date(m.created_at) >= last7Days)
    .reduce((sum, m) => sum + m.quantity, 0);

  // Simular carregamento de dados ao entrar na página
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Iniciar o tempo para medir quanto leva para carregar os dados
      const startTime = performance.now();

      // Operações de carregamento (já existentes na página)
      // Aqui dependemos dos estados do useEffect, mas não precisamos alterá-los

      // Quando todas as operações de carregamento terminarem, verificamos o tempo
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Garantir tempo mínimo de carregamento para evitar flash 
      // Se os dados carregarem muito rápido, mostramos o loading por pelo menos 350ms
      // Se os dados demorarem mais que isso, não adicionamos atraso adicional
      const minLoadingTime = 350;
      const remainingTime = Math.max(0, minLoadingTime - loadTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Renderizar state de loading
  if (isLoading) {
    return (
      <PageWrapper>
        <div className="px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex mb-3 sm:mb-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-0.5">Dashboard</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Bem-vindo ao seu painel de controle de estoque</p>
            </div>
          </div>
          <PageLoading message="Carregando seu dashboard..." />
        </div>
      </PageWrapper>
    );
  }

  // Renderização normal quando não está em carregamento
  return (
    <PageWrapper className="flex flex-col p-0">
      {/* Área de conteúdo rolável - ajustando espaçamentos laterais */}
      <div className="flex-1 w-full overflow-auto">
        <div className="w-full px-2 sm:px-4 py-3 sm:py-4">
          {/* Cabeçalho da página */}
          <div className="mb-3 sm:mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-0.5">Olá, {userName}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Bem-vindo ao seu painel de controle de estoque</p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => window.location.href = '/movements?type=entrada&open=true'}
                className="flex items-center px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/60 transition-colors"
              >
                <Plus size={14} className="mr-1" />
                <span>Entrada</span>
              </button>
              <button
                onClick={() => window.location.href = '/movements?type=saida&open=true'}
                className="flex items-center px-2 py-1 text-xs bg-orange-50 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 rounded-md hover:bg-orange-100 dark:hover:bg-orange-800/60 transition-colors"
              >
                <ArrowRight size={14} className="mr-1" />
                <span>Saída</span>
              </button>
              <span className="text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 py-0.5 px-1.5 rounded">
                Pro
              </span>
            </div>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-3 sm:mb-4">
            <div className="bg-white dark:bg-card p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-900">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Total de Produtos</p>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{totalProducts}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Em {totalCategories} categorias</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 h-8 w-8 rounded-full flex items-center justify-center">
                  <PackageIcon size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-card p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-900">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Ações Necessárias</p>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{criticalCount}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{lowStockCount} produtos com estoque baixo</p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/30 h-8 w-8 rounded-full flex items-center justify-center">
                  <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-card p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-900">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Entradas (7 dias)</p>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{entriesLastWeek}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {movements.filter(m => m.type === 'entrada' && new Date(m.created_at) >= last7Days).length} movimentações
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 h-8 w-8 rounded-full flex items-center justify-center">
                  <ArrowDown size={16} className="text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-card p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-900">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Saídas (7 dias)</p>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{exitsLastWeek}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {movements.filter(m => m.type === 'saida' && new Date(m.created_at) >= last7Days).length} movimentações
                  </p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/30 h-8 w-8 rounded-full flex items-center justify-center">
                  <ArrowUp size={16} className="text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Layout principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
            {/* Coluna da esquerda */}
            <div className="lg:col-span-2 space-y-2 sm:space-y-3">
              {/* Gráfico de movimentações */}
              <div className="bg-white dark:bg-card p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-900">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Fluxo de Estoque</h3>
                  <div className="flex space-x-2 text-xs">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                      <span className="dark:text-gray-300 text-xs">Entradas</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mr-1"></div>
                      <span className="dark:text-gray-300 text-xs">Saídas</span>
                    </div>
                  </div>
                </div>

                <div className="h-60 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartDataLong}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                        className="dark:stroke-gray-800"
                      />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        className="dark:text-gray-400"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        className="dark:text-gray-400"
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--background)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          fontSize: '0.75rem'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Entradas"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorEntradas)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Saídas"
                        stroke="#f97316"
                        fillOpacity={1}
                        fill="url(#colorSaidas)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Alertas e notificações */}
              <div className="bg-white dark:bg-card p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-900">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Alertas do Sistema</h3>
                  <button
                    onClick={() => window.location.href = '/products?status=critico'}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                  >
                    Ver todos
                    <ArrowRight size={12} className="ml-1" />
                  </button>
                </div>

                {criticalProducts.length > 0 ? (
                  <div className="space-y-2 mb-1.5">
                    {criticalProducts.slice(0, 3).map(product => {
                      const percentage = Math.round((product.quantity / product.min_quantity) * 100);

                      return (
                        <div key={product.id} className="flex items-start gap-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="bg-red-100 dark:bg-red-800/50 rounded-full p-1.5 mt-0.5">
                            <Flame size={14} className="text-red-600 dark:text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="space-y-0.5">
                                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-50 truncate">{product.name}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {product.code && <span>Código: {product.code} • </span>}
                                  <span className="text-red-700 dark:text-red-400 font-medium">{product.quantity}/{product.min_quantity}</span> {product.unit}
                                </p>
                              </div>
                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-200 rounded-full">
                                {percentage}%
                              </span>
                            </div>
                            <div className="w-full h-1 bg-red-100 dark:bg-red-800/30 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="h-full bg-red-500 dark:bg-red-600 rounded-full"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {criticalProducts.length > 3 && (
                      <div className="text-center py-1.5">
                        <button
                          onClick={() => window.location.href = '/products?status=critico'}
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          + {criticalProducts.length - 3} produtos críticos
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mb-2">
                      <CheckSquare2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-0.5">Tudo em ordem!</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Seu estoque está saudável e não há produtos em estado crítico.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna da direita */}
            <div className="space-y-2 sm:space-y-3">
              {/* Distribuição por categoria */}
              <div className="bg-white dark:bg-card p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-900">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Distribuição do Estoque</h3>
                  <div className="flex items-center rounded bg-blue-50 dark:bg-blue-900/30 p-0.5">
                    <button
                      onClick={() => setActiveTab('categories')}
                      className={`px-1.5 py-0.5 text-xs rounded ${activeTab === 'categories' ? 'text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-800/50' : 'text-blue-600 dark:text-blue-400'}`}
                    >
                      Categorias
                    </button>
                    <button
                      onClick={() => setActiveTab('status')}
                      className={`px-1.5 py-0.5 text-xs rounded ${activeTab === 'status' ? 'text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-800/50' : 'text-blue-600 dark:text-blue-400'}`}
                    >
                      Status
                    </button>
                  </div>
                </div>

                {/* Gráfico de pizza em primeiro plano */}
                <div className="relative mb-2 h-40 sm:h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartDisplayData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartDisplayData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} produtos`, '']}
                        contentStyle={{
                          background: 'var(--background)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          fontSize: '0.75rem'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legenda do gráfico */}
                <div className="grid grid-cols-2 gap-2">
                  {chartDisplayData.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: item.color }}></div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.name}</span>
                        <p className="text-xs font-medium dark:text-gray-200">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Movimentações recentes */}
              <div className="bg-white dark:bg-card p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-900">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Movimentações Recentes</h3>
                  <button
                    onClick={() => window.location.href = '/movements'}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                  >
                    Ver histórico
                    <ArrowRight size={12} className="ml-1" />
                  </button>
                </div>

                {!movements || movements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-5 text-center">
                    <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-2 mb-2">
                      <Calendar size={18} className="text-gray-400 dark:text-gray-400" />
                    </div>
                    <h4 className="text-xs font-medium text-gray-900 dark:text-gray-200 mb-0.5">Nenhuma movimentação recente</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                      Registre entradas e saídas para visualizar o histórico.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y dark:divide-gray-800">
                    {recentMovementsWithProducts.map((movement) => (
                      <div key={movement.id} className="py-2 first:pt-0 last:pb-0">
                        <div className="flex gap-2">
                          <div className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${movement.type === 'entrada'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-orange-100 dark:bg-orange-900/30'
                            }`}>
                            {movement.type === 'entrada' ?
                              <ArrowDown size={12} className="text-green-600 dark:text-green-400" /> :
                              <ArrowUp size={12} className="text-orange-600 dark:text-orange-400" />
                            }
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                              <div className="flex items-center space-x-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  movement.type === 'entrada' ? "bg-green-500" : "bg-orange-500"
                                )} />
                                <div className="font-medium text-sm">{movement.productName}</div>
                              </div>
                              <div className="text-sm">
                                {formatQuantity(movement.quantity, movement.unit)} {movement.unit}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
