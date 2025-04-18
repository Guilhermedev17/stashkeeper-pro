import { useCallback, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { Dialog } from "@/components/ui/dialog";
import ExcelImporter from "@/components/ExcelImporter";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";

// Flag global para controlar se o importador está aberto
let GLOBAL_IMPORTER_OPEN = false;

interface ImportExcelButtonProps {
  className?: string;
}

const ImportExcelButton = ({ className }: ImportExcelButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { fetchProducts } = useSupabaseProducts();
  const dialogRef = useRef(null);

  // Função para fechar o diálogo
  const handleClose = useCallback(() => {
    console.log("Fechando diálogo de importação");
    setIsDialogOpen(false);
    GLOBAL_IMPORTER_OPEN = false;
  }, []);

  // Função para atualizar a lista de produtos e fechar o diálogo
  const handleImportComplete = useCallback(() => {
    console.log("ImportExcelButton: handleImportComplete foi chamado");

    // Primeiro, atualizar os produtos diretamente
    console.log("ImportExcelButton: Chamando fetchProducts() para atualizar dados");
    fetchProducts()
      .then(() => {
        console.log("ImportExcelButton: fetchProducts() concluído com sucesso");

        // Após fetchProducts, disparar o evento para garantir que a página atualize
        setTimeout(() => {
          console.log("ImportExcelButton: Disparando evento excel-import-complete");
          const event = new CustomEvent('excel-import-complete');
          window.dispatchEvent(event);
        }, 100);
      })
      .catch(err => {
        console.error("ImportExcelButton: Erro ao atualizar produtos:", err);

        // Mesmo se falhar, ainda disparamos o evento para que outros componentes possam tentar atualizar
        const event = new CustomEvent('excel-import-complete');
        window.dispatchEvent(event);
      });

    // NÃO fechamos o diálogo automaticamente para mostrar os resultados
    // O usuário deve fechar manualmente para ver o resumo da importação
  }, [fetchProducts]);

  // Função para abrir o diálogo, garantindo que só haja uma instância
  const openDialog = useCallback(() => {
    if (GLOBAL_IMPORTER_OPEN) {
      console.warn("Importador Excel já está aberto");
      return;
    }

    console.log("Abrindo diálogo de importação");
    setIsDialogOpen(true);
    // Não definimos GLOBAL_IMPORTER_OPEN aqui pois o ExcelImporter irá defini-lo
  }, []);

  // Limpar estado global quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (isDialogOpen) {
        GLOBAL_IMPORTER_OPEN = false;
      }
    };
  }, [isDialogOpen]);

  return (
    <>
      <Button
        onClick={openDialog}
        className={`gap-1.5 h-10 ${className || ''}`}
        variant="outline"
        title="Importar produtos via Excel"
      >
        <FileSpreadsheet className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm">Importar Produtos</span>
      </Button>

      {isDialogOpen && (
        <ExcelImporter
          onClose={handleClose}
          onImportComplete={handleImportComplete}
        />
      )}
    </>
  );
};

export default ImportExcelButton; 