import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Edit,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Trash2,
  Plus,
  Search,
  FolderEdit
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseCategories, Category } from '@/hooks/useSupabaseCategories';
import PageWrapper from '@/components/layout/PageWrapper';
import { ModernHeader, ModernFilters, ModernTable } from '@/components/layout/modern';
import PageLoading from '@/components/PageLoading';

const Categories = () => {
  const { categories, loading, error, fetchCategories, addCategory, updateCategory, deleteCategory } = useSupabaseCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;

    const result = await addCategory({
      name: newCategory.name.trim(),
      description: newCategory.description.trim() || null
    });

    if (result.success) {
      setNewCategory({ name: '', description: '' });
      setIsDialogOpen(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !selectedCategory.name.trim()) return;

    const result = await updateCategory(selectedCategory.id, {
      name: selectedCategory.name.trim(),
      description: selectedCategory.description?.trim() || null
    });

    if (result.success) {
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    const result = await deleteCategory(selectedCategory.id);

    if (result.success) {
      setIsDeleteDialogOpen(false);
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Iniciar o tempo para medir quanto leva para carregar os dados
      const startTime = performance.now();

      // Esperar pelo menos que as categorias sejam carregadas
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
      // Se os dados carregarem muito rápido, mostramos o loading por pelo menos 300ms
      // Se os dados demorarem mais que isso, não adicionamos atraso adicional
      const minLoadingTime = 300;
      const remainingTime = Math.max(0, minLoadingTime - loadTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setIsLoading(false);
    };

    loadData();
  }, [loading]);

  if (isLoading) {
    return (
      <div className="h-full p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Categorias</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Gerencie as categorias de produtos
            </p>
          </div>
        </div>

        <PageLoading message="Carregando categorias..." />
      </div>
    );
  }

  return (
    <PageWrapper className="flex flex-col p-0">
      <div className="flex-1 w-full overflow-auto">
        <div className="w-full px-2 sm:px-4 py-4 sm:py-6">
          <ModernHeader
            title="Categorias"
            subtitle="Gerencie as categorias para organizar seus produtos."
            actions={
              <Button type="button" onClick={() => setIsDialogOpen(true)} className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span>Nova Categoria</span>
              </Button>
            }
          />

          <ModernFilters className="sm:grid-cols-1">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
            </div>
          </ModernFilters>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          <ModernTable
            title="Categorias"
            className="flex-1"
          >
            {loading ? (
              <div className="flex justify-center items-center py-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Folder className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium mb-1">Nenhuma categoria encontrada</h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  {searchTerm ? 'Tente ajustar sua busca ou crie uma nova categoria.' : 'Crie categorias para organizar seus produtos.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map(category => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description || '-'}</TableCell>
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
                              onClick={() => openEditDialog(category)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => openDeleteDialog(category)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ModernTable>
        </div>
      </div>

      {/* Dialog para adicionar categoria */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              Nova Categoria
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid gap-3">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome
              </Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Nome da categoria"
                className="w-full"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="description"
                value={newCategory.description || ''}
                onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Descreva a categoria brevemente"
                className="w-full min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="w-[120px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddCategory}
              disabled={!newCategory.name.trim()}
              className="w-[120px]"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar categoria */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FolderEdit className="h-5 w-5 text-primary" />
              Editar Categoria
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid gap-3">
              <Label htmlFor="edit-name" className="text-sm font-medium">
                Nome
              </Label>
              <Input
                id="edit-name"
                value={selectedCategory?.name || ''}
                onChange={e => selectedCategory && setSelectedCategory({ ...selectedCategory, name: e.target.value })}
                placeholder="Nome da categoria"
                className="w-full"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="edit-description" className="text-sm font-medium">
                Descrição <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="edit-description"
                value={selectedCategory?.description || ''}
                onChange={e => selectedCategory && setSelectedCategory({ ...selectedCategory, description: e.target.value })}
                placeholder="Descreva a categoria brevemente"
                className="w-full min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="w-[120px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleEditCategory}
              disabled={!selectedCategory?.name.trim()}
              className="w-[120px]"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar exclusão de categoria */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Excluir Categoria
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 px-1">
            <div className="p-4 rounded-lg border bg-muted/40">
              <h3 className="font-medium">{selectedCategory?.name}</h3>
              {selectedCategory?.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedCategory.description}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-[120px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteCategory}
              className="w-[120px]"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default Categories;
