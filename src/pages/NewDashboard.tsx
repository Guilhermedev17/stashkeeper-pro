import { useEffect, useState } from 'react';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseMovements } from '@/hooks/useSupabaseMovements';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { useAuth } from '@/contexts/AuthContext';
import {
    RefreshCcw,
    Plus,
    ArrowRight,
    CircleAlert,
    Mail,
    Calendar,
    CircleDollarSign,
    BarChart4,
    HelpCircle,
    Flame,
    ArrowDown,
    ArrowUp,
    Package,
    Layers,
    AlertCircle,
    Zap
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Interfaces mantidas do original
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

const ModernDashboard = () => {
    const { products, fetchProducts } = useSupabaseProducts();
    const { movements, fetchMovements } = useSupabaseMovements();
    const { categories } = useSupabaseCategories();
    const { user } = useAuth();

    // Produtos críticos (abaixo do mínimo)
    const criticalProducts = products.filter(p => p.quantity <= p.min_quantity);

    // Produtos com estoque baixo (até 30% acima do mínimo)
    const lowProducts = products.filter(p => p.quantity > p.min_quantity && p.quantity <= p.min_quantity * 1.3);

    // Estatísticas gerais
    const totalProducts = products.length;
    const criticalCount = criticalProducts.length;
    const lowStockCount = lowProducts.length;
    const totalCategories = categories.length;

    // Movimentações recentes (últimos 7 dias)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recentMovements = movements
        .filter(m => new Date(m.created_at) >= last7Days)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    // Encontra os detalhes dos produtos das movimentações recentes
    const recentMovementsWithProducts = recentMovements.map(movement => {
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

    const movementsByDay = last30Days.map(day => {
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

    const chartData = movementsByDay.map(day => ({
        name: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        Entradas: day.entradas,
        Saídas: day.saidas
    }));

    // Dados para o gráfico pizza de categorias
    const categoryData = categories.map(category => {
        const count = products.filter(p => p.category_id === category.id).length;
        return {
            name: category.name,
            value: count,
            color: getRandomColor()
        };
    });

    function getRandomColor() {
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#2ecc71', '#3498db', '#9b59b6', '#f1c40f'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

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

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Barra de topo com ações rápidas */}
            <div className="bg-white border-b sticky top-0 z-10 px-6 py-2">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-700">Olá, {userName}</h1>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => window.location.href = '/movements?type=entrada&open=true'}
                            className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                        >
                            <Plus size={16} className="mr-1" />
                            <span>Entrada</span>
                        </button>
                        <button
                            onClick={() => window.location.href = '/movements?type=saida&open=true'}
                            className="flex items-center px-3 py-1.5 text-sm bg-orange-50 text-orange-600 rounded-md hover:bg-orange-100 transition-colors"
                        >
                            <ArrowRight size={16} className="mr-1" />
                            <span>Saída</span>
                        </button>
                        <button
                            onClick={() => { fetchProducts(); fetchMovements(); }}
                            className="p-1.5 text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            <RefreshCcw size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Cabeçalho da página */}
                <div className="mb-8 flex justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                        <p className="text-gray-500">{formattedDate}</p>
                    </div>

                    <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded-md">
                            StashKeeper Pro
                        </span>
                    </div>
                </div>

                {/* Cards de resumo */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Total de Produtos</p>
                                <h3 className="text-2xl font-bold text-gray-800">{totalProducts}</h3>
                                <p className="text-xs text-gray-500 mt-1">Em {totalCategories} categorias</p>
                            </div>
                            <div className="bg-blue-100 h-12 w-12 rounded-full flex items-center justify-center">
                                <Package size={20} className="text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Ações Necessárias</p>
                                <h3 className="text-2xl font-bold text-gray-800">{criticalCount}</h3>
                                <p className="text-xs text-gray-500 mt-1">{lowStockCount} produtos com estoque baixo</p>
                            </div>
                            <div className="bg-red-100 h-12 w-12 rounded-full flex items-center justify-center">
                                <AlertCircle size={20} className="text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Entradas (7 dias)</p>
                                <h3 className="text-2xl font-bold text-gray-800">{entriesLastWeek}</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    {movements.filter(m => m.type === 'entrada' && new Date(m.created_at) >= last7Days).length} movimentações
                                </p>
                            </div>
                            <div className="bg-green-100 h-12 w-12 rounded-full flex items-center justify-center">
                                <ArrowDown size={20} className="text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Saídas (7 dias)</p>
                                <h3 className="text-2xl font-bold text-gray-800">{exitsLastWeek}</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    {movements.filter(m => m.type === 'saida' && new Date(m.created_at) >= last7Days).length} movimentações
                                </p>
                            </div>
                            <div className="bg-orange-100 h-12 w-12 rounded-full flex items-center justify-center">
                                <ArrowUp size={20} className="text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Layout principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna da esquerda */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Gráfico de movimentações */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Fluxo de Estoque</h3>
                                <div className="flex space-x-2 text-xs">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                                        <span>Entradas</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
                                        <span>Saídas</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={chartData}
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
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Alertas do Sistema</h3>
                                <button
                                    onClick={() => window.location.href = '/products?status=critico'}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                    Ver todos
                                    <ArrowRight size={14} className="ml-1" />
                                </button>
                            </div>

                            {criticalProducts.length > 0 ? (
                                <div className="space-y-3 mb-2">
                                    {criticalProducts.slice(0, 3).map(product => {
                                        const percentage = Math.round((product.quantity / product.min_quantity) * 100);

                                        return (
                                            <div key={product.id} className="flex items-start gap-4 p-3 bg-red-50 rounded-lg">
                                                <div className="bg-red-100 rounded-full p-2 mt-1">
                                                    <Flame size={18} className="text-red-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                                                            <p className="text-xs text-gray-500">
                                                                {product.code && <span>Código: {product.code} • </span>}
                                                                <span className="text-red-700 font-medium">{product.quantity}/{product.min_quantity}</span> {product.unit}
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

                                    {criticalProducts.length > 3 && (
                                        <div className="text-center py-2">
                                            <button
                                                onClick={() => window.location.href = '/products?status=critico'}
                                                className="text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                + {criticalProducts.length - 3} produtos críticos
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center">
                                    <div className="rounded-full bg-green-100 p-3 mb-3">
                                        <Zap size={24} className="text-green-600" />
                                    </div>
                                    <h4 className="font-medium text-gray-900 mb-1">Tudo em ordem!</h4>
                                    <p className="text-sm text-gray-500 max-w-sm">
                                        Nenhum produto está abaixo do nível mínimo. Seu estoque está em ótimas condições.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Coluna da direita */}
                    <div className="space-y-6">
                        {/* Distribuição por categoria */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Distribuição do Estoque</h3>
                                <div className="flex items-center rounded bg-blue-50 p-1">
                                    <button className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded">
                                        Categorias
                                    </button>
                                    <button className="px-2 py-1 text-xs text-blue-600">
                                        Status
                                    </button>
                                </div>
                            </div>

                            {/* Gráfico de pizza em primeiro plano */}
                            <div className="relative mb-3 h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stockData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {stockData.map((entry, index) => (
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

                            {/* Legenda do gráfico */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {stockData.map((item, index) => (
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
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Movimentações Recentes</h3>
                                <button
                                    onClick={() => window.location.href = '/movements'}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                    Ver histórico
                                    <ArrowRight size={14} className="ml-1" />
                                </button>
                            </div>

                            {recentMovementsWithProducts.length > 0 ? (
                                <div className="divide-y">
                                    {recentMovementsWithProducts.map((movement) => (
                                        <div key={movement.id} className="py-3 first:pt-0 last:pb-0">
                                            <div className="flex gap-3">
                                                <div className={`flex-shrink-0 mt-1 w-8 h-8 rounded-full flex items-center justify-center ${movement.type === 'entrada' ? 'bg-green-100' : 'bg-orange-100'
                                                    }`}>
                                                    {movement.type === 'entrada' ?
                                                        <ArrowDown size={14} className="text-green-600" /> :
                                                        <ArrowUp size={14} className="text-orange-600" />
                                                    }
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex justify-between">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {movement.productName}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(movement.created_at).toLocaleDateString('pt-BR')}
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
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center">
                                    <div className="rounded-full bg-gray-100 p-3 mb-3">
                                        <Calendar size={24} className="text-gray-400" />
                                    </div>
                                    <h4 className="font-medium text-gray-900 mb-1">Nenhuma movimentação recente</h4>
                                    <p className="text-sm text-gray-500 max-w-sm">
                                        Registre entradas e saídas para visualizar o histórico de movimentação.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Card de dicas rápidas */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                            <div className="absolute w-24 h-24 bg-blue-200 rounded-full -right-6 -top-6 opacity-50"></div>
                            <div className="absolute w-16 h-16 bg-indigo-200 rounded-full right-12 top-12 opacity-30"></div>

                            <h3 className="text-lg font-semibold text-gray-800 mb-3 relative">Dicas Rápidas</h3>

                            <div className="relative space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="bg-white/60 backdrop-blur-sm rounded-full p-1.5 mt-0.5">
                                        <HelpCircle size={14} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-800 font-medium">Mantenha seu estoque atualizado</p>
                                        <p className="text-xs text-gray-600">Registre as movimentações assim que ocorrerem para manter o sistema preciso.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="bg-white/60 backdrop-blur-sm rounded-full p-1.5 mt-0.5">
                                        <Zap size={14} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-800 font-medium">Configure alertas inteligentes</p>
                                        <p className="text-xs text-gray-600">Defina níveis mínimos adequados para cada produto em <a href="/products" className="text-blue-600 hover:underline">Gerenciar Produtos</a>.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="bg-white/60 backdrop-blur-sm rounded-full p-1.5 mt-0.5">
                                        <BarChart4 size={14} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-800 font-medium">Acompanhe relatórios</p>
                                        <p className="text-xs text-gray-600">Veja análises detalhadas na seção de <a href="/reports" className="text-blue-600 hover:underline">Relatórios</a> para tomar melhores decisões.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModernDashboard; 