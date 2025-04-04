import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, AlertCircle, FileSpreadsheet, Check, Search, X, CheckSquare, Square, Info } from 'lucide-react';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// Variável global para controlar se o importador já está aberto
let GLOBAL_EMPLOYEE_IMPORTER_OPEN = false;

interface EmployeeData {
  code: string;
  name: string;
  status: 'active' | 'inactive';
  valid: boolean;
  selected: boolean;
}

interface EmployeeImporterProps {
  onClose?: () => void;
  onImportComplete?: () => void;
}

const EmployeeImporter = ({ onClose, onImportComplete }: EmployeeImporterProps) => {
  // Verifica se o importador já está aberto
  if (GLOBAL_EMPLOYEE_IMPORTER_OPEN && onClose === undefined) {
    console.log("Importador de colaboradores já está aberto");
    return null;
  }

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<EmployeeData[]>([]);
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

  const { addEmployee, updateEmployee } = useSupabaseEmployees();
  const { toast } = useToast();

  // Marca o importador como aberto ao montar o componente
  useEffect(() => {
    GLOBAL_EMPLOYEE_IMPORTER_OPEN = true;
    return () => {
      GLOBAL_EMPLOYEE_IMPORTER_OPEN = false;
    };
  }, []);

  const handleClose = () => {
    if (onClose) onClose();
    GLOBAL_EMPLOYEE_IMPORTER_OPEN = false;
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
    if (!selectedFile) {
      toast({
        title: "Atenção",
        description: "Selecione um arquivo antes de continuar.",
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

          console.log(`Após processamento: ${processedData.length} colaboradores válidos`);

          // Marcar todos os colaboradores como selecionados por padrão
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

  const processExcelData = (jsonData: any[]): EmployeeData[] => {
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
      // Verificar se a linha tem código e nome do colaborador
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
      // B: Nome do Colaborador
      const code = String(row.A || '').trim();
      const name = String(row.B || '').trim();

      return {
        code,
        name,
        status: 'active' as 'active' | 'inactive',
        valid: Boolean(code && name),
        selected: true
      };
    });

    const validItems = mappedData.filter(item => item.valid);

    if (mappedData.length !== validItems.length) {
      console.log(`${mappedData.length - validItems.length} itens foram considerados inválidos após o mapeamento`);
    }

    return validItems;
  };

  // Função para alternar seleção de todos os colaboradores
  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    // Atualizar todos os itens de acordo com a seleção geral
    setPreviewData(previewData.map(item => ({
      ...item,
      selected: newSelectAll
    })));
  };

  // Função para alternar seleção de um colaborador específico
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
        description: "Nenhum colaborador selecionado para importação.",
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
      description: `Iniciando importação de ${selectedItems.length} colaboradores...`,
      variant: "progress"
    });

    // Processa a importação apenas dos itens selecionados
    for (let index = 0; index < selectedItems.length; index++) {
      const item = selectedItems[index];
      try {
        // Atualizar o progresso em intervalos regulares
        const progressPercent = Math.floor((index / selectedItems.length) * 100);

        // Atualizar a notificação mais frequentemente (a cada colaborador ou a cada 5%)
        if (selectedItems.length < 10 || index % Math.max(1, Math.floor(selectedItems.length / 20)) === 0) {
          toastInstance.update({
            id: toastInstance.id,
            title: "Importação em andamento",
            description: `${index + 1} de ${selectedItems.length} colaboradores processados (${progressPercent}%)`,
            variant: "progress"
          });
        }

        // Buscar se já existe um colaborador com este código
        const { data: existingEmployees } = await supabase
          .from('employees')
          .select('id, code')
          .eq('code', item.code)
          .limit(1);

        if (existingEmployees && existingEmployees.length > 0) {
          // Atualizar colaborador existente
          const employeeId = existingEmployees[0].id;
          const result = await updateEmployee(employeeId, {
            name: item.name,
            code: item.code,
            status: item.status
          }, { silent: true });

          if (result.success) {
            stats.updated++;
          } else {
            stats.errors++;
          }
        } else {
          // Adicionar novo colaborador
          const result = await addEmployee({
            name: item.name,
            code: item.code,
            status: item.status
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
      description: `${stats.added} colaboradores adicionados, ${stats.updated} atualizados, ${stats.errors} erros (100%).`,
      variant: stats.errors > 0 ? "destructive" : "success",
    });

    // Configurar temporizador para fechar o diálogo 
    // É importante NÃO fechar o diálogo automaticamente para mostrar os resultados
    // Apenas atualizar o estado para mostrar a tela de resultados
    setImportStats(stats);
    setImportStep('result');
    setIsUploading(false);

    // Após a conclusão da importação, chamar o callback de atualização
    // em um timer separado para não interferir na exibição da tela de resultados
    if (onImportComplete) {
      // Garantir que o callback seja chamado após o state ser atualizado
      setTimeout(() => {
        onImportComplete();
      }, 300);
    }
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
  };

  // Filtrar dados de acordo com a pesquisa
  const filteredPreviewData = previewData.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-0">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            <h2 className="text-xl font-bold">Importador de Colaboradores via Excel</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="size-4 rounded-full"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-6">
            Importe dados de colaboradores de um arquivo Excel com código e nome
          </p>

          {importStep === 'select' && (
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="grid w-full items-center gap-1.5">
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileSpreadsheet className="size-8 text-primary/70 mb-2" />
                      <p className="mb-1 text-sm text-muted-foreground">
                        <span className="font-semibold">Clique para selecionar</span> ou arraste o arquivo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        XLSX, XLS (MAX. 10MB)
                      </p>
                    </div>
                    {selectedFile && (
                      <div className="flex items-center gap-2 py-2 px-3 bg-secondary/50 rounded-md text-sm mt-2">
                        <Check className="size-4 text-green-500" />
                        <span className="truncate max-w-[280px]">{selectedFile.name}</span>
                      </div>
                    )}
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              <Alert className="bg-secondary/50 border-secondary">
                <Info className="size-5 text-primary/80" />
                <AlertTitle className="text-base font-medium">Como importar seus colaboradores</AlertTitle>
                <AlertDescription className="mt-1 text-sm">
                  <p className="mb-2">Use sua planilha Excel com informações de colaboradores:</p>
                  <ul className="space-y-1.5 list-disc pl-5">
                    <li>Prepare uma planilha com <strong>código</strong> e <strong>nome</strong> dos colaboradores</li>
                    <li>Faça o upload do arquivo e revise os dados</li>
                    <li>Confirme os colaboradores que deseja importar</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {importStep === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b">
                <h3 className="text-lg font-medium">Pré-visualização dos dados</h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Search className="size-4 text-muted-foreground" />
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
                    className="size-4"
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
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPreviewData.length > 0 ? (
                        filteredPreviewData.map((item, index) => (
                          <tr
                            key={index}
                            className={`border-t hover:bg-secondary/30 transition-colors ${item.selected ? '' : 'bg-muted/20'}`}
                            onClick={() => toggleSelectItem(previewData.indexOf(item))}
                            style={{ cursor: 'pointer' }}
                          >
                            <td
                              className="px-2 py-1.5 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={item.selected}
                                onCheckedChange={() => toggleSelectItem(previewData.indexOf(item))}
                                className="size-4"
                              />
                            </td>
                            <td className="px-3 py-1.5 font-medium">{item.code}</td>
                            <td className="px-3 py-1.5 max-w-[220px]">
                              <div
                                className="truncate hover:whitespace-normal"
                                title={item.name}
                              >
                                {item.name}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : searchQuery ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                            Nenhum colaborador encontrado com o termo "{searchQuery}"
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                            Nenhum colaborador encontrado no arquivo
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-xs text-muted-foreground flex justify-between">
                <span>{filteredPreviewData.length} itens exibidos</span>
                <span>{previewData.filter(item => item.selected).length} selecionados para importação</span>
              </div>

              <Alert className="bg-muted/50">
                <AlertCircle className="size-4" />
                <AlertTitle>Antes de importar</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    <li>Todos os colaboradores selecionados serão adicionados ou atualizados.</li>
                    <li>Colaboradores com códigos existentes terão seus nomes atualizados.</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {importStep === 'result' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-xl font-medium">Importação concluída</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="shadow-sm">
                  <CardContent className="pt-6 pb-4">
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm mb-1">Total</p>
                      <p className="text-3xl font-bold">{importStats.total}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/5 shadow-sm border-green-500/20">
                  <CardContent className="pt-6 pb-4">
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm mb-1">Adicionados</p>
                      <p className="text-3xl font-bold text-green-500">{importStats.added}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/5 shadow-sm border-blue-500/20">
                  <CardContent className="pt-6 pb-4">
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm mb-1">Atualizados</p>
                      <p className="text-3xl font-bold text-blue-500">{importStats.updated}</p>
                    </div>
                  </CardContent>
                </Card>

                {importStats.errors > 0 ? (
                  <Card className="bg-red-500/5 shadow-sm border-red-500/20">
                    <CardContent className="pt-6 pb-4">
                      <div className="text-center">
                        <p className="text-muted-foreground text-sm mb-1">Erros</p>
                        <p className="text-3xl font-bold text-red-500">{importStats.errors}</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              <Alert variant={importStats.errors > 0 ? "destructive" : "default"}>
                {importStats.errors > 0 ? (
                  <AlertCircle className="size-4" />
                ) : (
                  <Check className="size-4" />
                )}
                <AlertTitle>
                  {importStats.errors > 0 ? "Importação concluída com erros" : "Importação concluída com sucesso"}
                </AlertTitle>
                <AlertDescription>
                  {importStats.errors > 0 ? (
                    <p className="text-sm">Alguns colaboradores não puderam ser importados. Verifique os dados e tente novamente.</p>
                  ) : (
                    <p className="text-sm">Todos os colaboradores foram importados com sucesso.</p>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between p-4 border-t">
          {importStep === 'select' && (
            <>
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto order-2 sm:order-1">Cancelar</Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="gap-2 w-full sm:w-auto order-1 sm:order-2"
              >
                {isUploading ? "Processando..." : "Continuar"}
                <Upload className="size-4" />
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
                <Check className="size-4" />
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

export default EmployeeImporter; 