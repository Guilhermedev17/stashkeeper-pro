import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, AlertCircle, FileSpreadsheet, Check, Info, CheckSquare, Square, Search, X } from 'lucide-react';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useToast } from '@/components/ui/use-toast';
import { dismissAllToastsAfterDelay } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import ModernDialog from '@/components/layout/modern/ModernDialog';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Variável global para controlar se o importador já está aberto
let GLOBAL_IMPORTER_OPEN = false;

interface ExcelImporterProps {
  onClose?: () => void;
  onImportComplete?: () => void;
}

interface ProductData {
  name: string;
  code: string;
  description: string;
  category_id: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  selected?: boolean;
}

const ExcelImporter = ({ onClose, onImportComplete }: ExcelImporterProps) => {
  // Verifica se o importador já está aberto
  if (GLOBAL_IMPORTER_OPEN && onClose === undefined) {
    console.log("Importador já está aberto");
    return null;
  }

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<ProductData[]>([]);
  const [importStats, setImportStats] = useState({
    total: 0,
    added: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  });
  const [importStep, setImportStep] = useState<'select' | 'preview' | 'result'>('select');
  const [selectAll, setSelectAll] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { categories } = useSupabaseCategories();
  const { addProduct, updateProduct } = useSupabaseProducts();
  const { toast } = useToast();

  // Marca o importador como aberto ao montar o componente
  useEffect(() => {
    GLOBAL_IMPORTER_OPEN = true;
    return () => {
      GLOBAL_IMPORTER_OPEN = false;
    };
  }, []);

  const handleClose = () => {
    console.log("Fechando o importador...");

    // Garantir que todas as notificações sejam fechadas ao fechar o diálogo
    // Isto é importante para evitar notificações persistentes
    dismissAllToastsAfterDelay(500);

    // Verificar se estamos fechando após uma importação bem-sucedida (na tela de resultado)
    // para atualizar a lista de produtos na página principal
    if (importStep === 'result') {
      console.log("Fechando após importação concluída");

      // Disparar um evento global de atualização para garantir que qualquer componente
      // que esteja escutando saiba que deve atualizar os dados
      try {
        console.log("ExcelImporter: Disparando evento global stashkeeper-product-update");
        const updateEvent = new CustomEvent('stashkeeper-product-update');
        window.dispatchEvent(updateEvent);
      } catch (error) {
        console.error("ExcelImporter: Erro ao disparar evento global:", error);
      }

      // Chamar callback somente se existir
      if (onImportComplete) {
        console.log("ExcelImporter: Chamando onImportComplete para atualizar a lista de produtos...");
        console.log("ExcelImporter: onImportComplete tipo =", typeof onImportComplete);

        try {
          onImportComplete();
          console.log("ExcelImporter: onImportComplete foi executado com sucesso");
        } catch (error) {
          console.error("ExcelImporter: Erro ao executar onImportComplete:", error);
        }
      } else {
        console.log("ExcelImporter: onImportComplete não existe, apenas o evento global foi disparado");
      }
    } else {
      console.log("Fechando sem chamar onImportComplete. importStep =", importStep);
    }

    if (onClose) {
      onClose();
    }
    GLOBAL_IMPORTER_OPEN = false;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 10MB"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCategory) {
      toast({
        title: "Atenção",
        description: "Selecione um arquivo e uma categoria antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];

          // Converter para JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });

          console.log(`Dados brutos do Excel: ${jsonData.length} linhas`);

          // Processar e validar os dados para preview
          const processedData = processExcelData(jsonData);

          console.log(`Após processamento: ${processedData.length} produtos válidos`);

          // Marcar todos os produtos como selecionados por padrão
          const dataWithSelection = processedData.map(item => ({
            ...item,
            selected: true
          }));

          setPreviewData(dataWithSelection);
          setSelectAll(true);

          // Avançar para a etapa de preview
          setImportStep('preview');
        } catch (error) {
          console.error("Erro ao processar arquivo Excel:", error);
          toast({
            title: "Erro no processamento",
            description: "Não foi possível processar o arquivo Excel. Verifique o formato.",
            variant: "destructive"
          });
        }

        setIsUploading(false);
      };

      reader.onerror = () => {
        toast({
          title: "Erro na leitura",
          description: "Não foi possível ler o arquivo selecionado.",
          variant: "destructive"
        });
        setIsUploading(false);
      };

      reader.readAsBinaryString(selectedFile);
    } catch (error) {
      console.error("Erro ao processar arquivo Excel:", error);
      toast({
        title: "Erro no sistema",
        description: "Não foi possível carregar os módulos necessários. Tente novamente mais tarde.",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };

  const processExcelData = (jsonData: any[]): ProductData[] => {
    // Não pular a primeira linha - vamos verificar cada linha individualmente
    // para determinar se é cabeçalho ou dados
    const dataRows = jsonData.filter(row => {
      // Se a linha tem "Código" ou "CODIGO" na coluna A, provavelmente é cabeçalho
      const firstCol = String(row.A || '').toLowerCase();
      const isHeader = firstCol.includes('código') || firstCol.includes('codigo');
      if (isHeader) {
        console.log('Encontrado cabeçalho:', row);
      }
      return !isHeader;
    });

    console.log(`Após filtrar cabeçalhos: ${dataRows.length} linhas`);

    // Log das primeiras linhas para debug
    if (dataRows.length > 0) {
      console.log('Amostra das primeiras linhas:');
      for (let i = 0; i < Math.min(3, dataRows.length); i++) {
        console.log(`Linha ${i + 1}:`, dataRows[i]);
      }
    }

    // Filtrar linhas vazias ou inválidas
    const validRows = dataRows.filter(row => {
      // Verificar se a linha tem código e nome do produto
      const hasRequiredFields = row.A && row.B;
      if (!hasRequiredFields) {
        console.log('Linha inválida (sem código ou nome):', row);
      }
      return hasRequiredFields;
    });

    console.log(`Após filtrar linhas sem código/nome: ${validRows.length} linhas`);

    const mappedData = validRows.map(row => {
      // Mapeamento fixo de colunas conforme o formato da planilha:
      // A: Código
      // B: Nome do Produto
      // E: Unidade de Medida
      // I: Quantidade em Estoque
      const code = String(row.A || '');
      const name = String(row.B || '');
      const unit = String(row.E || 'UN');
      const rawQuantity = row.I;
      const quantity = parseFloat(row.I) || 0;

      if (rawQuantity !== undefined && isNaN(quantity)) {
        console.log(`Valor de estoque inválido para o produto ${code} - ${name}: ${rawQuantity}`);
      }

      // Valor padrão para quantidade mínima - apenas se quantidade > 0
      // Produtos com estoque zero mantêm min_quantity como zero
      const min_quantity = quantity > 0 ? Math.round(quantity * 0.2) : 0;

      return {
        code,
        name,
        description: '',
        quantity,
        min_quantity,
        unit,
        category_id: selectedCategory,
        // Agora consideramos válido mesmo com quantidade 0
        valid: Boolean(code && name && !isNaN(quantity))
      };
    });

    const validItems = mappedData.filter(item => item.valid);

    if (mappedData.length !== validItems.length) {
      console.log(`${mappedData.length - validItems.length} itens foram considerados inválidos após o mapeamento`);
    }

    return validItems;
  };

  // Função para alternar seleção de todos os produtos
  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    // Atualizar todos os itens de acordo com a seleção geral
    setPreviewData(previewData.map(item => ({
      ...item,
      selected: newSelectAll
    })));
  };

  // Função para alternar seleção de um produto específico
  const toggleSelectItem = (index: number) => {
    const updatedData = [...previewData];
    updatedData[index].selected = !updatedData[index].selected;

    // Verificar se todos estão selecionados para atualizar o selectAll
    const allSelected = updatedData.every(item => item.selected);
    setSelectAll(allSelected);

    setPreviewData(updatedData);
  };

  const confirmImport = async () => {
    // Filtrar apenas os itens selecionados
    const selectedItems = previewData.filter(item => item.selected);

    if (selectedItems.length === 0) {
      toast({
        title: "Atenção",
        description: "Nenhum produto selecionado para importação.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    const stats = {
      total: selectedItems.length,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };

    // Criar apenas uma notificação que pode ser atualizada
    const toastInstance = toast({
      title: "Importação em andamento",
      description: `Iniciando importação de ${selectedItems.length} produtos...`,
      variant: "progress"
    });

    // Processa a importação apenas dos itens selecionados
    for (let index = 0; index < selectedItems.length; index++) {
      const item = selectedItems[index];
      try {
        // Atualizar o progresso em intervalos regulares
        const progressPercent = Math.floor((index / selectedItems.length) * 100);

        // Atualizar a notificação mais frequentemente (a cada produto ou a cada 5%)
        if (selectedItems.length < 10 || index % Math.max(1, Math.floor(selectedItems.length / 20)) === 0) {
          toastInstance.update({
            id: toastInstance.id,
            title: "Importação em andamento",
            description: `${index + 1} de ${selectedItems.length} produtos processados (${progressPercent}%)`,
            variant: "progress"
          });
        }

        // Buscar se já existe um produto com este código
        const { data: existingProducts } = await supabase
          .from('products')
          .select('id, code')
          .eq('code', item.code)
          .limit(1);

        if (existingProducts && existingProducts.length > 0) {
          // Atualizar produto existente
          const productId = existingProducts[0].id;
          const result = await updateProduct(productId, {
            name: item.name,
            code: item.code,
            description: item.description,
            quantity: item.quantity,
            min_quantity: item.min_quantity,
            unit: item.unit,
            category_id: selectedCategory
          }, { silent: true });

          if (result.success) {
            stats.updated++;
          } else {
            stats.errors++;
          }
        } else {
          // Adicionar novo produto
          const result = await addProduct({
            name: item.name,
            code: item.code,
            description: item.description,
            quantity: item.quantity,
            min_quantity: item.min_quantity,
            unit: item.unit,
            category_id: selectedCategory
          }, { silent: true });

          if (result.success) {
            stats.added++;
          } else {
            stats.errors++;
          }
        }
      } catch (error) {
        console.error("Erro ao importar item:", item, error);
        stats.errors++;
      }
    }

    // Atualizar notificação final com o resultado
    // Incluir o número total e a porcentagem 100% para indicar conclusão
    toastInstance.update({
      id: toastInstance.id,
      title: "Importação concluída",
      description: `${stats.added} produtos adicionados, ${stats.updated} atualizados, ${stats.errors} erros (100%).`,
      variant: stats.errors > 0 ? "destructive" : "success",
      duration: 5000  // Mostrar por 5 segundos e depois fechar automaticamente
    });

    // Programar explicitamente o fechamento da notificação após 5 segundos
    // Algumas implementações de toast não respeitam a duração de forma confiável
    setTimeout(() => {
      try {
        // Forçar o fechamento da notificação usando o dismiss
        toastInstance.dismiss();
        console.log("Notificação de importação fechada automaticamente após 5s");
      } catch (e) {
        console.error("Erro ao tentar fechar notificação:", e);
      }
    }, 5000);

    // Garantir que todas as notificações sejam fechadas após 6 segundos
    // Este é um backup caso o dismiss da instância específica falhe
    dismissAllToastsAfterDelay(6000);

    // Configurar temporizador para fechar o diálogo 
    // É importante NÃO fechar o diálogo automaticamente para mostrar os resultados
    // Apenas atualizar o estado para mostrar a tela de resultados
    setImportStats(stats);
    setImportStep('result');
    setIsUploading(false);

    // Pré-carregar os dados para garantir que já estarão disponíveis quando o usuário fechar o diálogo
    console.log("ExcelImporter: Pré-carregando produtos após importação");
    try {
      // Esta é uma chamada direta ao Supabase para garantir que os dados sejam atualizados
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("ExcelImporter: Erro ao pré-carregar produtos:", error);
      } else {
        console.log(`ExcelImporter: ${data?.length || 0} produtos pré-carregados com sucesso`);
      }
    } catch (e) {
      console.error("ExcelImporter: Erro ao tentar pré-carregar produtos:", e);
    }

    // Não chamar onImportComplete aqui, vamos chamar apenas quando o usuário fechar o diálogo
    // Isso evita que a página atualize enquanto o usuário está vendo o resultado
  };

  const resetImport = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setImportStats({
      total: 0,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    });
    setImportStep('select');
    setSelectAll(true);
    setSearchQuery('');
    setSelectedCategory('');
    
    // Resetar o input de arquivo diretamente no DOM
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filtrar dados de acordo com a pesquisa
  const filteredPreviewData = previewData.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => !open && handleClose()}
    >
      <DialogContent className="sm:max-w-[800px] h-auto max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importador de Produtos via Excel</DialogTitle>
          <DialogDescription>
            Importe dados de estoque de um arquivo Excel para a categoria selecionada
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative">
          <div
            className={cn(
              "transition-all duration-300 ease-in-out h-full overflow-auto",
              importStep === 'select' ? "block" : "hidden"
            )}
          >
            <div className="p-4">
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="category" className="text-base font-medium">Categoria dos produtos</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category" className="h-11">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="file" className="text-base font-medium">Arquivo Excel</Label>
                  <div className="grid w-full items-center gap-1.5">
                    <Label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileSpreadsheet className="w-10 h-10 text-primary/70 mb-3" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Clique para selecionar</span> ou arraste o arquivo
                        </p>
                        <p className="text-xs text-muted-foreground">
                          XLSX, XLS (MAX. 10MB)
                        </p>
                      </div>
                      {selectedFile && (
                        <div className="flex items-center gap-2 py-2 px-3 bg-secondary/50 rounded-md text-sm mt-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="truncate max-w-[280px]">{selectedFile.name}</span>
                        </div>
                      )}
                      <input
                        id="file-upload"
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                      />
                    </Label>
                  </div>
                </div>

                <Alert className="bg-secondary/50 border-secondary">
                  <Info className="h-5 w-5 text-primary/80" />
                  <AlertTitle className="text-base font-medium">Como importar seus produtos</AlertTitle>
                  <AlertDescription className="mt-1 text-sm">
                    <p className="mb-2">Use sua planilha Excel com informações de produtos:</p>
                    <ul className="space-y-1.5 list-disc pl-5">
                      <li>Prepare uma planilha com código, nome, unidade e quantidade dos produtos</li>
                      <li>Selecione a categoria e faça o upload do arquivo</li>
                      <li>Confirme os produtos que deseja importar</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "transition-all duration-300 ease-in-out h-full overflow-auto",
              importStep === 'preview' ? "block" : "hidden"
            )}
          >
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b">
                <h3 className="text-lg font-medium">Pré-visualização dos dados</h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-full"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={toggleSelectAll}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium">
                    Selecionar todos
                  </Label>
                </div>
                <div className="px-2 py-0.5 bg-secondary/60 rounded-md text-xs">
                  <span className="font-medium">{previewData.filter(item => item.selected).length}</span> de <span className="font-medium">{previewData.length}</span> selecionados
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden shadow-sm">
                <div
                  ref={tableContainerRef}
                  className="overflow-auto"
                  style={{ maxHeight: '300px' }}
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-2 py-2 text-center font-medium w-10">
                          Sel.
                        </th>
                        <th className="px-3 py-2 text-left font-medium">Código</th>
                        <th className="px-3 py-2 text-left font-medium">Nome</th>
                        <th className="px-3 py-2 text-left font-medium">Unidade</th>
                        <th className="px-3 py-2 text-left font-medium">Estoque</th>
                        <th className="px-3 py-2 text-left font-medium">Mín</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPreviewData.length > 0 ? (
                        filteredPreviewData.map((item, index) => (
                          <tr
                            key={index}
                            className={`border-t hover:bg-secondary/30 transition-colors ${item.selected ? '' : 'bg-muted/20'}`}
                            onClick={() => toggleSelectItem(
                              previewData.findIndex(p => p.code === item.code && p.name === item.name)
                            )}
                            style={{ cursor: 'pointer' }}
                          >
                            <td
                              className="px-2 py-1.5 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={item.selected}
                                onCheckedChange={() => toggleSelectItem(
                                  previewData.findIndex(p => p.code === item.code && p.name === item.name)
                                )}
                                className="h-4 w-4"
                              />
                            </td>
                            <td className="px-3 py-1.5 font-medium">{item.code}</td>
                            <td className="px-3 py-1.5 max-w-[220px]">
                              <div
                                className="truncate"
                              >
                                {item.name}
                              </div>
                            </td>
                            <td className="px-3 py-1.5">{item.unit}</td>
                            <td className="px-3 py-1.5">{item.quantity}</td>
                            <td className="px-3 py-1.5">{item.min_quantity}</td>
                          </tr>
                        ))
                      ) : searchQuery ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                            Nenhum produto encontrado com o termo "{searchQuery}"
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                            Nenhum produto encontrado no arquivo
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between text-xs bg-muted/30 px-3 py-1.5 rounded-md">
                <span>{filteredPreviewData.length} itens exibidos</span>
                <span>{previewData.filter(item => item.selected).length} selecionados para importação</span>
              </div>

              <Alert className="bg-muted/50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Antes de importar</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    <li>Todos os produtos selecionados serão adicionados ou atualizados na categoria escolhida.</li>
                    <li>O sistema calculará automaticamente o estoque mínimo sugerido para cada produto.</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <div
            className={cn(
              "transition-all duration-300 ease-in-out h-full overflow-auto",
              importStep === 'result' ? "block" : "hidden"
            )}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-xl font-medium">Importação concluída</h3>
              </div>

              <div className="grid grid-cols-3 gap-4 mx-auto max-w-3xl">
                <Card className="shadow-sm flex flex-col items-center justify-center">
                  <CardContent className="py-6 flex flex-col items-center justify-center w-full">
                    <p className="text-muted-foreground text-sm mb-1">Total</p>
                    <p className="text-3xl font-bold">{importStats.total}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/5 shadow-sm border-green-500/20 flex flex-col items-center justify-center">
                  <CardContent className="py-6 flex flex-col items-center justify-center w-full">
                    <p className="text-muted-foreground text-sm mb-1">Adicionados</p>
                    <p className="text-3xl font-bold text-green-500">{importStats.added}</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/5 shadow-sm border-blue-500/20 flex flex-col items-center justify-center">
                  <CardContent className="py-6 flex flex-col items-center justify-center w-full">
                    <p className="text-muted-foreground text-sm mb-1">Atualizados</p>
                    <p className="text-3xl font-bold text-blue-500">{importStats.updated}</p>
                  </CardContent>
                </Card>
              </div>

              {importStats.errors > 0 && (
                <Card className="bg-red-500/5 shadow-sm border-red-500/20 max-w-xs mx-auto">
                  <CardContent className="py-6">
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm mb-1">Erros</p>
                      <p className="text-3xl font-bold text-red-500">{importStats.errors}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Alert variant={importStats.errors > 0 ? "destructive" : "default"}>
                {importStats.errors > 0 ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <AlertTitle>
                  {importStats.errors > 0 ? "Importação concluída com erros" : "Importação concluída com sucesso"}
                </AlertTitle>
                <AlertDescription>
                  {importStats.errors > 0 ? (
                    <p className="text-sm">Alguns produtos não puderam ser importados. Verifique os dados e tente novamente.</p>
                  ) : (
                    <p className="text-sm">Todos os produtos foram importados com sucesso.</p>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end p-4 border-t">
          {importStep === 'select' && (
            <>
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto order-2 sm:order-1">Cancelar</Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !selectedCategory || isUploading}
                className="gap-2 w-full sm:w-auto order-1 sm:order-2"
              >
                {isUploading ? "Processando..." : "Continuar"}
                <Upload className="h-4 w-4" />
              </Button>
            </>
          )}

          {importStep === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setImportStep('select')} className="w-full sm:w-auto order-2 sm:order-1">Voltar</Button>
              <Button
                onClick={confirmImport}
                disabled={isUploading || previewData.filter(item => item.selected).length === 0}
                className="gap-2 w-full sm:w-auto order-1 sm:order-2"
              >
                {isUploading ? "Importando..." : "Confirmar Importação"}
                <Check className="h-4 w-4" />
              </Button>
            </>
          )}

          {importStep === 'result' && (
            <>
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto order-2 sm:order-1">Fechar</Button>
              <Button onClick={resetImport} className="w-full sm:w-auto order-1 sm:order-2">Nova Importação</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImporter; 