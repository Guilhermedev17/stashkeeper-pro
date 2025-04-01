
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import ProductList from '@/components/products/ProductList';
import ProductFilters from '@/components/products/ProductFilters';
import AddProductDialog from '@/components/products/AddProductDialog';
import EditProductDialog from '@/components/products/EditProductDialog';
import DeleteProductDialog from '@/components/products/DeleteProductDialog';
import MovementDialog from '@/components/products/MovementDialog';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
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
  
  const [newProduct, setNewProduct] = useState({
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
    deleteProduct
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
        categoryId: p.category_id,
        quantity: p.quantity,
        minQuantity: p.min_quantity,
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
      
      const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;

      let matchesStatus = true;
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'critico') {
          matchesStatus = product.quantity <= product.minQuantity;
        } else if (selectedStatus === 'baixo') {
          matchesStatus = product.quantity > product.minQuantity && product.quantity <= product.minQuantity * 1.5;
        } else if (selectedStatus === 'normal') {
          matchesStatus = product.quantity > product.minQuantity * 1.5;
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
      category_id: selectedProduct.categoryId,
      quantity: selectedProduct.quantity,
      min_quantity: selectedProduct.minQuantity,
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

  const handleSelectedProductChange = (field: string, value: any) => {
    if (selectedProduct) {
      setSelectedProduct({ ...selectedProduct, [field]: value });
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sem categoria';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie o inventário de produtos do almoxarifado.
          </p>
        </div>
        
        <AddProductDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          categories={categories}
          newProduct={newProduct}
          onChange={handleNewProductChange}
          onSubmit={handleAddProduct}
        />
      </div>

      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      <ProductList
        products={filteredProducts}
        getCategoryName={getCategoryName}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onMovement={handleMovementClick}
      />

      <EditProductDialog
        product={selectedProduct}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        categories={categories}
        onUpdate={handleEditProduct}
        onChange={handleSelectedProductChange}
      />

      <DeleteProductDialog
        product={selectedProduct}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteProduct}
      />

      <MovementDialog
        product={selectedProduct}
        type={movementType}
        open={isMovementDialogOpen}
        onOpenChange={setIsMovementDialogOpen}
      />
    </div>
  );
};

export default Products;
