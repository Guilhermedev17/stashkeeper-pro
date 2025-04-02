import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import ProductList, { Product } from '@/components/products/ProductList';
import ProductFilters from '@/components/products/ProductFilters';
import AddProductDialog from '@/components/products/AddProductDialog';
import EditProductDialog from '@/components/products/EditProductDialog';
import DeleteProductDialog from '@/components/products/DeleteProductDialog';
import MovementDialog from '@/components/products/MovementDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PlusSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Interface para o EditProductDialog
interface EditProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  categoryId: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  createdAt: Date;
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
  categoryId: string;
  quantity: number;
  minQuantity: number;
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
  
  const [newProduct, setNewProduct] = useState<NewProduct>({
    code: '',
    name: '',
    description: '',
    categoryId: '',
    quantity: 0,
    minQuantity: 0,
    unit: 'unidade',
  });
  
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

  const handleAddProduct = async () => {
    const result = await addProduct({
      code: newProduct.code,
      name: newProduct.name,
      description: newProduct.description,
      category_id: newProduct.categoryId,
      quantity: newProduct.quantity,
      min_quantity: newProduct.minQuantity,
      unit: newProduct.unit
    });
    
    if (result.success) {
      setIsAddDialogOpen(false);
      setNewProduct({
        code: '',
        name: '',
        description: '',
        categoryId: '',
        quantity: 0,
        minQuantity: 0,
        unit: 'unidade',
      });
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

  const handleNewProductChange = (field: string, value: any) => {
    setNewProduct({ ...newProduct, [field]: value });
  };

  // Função para atualizar o selectedProduct com base no campo alterado
  const handleSelectedProductChange = (field: string, value: any) => {
    if (selectedProduct) {
      // Mapeia os campos da interface do EditProductDialog para a interface do Product
      if (field === 'categoryId') {
        setSelectedProduct({ ...selectedProduct, category_id: value });
      } else if (field === 'minQuantity') {
        setSelectedProduct({ ...selectedProduct, min_quantity: value });
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
      categoryId: product.category_id,
      quantity: product.quantity,
      minQuantity: product.min_quantity,
      unit: product.unit,
      createdAt: product.createdAt
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

  return (
    <div className="px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Visualize e gerencie todos os seus produtos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2" title="Adicionar novo produto">
            <PlusSquare className="h-4 w-4" /> Novo Produto
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <ProductFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />
      </div>

      <div className="rounded-md border overflow-hidden">
        <ProductList
          products={filteredProducts}
          getCategoryName={getCategoryName}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onMovement={handleMovementClick}
        />
      </div>

      <EditProductDialog
        product={selectedProduct ? mapProductToEditProduct(selectedProduct) : null}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        categories={categories}
        onUpdate={handleEditProduct}
        onChange={handleSelectedProductChange}
      />

      <DeleteProductDialog
        product={selectedProduct ? mapProductToDeleteProduct(selectedProduct) : null}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteProduct}
      />

      <MovementDialog 
        product={selectedProduct ? mapProductToMovementProduct(selectedProduct) : null}
        type={movementType}
        open={isMovementDialogOpen}
        onOpenChange={setIsMovementDialogOpen}
      />
      
      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        categories={categories}
        newProduct={newProduct}
        onChange={handleNewProductChange}
        onSubmit={handleAddProduct}
      />
    </div>
  );
};

export default Products;
