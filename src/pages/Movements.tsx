import { useState, useEffect } from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseMovements } from '@/hooks/useSupabaseMovements';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import MovementDialog from '@/components/products/MovementDialog';
import { 
  Package, 
  ArrowDownUp, 
  PlusCircle, 
  MinusCircle, 
  PlusSquare,
  CalendarDays,
  Calendar as CalendarIcon,
  CirclePlus,
  SearchIcon
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

  return (
    <div className="px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Movimentações</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Visualize o histórico de entradas e saídas de produtos.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsNewMovementDialogOpen(true)} className="gap-2 w-full sm:w-auto">
            <CirclePlus className="h-4 w-4" />
            <span>Nova Movimentação</span>
          </Button>
        </div>
      </div>

      {/* Filtros de busca, categoria e data */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
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
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="saida">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 col-span-1 sm:col-span-4 md:col-span-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant={dateRange ? "default" : "outline"}
                size="sm" 
                className="gap-1 flex-1"
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="truncate">Rápido</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <DateRangeFilter
                date={date}
                dateRange={dateRange}
                onDateSelect={handleDateSelect}
                onDateRangeSelect={handleDateRangeSelect}
                onClearFilter={clearDateFilter}
                placeholder="Filtro rápido"
                className="w-full border-0"
              />
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant={startDate && endDate ? "default" : "outline"}
                size="sm" 
                className="gap-1 flex-1"
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="truncate">Período</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <CustomDateRangePicker
                startDate={startDate}
                endDate={endDate}
                onRangeChange={handleCustomRangeChange}
                placeholder="Período específico"
                className="w-full border-0"
              />
            </PopoverContent>
          </Popover>
          
          {(dateRange || date || startDate || endDate) && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-destructive"
              onClick={clearDateFilter}
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Estado de carregamento ou sem dados */}
      {loading ? (
        <Card>
          <CardContent className="h-24 flex items-center justify-center">
            <p className="text-muted-foreground">Carregando produtos...</p>
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="h-24 flex flex-col items-center justify-center">
            <Package className="h-8 w-8 mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="py-4 px-4 sm:px-6 bg-background">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ArrowDownUp className="h-5 w-5" />
              Controle de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] sm:w-[120px]">Código</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="text-center w-[70px] sm:w-[100px]">Estoque</TableHead>
                    <TableHead className="text-center w-[100px]">Tipo</TableHead>
                    <TableHead className="hidden md:table-cell w-[200px]">Colaborador</TableHead>
                    <TableHead className="w-[130px] sm:w-[180px] md:w-[220px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-xs px-2 sm:px-4 py-2 sm:py-4">
                        <div className="bg-secondary/40 dark:bg-secondary/20 px-2 py-0.5 rounded border border-border/50 inline-block font-mono">
                          {product.code}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2 sm:py-4">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground hidden sm:block line-clamp-1">{product.description}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{getCategoryName(product.category_id)}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-4">
                        {getCategoryName(product.category_id)}
                      </TableCell>
                      <TableCell className="text-center px-2 sm:px-4 py-2 sm:py-4">
                        <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs sm:text-sm ${product.quantity <= product.min_quantity ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                          {product.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-center px-2 sm:px-4 py-2 sm:py-4">
                        {(() => {
                          const movement = movements.find(m => m.product_id === product.id);
                          if (movement?.type === 'entrada') {
                            return (
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Entrada</span>
                            );
                          } else {
                            return (
                              <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Saída</span>
                            );
                          }
                        })()}
                        {/* Exibir informação reduzida do colaborador em telas menores */}
                        {(() => {
                          const movement = movements.find(m => m.product_id === product.id);
                          if (movement?.type === 'saida' && movement?.employee_name) {
                            return (
                              <div className="text-xs mt-1 md:hidden">
                                <span className="text-muted-foreground">Colaborador:</span>
                                <div className="font-medium truncate">{movement.employee_name}</div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-4">
                        {(() => {
                          const movement = movements.find(m => m.product_id === product.id);
                          if (movement?.type === 'saida' && movement?.employee_name) {
                            return (
                              <div className="space-y-1">
                                <div className="font-medium truncate">{movement.employee_name}</div>
                                <div className="text-xs text-muted-foreground font-mono">{movement.employee_code || 'Sem código'}</div>
                              </div>
                            );
                          }
                          return '-';
                        })()}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2 sm:py-4">
                        <div className="flex flex-row sm:flex-row gap-1 sm:gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="gap-1 text-xs w-full sm:w-auto whitespace-nowrap"
                            onClick={() => handleOpenDialog(product, 'entrada')}
                          >
                            <PlusCircle className="h-3 w-3 text-green-500" />
                            <span className="hidden xs:inline">Entrada</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="gap-1 text-xs w-full sm:w-auto whitespace-nowrap"
                            onClick={() => handleOpenDialog(product, 'saida')}
                          >
                            <MinusCircle className="h-3 w-3 text-blue-500" />
                            <span className="hidden xs:inline">Saída</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog para produto selecionado */}
      <MovementDialog
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

      {/* Dialog para nova movimentação (selecionar produto) */}
      <MovementProductSelector
        open={isNewMovementDialogOpen}
        onOpenChange={setIsNewMovementDialogOpen}
        products={products}
        categories={categories}
        onSelectProduct={(product, type) => {
          setSelectedProduct(product);
          setMovementType(type);
          setIsNewMovementDialogOpen(false);
          setIsDialogOpen(true);
        }}
      />
    </div>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] p-0 w-[95vw] max-h-[90vh] overflow-hidden bg-background border-none shadow-xl">
        <div className="flex flex-col h-full">
          {/* Cabeçalho */}
          <div className="p-6 pb-3">
            <DialogTitle className="text-xl font-bold">
              Registrar Movimentação
            </DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Selecione o produto e o tipo de movimentação a ser registrada.
            </DialogDescription>
          </div>

          {/* Abas de tipo de movimentação */}
          <Tabs 
            defaultValue="entrada" 
            onValueChange={(value) => setMovementType(value as 'entrada' | 'saida')} 
            className="p-0 flex-1 flex flex-col"
          >
            <div className="px-6 pt-2">
              <TabsList className="grid w-full grid-cols-2 h-10 p-0.5">
                <TabsTrigger 
                  value="entrada" 
                  className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Entrada
                </TabsTrigger>
                <TabsTrigger 
                  value="saida" 
                  className="text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Saída
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Filtros e listagem de produtos */}
            <div className="px-6 py-4 flex-1 flex flex-col overflow-hidden">
              <div className="space-y-4 mb-4">
                {/* Campo de busca */}
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou código do produto..."
                    className="pl-9 w-full h-10"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Seletor de categoria */}
                <Select 
                  value={categoryFilter} 
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Filtrar por categoria" />
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

              {/* Lista de produtos */}
              <div className="border rounded-md overflow-hidden flex-1 min-h-[300px] bg-card">
                <div className="h-full overflow-y-auto max-h-[350px]">
                  {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
                      <Package className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
                      <p className="text-muted-foreground font-medium">Nenhum produto encontrado</p>
                      <p className="text-xs text-muted-foreground mt-1">Tente ajustar os filtros ou adicione produtos ao estoque</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                        <tr>
                          <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 w-[50%]">Produto</th>
                          <th className="text-center text-xs font-medium text-muted-foreground px-2 py-2.5 w-[20%]">Estoque</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5 w-[30%]"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredProducts.map(product => (
                          <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <div className="font-medium text-sm line-clamp-1">{product.name}</div>
                                <div className="flex items-center flex-wrap gap-1 sm:gap-2">
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted border border-muted-foreground/20 font-mono inline-block max-w-[100px] truncate">
                                    {product.code}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {getCategoryName(product.category_id)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="text-center px-2 py-3">
                              <div className={`inline-flex justify-center min-w-8 px-2.5 py-1 rounded-full text-sm font-medium ${
                                product.quantity <= product.min_quantity 
                                  ? 'bg-destructive/10 text-destructive' 
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                {product.quantity}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant={movementType === 'entrada' ? 'default' : 'custom-blue'}
                                onClick={() => onSelectProduct(product, movementType)}
                              >
                                Selecionar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Movements;
