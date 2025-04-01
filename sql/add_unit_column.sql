-- Adiciona a coluna 'unit' na tabela de produtos
ALTER TABLE products
ADD COLUMN unit text DEFAULT 'unidade' NOT NULL;

-- Atualiza os registros existentes para usar o valor padrão
UPDATE products SET unit = 'unidade' WHERE unit IS NULL;