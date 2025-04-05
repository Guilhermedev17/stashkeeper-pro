import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Printer, Download } from 'lucide-react';
import { useSupabaseEmployees } from '@/hooks/useSupabaseEmployees';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseMovements } from '@/hooks/useSupabaseMovements';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import PageWrapper from '@/components/layout/PageWrapper';
import { ModernHeader, ModernFilters } from '@/components/layout/modern';
import PageLoading from '@/components/PageLoading';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ModernDateRangeFilter, { DateFilterRange } from '@/components/ui/ModernDateRangeFilter';
import { startOfDay, endOfDay, addDays } from 'date-fns';

// Interface para produtos de saída por colaborador
interface ProductOutput {
  product_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  unit: string;
  category_id: string;
  category_name: string;
}

// Interface para o relatório por colaborador
interface EmployeeReport {
  employee_id: string;
  employee_code: string;
  employee_name: string;
  products: ProductOutput[];
}

const EmployeeOutputReport = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [reportData, setReportData] = useState<EmployeeReport[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  // Estado para o filtro de datas
  const [selectedDateRange, setSelectedDateRange] = useState<DateFilterRange>('last30Days');
  const [customDateRange, setCustomDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Hooks para dados
  const { employees } = useSupabaseEmployees();
  const { products } = useSupabaseProducts();
  const { movements, fetchMovements } = useSupabaseMovements();
  const { categories } = useSupabaseCategories();

  // Handler para seleção de período
  const handleDateRangeSelect = (range: DateFilterRange, dates?: { from?: Date; to?: Date }) => {
    setSelectedDateRange(range);

    if (range === 'custom' && dates) {
      setCustomDateRange({
        from: dates.from,
        to: dates.to
      });
    } else if (range === 'specificDate' && dates?.from) {
      setSelectedDate(dates.from);
    }
  };

  // Handler para seleção direta de data única
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Efeito para gerar o relatório quando os dados ou filtros mudarem
  useEffect(() => {
    // Iniciar o carregamento
    setIsLoading(true);

    // Calcular datas com base no filtro selecionado
    let startDate: Date = new Date(); // Inicialização para evitar erro de "possivelmente não inicializada"
    let endDate = new Date();

    if (selectedDateRange === 'custom' && customDateRange.from && customDateRange.to) {
      startDate = startOfDay(customDateRange.from);
      endDate = endOfDay(customDateRange.to);
    }
    else if (selectedDateRange === 'specificDate') {
      startDate = startOfDay(selectedDate);
      endDate = endOfDay(selectedDate);
    }
    else {
      // Filtros predefinidos
      const today = new Date();
      endDate = endOfDay(today);

      switch (selectedDateRange) {
        case 'today':
          startDate = startOfDay(today);
          break;
        case 'yesterday':
          startDate = startOfDay(addDays(today, -1));
          endDate = endOfDay(addDays(today, -1));
          break;
        case 'thisWeek':
          const day = today.getDay();
          const diff = today.getDate() - day + (day === 0 ? -6 : 1);
          startDate = startOfDay(new Date(today.setDate(diff)));
          break;
        case 'lastWeek':
          const lastWeekDay = today.getDay();
          const lastWeekDiff = today.getDate() - lastWeekDay - 6;
          startDate = startOfDay(new Date(new Date().setDate(lastWeekDiff)));
          endDate = endOfDay(new Date(new Date(startDate).setDate(startDate.getDate() + 6)));
          break;
        case 'thisMonth':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case 'lastMonth':
          const lastMonthDate = new Date(today);
          lastMonthDate.setDate(1);
          lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
          startDate = startOfDay(lastMonthDate);
          endDate = endOfDay(new Date(today.getFullYear(), today.getMonth(), 0));
          break;
        case 'last30Days':
        default:
          startDate = startOfDay(addDays(today, -29));
          break;
      }
    }

    const generateReport = () => {
      // Filtrar movimentos do tipo 'saida' no período selecionado
      const filteredMovements = movements.filter(m => {
        const movementDate = new Date(m.created_at);
        return m.type === 'saida' && 
               movementDate >= startDate && 
               movementDate <= endDate &&
               (selectedEmployee === 'all' || m.employee_id === selectedEmployee);
      });

      // Mapa para acumular as saídas por colaborador e produto
      const employeeProductMap: Record<string, Record<string, ProductOutput>> = {};

      // Processar todos os movimentos filtrados
      filteredMovements.forEach(movement => {
        if (!movement.employee_id) return;

        const employee = employees.find(e => e.id === movement.employee_id);
        if (!employee) return;

        const product = products.find(p => p.id === movement.product_id);
        if (!product) return;

        const category = categories.find(c => c.id === product.category_id);
        
        // Inicializar o mapa para este colaborador se não existir
        if (!employeeProductMap[movement.employee_id]) {
          employeeProductMap[movement.employee_id] = {};
        }

        // Chave única para o produto (agora usando código + categoria para consolidar produtos iguais)
        // Isso garante que o mesmo produto (mesmo código/nome) em categorias diferentes ainda seja tratado separadamente
        const productKey = `${product.code}_${product.category_id}`;

        // Se este produto já existe no mapa do colaborador, apenas somar a quantidade
        if (employeeProductMap[movement.employee_id][productKey]) {
          employeeProductMap[movement.employee_id][productKey].quantity += movement.quantity;
        } else {
          // Caso contrário, adicionar o produto ao mapa do colaborador
          employeeProductMap[movement.employee_id][productKey] = {
            product_id: movement.product_id,
            product_code: product.code,
            product_name: product.name,
            quantity: movement.quantity,
            unit: formatUnit(product.unit || 'un'),
            category_id: product.category_id || '',
            category_name: category?.name || 'Sem categoria'
          };
        }
      });

      // Converter o mapa em uma array de relatórios por colaborador
      const reportArray: EmployeeReport[] = Object.keys(employeeProductMap).map(employeeId => {
        const employee = employees.find(e => e.id === employeeId);
        
        // Converter o mapa de produtos em uma array
        const productsArray = Object.values(employeeProductMap[employeeId]);
        
        // Ordenar produtos por categoria e depois por código
        productsArray.sort((a, b) => {
          // Primeiro ordenar por categoria
          if (a.category_name !== b.category_name) {
            return a.category_name.localeCompare(b.category_name);
          }
          // Se for a mesma categoria, ordenar por código de produto
          return a.product_code.localeCompare(b.product_code);
        });

        return {
          employee_id: employeeId,
          employee_code: employee?.code || '',
          employee_name: employee?.name || 'Colaborador não encontrado',
          products: productsArray
        };
      });

      // Ordenar a lista de relatórios por nome de colaborador
      reportArray.sort((a, b) => a.employee_name.localeCompare(b.employee_name));

      setReportData(reportArray);
      setIsLoading(false);
    };

    // Garantir que temos todos os dados necessários antes de gerar o relatório
    if (employees.length > 0 && products.length > 0 && movements.length > 0 && categories.length > 0) {
      generateReport();
    } else {
      // Se não temos dados, configurar um timeout para evitar flash de loading
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedEmployee, employees, products, movements, categories, selectedDateRange, customDateRange, selectedDate]);

  // Função para imprimir o relatório
  const handlePrint = () => {
    generatePrintableContent();
  };

  // Função para gerar o conteúdo de impressão
  const generatePrintableContent = () => {
    if (printRef.current) {
      // Criar um iframe oculto dentro da mesma página
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      
      // Adicionar temporariamente ao documento
      document.body.appendChild(iframe);
      
      // Acessar o documento dentro do iframe
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        doc.open();
        doc.write('<html><head><title>Relatório de Saídas por Colaborador</title>');
        doc.write('<style>');
        doc.write(`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          /* Remove Page Headers, Footers and Margins in Print */
          @page { 
            size: A4; 
            margin: 0;
          }
          
          html, body { 
            margin: 0;
            padding: 0;
          }
          
          body { 
            font-family: 'Inter', Arial, sans-serif;
            padding: 10mm;
            color: #333;
            line-height: 1.3;
            font-size: 10px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Otimizações para impressão P&B */
          @media print {
            * {
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            @page {
              margin: 0;
            }
          }
          
          .report-container {
            column-count: 1;
          }
          
          @media (min-width: 800px) {
            .report-container {
              column-count: 2;
              column-gap: 20px;
            }
          }
          
          .employee-container {
            page-break-inside: avoid;
            break-inside: avoid;
            display: inline-block;
            width: 100%;
            margin-bottom: 8px;
          }
          
          .category-container {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 6px;
          }
          
          .product-row {
            page-break-inside: avoid;
            break-inside: avoid;
            padding: 2px 0 !important;
          }
          
          .employee-total {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-top: 4px !important;
            padding: 3px 6px !important;
          }
        `);
        doc.write('</style></head><body>');
        doc.write('<div class="report-container">');
        
        // Cores para a versão P&B
        const colors = {
          header: '#000000',
          headerBg: '#F2F2F2',
          companyName: '#000000',
          reportTitle: '#000000',
          subtitle: '#000000',
          employeeHeaderBg: '#EFF6FF',
          employeeHeaderBorder: '#000000',
          employeeHeaderText: '#000000',
          categoryHeaderBg: '#F2F2F2',
          categoryBorder: '#000000',
          categoryHeaderText: '#000000',
          tableHeaderBg: '#F2F2F2',
          tableHeaderText: '#000000',
          alternateRowBg: '#F9F9F9',
          totalBg: '#F2F2F2',
          totalBorder: '#000000',
          totalText: '#000000',
          separatorBorder: '#cccccc',
          dotted: '#666666',
          productText: '#000000'
        };
        
        // Adiciona cabeçalho personalizado
        doc.write(`
          <div style="margin-bottom: 12px; border-bottom: 2px solid #000000; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start;" class="report-header">
            <div>
              <div style="font-size: 16px; font-weight: 700; color: ${colors.companyName}; margin-bottom: 2px;">StashKeeperPro</div>
              <div style="font-size: 13px; font-weight: 600; color: ${colors.reportTitle}; margin-bottom: 2px;">Relatório de Saídas por Colaborador</div>
              <div style="font-size: 10px; color: ${colors.subtitle};">Produtos agrupados por colaborador e categoria</div>
            </div>
            <div style="text-align: right; font-size: 10px; color: ${colors.subtitle};">
              <div>Emissão: ${format(new Date(), 'dd/MM/yyyy')}</div>
              <div>Período: ${
                selectedDateRange === 'custom' && customDateRange.from && customDateRange.to 
                  ? `${format(customDateRange.from, 'dd/MM/yyyy')} a ${format(customDateRange.to, 'dd/MM/yyyy')}`
                  : selectedDateRange === 'specificDate'
                    ? format(selectedDate, 'dd/MM/yyyy')
                    : 'Últimos 30 dias'
              }</div>
            </div>
          </div>
        `);
        
        // Convertemos o HTML para um formato mais controlado para impressão
        doc.write(`
        <div class="report-container" style="column-gap: 20px;">
          ${reportData.map((employeeReport) => {
              let lastCategory = '';
              let output = '';
              
              output += `
                <div class="employee-container" style="margin-bottom: 8px;">
                  <div style="background-color: ${colors.employeeHeaderBg}; padding: 4px 6px; border-left: 3px solid ${colors.employeeHeaderBorder}; border-bottom: 1px solid ${colors.employeeHeaderBorder}; margin-bottom: 4px;">
                    <div style="font-size: 12px; font-weight: 700; color: ${colors.employeeHeaderText};">${employeeReport.employee_code} - ${employeeReport.employee_name}</div>
                  </div>
              `;
              
              let currentCategory = '';
              let categoryContent = '';
              
              employeeReport.products.forEach((product, productIndex) => {
                if (product.category_name !== currentCategory) {
                  // Se não for a primeira categoria, fechar a anterior
                  if (currentCategory !== '') {
                    output += `<div class="category-container" style="margin-bottom: 6px;">${categoryContent}</div>`;
                    categoryContent = '';
                  }
                  
                  currentCategory = product.category_name;
                  
                  categoryContent += `
                    <div style="margin-top: 4px; margin-bottom: 2px; padding: 2px 0; border-bottom: 1px solid ${colors.categoryBorder};">
                      <div style="font-weight: 600; color: ${colors.categoryHeaderText}; font-size: 9px; padding-left: 2px;">Categoria: ${product.category_name}</div>
                    </div>
                    <div style="display: flex; padding: 2px 0; background-color: ${colors.tableHeaderBg}; margin-bottom: 1px; border-bottom: 1px solid #E2E8F0;">
                      <div style="width: 15%; padding-right: 4px; font-size: 8px; font-weight: 600; color: ${colors.tableHeaderText};">Código</div>
                      <div style="width: 45%; padding-right: 4px; font-size: 8px; font-weight: 600; color: ${colors.tableHeaderText};">Produto</div>
                      <div style="width: 20%; text-align: right; padding-right: 4px; font-size: 8px; font-weight: 600; color: ${colors.tableHeaderText};">Qtd</div>
                      <div style="width: 20%; font-size: 8px; font-weight: 600; color: ${colors.tableHeaderText};">Un</div>
                    </div>
                  `;
                }
                
                categoryContent += `
                  <div class="product-row" style="display: flex; padding: 1px 0; ${productIndex % 2 === 1 ? `background-color: ${colors.alternateRowBg};` : ''} border-bottom: 1px solid #E2E8F0;">
                    <div style="width: 15%; padding-right: 4px; font-size: 9px; color: ${colors.productText};">${product.product_code}</div>
                    <div style="width: 45%; padding-right: 4px; font-size: 9px; color: ${colors.productText};">${product.product_name}</div>
                    <div style="width: 20%; text-align: right; padding-right: 4px; font-size: 9px; color: ${colors.productText};">${product.quantity}</div>
                    <div style="width: 20%; font-size: 9px; color: ${colors.productText};">${formatUnit(product.unit)}</div>
                  </div>
                `;
              });
              
              // Adicionar a última categoria
              if (categoryContent !== '') {
                output += `<div class="category-container" style="margin-bottom: 6px;">${categoryContent}</div>`;
              }
              
              // Adicionar o total do colaborador
              output += `
                <div class="employee-total" style="margin-top: 4px; background-color: ${colors.totalBg}; padding: 3px 6px; border-radius: 2px; display: flex; justify-content: space-between; font-size: 9px; border: 1px solid ${colors.totalBorder};">
                  <div style="font-weight: 600; color: ${colors.totalText};">Total do colaborador:</div>
                  <div style="font-weight: 700; color: ${colors.totalText};">${employeeReport.products.reduce((sum, product) => sum + product.quantity, 0)} itens</div>
                </div>
              `;
              
              output += `</div>`;
              
              // Adicionar espaço entre colaboradores (linha horizontal)
              output += `<div style="height: 12px; border-bottom: 1px dashed ${colors.separatorBorder}; margin-bottom: 8px;"></div>`;
              
              return output;
            }).join('')}
        </div>
        `);
        
        doc.write('</div>'); // Fecha container
        doc.write('</body></html>');
        doc.close();
        
        // Aguardar o carregamento das folhas de estilo antes de imprimir
        setTimeout(() => {
          try {
            // Chamar a impressão dentro do iframe
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            
            // Remover o iframe após a impressão
            const removeIframe = () => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            };
            
            // Remover o iframe depois da impressão ou após timeout
            if (iframe.contentWindow) {
              iframe.contentWindow.onafterprint = removeIframe;
            }
            
            // Fallback se onafterprint não for suportado
            setTimeout(removeIframe, 5000);
          } catch (error) {
            console.error("Erro ao imprimir:", error);
            document.body.removeChild(iframe);
            
            toast({
              title: "Erro",
              description: "Ocorreu um erro ao imprimir o relatório.",
              variant: "destructive"
            });
          }
        }, 1000);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível criar o documento para impressão.",
          variant: "destructive"
        });
      }
    }
  };

  // Função para formatar unidade de medida (abreviada e em maiúsculo)
  const formatUnit = (unit: string): string => {
    // Mapeamento de unidades comuns para suas abreviações ou formatação exata
    const unitMap: Record<string, string> = {
      'unidade': 'unidade',
      'un': 'unidade',
      'unidades': 'unidade',
      'litro': 'L',
      'litros': 'L',
      'l': 'L',
      'metro': 'M',
      'metros': 'M',
      'm': 'M',
      'quilograma': 'KG',
      'quilogramas': 'KG',
      'kg': 'KG',
      'kilograma': 'KG',
      'kilo': 'KG',
      'kilos': 'KG',
      'grama': 'G',
      'gramas': 'G',
      'g': 'G',
      'pacote': 'pacote',
      'pacotes': 'pacote',
      'pct': 'pacote',
      'caixa': 'CX',
      'caixas': 'CX',
      'cx': 'CX',
      'peça': 'PÇ',
      'peças': 'PÇ',
      'pç': 'PÇ',
      'pc': 'PÇ',
      'pcs': 'PÇ',
      'par': 'PAR',
      'pares': 'PAR',
      'metro quadrado': 'M²',
      'metros quadrados': 'M²',
      'm2': 'M²',
      'm²': 'M²',
      'metro cúbico': 'M³',
      'metros cúbicos': 'M³',
      'm3': 'M³',
      'm³': 'M³',
    };

    // Converter para minúsculo para comparação
    const lowerUnit = unit.toLowerCase().trim();
    
    // Retornar a abreviação mapeada ou a unidade original em maiúsculo
    return unitMap[lowerUnit] || unit;
  };

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <PageWrapper>
        <ModernHeader
          title="Relatório de Saídas por Colaborador"
          subtitle="Visualize produtos de saída por colaborador"
        />
        <PageLoading message="Gerando relatório..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <ModernHeader
        title="Relatório de Saídas por Colaborador"
        subtitle="Visualize todos os produtos que saíram por colaborador, organizados por categoria."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-1.5" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              <span className="hidden xs:inline">Imprimir / PDF</span>
            </Button>
          </div>
        }
      />

      <ModernFilters className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Período</label>
            <ModernDateRangeFilter
              selectedRange={selectedDateRange}
              customDateRange={customDateRange}
              selectedDate={selectedDate}
              onRangeSelect={handleDateRangeSelect}
              onDateSelect={handleDateSelect}
              placeholder="Selecione o período"
              defaultMode="range"
              showModeToggle={true}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Colaborador</label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Selecione o colaborador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os colaboradores</SelectItem>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.code} - {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </ModernFilters>

      {/* Área do relatório com referência para impressão */}
      <div className="mt-4">
        <Card>
          <CardContent className="p-6">
            <div ref={printRef}>
              <div className="flex justify-between items-start pb-4 mb-6 border-b border-gray-200">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 mb-1">Relatório de Saídas por Colaborador</h1>
                  <p className="text-sm text-gray-500">
                    Lista completa de produtos retirados por colaborador, organizados por categoria
                  </p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>Data de emissão: {format(new Date(), 'dd/MM/yyyy')}</div>
                  <div>
                    Período: {selectedDateRange === 'custom' && customDateRange.from && customDateRange.to ? (
                      `${format(customDateRange.from, 'dd/MM/yyyy')} a ${format(customDateRange.to, 'dd/MM/yyyy')}`
                    ) : selectedDateRange === 'specificDate' ? (
                      format(selectedDate, 'dd/MM/yyyy')
                    ) : (
                      `Últimos 30 dias`
                    )}
                  </div>
                </div>
              </div>

              {reportData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro de saída encontrado para o período selecionado.
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {reportData.map((employeeReport) => (
                    <div key={employeeReport.employee_id} className="bg-white border rounded-lg overflow-hidden shadow-sm">
                      <div className="bg-blue-50 p-3 border-l-4 border-blue-500 rounded-t">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm text-blue-900 font-medium">Colaborador</div>
                            <div className="text-base font-semibold text-gray-800">{employeeReport.employee_code} - {employeeReport.employee_name}</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        {(() => {
                          // Agrupar produtos por categoria
                          const productsByCategory: Record<string, ProductOutput[]> = {};
                          
                          employeeReport.products.forEach(product => {
                            if (!productsByCategory[product.category_id]) {
                              productsByCategory[product.category_id] = [];
                            }
                            productsByCategory[product.category_id].push(product);
                          });

                          return Object.keys(productsByCategory).map(categoryId => {
                            const products = productsByCategory[categoryId];
                            const categoryName = products[0]?.category_name || 'Sem categoria';
                            
                            return (
                              <div key={categoryId} className="mb-4">
                                <div className="flex items-center border-b border-gray-200 pb-2 mb-2">
                                  <div className="bg-gray-100 p-1.5 rounded-lg mr-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                  </div>
                                  <h3 className="text-sm font-semibold text-gray-700">Categoria: {categoryName}</h3>
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex text-xs text-gray-500 px-2 py-1 bg-gray-50">
                                    <div style={{ width: '15%' }} className="font-medium">Código</div>
                                    <div style={{ width: '45%' }} className="font-medium">Produto</div>
                                    <div style={{ width: '20%' }} className="font-medium text-right">Quantidade</div>
                                    <div style={{ width: '20%' }} className="font-medium">Unidade</div>
                                  </div>
                                  
                                  {products.map((product, idx) => (
                                    <div 
                                      key={idx} 
                                      className={`flex px-2 py-2 text-sm ${idx % 2 === 1 ? 'bg-gray-50' : ''} border-b border-dashed border-gray-200`}
                                    >
                                      <div style={{ width: '15%' }}>{product.product_code}</div>
                                      <div style={{ width: '45%' }}>{product.product_name}</div>
                                      <div style={{ width: '20%' }} className="text-right">{product.quantity}</div>
                                      <div style={{ width: '20%' }}>{formatUnit(product.unit)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          });
                        })()}
                        
                        {/* Total do colaborador */}
                        <div className="mt-4 pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div className="font-medium text-gray-700">Total de produtos retirados</div>
                            <div className="flex items-center">
                              <div className="px-3 py-1 bg-blue-500 text-white font-semibold rounded-md text-sm">
                                {employeeReport.products.reduce((sum, product) => sum + product.quantity, 0)}
                              </div>
                              <div className="ml-2 text-sm text-gray-500">itens</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

// Exportação explícita para garantir que o componente possa ser importado corretamente
export default EmployeeOutputReport; 