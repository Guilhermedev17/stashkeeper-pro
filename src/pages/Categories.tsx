
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Edit, MoreHorizontal, Plus, Tags, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  productCount: number;
}

// Initial mock categories
const INITIAL_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Eletrônicos',
    description: 'Equipamentos eletrônicos e acessórios',
    createdAt: new Date('2023-03-15'),
    productCount: 18,
  },
  {
    id: '2',
    name: 'Material de Escritório',
    description: 'Papelaria e materiais para escritório',
    createdAt: new Date('2023-02-20'),
    productCount: 42,
  },
  {
    id: '3',
    name: 'Móveis',
    description: 'Móveis e equipamentos para escritório',
    createdAt: new Date('2023-04-08'),
    productCount: 11,
  },
  {
    id: '4',
    name: 'Equipamentos',
    description: 'Equipamentos diversos para o ambiente de trabalho',
    createdAt: new Date('2023-05-12'),
    productCount: 24,
  },
];

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
  });
  
  const { toast } = useToast();

  const handleAddCategory = () => {
    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      description: newCategory.description,
      createdAt: new Date(),
      productCount: 0,
    };
    
    setCategories([...categories, category]);
    setIsAddDialogOpen(false);
    setNewCategory({
      name: '',
      description: '',
    });
    
    toast({
      title: 'Categoria adicionada',
      description: `${category.name} foi adicionada com sucesso.`,
    });
  };

  const handleEditCategory = () => {
    if (!selectedCategory) return;
    
    const updatedCategories = categories.map(category => 
      category.id === selectedCategory.id ? selectedCategory : category
    );
    
    setCategories(updatedCategories);
    setIsEditDialogOpen(false);
    setSelectedCategory(null);
    
    toast({
      title: 'Categoria atualizada',
      description: `${selectedCategory.name} foi atualizada com sucesso.`,
    });
  };

  const handleDeleteCategory = () => {
    if (!selectedCategory) return;
    
    // Check if category has products
    if (selectedCategory.productCount > 0) {
      toast({
        title: 'Não é possível excluir',
        description: `Esta categoria contém ${selectedCategory.productCount} produtos associados.`,
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
      return;
    }
    
    const updatedCategories = categories.filter(category => category.id !== selectedCategory.id);
    
    setCategories(updatedCategories);
    setIsDeleteDialogOpen(false);
    
    toast({
      title: 'Categoria removida',
      description: `${selectedCategory.name} foi removida com sucesso.`,
    });
    
    setSelectedCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias de produtos do almoxarifado.
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Categoria</DialogTitle>
              <DialogDescription>
                Preencha os detalhes da nova categoria.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="Nome da categoria"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={newCategory.description}
                  onChange={e => setNewCategory({...newCategory, description: e.target.value})}
                  placeholder="Descrição da categoria"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" onClick={handleAddCategory}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-center">Produtos</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Tags className="h-8 w-8 mb-2" />
                    <p>Nenhuma categoria encontrada</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              categories.map(category => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    {category.name}
                  </TableCell>
                  <TableCell>
                    {category.description}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                      {category.productCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    {category.createdAt.toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Atualize os detalhes da categoria selecionada.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCategory && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={selectedCategory.name}
                  onChange={e => setSelectedCategory({...selectedCategory, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Input
                  id="edit-description"
                  value={selectedCategory.description}
                  onChange={e => setSelectedCategory({...selectedCategory, description: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCategory}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Categoria</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Tem certeza que deseja excluir esta categoria?
            </DialogDescription>
          </DialogHeader>
          
          {selectedCategory && (
            <div className="py-4">
              <p className="font-medium">
                {selectedCategory.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedCategory.description}
              </p>
              
              {selectedCategory.productCount > 0 && (
                <p className="mt-4 text-sm text-destructive">
                  Esta categoria contém {selectedCategory.productCount} produtos associados e não pode ser excluída.
                </p>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCategory}
              disabled={selectedCategory?.productCount ? selectedCategory.productCount > 0 : false}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
