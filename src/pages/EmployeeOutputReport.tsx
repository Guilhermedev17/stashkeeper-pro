import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  FileText, 
  Printer, 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
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
import { formatQuantity, formatUnit } from '@/lib/utils';

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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [reportData, setReportData] = useState<EmployeeReport[]>([]);
  const [reportGenerated, setReportGenerated] = useState(false);
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

  // Estado para a página atual e total de páginas
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageContentRef = useRef<HTMLDivElement>(null);
  const [pageHeight, setPageHeight] = useState(0);
  
  // Estado para o nível de zoom com valor responsivo inicial
  const [zoomLevel, setZoomLevel] = useState(0.65);
  
  // Definir o zoom inicial baseado no tamanho da tela quando o componente montar
  useEffect(() => {
    const setInitialZoom = () => {
      const width = window.innerWidth;
      let initialZoom = 0.65; // valor padrão
      
      if (width < 640) { // telas muito pequenas (mobile)
        initialZoom = 0.45;
      } else if (width < 768) { // telas pequenas (sm)
        initialZoom = 0.55;
      } else if (width < 1024) { // telas médias (md)
        initialZoom = 0.65;
      } else if (width < 1280) { // telas grandes (lg)
        initialZoom = 0.75;
      } else { // telas muito grandes (xl)
        initialZoom = 0.85;
      }
      
      setZoomLevel(initialZoom);
    };
    
    // Definir o zoom inicial
    setInitialZoom();
    
    // Atualizar o zoom se a janela for redimensionada
    window.addEventListener('resize', setInitialZoom);
    
    // Limpar event listener
    return () => window.removeEventListener('resize', setInitialZoom);
  }, []);

  // Handler para seleção de período
  const handleDateRangeSelect = (range: DateFilterRange, dates?: { from?: Date; to?: Date }) => {
    setSelectedDateRange(range);
    setReportGenerated(false);

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
    setReportGenerated(false);
  };

  // Handler para quando o usuário seleciona outro colaborador
  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    setReportGenerated(false);
  };

  // Função para gerar o relatório quando o usuário clica no botão Gerar Relatório
  const handleGenerateReport = () => {
    setIsLoading(true);
    setReportGenerated(false);

    // Calcular datas com base no filtro selecionado
    let startDate: Date = new Date();
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
    setReportGenerated(true);
    
    // Exibir mensagem de sucesso ou sem dados
    if (reportArray.length === 0) {
      toast({
        title: "Nenhum dado encontrado",
        description: "Não há registros de saída para o período e colaborador selecionados.",
        variant: "default",
        duration: 5000 // 5 segundos
      });
    } else {
      toast({
        title: "Relatório gerado com sucesso",
        description: `${reportArray.length} colaborador(es) com movimentações no período.`,
        variant: "default",
        duration: 3000 // 3 segundos
      });
    }
  };

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
        doc.write('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
        doc.write('<meta name="format-detection" content="telephone=no">');
        doc.write('<meta name="format-detection" content="date=no">');
        doc.write('<meta name="format-detection" content="address=no">');
        doc.write('<meta name="format-detection" content="email=no">');
        doc.write('<style>');
        doc.write(`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          /* Remove Page Headers, Footers and Margins in Print */
          @page { 
            size: A4; 
            margin: 0;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          html, body { 
            margin: 0;
            padding: 0;
            height: auto !important;
            overflow: visible !important;
          }
          
          body { 
            font-family: 'Inter', Arial, sans-serif;
            padding: 10mm;
            color: #333;
            line-height: 1.3;
            font-size: 10px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            position: relative;
          }
          
          /* Remover URLs e outros elementos de cabeçalho/rodapé de impressão */
          @media print {
            /* Ocultar URL e outros elementos de cabeçalho/rodapé automáticos */
            html {
              height: auto !important;
              overflow: visible !important;
            }
            
            /* Impedir cabeçalhos e rodapés automáticos */
            @page {
              size: A4;
              margin: 0mm !important;
            }
            
            /* Fixar problema específico de Firefox */
            body {
              height: auto !important;
              position: relative;
              margin: 0;
            }
            
            /* Prevenir páginas em branco extras */
            .report-container {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            
            /* Garantir que nenhum cabeçalho/rodapé seja exibido */
            head, header, footer {
              display: none !important;
            }
            
            /* Otimizações para impressão P&B */
            * {
              color-adjust: exact;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            @page {
              margin: 0;
              margin-bottom: 1cm;
              /* Remover URLs e outros elementos automáticos do cabeçalho/rodapé */
              size: A4;
              margin-top: 0 !important;
              margin-bottom: 0 !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
            
            /* Esconder URL e outros elementos automáticos do navegador */
            @page :first {
              margin-top: 0;
            }

            @page :left {
              margin-left: 0;
            }

            @page :right {
              margin-right: 0;
            }
            
            /* Estilizar numeração de páginas */
            .print-page-number {
              display: block !important;
              position: fixed !important;
              bottom: 5mm !important;
              right: 10mm !important;
              font-size: 8px !important;
              color: #666 !important;
              background-color: white !important;
              padding: 2px 4px !important;
              border: 1px solid #eee !important;
              border-radius: 2px !important;
              box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
              z-index: 9999 !important;
            }
            
            /* Cada página deve começar em uma nova folha */
            .page-break-after {
              page-break-after: always !important;
              break-after: page !important;
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
        
        // Adicionar script para numeração de páginas (compatibilidade com diferentes navegadores)
        doc.write(`
          <script>
            // Função para inserir números de página em cada folha durante a impressão
            function addPageNumbers() {
              // Obter o elemento da página
              const content = document.querySelector('.report-container');
              if (!content) return;
              
              // Remover quaisquer números de página antigos
              const oldNumbers = document.querySelectorAll('.print-page-number');
              oldNumbers.forEach(el => el.remove());
              
              // Remover o número de página fixo (não vamos precisar dele)
              const fixedPageNumber = document.querySelector('.page-number');
              if (fixedPageNumber) {
                fixedPageNumber.remove();
              }
              
              // Calcular a altura da página A4 em pixels (ajustar conforme necessário)
              const pageHeight = 277 * 3.779; // altura útil A4 (297mm - 20mm margens) convertida em pixels
              
              // Obter a altura total do conteúdo
              const contentHeight = content.scrollHeight;
              
              // Calcular quantas páginas serão necessárias
              const pageCount = Math.max(1, Math.ceil(contentHeight / pageHeight));
              
              // Criar um número de página para cada página necessária (apenas para o conteúdo real)
              for (let i = 0; i < pageCount; i++) {
                const pageNumberDiv = document.createElement('div');
                pageNumberDiv.className = 'print-page-number';
                pageNumberDiv.textContent = 'Página ' + (i + 1) + ' de ' + pageCount;
                
                // Usar style direto para melhor precisão no posicionamento
                Object.assign(pageNumberDiv.style, {
                  position: 'fixed',
                  bottom: '10mm',
                  right: '10mm',
                  fontSize: '8px',
                  color: '#666',
                  backgroundColor: 'white',
                  padding: '2px 4px',
                  border: '1px solid #eee',
                  borderRadius: '2px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  zIndex: '9999',
                  margin: '0',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                });
                
                document.body.appendChild(pageNumberDiv);
                
                // Adicionar quebra de página antes da próxima página (exceto a última)
                if (i < pageCount - 1) {
                  const pageBreak = document.createElement('div');
                  pageBreak.className = 'page-break-after';
                  pageBreak.style.position = 'absolute';
                  pageBreak.style.top = ((i + 1) * pageHeight) + 'px';
                  pageBreak.style.height = '0';
                  pageBreak.style.width = '100%';
                  pageBreak.style.pageBreakAfter = 'always';
                  pageBreak.style.breakAfter = 'page';
                  document.body.appendChild(pageBreak);
                }
              }
              
              console.log('Adicionados números para ' + pageCount + ' páginas');
            }
            
            // Chamar a função antes da impressão
            window.onbeforeprint = addPageNumbers;
            
            // Também executar após o carregamento para a visualização prévia
            window.addEventListener('load', function() {
              setTimeout(addPageNumbers, 500);
            });
          </script>
        `);
        
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
                    <div style="width: 20%; text-align: right; padding-right: 4px; font-size: 9px; color: ${colors.productText};">${formatQuantity(product.quantity, product.unit)}</div>
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
                  <div style="font-weight: 700; color: ${colors.totalText};">${formatQuantity(employeeReport.products.reduce((sum, product) => sum + product.quantity, 0), 'un')} itens</div>
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
            // Verificar e ajustar altura do conteúdo para evitar páginas extras
            const contentDiv = iframe.contentDocument?.querySelector('.report-container');
            if (contentDiv && contentDiv instanceof HTMLElement) {
              // Definir altura automática para evitar páginas extras
              contentDiv.style.height = 'auto';
              contentDiv.style.overflow = 'visible';
              
              // Forçar recálculo para garantir que não haverá páginas extras
              if (iframe.contentDocument?.body) {
                iframe.contentDocument.body.style.height = 'auto';
              }
              if (iframe.contentDocument?.documentElement) {
                iframe.contentDocument.documentElement.style.height = 'auto';
              }
            }
            
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
              variant: "destructive",
              duration: 5000 // 5 segundos
            });
          }
        }, 1000);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível criar o documento para impressão.",
          variant: "destructive",
          duration: 5000 // 5 segundos
        });
      }
    }
  };

  // Função para calcular a altura total de conteúdo e o número de páginas
  const calculatePages = () => {
    if (pageContentRef.current && printRef.current) {
      // Altura do conteúdo real em pixels
      const contentHeight = printRef.current.scrollHeight;
      
      // Altura útil de uma página A4 em pixels
      // A4 = 297mm de altura, com 20mm de margens total (10mm superior + 10mm inferior)
      // Altura útil = 277mm
      // Em pixels (96 DPI): 1mm ≈ 3.779px
      const a4HeightPx = 277 * 3.779;
      
      // Adicionar um buffer para compensar pequenas variações de layout
      const bufferHeight = 20; // pixels
      const adjustedA4Height = a4HeightPx - bufferHeight;
      
      // Calcular o número de páginas e garantir pelo menos 1 página
      const pagesNeeded = Math.max(1, Math.ceil(contentHeight / adjustedA4Height));
      
      console.log('Altura do conteúdo:', contentHeight, 'px');
      console.log('Altura útil por página:', adjustedA4Height, 'px');
      console.log('Páginas necessárias:', pagesNeeded);
      
      setTotalPages(pagesNeeded);
      setPageHeight(adjustedA4Height);
      
      // Se estiver em uma página que não existe mais, voltar para a última
      if (currentPage > pagesNeeded) {
        setCurrentPage(pagesNeeded);
      }
    }
  };

  // Recalcular páginas quando o conteúdo mudar
  useEffect(() => {
    if (reportGenerated) {
      // Dar tempo suficiente para o conteúdo ser renderizado completamente
      const timer = setTimeout(() => {
        calculatePages();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [reportData, reportGenerated]);

  // Usar ResizeObserver para recalcular quando o tamanho do conteúdo mudar
  useEffect(() => {
    if (reportGenerated && printRef.current) {
      const resizeObserver = new ResizeObserver(debounce(() => {
        calculatePages();
      }, 300));
      
      resizeObserver.observe(printRef.current);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [reportGenerated]);

  // Função debounce para evitar múltiplas chamadas em sequência
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  // Quando a página atual mudar, ajustar o scroll e atualizar o número da página
  useEffect(() => {
    if (pageContentRef.current && pageHeight > 0) {
      const scrollTo = (currentPage - 1) * pageHeight;
      pageContentRef.current.scrollTop = scrollTo;
    }
  }, [currentPage, pageHeight]);

  // Funções de navegação
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  
  // Funções de zoom
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.2)); // Limitar zoom máximo a 120%
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.3)); // Limitar zoom mínimo a 30%

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
          reportGenerated ? (
            <div className="flex gap-2">
              {/* Remover botão duplicado de impressão */}
            </div>
          ) : null
        }
      />

      <ModernFilters className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
            <Select value={selectedEmployee} onValueChange={handleEmployeeChange}>
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
          <div className="flex items-end">
            <Button 
              onClick={handleGenerateReport} 
              className="w-full gap-2"
              size="default"
            >
              <Search className="h-4 w-4" />
              Gerar Relatório
            </Button>
          </div>
        </div>
      </ModernFilters>

      {/* Área do relatório com referência para impressão - só mostra se o relatório foi gerado */}
      {reportGenerated && (
        <div className="mt-6">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              {/* Controles de pré-visualização e navegação */}
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={currentPage === 1} className="h-8 w-8 p-0">
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1} className="h-8 w-8 p-0">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm mx-2">Página {currentPage} de {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToLastPage} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                  <div className="h-8 border-l border-gray-200 mx-2"></div>
                  <Button variant="outline" size="sm" onClick={zoomOut} title="Reduzir zoom" className="h-8 w-8 p-0">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs whitespace-nowrap">{Math.round(zoomLevel * 100)}%</span>
                  <Button variant="outline" size="sm" onClick={zoomIn} title="Aumentar zoom" className="h-8 w-8 p-0">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" className="gap-1.5" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  <span className="hidden xs:inline">Imprimir / PDF</span>
                </Button>
              </div>
              
              {/* Wrapper para simular o papel A4 com visualização paginada */}
              <div className="flex justify-center py-6 bg-card dark:bg-card relative">
                <div className="absolute top-0 left-0 right-0 text-center mt-1 text-xs text-muted-foreground">
                  Pré-visualização de impressão (a folha será sempre branca)
                </div>
                <div 
                  className="w-full flex justify-center overflow-hidden"
                  style={{
                    height: `calc(297mm * ${zoomLevel})`,
                    transition: 'height 0.2s ease-in-out'
                  }}
                >
                  <div 
                    className="bg-white shadow-lg dark:shadow-primary/20 mx-auto relative border-2 dark:border-primary/30"
                    style={{
                      width: '210mm',
                      height: '297mm',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'top center',
                    }}
                  >
                    {/* Container para permitir deslocamento vertical do conteúdo conforme a página */}
                    <div 
                      ref={pageContentRef}
                      className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden"
                      style={{
                        padding: '10mm',
                      }}
                    >
                      <div ref={printRef} className="text-sm text-black">
                        {reportData.length === 0 ? (
                          <div className="text-center py-6 text-gray-800">
                            <FileText className="h-10 w-10 mx-auto mb-3 opacity-40 text-gray-800" />
                            <p className="text-base text-gray-900">Nenhum registro de saída encontrado para o período selecionado.</p>
                          </div>
                        ) : (
                          <div>
                            {/* Cabeçalho do relatório - igual ao impresso */}
                            <div className="border-b-2 border-black pb-2 mb-4 flex justify-between">
                              <div>
                                <div className="text-base font-bold text-black">StashKeeperPro</div>
                                <div className="text-sm font-semibold text-black">Relatório de Saídas por Colaborador</div>
                                <div className="text-xs text-black">Produtos agrupados por colaborador e categoria</div>
                              </div>
                              <div className="text-right text-xs text-black">
                                <div>Emissão: {format(new Date(), 'dd/MM/yyyy')}</div>
                                <div>Período: {selectedDateRange === 'custom' && customDateRange.from && customDateRange.to ? 
                                  `${format(customDateRange.from, 'dd/MM/yyyy')} a ${format(customDateRange.to, 'dd/MM/yyyy')}` : 
                                  selectedDateRange === 'specificDate' ? format(selectedDate, 'dd/MM/yyyy') : 'Últimos 30 dias'}</div>
                              </div>
                            </div>

                            {/* Número da página no canto inferior */}
                            <div className="absolute bottom-4 right-10 text-xs text-gray-700">
                              Página {currentPage} de {totalPages}
                            </div>

                            {/* Lista de colaboradores no formato impresso */}
                            <div className="space-y-2 pb-8">
                              {reportData.map((employeeReport) => (
                                <div key={employeeReport.employee_id} className="mb-4 break-inside-avoid">
                                  {/* Nome do colaborador com fundo preto */}
                                  <div className="border border-black bg-white mb-px">
                                    <div className="font-semibold text-sm px-2 py-1 border-l-4 border-black text-black">
                                      {employeeReport.employee_code} - {employeeReport.employee_name}
                                    </div>
                                  </div>

                                  {/* Categorias e produtos em tabelas */}
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
                                        <div key={categoryId} className="mb-1 break-inside-avoid">
                                          {/* Nome da categoria */}
                                          <div className="border-t border-b border-black">
                                            <div className="px-2 py-0.5 text-xs font-medium text-black">
                                              Categoria: {categoryName}
                                            </div>
                                          </div>
                                          
                                          {/* Cabeçalho da tabela */}
                                          <div className="flex text-xs font-medium border-b border-black">
                                            <div className="w-[15%] px-2 py-0.5 text-black">Código</div>
                                            <div className="w-[45%] px-2 py-0.5 text-black">Produto</div>
                                            <div className="w-[20%] px-2 py-0.5 text-right text-black">Qtd</div>
                                            <div className="w-[20%] px-2 py-0.5 text-black">Un</div>
                                          </div>
                                          
                                          {/* Lista de produtos */}
                                          <div>
                                            {products.map((product, idx) => (
                                              <div 
                                                key={idx} 
                                                className={`flex text-xs ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200`}
                                              >
                                                <div className="w-[15%] px-2 py-0.5 text-black">{product.product_code}</div>
                                                <div className="w-[45%] px-2 py-0.5 text-black">{product.product_name}</div>
                                                <div className="w-[20%] px-2 py-0.5 text-right text-black">{formatQuantity(product.quantity, product.unit)}</div>
                                                <div className="w-[20%] px-2 py-0.5 text-black">{formatUnit(product.unit)}</div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                  
                                  {/* Total do colaborador */}
                                  <div className="border border-black mb-4">
                                    <div className="flex justify-between px-2 py-0.5 text-xs">
                                      <div className="font-medium text-black">Total do colaborador:</div>
                                      <div className="font-bold text-black">{formatQuantity(employeeReport.products.reduce((sum, product) => sum + product.quantity, 0), 'un')} itens</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mensagem para instruir o usuário quando nenhum relatório foi gerado ainda */}
      {!reportGenerated && !isLoading && (
        <div className="mt-10 text-center p-8 border border-dashed rounded-lg bg-muted/20">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum relatório gerado</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Selecione um período e um colaborador, em seguida clique em "Gerar Relatório" para visualizar os dados.
          </p>
        </div>
      )}
    </PageWrapper>
  );
};

export default EmployeeOutputReport; 