import React from 'react';
import { PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddProductButtonProps {
  onClick: () => void;
}

const AddProductButton: React.FC<AddProductButtonProps> = ({ onClick }) => {
  return (
    <Button onClick={onClick} className="gap-2 w-full sm:w-auto">
      <PlusSquare className="h-4 w-4" />
      <span>Adicionar Produto</span>
    </Button>
  );
};

export default AddProductButton; 