import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface FilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: React.ReactNode;
    label: string;
    isActive?: boolean;
    showChevron?: boolean;
}

const FilterButton = React.forwardRef<HTMLButtonElement, FilterButtonProps>(
    ({ className, icon, label, isActive, showChevron = true, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                variant="filter"
                className={cn(
                    "h-10 px-3 justify-between relative",
                    isActive && "border-primary/50 bg-primary/5 text-primary",
                    className
                )}
                {...props}
            >
                <span className="flex items-center gap-2">
                    {icon && <span className="opacity-70">{icon}</span>}
                    <span className="text-sm font-medium truncate">{label}</span>
                </span>
                {showChevron && (
                    <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
                )}
            </Button>
        );
    }
);

FilterButton.displayName = 'FilterButton';

export { FilterButton }; 