
import { useState } from 'react';
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

// Mock Data
const stockMovementData = [
  { month: 'Jan', entradas: 24, saidas: 18, total: 120 },
  { month: 'Fev', entradas: 30, saidas: 22, total: 128 },
  { month: 'Mar', entradas: 28, saidas: 25, total: 131 },
  { month: 'Abr', entradas: 35, saidas: 30, total: 136 },
  { month: 'Mai', entradas: 32, saidas: 28, total: 140 },
  { month: 'Jun', entradas: 40, saidas: 32, total: 148 },
];

const categoryData = [
  { name: 'Eletrônicos', value: 35 },
  { name: 'Material de Escritório', value: 50 },
  { name: 'Móveis', value: 15 },
  { name: 'Equipamentos', value: 30 },
];

const productUsageData = [
  { name: 'Papel A4', quantidade: 120 },
  { name: 'Canetas', quantidade: 85 },
  { name: 'Lápis', quantidade: 60 },
  { name: 'Notebooks', quantidade: 30 },
  { name: 'Toners', quantidade: 45 },
  { name: 'Mouses', quantidade: 25 },
  { name: 'Teclados', quantidade: 20 },
  { name: 'Monitores', quantidade: 15 },
];

const monthlyValueData = [
  { name: 'Jan', value: 12500 },
  { name: 'Fev', value: 13200 },
  { name: 'Mar', value: 12800 },
  { name: 'Abr', value: 15000 },
  { name: 'Mai', value: 14800 },
  { name: 'Jun', value: 16500 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Reports = () => {
  const [period, setPeriod] = useState('6months');
  const [category, setCategory] = useState('all');

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
                <SelectItem value="electronics">Eletrônicos</SelectItem>
                <SelectItem value="office">Material de Escritório</SelectItem>
                <SelectItem value="furniture">Móveis</SelectItem>
                <SelectItem value="equipment">Equipamentos</SelectItem>
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
              <div className="text-2xl font-bold">189</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nos últimos 6 meses
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
              <div className="text-2xl font-bold">155</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nos últimos 6 meses
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
                    <div className="text-2xl font-bold">148</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm text-muted-foreground">Crescimento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">+23%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm text-muted-foreground">Taxa de Rotatividade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">32%</div>
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
                {categoryData.map((category, index) => (
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
                    <div className="text-xl font-bold">Papel A4</div>
                    <div className="text-sm text-muted-foreground">120 unidades</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm text-muted-foreground">Total de Saídas no Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">400 unidades</div>
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
                    <div className="text-xl font-bold">R$ 16.500,00</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm text-muted-foreground">Crescimento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-green-500">+32%</div>
                    <div className="text-sm text-muted-foreground">Nos últimos 6 meses</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm text-muted-foreground">Média Mensal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">R$ 14.133,33</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-center gap-1 pt-4 text-sm text-muted-foreground">
        <CalendarRange className="h-4 w-4" />
        <span>Dados atualizados em 15/07/2023</span>
      </div>
    </div>
  );
};

export default Reports;
