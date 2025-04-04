import { useState, useEffect } from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseMovements } from '@/hooks/useSupabaseMovements';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import ModernMovementDialog from '@/components/products/ModernMovementDialog';
import {
  Package,
  ArrowDownUp,
  PlusCircle,
  MinusCircle,
  PlusSquare,
  CalendarDays,
  Calendar as CalendarIcon,
  CirclePlus,
  SearchIcon,
  ArrowDownIcon,
  ArrowUpIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import DateRangeFilter from '@/components/ui/DateRangeFilter';
import CustomDateRangePicker from '@/components/ui/CustomDateRangePicker';
import PageWrapper from '@/components/layout/PageWrapper';
import { ModernHeader, ModernFilters, ModernTable } from '@/components/layout/modern';
import { Badge } from '@/components/ui/badge';
import PageLoading from '@/components/PageLoading';

// Definições de interface para tipagem
interface ProductItem {
  id: string;
  code: string;
  name: string;
  description: string;
  category_id: string;
  quantity: number;
  min_quantity: number;
  unit: string;
}

interface Movement {
  id: string;
  product_id: string;
  type: 'entrada' | 'saida';
  quantity: number;
  created_at: string;
  employee_name?: string;
  notes?: string;
}

interface Category {
  id: string;
  name: string;
}

interface MovementProductSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductItem[];
  categories: Category[];
  onSelectProduct: (product: ProductItem, type: 'entrada' | 'saida') => void;
}

const Movements = () => {
  const { products, loading, fetchProducts } = useSupabaseProducts();
  const { movements, loading: loadingMovements, fetchMovements } = useSupabaseMovements();
  const { categories } = useSupabaseCategories();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'year' | undefined>(
    undefined
  );
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isNewMovementDialogOpen, setIsNewMovementDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'predefined' | 'custom'>('predefined');
  const [isLoading, setIsLoading] = useState(true);

  // Verificar parâmetros da URL ao carregar a página
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type');

    if (typeParam === 'entrada' || typeParam === 'saida') {
      setMovementType(typeParam);

      // Verificar se devemos abrir o diálogo de nova movimentação
      const openDialog = params.get('open') === 'true';
      if (openDialog) {
        setIsNewMovementDialogOpen(true);
      }
    }

    const productParam = params.get('product');
    if (productParam) {
      const product = products.find(p => p.id === productParam);
      if (product) {
        setSelectedProduct(product);

        // Se temos um produto e um tipo, abrimos o diálogo diretamente
        if (typeParam && (typeParam === 'entrada' || typeParam === 'saida')) {
          setIsDialogOpen(true);
        }
      }
    }
  }, [products]);

  // Adicionar efeito de carregamento inicial
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Iniciar o tempo para medir quanto leva para carregar os dados
      const startTime = performance.now();

      // Esperar pelo menos que os produtos e movimentos sejam carregados
      if (loading || loadingMovements) {
        await new Promise(resolve => {
          const checkInterval = setInterval(() => {
            if (!loading && !loadingMovements) {
              clearInterval(checkInterval);
              resolve(true);
            }
          }, 50);
        });
      }

      // Quando todas as operações de carregamento terminarem, verificamos o tempo
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Garantir tempo mínimo de carregamento para evitar flash
      // Se os dados carregarem muito rápido, mostramos o loading por pelo menos 400ms
      // Se os dados demorarem mais que isso, não adicionamos atraso adicional
      const minLoadingTime = 400;
      const remainingTime = Math.max(0, minLoadingTime - loadTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setIsLoading(false);
    };

    loadData();
  }, [loading, loadingMovements]);

  const handleOpenDialog = (product: ProductItem, type: 'entrada' | 'saida') => {
    setSelectedProduct(product);
    setMovementType(type);
    setIsDialogOpen(true);
  };

  const handleOpenNewMovementDialog = () => {
    setMovementType('entrada');
    setIsNewMovementDialogOpen(true);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setDateRange(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setActiveFilter('predefined');
  };

  const handleDateRangeSelect = (range: 'day' | 'week' | 'month' | 'year') => {
    setDateRange(range);
    setDate(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setActiveFilter('predefined');
  };

  const handleCustomRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
    setDate(undefined);
    setDateRange(undefined);
    setActiveFilter('custom');
  };

  const clearDateFilter = () => {
    setDate(undefined);
    setDateRange(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // Filtra os movimentos de acordo com a data selecionada
  const filterMovementsByDate = (productMovements: Movement) => {
    const movementDate = new Date(productMovements.created_at);

    // Se não há filtro de data ativo
    if (!date && !dateRange && !startDate && !endDate) return true;

    // Filtro por intervalo personalizado
    if (startDate && endDate) {
      // Ajustar endDate para incluir o final do dia
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);

      return movementDate >= startDate && movementDate <= adjustedEndDate;
    }

    // Filtro por data específica
    if (date) {
      return (
        movementDate.getDate() === date.getDate() &&
        movementDate.getMonth() === date.getMonth() &&
        movementDate.getFullYear() === date.getFullYear()
      );
    }

    // Filtro por intervalo predefinido
    if (dateRange) {
      const today = new Date();

      if (dateRange === 'day') {
        return (
          movementDate.getDate() === today.getDate() &&
          movementDate.getMonth() === today.getMonth() &&
          movementDate.getFullYear() === today.getFullYear()
        );
      } else if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        return movementDate >= weekAgo;
      } else if (dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        return movementDate >= monthAgo;
      } else if (dateRange === 'year') {
        const yearAgo = new Date();
        yearAgo.setFullYear(today.getFullYear() - 1);
        return movementDate >= yearAgo;
      }
    }

    return true;
  };

  // Filter products that have movements and match search/category/type criteria
  const filteredProducts = products.filter(product => {
    // Check if product has any movements that match the date and type filter
    const hasMovements = movements.some(m =>
      m.product_id === product.id &&
      filterMovementsByDate(m) &&
      (selectedType === 'all' || m.type === selectedType)
    );

    if (!hasMovements) return false;

    const matchesSearch =
      searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' ||
      product.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sem categoria';
  };

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <div className="h-full p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Movimentações</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Histórico de entradas e saídas de produtos
            </p>
          </div>
        </div>

        <PageLoading message="Carregando movimentações..." />
      </div>
    );
  }

  return (
    <PageWrapper className="flex flex-col p-0">
      <div className="flex-1 w-full overflow-auto">
        <div className="w-full px-2 sm:px-4 py-4 sm:py-6">
          <ModernHeader
            title="Movimentações"
            subtitle="Visualize o histórico de entradas e saídas de produtos."
            actions={
              <Button
                type="button"
                onClick={() => setIsNewMovementDialogOpen(true)}
                className="gap-2 w-full sm:w-auto"
              >
                <PlusSquare className="h-4 w-4" /> Nova Movimentação
              </Button>
            }
          />

          {/* Filtros de busca, categoria e data */}
          <ModernFilters>
            <div className="relative col-span-1 sm:col-span-4 md:col-span-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <Select
                value={selectedType}
                onValueChange={setSelectedType}
              >
                <SelectTrigger className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Tipos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <CustomDateRangePicker
                startDate={startDate}
                endDate={endDate}
                onRangeChange={handleCustomRangeChange}
                className="w-full"
                placeholder="Selecionar período"
              />
            </div>
          </ModernFilters>

          {/* Lista de movimentações */}
          <ModernTable className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center py-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <h3 className="text-lg font-medium mb-1 dark:text-gray-300">Nenhuma movimentação encontrada</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto">
                  Tente ajustar os filtros ou criar uma nova movimentação clicando no botão acima.
                </p>
              </div>
            ) : (
              <div className="space-y-6 p-2">
                {filteredProducts.map(product => {
                  const productMovements = movements.filter(
                    m => m.product_id === product.id &&
                      filterMovementsByDate(m) &&
                      (selectedType === 'all' || m.type === selectedType)
                  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                  if (productMovements.length === 0) return null;

                  return (
                    <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                      <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900/30 h-10 w-10 rounded-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-medium dark:text-white">{product.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Categoria: {getCategoryName(product.category_id)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          onClick={() => handleOpenDialog(product, 'entrada')}
                        >
                          <span className="mr-1 text-xs">+</span> Movimentar
                        </Button>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-gray-200 dark:border-gray-700">
                            <TableHead>Data</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Responsável</TableHead>
                            <TableHead>Observação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productMovements.map(movement => (
                            <TableRow key={movement.id} className="border-b border-gray-100 dark:border-gray-800">
                              <TableCell className="font-medium whitespace-nowrap dark:text-gray-300">
                                {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {movement.type === 'entrada' ? (
                                    <>
                                      <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                                      <span className="dark:text-gray-300">Entrada</span>
                                    </>
                                  ) : (
                                    <>
                                      <div className="mr-2 h-2 w-2 rounded-full bg-orange-500"></div>
                                      <span className="dark:text-gray-300">Saída</span>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium dark:text-gray-300">
                                  {movement.quantity} {product.unit}
                                </span>
                              </TableCell>
                              <TableCell className="dark:text-gray-300">{movement.employee_name || '-'}</TableCell>
                              <TableCell className="max-w-xs truncate dark:text-gray-300">{movement.notes || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            )}
          </ModernTable>
        </div>
      </div>

      {/* Dialog para criar uma nova movimentação */}
      <Dialog open={isNewMovementDialogOpen} onOpenChange={setIsNewMovementDialogOpen}>
        <DialogContent className="sm:max-w-[580px] p-0 border-none max-h-[90vh] overflow-hidden">
          <MovementProductSelector
            open={isNewMovementDialogOpen}
            onOpenChange={setIsNewMovementDialogOpen}
            products={products}
            categories={categories}
            onSelectProduct={handleOpenDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de movimentação */}
      <ModernMovementDialog
        product={selectedProduct ? {
          id: selectedProduct.id,
          code: selectedProduct.code,
          name: selectedProduct.name,
          description: selectedProduct.description,
          unit: selectedProduct.unit
        } : null}
        type={movementType}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </PageWrapper>
  );
};

const MovementProductSelector = ({
  open,
  onOpenChange,
  products,
  categories,
  onSelectProduct
}: MovementProductSelectorProps) => {
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' ||
      product.category_id === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sem categoria';
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      <div className="p-6 pb-4 border-b">
        <h2 className="text-xl font-semibold">Registrar Movimentação</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione o produto e o tipo de movimentação a ser registrada.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4">
        <Button
          type="button"
          variant={movementType === 'entrada' ? 'default' : 'outline'}
          className={`h-12 ${movementType === 'entrada'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'hover:bg-primary/10'
            }`}
          onClick={() => setMovementType('entrada')}
        >
          <ArrowDownIcon className="h-4 w-4 mr-2" />
          Entrada
        </Button>
        <Button
          type="button"
          variant={movementType === 'saida' ? 'default' : 'outline'}
          className={`h-12 ${movementType === 'saida'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
            }`}
          onClick={() => setMovementType('saida')}
        >
          <ArrowUpIcon className="h-4 w-4 mr-2" />
          Saída
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código do produto..."
            className="pl-9 w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-hidden p-4 pt-0">
        <div className="border rounded-lg overflow-hidden h-full dark:border-gray-700">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="font-medium text-muted-foreground">Nenhum produto encontrado</p>
              <p className="text-sm text-muted-foreground/70 text-center mt-1 max-w-xs">
                Tente ajustar os filtros ou pesquise por outro termo
              </p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="sticky top-0 bg-muted/60 dark:bg-gray-800/80 backdrop-blur-sm border-b dark:border-gray-700">
                <div className="grid grid-cols-3 px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  <div>Produto</div>
                  <div className="text-center">Estoque</div>
                  <div className="text-right">Ação</div>
                </div>
              </div>

              <div className="divide-y dark:divide-gray-700">
                {filteredProducts.map(product => (
                  <div key={product.id} className="grid grid-cols-3 items-center px-4 py-3 hover:bg-muted/40 dark:hover:bg-gray-700/40 transition-colors">
                    <div>
                      <div className="font-medium dark:text-white">{product.name}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="font-mono text-xs dark:border-gray-600 dark:text-gray-300">
                          {product.code}
                        </Badge>
                        <span className="text-xs bg-secondary/40 dark:bg-gray-700 px-1.5 py-0.5 rounded-full dark:text-gray-300">
                          {getCategoryName(product.category_id)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Badge variant={product.quantity <= product.min_quantity ? "destructive" : "secondary"} className="px-2.5 py-1">
                        {product.quantity}
                      </Badge>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant={movementType === 'entrada' ? 'default' : 'custom-blue'}
                        className="px-3"
                        size="sm"
                        onClick={() => onSelectProduct(product, movementType)}
                      >
                        Selecionar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Movements;
