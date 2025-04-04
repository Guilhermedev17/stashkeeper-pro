import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { Product } from '@/components/products/ModernProductList';
import ModernProductList from '@/components/products/ModernProductList';
import ModernProductFilters from '@/components/products/ModernProductFilters';
import ModernAddProductDialog from '@/components/products/ModernAddProductDialog';
import ModernEditProductDialog from '@/components/products/ModernEditProductDialog';
import ModernDeleteProductDialog from '@/components/products/ModernDeleteProductDialog';
import ModernMovementDialog from '@/components/products/ModernMovementDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PlusSquare, CheckSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ImportExcelButton from '@/components/ImportExcelButton';
import PageWrapper from '@/components/layout/PageWrapper';
import { ModernHeader, ModernFilters, ModernTable } from '@/components/layout/modern';
import PageLoading from '@/components/PageLoading';
import ResponsiveTable from '@/components/ResponsiveTable';

// Interface para o EditProductDialog
interface EditProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  currentQty: number;
  minQty: number;
  unit: string;
}

// Interface para o DeleteProductDialog
interface DeleteProduct {
  id: string;
  name: string;
  code: string;
}

// Interface para o MovementDialog
interface MovementProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  unit: string;
}

// Interface para o NewProduct usado no AddProductDialog e ProductForm
interface NewProduct {
  code: string;
  name: string;
  description: string;
  category: string;
  initialQty: number;
  minQty: number;
  unit: string;
}

const Products = () => {

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();
  const { user } = useAuth();
  const {
    products: supabaseProducts,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    addMovement
  } = useSupabaseProducts();

  const { categories } = useSupabaseCategories();

  // Verificar parâmetros da URL ao carregar a página
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status');

    if (statusParam && ['all', 'normal', 'baixo', 'critico'].includes(statusParam)) {
      setSelectedStatus(statusParam);
    }

    const productParam = params.get('product');
    if (productParam) {
      const product = products.find(p => p.id === productParam);
      if (product) {
        setSelectedProduct(product);
      }
    }

    const typeParam = params.get('type');
    if (typeParam === 'entrada' || typeParam === 'saida') {
      setMovementType(typeParam);
      if (productParam && selectedProduct) {
        setIsMovementDialogOpen(true);
      }
    }
  }, [products]);

  // Load products from Supabase
  useEffect(() => {
    if (supabaseProducts.length > 0) {
      const formattedProducts = supabaseProducts.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        category_id: p.category_id,
        quantity: p.quantity,
        min_quantity: p.min_quantity,
        unit: p.unit,
        createdAt: new Date(p.created_at)
      }));
      setProducts(formattedProducts);
    }
  }, [supabaseProducts]);

  // Filter products when search term or category changes
  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = products.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(lowercasedFilter) ||
        product.code.toLowerCase().includes(lowercasedFilter) ||
        product.description?.toLowerCase().includes(lowercasedFilter);

      const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;

      let matchesStatus = true;
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'critico') {
          matchesStatus = product.quantity <= product.min_quantity;
        } else if (selectedStatus === 'baixo') {
          matchesStatus = product.quantity > product.min_quantity && product.quantity <= product.min_quantity * 1.5;
        } else if (selectedStatus === 'normal') {
          matchesStatus = product.quantity > product.min_quantity * 1.5;
        }
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, selectedStatus, products]);

  // Adicionar efeito de carregamento inicial
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Iniciar o tempo para medir quanto leva para carregar os dados
      const startTime = performance.now();

      // Esperar pelo menos que os produtos sejam carregados
      if (loading) {
        await new Promise(resolve => {
          const checkInterval = setInterval(() => {
            if (!loading) {
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
  }, [loading]);

  const handleAddProduct = async () => {
    console.log("handleAddProduct chamado - iniciando adição de produto");
    try {
      const result = await addProduct({
        code: '',
        name: '',
        description: '',
        category_id: '',
        quantity: 0,
        min_quantity: 0,
        unit: 'unidade'
      });

      console.log("Resultado da adição:", result);

      if (result.success) {
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;

    const result = await updateProduct(selectedProduct.id, {
      name: selectedProduct.name,
      description: selectedProduct.description,
      category_id: selectedProduct.category_id,
      quantity: selectedProduct.quantity,
      min_quantity: selectedProduct.min_quantity,
      unit: selectedProduct.unit
    });

    if (result.success) {
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    const result = await deleteProduct(selectedProduct.id);

    if (result.success) {
      setIsDeleteDialogOpen(false);

      // Importante: Definir como null APÓS fechar o diálogo
      setTimeout(() => {
        setSelectedProduct(null);
      }, 100);
    }
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleMovementClick = (product: Product, type: 'entrada' | 'saida') => {
    setSelectedProduct(product);
    setMovementType(type);
    setIsMovementDialogOpen(true);
  };

  // Função para atualizar o selectedProduct com base no campo alterado
  const handleSelectedProductChange = (field: string, value: any) => {
    if (selectedProduct) {
      // Mapeia os campos da interface do EditProductDialog para a interface do Product
      if (field === 'category') {
        setSelectedProduct({ ...selectedProduct, category_id: value });
      } else if (field === 'minQty') {
        setSelectedProduct({ ...selectedProduct, min_quantity: value });
      } else if (field === 'currentQty') {
        setSelectedProduct({ ...selectedProduct, quantity: value });
      } else {
        setSelectedProduct({ ...selectedProduct, [field]: value });
      }
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sem categoria';
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Função para mapear Product para EditProduct com as propriedades corretas
  const mapProductToEditProduct = (product: Product): EditProduct => {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description,
      category: product.category_id,
      currentQty: product.quantity,
      minQty: product.min_quantity,
      unit: product.unit
    };
  };

  // Função para mapear Product para DeleteProduct
  const mapProductToDeleteProduct = (product: Product): DeleteProduct => {
    return {
      id: product.id,
      code: product.code,
      name: product.name
    };
  };

  // Função para mapear Product para MovementProduct
  const mapProductToMovementProduct = (product: Product): MovementProduct => {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description,
      unit: product.unit
    };
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
  };

  const handleDeleteMultiple = async (productIds: string[]) => {
    if (productIds.length === 0) return;

    let success = true;
    let deleted = 0;

    // Criar apenas uma notificação que pode ser atualizada
    const toastInstance = toast({
      title: "Exclusão em lote",
      description: `Iniciando exclusão de ${productIds.length} produtos...`,
      variant: "progress"
    });

    // Executa cada exclusão individualmente
    for (let index = 0; index < productIds.length; index++) {
      const id = productIds[index];

      // Atualizar o progresso em intervalos regulares
      const progressPercent = Math.floor((index / productIds.length) * 100);

      // Atualizar a notificação mais frequentemente (a cada produto ou a cada 5%)
      if (productIds.length < 10 || index % Math.max(1, Math.floor(productIds.length / 20)) === 0) {
        toastInstance.update({
          id: toastInstance.id,
          title: "Exclusão em andamento",
          description: `${index + 1} de ${productIds.length} produtos processados (${progressPercent}%)`,
          variant: "progress"
        });
      }

      // Usar o modo silencioso para evitar múltiplas notificações
      const result = await deleteProduct(id, { silent: true });
      if (result.success) {
        deleted++;
      } else {
        success = false;
      }
    }

    // Atualizar notificação final com o resultado
    // Incluir o número total e a porcentagem 100% para indicar conclusão
    toastInstance.update({
      id: toastInstance.id,
      title: success ? "Produtos excluídos" : "Exclusão parcial",
      description: success
        ? `${deleted} de ${productIds.length} produtos excluídos com sucesso (100%).`
        : `${deleted} de ${productIds.length} produtos foram excluídos (100%). Alguns produtos não puderam ser excluídos.`,
      variant: success ? "success" : "destructive"
    });
  };

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <div className="h-full p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Produtos</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Gerencie seu inventário de produtos
            </p>
          </div>
        </div>

        <PageLoading message="Carregando produtos..." />
      </div>
    );
  }

  return (
    <PageWrapper className="flex flex-col p-0">
      <div className="flex-1 w-full overflow-auto">
        <div className="mobile-container">
          <ModernHeader
            title="Produtos"
            subtitle="Visualize e gerencie todos os seus produtos."
            actions={
              <div className="mobile-btn-group">
                <ImportExcelButton />
                {!selectMode && (
                  <Button
                    type="button"
                    onClick={() => setIsAddDialogOpen(true)}
                    className="gap-2"
                    title="Adicionar novo produto"
                  >
                    <PlusSquare className="h-4 w-4" /> Novo Produto
                  </Button>
                )}
              </div>
            }
          />

          <div className="responsive-gap">
            <ModernFilters>
              <ModernProductFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectMode={selectMode}
                onToggleSelectMode={toggleSelectMode}
              />
            </ModernFilters>

            <div className="responsive-table">
              <ModernProductList
                products={filteredProducts}
                getCategoryName={getCategoryName}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onDeleteMultiple={handleDeleteMultiple}
                onMovement={handleMovementClick}
                selectMode={selectMode}
                onToggleSelectMode={toggleSelectMode}
              />
            </div>
          </div>
        </div>
      </div>

      <ModernEditProductDialog
        product={selectedProduct ? mapProductToEditProduct(selectedProduct) : undefined}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        categories={categories}
        onSave={(updatedProduct) => {
          if (selectedProduct) {
            // Map back from EditProduct to the format expected by updateProduct
            updateProduct(selectedProduct.id, {
              name: updatedProduct.name,
              description: updatedProduct.description,
              category_id: updatedProduct.category,
              quantity: updatedProduct.currentQty,
              min_quantity: updatedProduct.minQty,
              unit: updatedProduct.unit
            }).then(result => {
              if (result.success) {
                setIsEditDialogOpen(false);
                setSelectedProduct(null);
              }
            });
          }
        }}
      />

      <ModernDeleteProductDialog
        product={selectedProduct ? mapProductToDeleteProduct(selectedProduct) : undefined}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDelete={handleDeleteProduct}
      />

      <ModernMovementDialog
        product={selectedProduct ? mapProductToMovementProduct(selectedProduct) : undefined}
        type={movementType}
        open={isMovementDialogOpen}
        onOpenChange={setIsMovementDialogOpen}
      />

      <ModernAddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        categories={categories}
        onAdd={(product) => {
          // Map from our dialog's NewProduct to the format expected by addProduct
          addProduct({
            code: product.code,
            name: product.name,
            description: product.description,
            category_id: product.category,
            quantity: product.initialQty,
            min_quantity: product.minQty,
            unit: product.unit
          }).then(result => {
            if (result.success) {
              setIsAddDialogOpen(false);
            }
          });
        }}
      />
    </PageWrapper>
  );
};

export default Products;
