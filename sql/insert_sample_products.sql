-- Exemplo de inserção manual de produtos
-- Verifique primeiro os IDs de categoria existentes na tabela categories

INSERT INTO products (id, code, name, description, category_id, quantity, min_quantity, created_at) 
VALUES
  ('a1b2c3d4-1234-5678-9012-abcdef123456', 'PROD001', 'Produto Exemplo 1', 'Descrição do produto exemplo 1', 'categoria-id-existente-1', 100, 10, NOW()),
  ('e5f6g7h8-5678-9012-3456-ijklmn567890', 'PROD002', 'Produto Exemplo 2', 'Descrição do produto exemplo 2', 'categoria-id-existente-2', 200, 20, NOW()),
  ('i9j0k1l2-9012-3456-7890-opqrst901234', 'PROD003', 'Produto Exemplo 3', 'Descrição do produto exemplo 3', 'categoria-id-existente-3', 300, 30, NOW());

-- Substitua 'categoria-id-existente-*' pelos IDs reais das categorias
-- Garanta que os códigos (code) sejam únicos na tabela