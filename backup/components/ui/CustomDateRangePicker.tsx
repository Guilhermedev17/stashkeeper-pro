import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";

interface CustomDateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onRangeChange: (start: Date | undefined, end: Date | undefined) => void;
  className?: string;
  placeholder?: string;
}

const CustomDateRangePicker = ({
  startDate,
  endDate,
  onRangeChange,
  className,
  placeholder = "Selecionar período"
}: CustomDateRangePickerProps) => {
  const [open, setOpen] = useState(false);
  const [calendarTab, setCalendarTab] = useState<"inicio" | "fim">("inicio");
  const [internalStartDate, setInternalStartDate] = useState<Date | undefined>(startDate);
  const [internalEndDate, setInternalEndDate] = useState<Date | undefined>(endDate);

  // Atualiza estados internos quando props mudam
  useEffect(() => {
    setInternalStartDate(startDate);
    setInternalEndDate(endDate);
  }, [startDate, endDate]);

  const handleRangeApply = () => {
    onRangeChange(internalStartDate, internalEndDate);
    setOpen(false);
  };

  const handleRangeClear = () => {
    setInternalStartDate(undefined);
    setInternalEndDate(undefined);
    onRangeChange(undefined, undefined);
    setOpen(false);
  };

  // Quando uma data é selecionada, atualize o estado interno e mude para a próxima aba
  const handleSelect = (date: Date | undefined) => {
    if (calendarTab === "inicio") {
      setInternalStartDate(date);
      setCalendarTab("fim");
    } else {
      setInternalEndDate(date);
    }
  };

  const formattedRange = (() => {
    if (startDate && endDate) {
      const formattedStart = format(startDate, "dd/MM/yyyy", { locale: ptBR });
      const formattedEnd = format(endDate, "dd/MM/yyyy", { locale: ptBR });
      return `${formattedStart} - ${formattedEnd}`;
    }
    return placeholder;
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !startDate && !endDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{formattedRange}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="bg-muted/50 p-3 font-medium text-sm">
          <Tabs value={calendarTab} onValueChange={(v) => setCalendarTab(v as "inicio" | "fim")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inicio" className="text-xs">Data Inicial</TabsTrigger>
              <TabsTrigger value="fim" className="text-xs">Data Final</TabsTrigger>
            </TabsList>
            <TabsContent value="inicio" className="mt-2">
              <Calendar
                mode="single"
                selected={internalStartDate}
                onSelect={handleSelect}
                initialFocus
                locale={ptBR}
              />
            </TabsContent>
            <TabsContent value="fim" className="mt-2">
              <Calendar
                mode="single"
                selected={internalEndDate}
                onSelect={handleSelect}
                initialFocus
                locale={ptBR}
                disabled={(date) => {
                  // Desabilita datas anteriores à data inicial
                  return internalStartDate ? date < internalStartDate : false;
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex items-center justify-between p-3 border-t">
          <Button 
            variant="ghost" 
            className="text-xs"
            onClick={handleRangeClear}
          >
            Limpar
          </Button>
          <Button 
            variant="default" 
            className="text-xs"
            onClick={handleRangeApply}
            disabled={!internalStartDate || !internalEndDate}
          >
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CustomDateRangePicker; 