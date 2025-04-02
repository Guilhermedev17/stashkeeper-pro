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
        return "from-primary/80 to-primary/10";
      case "low":
        return "from-orange-500/80 to-orange-500/10";
      case "in":
        return "from-green-500/80 to-green-500/10";
      case "out":
        return "from-blue-500/80 to-blue-500/10";
      default:
        return "from-primary/80 to-primary/10";
    }
  };

  return (
    <Card className="overflow-hidden card-hover border-0">
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradient()} opacity-[0.08] rounded-xl`}></div>
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background dark:bg-card shadow-sm">
            {getIcon()}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{value}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const StatsCards = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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