import { useState } from 'react';
import {
    Package,
    TrendingUp,
    TrendingDown,
    ArrowDown,
    ArrowUp,
    Users,
    Calendar,
    BarChart4,
    CircleAlert,
    RefreshCcw,
    Plus,
    ChevronRight,
    Flame
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Dados de exemplo
const areaChartData = [
    { name: '01/05', entradas: 40, saidas: 24 },
    { name: '02/05', entradas: 30, saidas: 13 },
    { name: '03/05', entradas: 20, saidas: 28 },
    { name: '04/05', entradas: 27, saidas: 18 },
    { name: '05/05', entradas: 18, saidas: 12 },
    { name: '06/05', entradas: 23, saidas: 30 },
    { name: '07/05', entradas: 34, saidas: 21 },
];

const pieChartData = [
    { name: 'Saudável', value: 120, color: '#10b981' },
    { name: 'Baixo', value: 15, color: '#f59e0b' },
    { name: 'Crítico', value: 8, color: '#ef4444' }
];

const movementsData = [
    { id: 1, productName: 'Produto A', type: 'entrada', quantity: 20, unit: 'un', date: '05/05/2023' },
    { id: 2, productName: 'Produto B', type: 'saida', quantity: 5, unit: 'kg', date: '05/05/2023' },
    { id: 3, productName: 'Produto C', type: 'entrada', quantity: 10, unit: 'un', date: '04/05/2023' },
];

const criticalProductsData = [
    { id: 1, name: 'Produto X', code: 'PX-001', quantity: 2, minQuantity: 10, unit: 'un' },
    { id: 2, name: 'Produto Y', code: 'PY-002', quantity: 3, minQuantity: 15, unit: 'kg' },
];

const IntegratedDashboard = () => {
    const [activeTab, setActiveTab] = useState('categories');

    return (
        <div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Visão Geral do Estoque</h1>
                    <p className="text-gray-500 mt-1">
                        {new Date().toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>

                <div className="flex mt-4 lg:mt-0 space-x-2">
                    <button className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <RefreshCcw className="h-4 w-4" />
                        <span>Atualizar</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-blue-600 rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        <Plus className="h-4 w-4" />
                        <span>Nova Entrada</span>
                    </button>
                </div>
            </div>

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Total de Produtos</p>
                            <h3 className="text-2xl font-bold text-gray-900">143</h3>
                            <p className="text-gray-500 text-xs mt-1">Em 12 categorias</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Ações Necessárias</p>
                            <h3 className="text-2xl font-bold text-gray-900">8</h3>
                            <p className="text-gray-500 text-xs mt-1">15 produtos com estoque baixo</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                            <CircleAlert className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Entradas (7 dias)</p>
                            <h3 className="text-2xl font-bold text-gray-900">192</h3>
                            <p className="text-gray-500 text-xs mt-1">23 movimentações</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <ArrowDown className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Saídas (7 dias)</p>
                            <h3 className="text-2xl font-bold text-gray-900">146</h3>
                            <p className="text-gray-500 text-xs mt-1">18 movimentações</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <ArrowUp className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Conteúdo principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna da esquerda */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Gráfico */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800">Fluxo de Estoque</h3>
                            <div className="flex space-x-4">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                    <span className="text-xs text-gray-600">Entradas</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                                    <span className="text-xs text-gray-600">Saídas</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={areaChartData}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="entradas"
                                        name="Entradas"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorEntradas)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="saidas"
                                        name="Saídas"
                                        stroke="#f97316"
                                        fillOpacity={1}
                                        fill="url(#colorSaidas)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Produtos críticos */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800">Produtos em Estado Crítico</h3>
                            <button className="text-blue-600 text-sm flex items-center hover:text-blue-800">
                                Ver todos
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {criticalProductsData.map(product => {
                                const percentage = Math.round((product.quantity / product.minQuantity) * 100);

                                return (
                                    <div key={product.id} className="flex items-start gap-4 p-4 bg-red-50 rounded-lg">
                                        <div className="bg-red-100 rounded-full p-2 mt-1">
                                            <Flame className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                                                    <p className="text-xs text-gray-500">
                                                        {product.code && <span>Código: {product.code} • </span>}
                                                        <span className="text-red-700 font-medium">{product.quantity}/{product.minQuantity}</span> {product.unit}
                                                    </p>
                                                </div>
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                                    {percentage}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-red-100 rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-red-500 rounded-full"
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="flex justify-center">
                                <button className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium">
                                    Registrar Entradas para Produtos Críticos
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna da direita */}
                <div className="space-y-6">
                    {/* Distribuição do estoque */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Distribuição do Estoque</h3>
                            <div className="flex items-center rounded bg-gray-100 p-1">
                                <button
                                    onClick={() => setActiveTab('categories')}
                                    className={`px-2 py-1 text-xs rounded ${activeTab === 'categories' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-600'}`}
                                >
                                    Categorias
                                </button>
                                <button
                                    onClick={() => setActiveTab('status')}
                                    className={`px-2 py-1 text-xs rounded ${activeTab === 'status' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-600'}`}
                                >
                                    Status
                                </button>
                            </div>
                        </div>

                        <div className="h-60 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => [`${value} produtos`, '']}
                                        contentStyle={{
                                            background: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
                            {pieChartData.map((item, index) => (
                                <div key={index} className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                                    <div>
                                        <span className="text-xs text-gray-500">{item.name}</span>
                                        <p className="text-sm font-medium">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Movimentações recentes */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Movimentações Recentes</h3>
                            <button className="text-blue-600 text-sm flex items-center hover:text-blue-800">
                                Ver histórico
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </button>
                        </div>

                        <div className="divide-y">
                            {movementsData.map((movement) => (
                                <div key={movement.id} className="py-3 first:pt-0 last:pb-0">
                                    <div className="flex gap-3">
                                        <div className={`flex-shrink-0 mt-1 w-8 h-8 rounded-full flex items-center justify-center ${movement.type === 'entrada' ? 'bg-green-100' : 'bg-orange-100'
                                            }`}>
                                            {movement.type === 'entrada' ?
                                                <ArrowDown className="h-4 w-4 text-green-600" /> :
                                                <ArrowUp className="h-4 w-4 text-orange-600" />
                                            }
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {movement.productName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {movement.date}
                                                </p>
                                            </div>
                                            <div className="flex items-center mt-0.5">
                                                <span className={`inline-flex items-center mr-2 px-1.5 py-0.5 text-xs rounded ${movement.type === 'entrada'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-orange-100 text-orange-800'
                                                    }`}>
                                                    {movement.type === 'entrada' ? 'Entrada' : 'Saída'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {movement.quantity} {movement.unit}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                            <button className="flex justify-center items-center py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                                <Plus className="h-4 w-4 mr-1.5" />
                                Nova Entrada
                            </button>
                            <button className="flex justify-center items-center py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors">
                                <TrendingUp className="h-4 w-4 mr-1.5" />
                                Nova Saída
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntegratedDashboard; 