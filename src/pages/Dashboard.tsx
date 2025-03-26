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
    if (products.length > 0 && categories.length > 0) {
      const catCounts: Record<string, number> = {};
      
      products.forEach(product => {
        if (product.category_id) {
          if (catCounts[product.category_id]) {
            catCounts[product.category_id]++;
          } else {
            catCounts[product.category_id] = 1;
          }
        }
      });

      const catData = Object.entries(catCounts).map(([id, value]) => {
        const cat = categories.find(c => c.id === id);
        return {
          name: cat ? cat.name : 'Sem categoria',
          value
        };
      });

      setCategoryData(catData.length > 0 ? catData : [{ name: 'Sem dados', value: 1 }]);

      const critical = products
        .filter(p => p.quantity <= p.min_quantity)
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 4)
        .map(p => ({
          id: p.id,
          name: p.name,
          stock: p.quantity,
          min: p.min_quantity
        }));
      
      console.log('Products with critical stock:', critical);
      setCriticalStock(critical);
    }
  }, [products, categories]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
              Unidades recebidas
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
              Unidades distribuídas
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
        <Card className="md:col-span-4 hover:shadow-md transition-all duration-300">
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
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="entradas" fill="#0088FE" name="Entradas" />
                <Bar dataKey="saidas" fill="#FF8042" name="Saídas" />
              </BarChart>
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
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos com Estoque Crítico
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 text-sm">
                <div className="font-medium">Produto</div>
                <div className="font-medium text-center">Estoque</div>
                <div className="font-medium text-right">Mínimo</div>
              </div>
              <div className="space-y-2">
                {criticalStock.length > 0 ? criticalStock.map(item => (
                  <div key={item.id} className="grid grid-cols-3 text-sm">
                    <div className="truncate">{item.name}</div>
                    <div className="text-center font-medium text-red-500">{item.stock}</div>
                    <div className="text-right">{item.min}</div>
                  </div>
                )) : (
                  <div className="text-center text-muted-foreground py-2">
                    Nenhum produto em estado crítico
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Últimas Movimentações
            </CardTitle>
            <ArchiveRestore className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                {recentMovements.length > 0 ? recentMovements.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    {item.type === 'entrada' ? (
                      <ArrowDown className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowUp className="h-3 w-3 text-blue-500" />
                    )}
                    <div className="flex-1 truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.qty} un.</div>
                    <div className="text-xs text-muted-foreground">{item.date}</div>
                  </div>
                )) : (
                  <div className="text-center text-muted-foreground py-2">
                    Nenhuma movimentação recente
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Resumo de Estoque
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Itens Totais: {products.reduce((sum, p) => sum + p.quantity, 0)}</div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyData}
                  margin={{
                    top: 20, 
                    right: 30, 
                    bottom: 10, 
                    left: 20
                  }}
                >
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="entradas"
                    stroke="#0088FE"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="saidas"
                    stroke="#FF8042"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
