import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Edit } from 'lucide-react';

interface Category {
    id: string;
    name: string;
}

interface EditProduct {
    code: string;
    name: string;
    description: string;
    category: string;
    unit: string;
    currentQty: number;
    minQty: number;
}

interface ModernEditProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: EditProduct | undefined | null;
    categories: Category[];
    onSave: (product: EditProduct) => void;
}

/**
 * Diálogo modernizado para editar produtos existentes no sistema.
 * Inclui formulário com campos necessários e validação básica.
 */
export function ModernEditProductDialog({
    open,
    onOpenChange,
    product,
    categories,
    onSave,
}: ModernEditProductDialogProps) {
    // Se não houver produto, usar um modelo vazio para evitar erros
    const emptyProduct: EditProduct = {
        code: '',
        name: '',
        description: '',
        category: '',
        unit: '',
        currentQty: 0,
        minQty: 0
    };

    const [editedProduct, setEditedProduct] = useState<EditProduct>(product || emptyProduct);

    // Atualizar editedProduct quando o produto mudar
    useEffect(() => {
        if (product) {
            setEditedProduct(product);
        }
    }, [product]);

    // Se não houver produto e o diálogo estiver aberto, não mostrar nada
    if (!product && open) {
        onOpenChange(false);
        return null;
    }

    const handleChange = (field: keyof EditProduct, value: string | number) => {
        setEditedProduct((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(editedProduct);
        onOpenChange(false);
    };

    const isValid = editedProduct.code.trim() !== '' && editedProduct.name.trim() !== '';

    // Lista de unidades disponíveis para garantir que valores personalizados também sejam suportados
    const unitOptions = [
        { value: "unidade", label: "Unidade" },
        { value: "kg", label: "Kg" },
        { value: "g", label: "g" },
        { value: "ml", label: "ml" },
        { value: "l", label: "L" },
        { value: "m", label: "m" },
        { value: "cm", label: "cm" },
        { value: "caixa", label: "Caixa" },
        { value: "pacote", label: "Pacote" }
    ];

    // Função para obter o rótulo da unidade a partir do valor
    const getUnitLabel = (unitValue: string): string => {
        const unit = unitOptions.find(u => u.value.toLowerCase() === unitValue.toLowerCase());
        return unit ? unit.label : unitValue;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Edit className="h-5 w-5 text-primary" />
                        Editar Produto
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                    <div className="grid gap-3">
                        <Label htmlFor="code" className="text-sm font-medium">
                            Código
                        </Label>
                        <Input
                            id="code"
                            value={editedProduct.code}
                            onChange={(e) => handleChange('code', e.target.value)}
                            placeholder="Código do produto"
                            className="w-full"
                            disabled={true}
                        />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="name" className="text-sm font-medium">
                            Nome
                        </Label>
                        <Input
                            id="name"
                            value={editedProduct.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Nome do produto"
                            className="w-full"
                        />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="description" className="text-sm font-medium">
                            Descrição
                        </Label>
                        <Textarea
                            id="description"
                            value={editedProduct.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Descrição do produto"
                            className="w-full min-h-[80px]"
                        />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="category" className="text-sm font-medium">
                            Categoria
                        </Label>
                        <Select
                            value={editedProduct.category}
                            onValueChange={(value) => handleChange('category', value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="unit" className="text-sm font-medium">
                            Unidade
                        </Label>
                        <Select
                            defaultValue={editedProduct.unit}
                            onValueChange={(value) => handleChange('unit', value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue>
                                    {getUnitLabel(editedProduct.unit)}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {unitOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="currentQty" className="text-sm font-medium">
                                Quantidade Atual
                            </Label>
                            <Input
                                id="currentQty"
                                type="number"
                                value={editedProduct.currentQty}
                                onChange={(e) => handleChange('currentQty', Number(e.target.value))}
                                className="w-full"
                                min="0"
                            />
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="minQty" className="text-sm font-medium">
                                Quantidade Mínima
                            </Label>
                            <Input
                                id="minQty"
                                type="number"
                                value={editedProduct.minQty}
                                onChange={(e) => handleChange('minQty', Number(e.target.value))}
                                className="w-full"
                                min="0"
                            />
                        </div>
                    </div>
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
                        disabled={!isValid}
                        onClick={handleSave}
                        className="w-[160px]"
                    >
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ModernEditProductDialog; 