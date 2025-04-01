import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, LineChart, PieChart, ResponsiveContainer, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Line, Pie, Cell } from 'recharts';
import { ArchiveRestore, ArrowDown, ArrowUp, CircleDollarSign, ClipboardList, PackageOpen, Percent } from 'lucide-react';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseMovements } from '@/hooks/useSupabaseMovements';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';

const Dashboard = () => {
  const { user } = useAuth();
  const { products } = useSupabaseProducts();
  const { movements } = useSupabaseMovements();
  const { categories } = useSupabaseCategories();
  
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [unitData, setUnitData] = useState<any[]>([]);
  const [criticalStock, setCriticalStock] = useState<any[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);

  const userName = user?.user_metadata?.name || user?.email || 'Usuário';

  useEffect(() => {
    if (movements.length > 0) {
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toLocaleString('pt-BR', { month: 'short' });
      }).reverse();

      const groupedData = last6Months.map(month => {
        const monthMovements = movements.filter(m => {
          const movementDate = new Date(m.created_at);
          const monthStr = movementDate.toLocaleString('pt-BR', { month: 'short' });
          return monthStr === month;
        });

        const entradas = monthMovements.filter(m => m.type === 'entrada').reduce((acc, m) => acc + m.quantity, 0);
        const saidas = monthMovements.filter(m => m.type === 'saida').reduce((acc, m) => acc + m.quantity, 0);

        return {
          name: month,
          entradas,
          saidas
        };
      });

      setMonthlyData(groupedData);

      const recent = [...movements]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4)
        .map(m => ({
          id: m.id,
          type: m.type,
          name: m.product_name || 'Produto',
          qty: m.quantity,
          date: new Date(m.created_at).toLocaleDateString('pt-BR')
        }));
      
      setRecentMovements(recent);
    }
  }, [movements]);

  useEffect(() => {
    if (products.length > 0) {
      // Agrupar produtos por unidade
      const unitCounts: Record<string, { count: number, total: number }> = {};
      const catCounts: Record<string, number> = {};
      
      products.forEach(product => {
        // Contagem por unidade
        const unit = product.unit || 'unidade';
        if (!unitCounts[unit]) {
          unitCounts[unit] = { count: 0, total: 0 };
        }
        unitCounts[unit].count++;
        unitCounts[unit].total += product.quantity;

        // Contagem por categoria
        if (product.category_id) {
          if (catCounts[product.category_id]) {
            catCounts[product.category_id]++;
          } else {
            catCounts[product.category_id] = 1;
          }
        }
      });

      // Formatar dados de unidade para o gráfico
      const unitDataArray = Object.entries(unitCounts).map(([unit, data]) => ({
        name: unit,
        quantidade: data.count,
        total: data.total
      }));
      setUnitData(unitDataArray);

      // Formatar dados de categoria para o gráfico
      const catData = Object.entries(catCounts).map(([id, value]) => {
        const cat = categories.find(c => c.id === id);
        return {
          name: cat ? cat.name : 'Sem categoria',
          value
        };
      });
      setCategoryData(catData.length > 0 ? catData : [{ name: 'Sem dados', value: 1 }]);

      // Produtos com estoque crítico
      const critical = products
        .filter(p => p.quantity <= p.min_quantity)
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 4)
        .map(p => ({
          id: p.id,
          name: p.name,
          stock: p.quantity,
          min: p.min_quantity,
          unit: p.unit || 'unidade'
        }));
      
      setCriticalStock(critical);
    }
  }, [products, categories]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const totalProducts = products.length;
  const totalEntradas = movements.filter(m => m.type === 'entrada').reduce((acc, m) => acc + m.quantity, 0);
  const totalSaidas = movements.filter(m => m.type === 'saida').reduce((acc, m) => acc + m.quantity, 0);
  const criticalCount = products.filter(p => p.quantity <= p.min_quantity).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {userName}. Aqui está um resumo do almoxarifado.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produtos cadastrados
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
            <ArrowDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntradas}</div>
            <p className="text-xs text-muted-foreground">
              Itens recebidos
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
            <ArrowUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSaidas}</div>
            <p className="text-xs text-muted-foreground">
              Itens distribuídos
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estoque Crítico</CardTitle>
            <Percent className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">
              Produtos abaixo do mínimo
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-3 hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle>Produtos por Unidade</CardTitle>
            <CardDescription>
              Distribuição dos produtos por tipo de unidade
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={unitData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="quantidade"
                  label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: '#888888', strokeWidth: 1 }}
                >
                  {unitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>
              Produtos por categoria
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => {
                    const displayName = name.length > 15 ? `${name.slice(0, 12)}...` : name;
                    return `${displayName} ${(percent * 100).toFixed(0)}%`;
                  }}
                  labelLine={{ stroke: '#888888', strokeWidth: 1 }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle>Movimentação Mensal</CardTitle>
            <CardDescription>
              Comparativo de entradas e saídas nos últimos meses
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={monthlyData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
                barGap={8}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.4} />
                <XAxis dataKey="name" tick={{ fill: '#888888' }} />
                <YAxis tick={{ fill: '#888888' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333333',
                    borderRadius: '6px',
                  }}
                  itemStyle={{ color: '#888888' }}
                />
                <Legend wrapperStyle={{ color: '#888888' }} />
                <Bar dataKey="entradas" name="Entradas" fill="#22c55e" />
                <Bar dataKey="saidas" name="Saídas" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle>Estoque por Unidade</CardTitle>
            <CardDescription>
              Quantidade total em estoque por unidade
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={unitData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.4} />
                <XAxis dataKey="name" tick={{ fill: '#888888' }} />
                <YAxis tick={{ fill: '#888888' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333333',
                    borderRadius: '6px',
                  }}
                  itemStyle={{ color: '#888888' }}
                />
                <Bar dataKey="total" name="Quantidade" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle>Produtos com Estoque Crítico</CardTitle>
            <CardDescription>
              Produtos abaixo do estoque mínimo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalStock.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Mínimo: {item.min} {item.unit}
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {item.stock} {item.unit}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle>Movimentações Recentes</CardTitle>
            <CardDescription>
              Últimas movimentações realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMovements.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                  </div>
                  <div className={`text-sm font-medium ${item.type === 'entrada' ? 'text-green-500' : 'text-blue-500'}`}>
                    {item.type === 'entrada' ? '+' : '-'}{item.qty}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
