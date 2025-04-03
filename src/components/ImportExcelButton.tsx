import { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';

// ID único para o container do modal
const MODAL_CONTAINER_ID = 'excel-importer-modal-container';

// Flag global para controlar se o modal está aberto
let isModalOpen = false;

interface ImportExcelButtonProps {
  className?: string;
}

const ImportExcelButton = ({ className }: ImportExcelButtonProps) => {
  // Função para verificar se o modal já está aberto
  const isAlreadyOpen = useCallback(() => {
    return document.getElementById(MODAL_CONTAINER_ID) !== null || isModalOpen;
  }, []);

  // Função para abrir o modal de importação
  const openImporter = useCallback(() => {
    // Evitar abrir múltiplos modais
    if (isAlreadyOpen()) {
      console.warn('Modal de importação já está aberto');
      return;
    }

    // Sinalizar que o modal está aberto
    isModalOpen = true;

    // Redirecionar para a URL de importação
    window.location.href = '/import-excel';
  }, [isAlreadyOpen]);

  useEffect(() => {
    // Limpar o modal quando o componente for desmontado
    return () => {
      // Remover o container do modal, se existir
      const container = document.getElementById(MODAL_CONTAINER_ID);
      if (container) {
        document.body.removeChild(container);
        isModalOpen = false;
      }
    };
  }, []);

  return (
    <Button
      variant="outline"
      className={`gap-2 ${className || ''}`}
      onClick={openImporter}
    >
      <FileSpreadsheet className="h-4 w-4" />
      <span>Importar Excel</span>
    </Button>
  );
};

export default ImportExcelButton; 