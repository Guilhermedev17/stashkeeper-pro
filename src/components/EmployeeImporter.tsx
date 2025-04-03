import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, Check, Search, X, AlertCircle } from 'lucide-react';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Variável global para controlar se o importador já está aberto
let GLOBAL_EMPLOYEE_IMPORTER_OPEN = false;

interface EmployeeImporterProps {
  onClose?: () => void;
  onImportComplete?: () => void;
}

interface EmployeeData {
  code: string;
  name: string;
  status: 'active' | 'inactive';
  selected?: boolean;
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
        console.log(`Linha ${i+1}:`, dataRows[i]);
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
      const code = String(row.A || '');
      const name = String(row.B || '');
      
      return {
        code,
        name,
        status: 'active' as const, // Colaboradores importados são ativos por padrão
        valid: Boolean(code && name)
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
          });
          
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
          });
          
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
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Importador de Colaboradores via Excel</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-6">
            Importe colaboradores de um arquivo Excel com colunas para Código e Nome
          </p>
          
          {importStep === 'select' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="file" className="text-base">Arquivo Excel</Label>
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
                    />
                  </Label>
                </div>
              </div>
              
              <Alert className="bg-blue-50 border-blue-100">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Formato da Planilha</AlertTitle>
                <AlertDescription className="text-blue-700">
                  A planilha deve conter:
                  <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                    <li>Coluna A: Código do colaborador</li>
                    <li>Coluna B: Nome do colaborador</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {importStep === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold">Pré-visualização dos Dados</h3>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar colaborador..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="select-all" 
                      checked={selectAll}
                      onCheckedChange={toggleSelectAll}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Todos
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md">
                <div className="overflow-auto" ref={tableContainerRef} style={{ maxHeight: '400px' }}>
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left w-14">
                          <span className="sr-only">Selecionar</span>
                        </th>
                        <th className="p-2 text-left text-sm font-medium text-muted-foreground">Código</th>
                        <th className="p-2 text-left text-sm font-medium text-muted-foreground">Nome</th>
                        <th className="p-2 text-left text-sm font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPreviewData.length > 0 ? (
                        filteredPreviewData.map((item, index) => (
                          <tr key={index} className="border-t hover:bg-muted/30">
                            <td className="p-2 text-center">
                              <Checkbox 
                                checked={item.selected}
                                onCheckedChange={() => toggleSelectItem(
                                  previewData.findIndex(i => i.code === item.code && i.name === item.name)
                                )}
                              />
                            </td>
                            <td className="p-2 text-sm">{item.code}</td>
                            <td className="p-2 text-sm">{item.name}</td>
                            <td className="p-2 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Ativo
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground">
                            {searchQuery ? "Nenhum resultado encontrado" : "Nenhum colaborador para importar"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div>
                  Total: {filteredPreviewData.length} colaboradores
                </div>
                <div>
                  Selecionados: {filteredPreviewData.filter(i => i.selected).length}
                </div>
              </div>
            </div>
          )}
          
          {importStep === 'result' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="text-lg font-semibold mb-4">Resultado da Importação</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-md bg-green-50 border border-green-100">
                    <p className="font-semibold text-green-700">Adicionados</p>
                    <p className="text-3xl font-bold text-green-600">{importStats.added}</p>
                  </div>
                  
                  <div className="p-4 rounded-md bg-blue-50 border border-blue-100">
                    <p className="font-semibold text-blue-700">Atualizados</p>
                    <p className="text-3xl font-bold text-blue-600">{importStats.updated}</p>
                  </div>
                  
                  <div className="p-4 rounded-md bg-red-50 border border-red-100">
                    <p className="font-semibold text-red-700">Erros</p>
                    <p className="text-3xl font-bold text-red-600">{importStats.errors}</p>
                  </div>
                </div>
                
                <div className="mt-4 text-muted-foreground text-sm">
                  <p>Total processado: {importStats.total} colaboradores</p>
                </div>
              </div>
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

export default EmployeeImporter; 