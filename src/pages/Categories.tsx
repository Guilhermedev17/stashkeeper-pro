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
      <PageWrapper>
        <ModernHeader
          title="Categorias"
          subtitle="Gerencie as categorias para organizar seus produtos."
        />
        <PageLoading message="Carregando categorias..." />
      </PageWrapper>
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
              <Button 
                type="button" 
                onClick={() => setIsDialogOpen(true)} 
                className="gap-1.5"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs">Nova Categoria</span>
              </Button>
            }
          />

          <ModernFilters className="mt-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </ModernFilters>

          {error && (
            <Alert variant="destructive" className="mt-4 mb-4 text-sm">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          <ModernTable
            title="Categorias"
            className="flex-1 mt-4 shadow-sm"
          >
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-14 text-muted-foreground">
                <Folder className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <h3 className="text-sm font-medium mb-1">Nenhuma categoria encontrada</h3>
                <p className="text-xs text-muted-foreground/70 max-w-md mx-auto">
                  {searchTerm ? 'Tente ajustar sua busca ou crie uma nova categoria.' : 'Crie categorias para organizar seus produtos.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nome</TableHead>
                    <TableHead className="text-xs">Descrição</TableHead>
                    <TableHead className="text-right text-xs">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map(category => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium text-sm">{category.name}</TableCell>
                      <TableCell className="text-sm">{category.description || '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuLabel className="text-xs">Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openEditDialog(category)}
                              className="text-xs cursor-pointer"
                            >
                              <Edit className="mr-2 h-3.5 w-3.5" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive text-xs cursor-pointer"
                              onClick={() => openDeleteDialog(category)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-primary" />
              Nova Categoria
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-medium">
                Nome
              </Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Nome da categoria"
                className="h-9 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-xs font-medium">
                Descrição <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="description"
                value={newCategory.description || ''}
                onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Descreva a categoria brevemente"
                className="text-sm min-h-[80px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddCategory}
              disabled={!newCategory.name.trim()}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar categoria */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <FolderEdit className="h-4 w-4 text-primary" />
              Editar Categoria
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="text-xs font-medium">
                Nome
              </Label>
              <Input
                id="edit-name"
                value={selectedCategory?.name || ''}
                onChange={e => selectedCategory && setSelectedCategory({ ...selectedCategory, name: e.target.value })}
                placeholder="Nome da categoria"
                className="h-9 text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-xs font-medium">
                Descrição <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="edit-description"
                value={selectedCategory?.description || ''}
                onChange={e => selectedCategory && setSelectedCategory({ ...selectedCategory, description: e.target.value })}
                placeholder="Descreva a categoria brevemente"
                className="text-sm min-h-[80px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleEditCategory}
              disabled={!selectedCategory?.name.trim()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar exclusão de categoria */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              Excluir Categoria
            </DialogTitle>
            <DialogDescription className="text-xs pt-2">
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 px-1">
            <div className="p-3 rounded-lg border bg-muted/40">
              <h3 className="font-medium text-sm">{selectedCategory?.name}</h3>
              {selectedCategory?.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedCategory.description}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteCategory}
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
