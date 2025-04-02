import { useState } from 'react';
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
  const [selectedType, setSelectedType] = useState('all');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'year' | undefined>(undefined);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setDateRange(undefined);
  };

  const handleDateRangeSelect = (range: 'day' | 'week' | 'month' | 'year') => {
    setDateRange(range);
    setDate(undefined);
  };

  const clearDateFilter = () => {
    setDate(undefined);
    setDateRange(undefined);
  };
  
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
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 w-[95vw] max-h-[90vh] overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-2">
          <DialogTitle className="text-lg sm:text-xl">Registrar Movimentação</DialogTitle>
          <DialogDescription className="text-sm">
            Selecione o produto e o tipo de movimentação a ser registrada.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="entrada" onValueChange={(value) => setMovementType(value as 'entrada' | 'saida')} className="px-4 sm:px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="entrada">Entrada</TabsTrigger>
            <TabsTrigger value="saida">Saída</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="p-4 sm:p-6 pt-4 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative sm:col-span-2">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                className="pl-8"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select 
              value={categoryFilter} 
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="text-xs sm:text-sm">
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
          
            <Select 
          value={selectedType} 
          onValueChange={setSelectedType}
        >
          <SelectTrigger className="w-full text-xs sm:text-sm">
            <SelectValue placeholder="Filtrar por Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>

        <DateRangeFilter
              date={date}
              dateRange={dateRange}
              onDateSelect={handleDateSelect}
              onDateRangeSelect={handleDateRangeSelect}
              onClearFilter={clearDateFilter}
              placeholder="Filtrar por Data"
            />
          </div>

          <div className="border rounded-md overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="px-2 sm:px-4 py-2">Produto</TableHead>
                    <TableHead className="hidden sm:table-cell px-2 sm:px-4 py-2">Categoria</TableHead>
                    <TableHead className="text-center w-[60px] px-2 sm:px-4 py-2">Estoque</TableHead>
                    <TableHead className="w-[80px] px-2 sm:px-4 py-2"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 px-2 sm:px-4">
                        Nenhum produto encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map(product => (
                      <TableRow key={product.id}>
                        <TableCell className="px-2 sm:px-4 py-2">
                          <div className="font-medium text-sm line-clamp-1">{product.name}</div>
                          <div className="text-xs bg-secondary/40 dark:bg-secondary/20 px-2 py-0.5 rounded border border-border/50 inline-block mt-1 font-mono">
                            {product.code}
                          </div>
                          <div className="text-xs text-muted-foreground sm:hidden mt-1 line-clamp-1">
                            {getCategoryName(product.category_id)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell px-2 sm:px-4 py-2">
                          {getCategoryName(product.category_id)}
                        </TableCell>
                        <TableCell className="text-center px-2 sm:px-4 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            product.quantity <= product.min_quantity 
                              ? 'bg-destructive/10 text-destructive' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {product.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 sm:px-4 py-2">
                          <Button
                            size="sm" 
                            onClick={() => onSelectProduct(product, movementType)}
                            className="w-full text-xs whitespace-nowrap"
                          >
                            Selecionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Movements;
