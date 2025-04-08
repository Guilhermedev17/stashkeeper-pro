import { useState, useEffect } from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseMovements } from '@/hooks/useSupabaseMovements';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import ModernMovementDialog from '@/components/products/ModernMovementDialog';
import {
  Package,
  ArrowDownUp,
  PlusCircle,
  MinusCircle,
  PlusSquare,
  CalendarDays,
  Calendar as CalendarIcon,
  CirclePlus,
  SearchIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  Edit,
  Trash2,
  AlertCircle,
  Plus,
  InfoIcon
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
import PageWrapper from '@/components/layout/PageWrapper';
import { ModernHeader, ModernFilters, ModernTable } from '@/components/layout/modern';
import { Badge } from '@/components/ui/badge';
import PageLoading from '@/components/PageLoading';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { formatQuantity } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { IntegrityCheck } from '@/components/IntegrityCheck';

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
  employee_name?: string;
  employee_id?: string;
  notes?: string;
  deleted?: boolean;
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

const getUnitAbbreviation = (unit: string): string => {
  switch (unit.toLowerCase()) {
    case 'un': return 'UN';
    case 'unidade': return 'UN';
    case 'kg': return 'KG';
    case 'g': return 'G';
    case 'gramas': return 'G';
    case 'l': return 'L';
    case 'litros': return 'L';
    case 'ml': return 'ML';
    case 'cx': return 'CX';
    case 'caixa': return 'CX';
    case 'pct': return 'PCT';
    case 'pacote': return 'PCT';
    case 'rl': return 'RL';
    case 'rolo': return 'RL';
    case 'par': return 'PAR';
    case 'm': return 'M';
    case 'metros': return 'M';
    case 'cm': return 'CM';
    default: return unit.toUpperCase();
  }
};

const Movements = () => {
  const { products, loading: loadingProducts, fetchProducts } = useSupabaseProducts();
  const { movements, loading: loadingMovements, fetchMovements, deleteMovementLocally, deleteMovement } = useSupabaseMovements();
  const { categories } = useSupabaseCategories();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showCompensations, setShowCompensations] = useState<boolean>(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'year' | undefined>(
    undefined
  );
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isNewMovementDialogOpen, setIsNewMovementDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'predefined' | 'custom'>('predefined');
  const [isLoading, setIsLoading] = useState(true);
  const [movementToEdit, setMovementToEdit] = useState<Movement | null>(null);
  const [movementToDelete, setMovementToDelete] = useState<Movement | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingMovement, setIsDeletingMovement] = useState(false);
  const [localMovements, setLocalMovements] = useState<Movement[]>([]);
  // Flag para controlar quando atualizar movimentações
  const [skipMovementUpdate, setSkipMovementUpdate] = useState(false);
  const [isDeleteCompensationDialogOpen, setIsDeleteCompensationDialogOpen] = useState(false);
  const [compensationToDelete, setCompensationToDelete] = useState<Movement | null>(null);
  const [isDeletingCompensation, setIsDeletingCompensation] = useState(false);

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

  // Adicionar efeito de carregamento inicial
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Iniciar o tempo para medir quanto leva para carregar os dados
      const startTime = performance.now();

      // Esperar pelo menos que os produtos e movimentos sejam carregados
      if (loadingProducts || loadingMovements) {
        await new Promise(resolve => {
          const checkInterval = setInterval(() => {
            if (!loadingProducts && !loadingMovements) {
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
  }, [loadingProducts, loadingMovements]);

  // Sincronizar movimentos do hook com o estado local
  useEffect(() => {
    if (!skipMovementUpdate) {
      console.log("[Movements] Sincronizando movimentos. Total recebido:", movements.length);
      
      // Carregar IDs de movimentações excluídas do localStorage para segurança adicional
      let deletedIdsFromStorage: string[] = [];
      try {
        const storedIds = localStorage.getItem('deletedMovementIds');
        if (storedIds) {
          deletedIdsFromStorage = JSON.parse(storedIds);
          console.log(`[Movements] Carregados ${deletedIdsFromStorage.length} IDs de movimentações excluídas do armazenamento local`);
        }
      } catch (error) {
        console.error('[Movements] Erro ao carregar IDs excluídos do localStorage:', error);
      }
      
      // Criar Set para verificação rápida
      const deletedIdSet = new Set(deletedIdsFromStorage);
      
      // Preservar movimentações filtradas quando já estiverem no estado local
      setLocalMovements(prevLocalMovements => {
        // Filtro de segurança para remover movimentações excluídas ou com ID na lista de excluídos
        const filterSafely = (movs: Movement[]) => {
          return movs.filter(m => 
            !m.deleted && 
            !deletedIdSet.has(m.id)
          );
        };
        
        // Caso ainda não tenhamos dados locais ou estejamos recarregando todos os dados
        if (prevLocalMovements.length === 0) {
          // Verificação extra para garantir que nenhuma movimentação excluída apareça
          const safeMovements = filterSafely(movements);
          console.log(`[Movements] Verificação de segurança removeu ${movements.length - safeMovements.length} movimentações marcadas como excluídas`);
          return safeMovements;
        }
        
        // Criar nova lista a partir dos movements recebidos garantindo segurança
        const safeMovements = filterSafely(movements);
        
        // Obter IDs que existem no estado atual mas não no novo (potencialmente excluídos)
        const prevIds = new Set(prevLocalMovements.map(m => m.id));
        const newIds = new Set(safeMovements.map(m => m.id));
        const potentiallyDeletedIds = new Set(
          [...prevIds].filter(id => !newIds.has(id))
        );
        
        if (potentiallyDeletedIds.size > 0) {
          console.log(`[Movements] Detectados ${potentiallyDeletedIds.size} IDs potencialmente excluídos`);
        }
        
        // Criar listas de IDs para controlar o que incluir
        const idsToKeep = new Set(safeMovements.map(m => m.id));
        
        // Filtrar as movimentações locais para evitar duplicatas e movimentações excluídas
        const currentMovements = filterSafely(prevLocalMovements).filter(m => 
          (idsToKeep.has(m.id) || !potentiallyDeletedIds.has(m.id))
        );
        
        // Adicionar novas movimentações que não existem no estado local atual
        const currentIds = new Set(currentMovements.map(m => m.id));
        const newMovements = safeMovements.filter(m => !currentIds.has(m.id));
        
        console.log(`[Movements] Estado final: ${currentMovements.length} existentes + ${newMovements.length} novas = ${currentMovements.length + newMovements.length} total`);
        
        // Retornar a combinação de movimentações atuais + novas
        return [...newMovements, ...currentMovements];
      });
    }
  }, [movements, skipMovementUpdate]);

  // Forçar a atualização da interface quando localMovements mudar
  useEffect(() => {
    console.log(`[Movements] Estado localMovements atualizado com ${localMovements.length} movimentações`);
    
    // Verificação adicional para garantir que nenhuma movimentação excluída esteja presente
    const anyDeleted = localMovements.some(m => m.deleted === true);
    
    if (anyDeleted) {
      console.warn('[Movements] Detectadas movimentações marcadas como excluídas no estado localMovements. Realizando limpeza...');
      setLocalMovements(current => current.filter(m => !m.deleted));
    }
    
  }, [localMovements]);

  // Efeito para limpeza periódica das movimentações (sanitização)
  useEffect(() => {
    // Definir função de limpeza para ser mais fácil de rastrear
    const performCleanup = () => {
      if (localMovements.length === 0 || isDeletingMovement) {
        return; // Não fazer nada se não houver movimentações ou estiver em processo de exclusão
      }
      
      try {
        console.log('[Movements] Iniciando verificação de consistência...');
        
        // 1. Verificar se há movimentações marcadas como excluídas no estado local
        const locallyDeleted = localMovements.filter(m => m.deleted === true);
        
        // 2. Verificar IDs que já foram excluídos anteriormente (no localStorage)
        const deletedIds = JSON.parse(localStorage.getItem('deletedMovementIds') || '[]');
        const deletedIdSet = new Set(deletedIds);
        
        // 3. Identificar movimentações que devem ser removidas pelo ID
        const alsoRemoveById = localMovements.filter(m => 
          !m.deleted && deletedIdSet.has(m.id)
        );
        
        const totalToRemove = locallyDeleted.length + alsoRemoveById.length;
        
        if (totalToRemove > 0) {
          console.log(`[Movements] Sanitização: removendo ${totalToRemove} movimentações inconsistentes (${locallyDeleted.length} marcadas como excluídas + ${alsoRemoveById.length} nos IDs excluídos)`);
          
          // Obter todos os IDs a remover
          const idsToRemove = new Set([
            ...locallyDeleted.map(m => m.id),
            ...alsoRemoveById.map(m => m.id)
          ]);
          
          // Atualizar estado removendo todas as movimentações problemáticas
          setLocalMovements(current => 
            current.filter(m => !idsToRemove.has(m.id) && m.deleted !== true)
          );
        }
      } catch (error) {
        console.error('[Movements] Erro durante sanitização:', error);
      }
    };
    
    // Executar limpeza imediatamente na primeira renderização
    performCleanup();
    
    // Configurar intervalo para verificações periódicas (a cada 30 segundos)
    const cleanupInterval = setInterval(performCleanup, 30000);
    
    // Limpar intervalo quando o componente for desmontado
    return () => clearInterval(cleanupInterval);
  }, [localMovements, isDeletingMovement]);

  // Verificação de segurança extra ao montar o componente
  useEffect(() => {
    console.log('[Movements] Executando verificação de segurança inicial');
    
    // Verificar se há IDs excluídos no localStorage
    try {
      const deletedIds = JSON.parse(localStorage.getItem('deletedMovementIds') || '[]');
      const deletedIdSet = new Set(deletedIds);
      
      if (deletedIdSet.size > 0) {
        console.log(`[Movements] Encontrados ${deletedIdSet.size} IDs no registro de exclusões`);
        
        // Verificar se alguma movimentação no estado atual tem ID na lista de excluídos
        const conflictingMovements = movements.filter(m => deletedIdSet.has(m.id) || m.deleted === true);
        
        if (conflictingMovements.length > 0) {
          console.log(`[Movements] Detectadas ${conflictingMovements.length} movimentações que deveriam estar excluídas`);
          
          // Forçar atualização do estado para remover estas movimentações
          setSkipMovementUpdate(true);
          setLocalMovements(prev => prev.filter(m => !deletedIdSet.has(m.id) && m.deleted !== true));
          
          // Restaurar o comportamento normal após a limpeza
          setTimeout(() => setSkipMovementUpdate(false), 500);
        }
      }
    } catch (error) {
      console.error('[Movements] Erro durante verificação inicial:', error);
    }
  }, []);

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
    const hasMovements = localMovements.some(m =>
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

  // Função para abrir diálogo de edição de movimentação
  const handleEditMovement = (movement: Movement, product: ProductItem) => {
    setMovementToEdit(movement);
    setSelectedProduct(product);
    setMovementType(movement.type);
    setIsEditDialogOpen(true);
  };
  
  // Função para abrir diálogo de exclusão de movimentação
  const handleDeleteMovement = (movement: Movement) => {
    setMovementToDelete(movement);
    setIsDeleteDialogOpen(true);
  };
  
  // Função para confirmar exclusão de movimentação
  const confirmDeleteMovement = async () => {
    if (!movementToDelete) return;
    
    setIsDeletingMovement(true);
    console.log('[Movements] Iniciando exclusão de movimentação:', movementToDelete.id);
    
    try {
      // Usar a função melhorada do hook useSupabaseMovements com a opção silent
      // para evitar duplicação de notificação
      const result = await deleteMovement(movementToDelete.id);
      
      if (!result.success) {
        console.error('[Movements] Erro retornado pela função de exclusão:', result.error);
        throw new Error(result.error || 'Erro ao excluir movimentação');
      }
      
      console.log('[Movements] Movimentação excluída com sucesso');
      
      // Fechar diálogo e limpar estado
      setIsDeleteDialogOpen(false);
      setMovementToDelete(null);
      
      // Notificação removida daqui pois já é exibida pelo hook
      
    } catch (error: any) {
      console.error('[Movements] Erro ao excluir movimentação:', error);
      
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a movimentação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingMovement(false);
    }
  };

  // Função para abrir diálogo de exclusão permanente de compensação
  const handleDeleteCompensationPermanently = (movement: Movement) => {
    setCompensationToDelete(movement);
    setIsDeleteCompensationDialogOpen(true);
  };

  // Função para confirmar exclusão permanente da compensação
  const confirmDeleteCompensationPermanently = async () => {
    if (!compensationToDelete) return;
    
    setIsDeletingCompensation(true);
    console.log('[Movements] Iniciando exclusão permanente da compensação:', compensationToDelete.id);
    
    try {
      // Executar exclusão física no banco de dados
      const { error } = await supabase
        .from('movements')
        .delete()
        .eq('id', compensationToDelete.id);
      
      if (error) {
        console.error('[Movements] Erro ao excluir compensação permanentemente:', error);
        throw new Error(`Não foi possível excluir a compensação: ${error.message}`);
      }
      
      console.log('[Movements] Compensação excluída permanentemente com sucesso');
      
      // Remover do estado local
      setLocalMovements(current => 
        current.filter(m => m.id !== compensationToDelete.id)
      );
      
      // Fechar diálogo e limpar estado
      setIsDeleteCompensationDialogOpen(false);
      setCompensationToDelete(null);
      
      // Exibir notificação de sucesso
      toast({
        title: "Compensação excluída",
        description: "A compensação automática foi excluída permanentemente.",
        variant: "default",
        duration: 2000,
      });
      
    } catch (error: any) {
      console.error('[Movements] Erro ao excluir compensação permanentemente:', error);
      
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a compensação. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsDeletingCompensation(false);
    }
  };

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <PageWrapper>
        <ModernHeader
          title="Movimentações"
          subtitle="Visualize o histórico de entradas e saídas de produtos."
        />
        <PageLoading message="Carregando movimentações..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="flex flex-col p-0">
      <div className="flex-1 w-full overflow-auto">
        <div className="w-full px-2 sm:px-4 py-4 sm:py-6">
          <ModernHeader
            title="Movimentações"
            subtitle="Visualize o histórico de entradas e saídas de produtos."
            actions={
              <Button
                type="button"
                onClick={() => setIsNewMovementDialogOpen(true)}
                className="gap-1.5"
                size="sm"
              >
                <PlusSquare className="h-3.5 w-3.5" /> 
                <span className="text-xs">Nova Movimentação</span>
              </Button>
            }
          />
          
          {/* Componente de verificação de integridade - executado em background sem exibição visual */}
          <div className="hidden">
            <IntegrityCheck />
          </div>

          {/* Filtros de busca, categoria e data */}
          <ModernFilters className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  className="pl-8 h-9 text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="h-9 text-xs">
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

              <div>
                <Select
                  value={selectedType}
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Tipos</SelectItem>
                    <SelectItem value="entrada">Entradas</SelectItem>
                    <SelectItem value="saida">Saídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <CustomDateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onRangeChange={handleCustomRangeChange}
                  className="h-9"
                  placeholder="Selecionar período"
                />
              </div>
            </div>
            
            {/* Filtro para compensações */}
            <div className="flex items-center pt-1 pb-0.5 text-xs">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-compensations"
                  checked={showCompensations}
                  onCheckedChange={(checked) => setShowCompensations(checked === true)}
                />
                <label
                  htmlFor="show-compensations"
                  className="text-sm text-gray-700 dark:text-gray-300 leading-none cursor-pointer"
                >
                  Mostrar compensações automáticas
                </label>
              </div>
            </div>
          </ModernFilters>

          {/* Lista de movimentações */}
          <ModernTable className="flex-1 mt-4 shadow-sm">
            {loadingProducts ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="p-1" key={`movement-table-${localMovements.length}-${Date.now()}`}>
                {/* Filtragem de movimentações */}
                {(() => {
                  // Filtrar todas as movimentações baseado nos critérios
                  const filteredMovements = localMovements.filter(movement => {
                    // Verificar se corresponde à busca por texto (produto)
                    const product = products.find(p => p.id === movement.product_id);
                    const matchesSearch = !searchTerm || (
                      product && (
                        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.code.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                    );
                    
                    // Verificar se corresponde à categoria
                    const matchesCategory = selectedCategory === 'all' || (
                      product && product.category_id === selectedCategory
                    );
                    
                    // Verificar se corresponde ao tipo de movimentação
                    const matchesType = selectedType === 'all' || movement.type === selectedType;
                    
                    // Verificar se corresponde ao filtro de data
                    const matchesDate = filterMovementsByDate(movement);
                    
                    // Verificar se é uma compensação automática
                    const isCompensation = movement.notes && movement.notes.includes('Compensação automática');
                    const showBasedOnCompensationFilter = showCompensations || !isCompensation;
                    
                    return matchesSearch && matchesCategory && matchesType && matchesDate && showBasedOnCompensationFilter;
                  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                  
                  if (filteredMovements.length === 0) {
                    return (
                      <div className="text-center py-14 text-muted-foreground">
                        <Package className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                        <h3 className="text-sm font-medium mb-1">Nenhuma movimentação encontrada</h3>
                        <p className="text-xs text-muted-foreground/70 max-w-md mx-auto">
                          Tente ajustar os filtros ou criar uma nova movimentação clicando no botão acima.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-gray-200 dark:border-gray-700">
                            <TableHead className="text-xs w-[150px]">Data</TableHead>
                            <TableHead className="text-xs w-[250px]">Produto</TableHead>
                            <TableHead className="text-xs w-[150px]">Categoria</TableHead>
                            <TableHead className="text-xs w-[100px]">Tipo</TableHead>
                            <TableHead className="text-xs w-[100px]">Quantidade</TableHead>
                            <TableHead className="text-xs w-[150px]">Responsável</TableHead>
                            <TableHead className="text-xs w-[180px]">Observação</TableHead>
                            <TableHead className="text-xs w-[100px] text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMovements.map(movement => {
                            const product = products.find(p => p.id === movement.product_id);
                            if (!product) return null;
                            
                            // Verificar se é uma compensação
                            const isCompensation = movement.notes && movement.notes.includes('Compensação automática');
                            
                            return (
                              <TableRow 
                                key={movement.id} 
                                className={`border-b border-gray-100 dark:border-gray-800 ${
                                  isCompensation ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                                }`}
                              >
                                <TableCell className="whitespace-nowrap text-xs w-[150px]">
                                  {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm')}
                                </TableCell>
                                <TableCell className="w-[250px]">
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant="outline" 
                                      className="font-mono text-xs px-1.5 py-0 h-5 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                    >
                                      {product.code}
                                    </Badge>
                                    <span className="text-xs font-medium">{product.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs w-[150px]">
                                  {getCategoryName(product.category_id)}
                                </TableCell>
                                <TableCell className="w-[100px]">
                                  <div className="flex items-center">
                                    {movement.type === 'entrada' ? (
                                      <>
                                        <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                                        <span className="text-xs">Entrada</span>
                                      </>
                                    ) : (
                                      <>
                                        <div className="mr-2 h-2 w-2 rounded-full bg-orange-500"></div>
                                        <span className="text-xs">Saída</span>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="w-24 sm:w-32 text-center">
                                  <span className="text-xs whitespace-nowrap">
                                    {formatQuantity(movement.quantity, product.unit)} {product.unit}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs w-[150px]">{movement.employee_name || '-'}</TableCell>
                                <TableCell className="max-w-xs truncate text-xs w-[180px]">
                                  {isCompensation ? (
                                    <div className="flex items-center">
                                      <span className="bg-yellow-100 text-amber-800 dark:bg-yellow-900/30 dark:text-amber-200 px-1.5 py-0.5 rounded text-xs mr-1 font-medium">
                                        Compensação
                                      </span>
                                      <span className="truncate">{movement.notes || '-'}</span>
                                    </div>
                                  ) : (
                                    movement.notes || '-'
                                  )}
                                </TableCell>
                                <TableCell className="text-right w-[100px]">
                                  <div className="flex items-center justify-end space-x-1">
                                    {isCompensation ? (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-gray-500 hover:text-red-800"
                                        onClick={() => handleDeleteCompensationPermanently(movement)}
                                        title="Excluir compensação permanentemente"
                                      >
                                        <AlertCircle className="h-3.5 w-3.5" />
                                      </Button>
                                    ) : (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-gray-500 hover:text-blue-600"
                                          onClick={() => handleEditMovement(movement, product)}
                                          title="Editar movimentação"
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-gray-500 hover:text-red-600"
                                          onClick={() => handleDeleteMovement(movement)}
                                          title="Excluir movimentação"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })()}
              </div>
            )}
          </ModernTable>
        </div>
      </div>

      {/* Dialog para criar uma nova movimentação */}
      <Dialog open={isNewMovementDialogOpen} onOpenChange={setIsNewMovementDialogOpen}>
        <DialogContent className="sm:max-w-[650px] md:max-w-[700px] p-0 border-none max-h-[90vh] overflow-hidden">
          <MovementProductSelector
            open={isNewMovementDialogOpen}
            onOpenChange={setIsNewMovementDialogOpen}
            products={products}
            categories={categories}
            onSelectProduct={handleOpenDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de nova movimentação (após seleção do produto) */}
      <ModernMovementDialog
        product={selectedProduct ? {
          id: selectedProduct.id,
          code: selectedProduct.code,
          name: selectedProduct.name,
          description: selectedProduct.description,
          unit: selectedProduct.unit,
          quantity: selectedProduct.quantity,
          categoryName: getCategoryName(selectedProduct.category_id)
        } : null}
        type={movementType}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editMode={false}
        movementToEdit={null}
      />

      {/* Dialog de edição de movimentação */}
      <ModernMovementDialog
        product={selectedProduct ? {
          id: selectedProduct.id,
          code: selectedProduct.code,
          name: selectedProduct.name,
          description: selectedProduct.description,
          unit: selectedProduct.unit,
          quantity: selectedProduct.quantity,
          categoryName: getCategoryName(selectedProduct.category_id)
        } : null}
        type={movementType}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editMode={true}
        movementToEdit={movementToEdit}
      />
      
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md border-0 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl flex items-center gap-2 font-semibold">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Excluir Movimentação
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground mt-2">
              Tem certeza que deseja excluir esta movimentação? Esta ação é irreversível e o estoque será ajustado automaticamente.
              
              {movementToDelete?.type === 'entrada' ? (
                <div className="mt-4 p-3 rounded-md bg-yellow-50 text-amber-800 text-sm border border-yellow-200 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="font-medium">Atenção</p>
                    <p>A quantidade será <strong>removida</strong> do estoque atual.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-md bg-blue-50 text-blue-800 text-sm border border-blue-200 flex items-center gap-2">
                  <InfoIcon className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div>
                    <p className="font-medium">Informação</p>
                    <p>A quantidade será <strong>DEVOLVIDA</strong> ao estoque atual.</p>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel 
              disabled={isDeletingMovement}
              className="border-gray-300 hover:bg-gray-100">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMovement}
              disabled={isDeletingMovement}
              className="bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              {isDeletingMovement ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação de exclusão permanente de compensação */}
      <AlertDialog open={isDeleteCompensationDialogOpen} onOpenChange={setIsDeleteCompensationDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Compensação Permanentemente</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              <div className="space-y-2">
                <p>Você está prestes a <strong>excluir permanentemente</strong> esta compensação automática.</p>
                
                <div className="mt-2 flex items-center p-2 rounded bg-red-50 text-red-800 text-xs border border-red-200">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>
                    Esta ação é <strong>irreversível</strong> e pode causar inconsistências no estoque. O registro será completamente removido do banco de dados.
                  </span>
                </div>
                
                <p className="font-medium">Tem certeza que deseja continuar?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCompensation}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCompensationPermanently}
              disabled={isDeletingCompensation}
              className="bg-red-700 text-white hover:bg-red-800"
            >
              {isDeletingCompensation ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Excluindo...
                </>
              ) : (
                "Excluir Permanentemente"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
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
    <div className="flex flex-col h-full max-h-[90vh]">
      <div className="p-4 pb-3 border-b">
        <h2 className="text-base font-medium">Registrar Movimentação</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Selecione o produto e o tipo de movimentação a ser registrada.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4">
        <Button
          type="button"
          variant={movementType === 'entrada' ? 'default' : 'outline'}
          className={`h-10 text-sm ${movementType === 'entrada'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'hover:bg-primary/10'
            }`}
          onClick={() => setMovementType('entrada')}
        >
          <ArrowDownIcon className="h-4 w-4 mr-2" />
          Entrada
        </Button>
        <Button
          type="button"
          variant={movementType === 'saida' ? 'default' : 'outline'}
          className={`h-10 text-sm ${movementType === 'saida'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
            }`}
          onClick={() => setMovementType('saida')}
        >
          <ArrowUpIcon className="h-4 w-4 mr-2" />
          Saída
        </Button>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código do produto..."
            className="pl-10 h-9 text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id} className="text-sm">
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-hidden px-4 pb-4">
        <div className="rounded-lg overflow-hidden h-full border dark:border-gray-700">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <Package className="h-8 w-8 text-muted-foreground/50 mb-3" />
              <p className="font-medium text-sm text-muted-foreground">Nenhum produto encontrado</p>
              <p className="text-xs text-muted-foreground/70 text-center mt-1 max-w-xs">
                Tente ajustar os filtros ou pesquise por outro termo
              </p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="sticky top-0 bg-muted/60 dark:bg-gray-800/80 backdrop-blur-sm border-b dark:border-gray-700">
                <div className="grid grid-cols-3 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <div>Produto</div>
                  <div className="text-center">Estoque</div>
                  <div className="text-right">Ação</div>
                </div>
              </div>

              <div>
                {filteredProducts.map(product => (
                  <div key={product.id} className="grid grid-cols-3 items-center px-3 py-2 hover:bg-muted/40 dark:hover:bg-gray-700/40 transition-colors">
                    <div>
                      <div className="font-medium text-sm dark:text-white">{product.name}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="font-mono text-xs dark:border-gray-600 dark:text-gray-300 px-1.5 py-0 h-5">
                          {product.code}
                        </Badge>
                        <span className="text-xs bg-secondary/40 dark:bg-gray-700 px-1.5 py-0 rounded-full dark:text-gray-300 h-5 flex items-center">
                          {getCategoryName(product.category_id)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Badge variant={product.quantity <= product.min_quantity ? "destructive" : "secondary"} className="px-2 py-0.5 text-xs h-5">
                        {product.quantity} {getUnitAbbreviation(product.unit)}
                      </Badge>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant={movementType === 'entrada' ? 'default' : 'custom-blue'}
                        size="sm"
                        className="h-7 text-xs px-2.5"
                        onClick={() => onSelectProduct(product, movementType)}
                      >
                        Selecionar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Movements;
