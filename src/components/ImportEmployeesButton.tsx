import { useCallback, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { Dialog } from "@/components/ui/dialog";
import EmployeeImporter from "@/components/EmployeeImporter";
import { useSupabaseEmployees } from "@/hooks/useSupabaseEmployees";

// Flag global para controlar se o importador está aberto
let GLOBAL_EMPLOYEE_IMPORTER_OPEN = false;

interface ImportEmployeesButtonProps {
  className?: string;
}

const ImportEmployeesButton = ({ className }: ImportEmployeesButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { fetchEmployees } = useSupabaseEmployees();
  const dialogRef = useRef(null);

  // Função para fechar o diálogo
  const handleClose = useCallback(() => {
    console.log("Fechando diálogo de importação de colaboradores");
    setIsDialogOpen(false);
    GLOBAL_EMPLOYEE_IMPORTER_OPEN = false;
  }, []);

  // Função para atualizar a lista de colaboradores e fechar o diálogo
  const handleImportComplete = useCallback(() => {
    console.log("Atualizando colaboradores após importação");

    // Atualizar os colaboradores
    fetchEmployees();

    // Disparar um evento personalizado para notificar outros componentes
    const event = new CustomEvent('employee-import-complete');
    window.dispatchEvent(event);

    // NÃO fechamos o diálogo automaticamente para mostrar os resultados
    // O usuário deve fechar manualmente para ver o resumo da importação
  }, [fetchEmployees]);

  // Função para abrir o diálogo, garantindo que só haja uma instância
  const openDialog = useCallback(() => {
    if (GLOBAL_EMPLOYEE_IMPORTER_OPEN) {
      console.warn("Importador de colaboradores já está aberto");
      return;
    }

    console.log("Abrindo diálogo de importação de colaboradores");
    setIsDialogOpen(true);
    // Não definimos GLOBAL_EMPLOYEE_IMPORTER_OPEN aqui pois o EmployeeImporter irá defini-lo
  }, []);

  // Limpar estado global quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (isDialogOpen) {
        GLOBAL_EMPLOYEE_IMPORTER_OPEN = false;
      }
    };
  }, [isDialogOpen]);

  return (
    <>
      <Button
        onClick={openDialog}
        className={`gap-2 ${className || ''}`}
        variant="outline"
        title="Importar colaboradores via Excel"
      >
        <FileSpreadsheet className="size-4" />
        <span>Importar Excel</span>
      </Button>

      {isDialogOpen && (
        <EmployeeImporter
          onClose={handleClose}
          onImportComplete={handleImportComplete}
        />
      )}
    </>
  );
};

export default ImportEmployeesButton; 