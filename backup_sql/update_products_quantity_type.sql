-- Atualizar o tipo da coluna quantity na tabela products para suportar valores decimais
ALTER TABLE products 
  ALTER COLUMN quantity TYPE DECIMAL(10,4);

-- Atualizar também min_quantity para usar o mesmo tipo
ALTER TABLE products 
  ALTER COLUMN min_quantity TYPE DECIMAL(10,4);

COMMENT ON COLUMN products.quantity IS 'Quantidade do produto em estoque, tipo DECIMAL para suportar valores fracionados como 0,090';
COMMENT ON COLUMN products.min_quantity IS 'Quantidade mínima do produto em estoque, tipo DECIMAL para suportar valores fracionados'; 