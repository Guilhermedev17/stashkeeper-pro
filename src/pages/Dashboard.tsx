
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, LineChart, PieChart, ResponsiveContainer, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Line, Pie, Cell } from 'recharts';
import { ArchiveRestore, ArrowDown, ArrowUp, CircleDollarSign, ClipboardList, PackageOpen, Percent } from 'lucide-react';

// Mock data for the charts
const monthlyData = [
  { name: 'Jan', entradas: 45, saidas: 30 },
  { name: 'Fev', entradas: 52, saidas: 38 },
  { name: 'Mar', entradas: 48, saidas: 41 },
  { name: 'Abr', entradas: 61, saidas: 50 },
  { name: 'Mai', entradas: 55, saidas: 45 },
  { name: 'Jun', entradas: 67, saidas: 52 },
];

const categoryData = [
  { name: 'Eletrônicos', value: 35 },
  { name: 'Material de Escritório', value: 25 },
  { name: 'Móveis', value: 15 },
  { name: 'Equipamentos', value: 25 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const { user } = useAuth();
  
  // Get user's name from metadata, or use email as fallback
  const userName = user?.user_metadata?.name || user?.email || 'Usuário';

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
            <div className="text-2xl font-bold">248</div>
            <p className="text-xs text-muted-foreground">
              +12% do mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entradas do Mês</CardTitle>
            <ArrowDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67</div>
            <p className="text-xs text-muted-foreground">
              +22% do mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saídas do Mês</CardTitle>
            <ArrowUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">52</div>
            <p className="text-xs text-muted-foreground">
              +15% do mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estoque Crítico</CardTitle>
            <Percent className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              -3 do mês anterior
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
                {[
                  { id: 1, name: 'Papel A4', stock: 2, min: 5 },
                  { id: 2, name: 'Toner', stock: 1, min: 3 },
                  { id: 3, name: 'Mouse USB', stock: 4, min: 10 },
                  { id: 4, name: 'Caderno', stock: 3, min: 8 },
                ].map(item => (
                  <div key={item.id} className="grid grid-cols-3 text-sm">
                    <div className="truncate">{item.name}</div>
                    <div className="text-center">{item.stock}</div>
                    <div className="text-right">{item.min}</div>
                  </div>
                ))}
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
                {[
                  { id: 1, type: 'entrada', name: 'Papel A4', qty: 10, date: '12/07/2023' },
                  { id: 2, type: 'saida', name: 'Toner', qty: 2, date: '10/07/2023' },
                  { id: 3, type: 'entrada', name: 'Mouse USB', qty: 15, date: '09/07/2023' },
                  { id: 4, type: 'saida', name: 'Caderno', qty: 8, date: '07/07/2023' },
                ].map(item => (
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
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Valor do Estoque
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 42.580,00</div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { month: 'Jan', value: 35000 },
                    { month: 'Fev', value: 37500 },
                    { month: 'Mar', value: 36800 },
                    { month: 'Abr', value: 38200 },
                    { month: 'Mai', value: 40100 },
                    { month: 'Jun', value: 42580 },
                  ]}
                >
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0088FE"
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
