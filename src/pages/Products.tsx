
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import ProductList from '@/components/products/ProductList';
import ProductFilters from '@/components/products/ProductFilters';
import AddProductDialog from '@/components/products/AddProductDialog';
import EditProductDialog from '@/components/products/EditProductDialog';
import DeleteProductDialog from '@/components/products/DeleteProductDialog';

// Mock data
const MOCK_CATEGORIES = [
  { id: '1', name: 'Eletrônicos' },
  { id: '2', name: 'Material de Escritório' },
  { id: '3', name: 'Móveis' },
  { id: '4', name: 'Equipamentos' },
];

interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  categoryId: string;
  quantity: number;
  minQuantity: number;
  createdAt: Date;
}

const generateProductCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    categoryId: '',
    quantity: 0,
    minQuantity: 0,
  });
  
  const { toast } = useToast();
  const { products: supabaseProducts, loading, error, fetchProducts } = useSupabaseProducts();

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
        createdAt: new Date(p.created_at)
      }));
      setProducts(formattedProducts);
    } else {
      // Fallback to mock data if no products from Supabase
      setProducts([
        {
          id: '1',
          code: 'PRD47X29',
          name: 'Notebook Dell',
          description: 'Notebook Dell Inspiron 15',
          categoryId: '1',
          quantity: 5,
          minQuantity: 2,
          createdAt: new Date('2023-05-15'),
        },
        {
          id: '2',
          code: 'PRD81Y36',
          name: 'Papel A4',
          description: 'Resma de papel A4, 500 folhas',
          categoryId: '2',
          quantity: 50,
          minQuantity: 10,
          createdAt: new Date('2023-06-20'),
        },
        {
          id: '3',
          code: 'PRD24Z51',
          name: 'Cadeira Ergonômica',
          description: 'Cadeira de escritório ergonômica',
          categoryId: '3',
          quantity: 8,
          minQuantity: 3,
          createdAt: new Date('2023-04-08'),
        },
        {
          id: '4',
          code: 'PRD63W18',
          name: 'Projetor',
          description: 'Projetor multimídia HD',
          categoryId: '4',
          quantity: 2,
          minQuantity: 1,
          createdAt: new Date('2023-07-02'),
        },
      ]);
    }
  }, [supabaseProducts]);

  // Filter products when search term changes
  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = products.filter(product => {
      return (
        product.name.toLowerCase().includes(lowercasedFilter) ||
        product.code.toLowerCase().includes(lowercasedFilter) ||
        product.description.toLowerCase().includes(lowercasedFilter)
      );
    });
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleAddProduct = () => {
    const productCode = generateProductCode();
    
    const product: Product = {
      id: Date.now().toString(),
      code: productCode,
      name: newProduct.name,
      description: newProduct.description,
      categoryId: newProduct.categoryId,
      quantity: newProduct.quantity,
      minQuantity: newProduct.minQuantity || 0,
      createdAt: new Date(),
    };
    
    setProducts([...products, product]);
    setIsAddDialogOpen(false);
    setNewProduct({
      name: '',
      description: '',
      categoryId: '',
      quantity: 0,
      minQuantity: 0,
    });
    
    toast({
      title: 'Produto adicionado',
      description: `${product.name} foi adicionado com sucesso.`,
    });
  };

  const handleEditProduct = () => {
    if (!selectedProduct) return;
    
    const updatedProducts = products.map(product => 
      product.id === selectedProduct.id ? selectedProduct : product
    );
    
    setProducts(updatedProducts);
    setIsEditDialogOpen(false);
    setSelectedProduct(null);
    
    toast({
      title: 'Produto atualizado',
      description: `${selectedProduct.name} foi atualizado com sucesso.`,
    });
  };

  const handleDeleteProduct = () => {
    if (!selectedProduct) return;
    
    const updatedProducts = products.filter(product => product.id !== selectedProduct.id);
    
    setProducts(updatedProducts);
    setIsDeleteDialogOpen(false);
    
    toast({
      title: 'Produto removido',
      description: `${selectedProduct.name} foi removido com sucesso.`,
    });
    
    // Importante: Definir como null APÓS fechar o diálogo
    setTimeout(() => {
      setSelectedProduct(null);
    }, 100);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
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
    const category = MOCK_CATEGORIES.find(cat => cat.id === categoryId);
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
          categories={MOCK_CATEGORIES}
          newProduct={newProduct}
          onChange={handleNewProductChange}
          onSubmit={handleAddProduct}
        />
      </div>

      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categories={MOCK_CATEGORIES}
      />

      <ProductList
        products={filteredProducts}
        getCategoryName={getCategoryName}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      <EditProductDialog
        product={selectedProduct}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        categories={MOCK_CATEGORIES}
        onUpdate={handleEditProduct}
        onChange={handleSelectedProductChange}
      />

      <DeleteProductDialog
        product={selectedProduct}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteProduct}
      />
    </div>
  );
};

export default Products;
