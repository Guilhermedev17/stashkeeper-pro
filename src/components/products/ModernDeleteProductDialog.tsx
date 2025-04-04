import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Product {
    code: string;
    name: string;
}

interface ModernDeleteProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null | undefined;
    onDelete: () => void;
}

export function ModernDeleteProductDialog({
    open,
    onOpenChange,
    product,
    onDelete,
}: ModernDeleteProductDialogProps) {
    if (!product && open) {
        onOpenChange(false);
        return null;
    }

    if (!product) return null;

    const handleDelete = () => {
        onDelete();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Excluir Produto
                    </DialogTitle>
                    <DialogDescription>
                        Esta ação não pode ser desfeita. O produto será removido permanentemente do sistema.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <p className="mb-2">
                        Tem certeza que deseja excluir o produto:
                    </p>
                    <p className="font-semibold">
                        {product.code} - {product.name}
                    </p>
                </div>

                <DialogFooter className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-[120px]"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        className="w-[160px]"
                    >
                        Excluir Produto
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ModernDeleteProductDialog; 