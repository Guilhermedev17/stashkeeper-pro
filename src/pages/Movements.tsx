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

const getUnitAbbreviation = (unit: string): string => {
  switch (unit.toLowerCase()) {
    case 'un': return 'UN';
    case 'unidade': return 'UN';
    case 'kg': return 'KG';
    case 'g': return 'G';
    case 'gramas': return 'G';
    case 'l': return 'L';
    case 'litros': return 'L';
    case 'ml': return 'ML';
    case 'cx': return 'CX';
    case 'caixa': return 'CX';
    case 'pct': return 'PCT';
    case 'pacote': return 'PCT';
    case 'rl': return 'RL';
    case 'rolo': return 'RL';
    case 'par': return 'PAR';
    case 'm': return 'M';
    case 'metros': return 'M';
    case 'cm': return 'CM';
    default: return unit.toUpperCase();
  }
};

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
      <PageWrapper>
        <ModernHeader
          title="Movimentações"
          subtitle="Visualize o histórico de entradas e saídas de produtos."
        />
        <PageLoading message="Carregando movimentações..." />
      </PageWrapper>
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
                className="gap-1.5"
                size="sm"
              >
                <PlusSquare className="h-3.5 w-3.5" /> 
                <span className="text-xs">Nova Movimentação</span>
              </Button>
            }
          />

          {/* Filtros de busca, categoria e data */}
          <ModernFilters className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  className="pl-8 h-9 text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="h-9 text-xs">
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

              <div>
                <Select
                  value={selectedType}
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Tipos</SelectItem>
                    <SelectItem value="entrada">Entradas</SelectItem>
                    <SelectItem value="saida">Saídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <CustomDateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onRangeChange={handleCustomRangeChange}
                  className="h-9"
                  placeholder="Selecionar período"
                />
              </div>
            </div>
          </ModernFilters>

          {/* Lista de movimentações */}
          <ModernTable className="flex-1 mt-4 shadow-sm">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-14 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <h3 className="text-sm font-medium mb-1">Nenhuma movimentação encontrada</h3>
                <p className="text-xs text-muted-foreground/70 max-w-md mx-auto">
                  Tente ajustar os filtros ou criar uma nova movimentação clicando no botão acima.
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-1">
                {filteredProducts.map(product => {
                  const productMovements = movements.filter(
                    m => m.product_id === product.id &&
                      filterMovementsByDate(m) &&
                      (selectedType === 'all' || m.type === selectedType)
                  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                  if (productMovements.length === 0) return null;

                  return (
                    <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                      <div className="p-3 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 dark:bg-blue-900/30 h-8 w-8 rounded-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm dark:text-white">
                              {product.name}
                              <Badge variant="outline" className="ml-2 font-mono text-xs px-1.5 py-0 h-5 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                {product.code}
                              </Badge>
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Categoria: {getCategoryName(product.category_id)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1 text-muted-foreground hover:text-primary"
                          onClick={() => handleOpenDialog(product, 'entrada')}
                        >
                          + Movimentar
                        </Button>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-gray-200 dark:border-gray-700">
                            <TableHead className="text-xs w-[400px]">Data</TableHead>
                            <TableHead className="text-xs w-[350px]">Tipo</TableHead>
                            <TableHead className="text-xs w-[300px]">Quantidade</TableHead>
                            <TableHead className="text-xs w-[250px]">Responsável</TableHead>
                            <TableHead className="text-xs w-[180px]">Observação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productMovements.map(movement => (
                            <TableRow key={movement.id} className="border-b border-gray-100 dark:border-gray-800">
                              <TableCell className="whitespace-nowrap text-xs w-[400px]">
                                {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm')}
                              </TableCell>
                              <TableCell className="w-[350px]">
                                <div className="flex items-center">
                                  {movement.type === 'entrada' ? (
                                    <>
                                      <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                                      <span className="text-xs">Entrada</span>
                                    </>
                                  ) : (
                                    <>
                                      <div className="mr-2 h-2 w-2 rounded-full bg-orange-500"></div>
                                      <span className="text-xs">Saída</span>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="w-[300px]">
                                <span className="font-medium text-xs">
                                  {movement.quantity} {getUnitAbbreviation(product.unit)}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs w-[250px]">{movement.employee_name || '-'}</TableCell>
                              <TableCell className="max-w-xs truncate text-xs w-[180px]">{movement.notes || '-'}</TableCell>
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
        <DialogContent className="sm:max-w-[650px] md:max-w-[700px] p-0 border-none max-h-[90vh] overflow-hidden">
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
      <div className="p-4 pb-3 border-b">
        <h2 className="text-base font-medium">Registrar Movimentação</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Selecione o produto e o tipo de movimentação a ser registrada.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4">
        <Button
          type="button"
          variant={movementType === 'entrada' ? 'default' : 'outline'}
          className={`h-10 text-sm ${movementType === 'entrada'
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
          className={`h-10 text-sm ${movementType === 'saida'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
            }`}
          onClick={() => setMovementType('saida')}
        >
          <ArrowUpIcon className="h-4 w-4 mr-2" />
          Saída
        </Button>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código do produto..."
            className="pl-10 h-9 text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id} className="text-sm">
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-hidden px-4 pb-4">
        <div className="rounded-lg overflow-hidden h-full border dark:border-gray-700">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <Package className="h-8 w-8 text-muted-foreground/50 mb-3" />
              <p className="font-medium text-sm text-muted-foreground">Nenhum produto encontrado</p>
              <p className="text-xs text-muted-foreground/70 text-center mt-1 max-w-xs">
                Tente ajustar os filtros ou pesquise por outro termo
              </p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="sticky top-0 bg-muted/60 dark:bg-gray-800/80 backdrop-blur-sm border-b dark:border-gray-700">
                <div className="grid grid-cols-3 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <div>Produto</div>
                  <div className="text-center">Estoque</div>
                  <div className="text-right">Ação</div>
                </div>
              </div>

              <div>
                {filteredProducts.map(product => (
                  <div key={product.id} className="grid grid-cols-3 items-center px-3 py-2 hover:bg-muted/40 dark:hover:bg-gray-700/40 transition-colors">
                    <div>
                      <div className="font-medium text-sm dark:text-white">{product.name}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="font-mono text-xs dark:border-gray-600 dark:text-gray-300 px-1.5 py-0 h-5">
                          {product.code}
                        </Badge>
                        <span className="text-xs bg-secondary/40 dark:bg-gray-700 px-1.5 py-0 rounded-full dark:text-gray-300 h-5 flex items-center">
                          {getCategoryName(product.category_id)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Badge variant={product.quantity <= product.min_quantity ? "destructive" : "secondary"} className="px-2 py-0.5 text-xs h-5">
                        {product.quantity} {getUnitAbbreviation(product.unit)}
                      </Badge>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant={movementType === 'entrada' ? 'default' : 'custom-blue'}
                        size="sm"
                        className="h-7 text-xs px-2.5"
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
