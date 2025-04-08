-- Alterar o tipo da coluna quantity para DECIMAL(10,4)
ALTER TABLE movements 
  ALTER COLUMN quantity TYPE DECIMAL(10,4);

-- Adicionar comentário na coluna para documentar
COMMENT ON COLUMN movements.quantity IS 'Quantidade da movimentação, tipo DECIMAL para suportar valores fracionados como 0,090'; 