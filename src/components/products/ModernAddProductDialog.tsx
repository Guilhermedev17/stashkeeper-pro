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
import { PlusCircle, Plus, Loader2 } from 'lucide-react';

interface Category {
    id: string;
    name: string;
}

interface NewProduct {
    code: string;
    name: string;
    description: string;
    category: string;
    unit: string;
    initialQty: number;
    minQty: number;
}

interface ModernAddProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    onAdd: (product: NewProduct) => void;
}

/**
 * Diálogo modernizado para adicionar novos produtos ao sistema.
 * Inclui formulário com campos necessários e validação básica.
 */
export function ModernAddProductDialog({
    open,
    onOpenChange,
    categories,
    onAdd,
}: ModernAddProductDialogProps) {
    const [newProduct, setNewProduct] = useState<NewProduct>({
        code: '',
        name: '',
        description: '',
        category: '',
        unit: '',
        initialQty: 0,
        minQty: 0
    });

    // Limpar o formulário quando o diálogo for aberto
    useEffect(() => {
        if (open) {
            setNewProduct({
                code: '',
                name: '',
                description: '',
                category: '',
                unit: '',
                initialQty: 0,
                minQty: 0
            });
        }
    }, [open]);

    const handleChange = (field: keyof NewProduct, value: string | number) => {
        setNewProduct((prev) => ({ ...prev, [field]: value }));
    };

    const handleAdd = () => {
        onAdd(newProduct);
        onOpenChange(false);
    };

    const isValid = newProduct.code.trim() !== '' &&
        newProduct.name.trim() !== '' &&
        newProduct.unit.trim() !== '';

    // Renderização condicional para campos numéricos
    const displayNumberField = (value: number) => {
        return value === 0 ? '' : value;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <PlusCircle className="h-5 w-5 text-primary" />
                        Adicionar Produto
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                    <div className="grid gap-3">
                        <Label htmlFor="code" className="text-sm font-medium">
                            Código
                        </Label>
                        <Input
                            id="code"
                            value={newProduct.code}
                            onChange={(e) => handleChange('code', e.target.value)}
                            placeholder="Código do produto"
                            className="w-full"
                        />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="name" className="text-sm font-medium">
                            Nome
                        </Label>
                        <Input
                            id="name"
                            value={newProduct.name}
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
                            value={newProduct.description}
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
                            value={newProduct.category}
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
                            value={newProduct.unit}
                            onValueChange={(value) => handleChange('unit', value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione uma unidade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="un">UNIDADE</SelectItem>
                                <SelectItem value="kg">KG</SelectItem>
                                <SelectItem value="g">GRAMAS</SelectItem>
                                <SelectItem value="ml">ML</SelectItem>
                                <SelectItem value="cx">CAIXA</SelectItem>
                                <SelectItem value="pct">PACOTE</SelectItem>
                                <SelectItem value="rl">ROLO</SelectItem>
                                <SelectItem value="par">PAR</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="initialQty" className="text-sm font-medium">
                                Quantidade Inicial
                            </Label>
                            <Input
                                id="initialQty"
                                type="number"
                                value={displayNumberField(newProduct.initialQty)}
                                onChange={(e) => handleChange('initialQty', e.target.value === '' ? 0 : Number(e.target.value))}
                                className="w-full"
                                min="0"
                                placeholder="0"
                            />
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="minQty" className="text-sm font-medium">
                                Quantidade Mínima
                            </Label>
                            <Input
                                id="minQty"
                                type="number"
                                value={displayNumberField(newProduct.minQty)}
                                onChange={(e) => handleChange('minQty', e.target.value === '' ? 0 : Number(e.target.value))}
                                className="w-full"
                                min="0"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end justify-end gap-2">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                            setNewProduct({
                                code: '',
                                name: '',
                                description: '',
                                category: '',
                                unit: '',
                                initialQty: 0,
                                minQty: 0
                            });
                            onOpenChange(false);
                        }}
                        className="w-full sm:w-auto"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        className="gap-2 w-full sm:w-auto"
                        disabled={!isValid}
                        onClick={handleAdd}
                    >
                        <Plus className="h-4 w-4" /> Adicionar Produto
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ModernAddProductDialog; 