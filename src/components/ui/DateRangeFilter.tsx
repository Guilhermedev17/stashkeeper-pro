import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  date: Date | undefined;
  dateRange: 'day' | 'week' | 'month' | 'year' | undefined;
  onDateSelect: (date: Date | undefined) => void;
  onDateRangeSelect: (range: 'day' | 'week' | 'month' | 'year') => void;
  onClearFilter: () => void;
  className?: string;
  placeholder?: string;
}

const DateRangeFilter = ({
  date,
  dateRange,
  onDateSelect,
  onDateRangeSelect,
  onClearFilter,
  className,
  placeholder = "Selecionar data"
}: DateRangeFilterProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && !dateRange && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">
            {date ? (
              format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
            ) : dateRange ? (
              dateRange === 'day' ? 'Hoje' :
              dateRange === 'week' ? 'Última semana' :
              dateRange === 'month' ? 'Último mês' :
              'Último ano'
            ) : (
              placeholder
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="bg-muted/50 p-3 font-medium text-sm text-center border-b">
          {date 
            ? format(date, "MMMM yyyy", { locale: ptBR }) 
            : format(new Date(), "MMMM yyyy", { locale: ptBR })}
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onDateSelect(selectedDate);
            setOpen(false);
          }}
          initialFocus
          locale={ptBR}
          className="border-b rounded-none"
        />
        <div className="grid grid-cols-1 gap-2 p-3">
          <Button 
            variant="outline" 
            className="w-full justify-start text-left font-normal"
            onClick={() => {
              onDateRangeSelect('day');
              setOpen(false);
            }}
          >
            Hoje
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-left font-normal"
            onClick={() => {
              onDateRangeSelect('week');
              setOpen(false);
            }}
          >
            Última semana
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-left font-normal"
            onClick={() => {
              onDateRangeSelect('month');
              setOpen(false);
            }}
          >
            Último mês
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-left font-normal"
            onClick={() => {
              onDateRangeSelect('year');
              setOpen(false);
            }}
          >
            Último ano
          </Button>
          {(date || dateRange) && (
            <Button 
              variant="ghost" 
              className="w-full justify-start text-left font-normal text-destructive"
              onClick={() => {
                onClearFilter();
                setOpen(false);
              }}
            >
              Limpar filtro
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeFilter; 