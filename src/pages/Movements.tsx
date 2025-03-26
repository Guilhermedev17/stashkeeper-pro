
import { useState } from 'react';
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
  RefreshCw, 
  Search,
  PlusSquare 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Movements = () => {
  const { products, loading, fetchProducts } = useSupabaseProducts();
  const { movements, loading: loadingMovements, fetchMovements } = useSupabaseMovements();
  const { categories } = useSupabaseCategories();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isNewMovementDialogOpen, setIsNewMovementDialogOpen] = useState(false);

  const handleOpenDialog = (product: any, type: 'entrada' | 'saida') => {
    setSelectedProduct(product);
    setMovementType(type);
    setIsDialogOpen(true);
  };

  const handleRefresh = () => {
    fetchProducts();
    fetchMovements();
  };

  const handleOpenNewMovementDialog = () => {
    setMovementType('entrada');
    setIsNewMovementDialogOpen(true);
  };

  // Filter products based on search term and selected category
  const filteredProducts = products.filter(product => {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimentações</h1>
          <p className="text-muted-foreground">
            Registre entradas e saídas de produtos do estoque.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenNewMovementDialog} className="gap-2">
            <PlusSquare className="h-4 w-4" />
            Registrar Movimentação
          </Button>
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros de busca e categoria */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar produtos..."
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select 
          value={selectedCategory} 
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Categoria" />
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownUp className="h-5 w-5" />
              Controle de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Estoque Atual</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs">
                      {product.code}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.description}</div>
                    </TableCell>
                    <TableCell>
                      {getCategoryName(product.category_id)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded text-sm ${
                        product.quantity <= product.min_quantity 
                          ? 'bg-destructive/10 text-destructive' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {product.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleOpenDialog(product, 'entrada')}
                        >
                          <PlusCircle className="h-4 w-4 text-green-500" />
                          Entrada
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleOpenDialog(product, 'saida')}
                        >
                          <MinusCircle className="h-4 w-4 text-blue-500" />
                          Saída
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog para produto selecionado */}
      <MovementDialog
        product={selectedProduct}
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

// Componente para seleção de produto quando o usuário clica em "Registrar Movimentação"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MovementProductSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: any[];
  categories: any[];
  onSelectProduct: (product: any, type: 'entrada' | 'saida') => void;
}

const MovementProductSelector = ({
  open,
  onOpenChange,
  products,
  categories,
  onSelectProduct
}: MovementProductSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');

  // Filter products based on search term and category
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Registrar Movimentação</DialogTitle>
          <DialogDescription>
            Selecione o produto e o tipo de movimentação a ser registrada.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="entrada" onValueChange={(value) => setMovementType(value as 'entrada' | 'saida')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="entrada">Entrada</TabsTrigger>
            <TabsTrigger value="saida">Saída</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 my-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
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
            <SelectTrigger className="w-[180px]">
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

        <div className="max-h-[300px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.code}</div>
                    </TableCell>
                    <TableCell>{getCategoryName(product.category_id)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded text-sm ${
                        product.quantity <= product.min_quantity 
                          ? 'bg-destructive/10 text-destructive' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {product.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm" 
                        onClick={() => onSelectProduct(product, movementType)}
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
      </DialogContent>
    </Dialog>
  );
};

export default Movements;
