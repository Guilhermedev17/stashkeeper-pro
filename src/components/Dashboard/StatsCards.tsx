import { Package, AlertTriangle, ArrowDownUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: "products" | "low" | "in" | "out";
  trend?: "up" | "down" | "neutral";
}

const StatCard = ({ title, value, description, icon, trend }: StatCardProps) => {
  const getIcon = () => {
    switch (icon) {
      case "products":
        return <Package className="h-5 w-5 text-primary" />;
      case "low":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "in":
        return <ArrowDown className="h-5 w-5 text-green-500" />;
      case "out":
        return <ArrowDownUp className="h-5 w-5 rotate-90 text-blue-500" />;
      default:
        return null;
    }
  };

  const getGradient = () => {
    switch (icon) {
      case "products":
        return "from-primary/80 to-primary/10 dark:from-primary/30 dark:to-primary/5";
      case "low":
        return "from-orange-500/80 to-orange-500/10 dark:from-orange-500/30 dark:to-orange-500/5";
      case "in":
        return "from-green-500/80 to-green-500/10 dark:from-green-500/30 dark:to-green-500/5";
      case "out":
        return "from-blue-500/80 to-blue-500/10 dark:from-blue-500/30 dark:to-blue-500/5";
      default:
        return "from-primary/80 to-primary/10 dark:from-primary/30 dark:to-primary/5";
    }
  };

  return (
    <Card className="overflow-hidden card-hover border dark:border-gray-800 w-full">
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradient()} opacity-[0.08] dark:opacity-[0.15] rounded-xl`}></div>
      <CardContent className="p-4 sm:p-6 relative flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <div className="flex aspect-square h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-background dark:bg-card/90 shadow-sm dark:shadow-black/10 border dark:border-gray-800">
            {getIcon()}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold">{value}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const StatsCards = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
      <StatCard
        title="Total de Produtos"
        value="6"
        description="Em 3 categorias diferentes"
        icon="products"
      />
      <StatCard
        title="Estoque Baixo"
        value="1"
        description="0 em nível crítico"
        icon="low"
      />
      <StatCard
        title="Entradas Recentes"
        value="1"
        description="Nos últimos 7 dias"
        icon="in"
      />
      <StatCard
        title="Saídas Recentes"
        value="1"
        description="Nos últimos 7 dias"
        icon="out"
      />
    </div>
  );
};

export default StatsCards; 