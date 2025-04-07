-- Script para inserir movimentações de teste na tabela movements
-- Este script insere alguns exemplos de movimentações para teste

-- Primeiro vamos buscar alguns IDs de produtos existentes no banco
-- Substitua 'product-id-*' pelos IDs reais dos produtos na sua base de dados
-- Exemplo: SELECT id FROM products LIMIT 5;

-- Inserir entradas de produtos
INSERT INTO movements (id, product_id, type, quantity, notes, created_at)
VALUES
  (gen_random_uuid(), 'product-id-1', 'entrada', 10.5, 'Entrada inicial de estoque', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), 'product-id-2', 'entrada', 20, 'Recebimento de fornecedor', NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), 'product-id-3', 'entrada', 5.75, 'Ajuste de inventário', NOW() - INTERVAL '1 day');

-- Inserir saídas de produtos
INSERT INTO movements (id, product_id, type, quantity, notes, created_at)
VALUES
  (gen_random_uuid(), 'product-id-1', 'saida', 3.5, 'Venda para cliente', NOW() - INTERVAL '12 hours'),
  (gen_random_uuid(), 'product-id-2', 'saida', 7, 'Uso interno', NOW() - INTERVAL '6 hours'),
  (gen_random_uuid(), 'product-id-3', 'saida', 2.25, 'Perda no estoque', NOW() - INTERVAL '3 hours');

-- Se quiser adicionar movimentações com funcionários, use este exemplo:
-- Substitua 'employee-id-*' pelos IDs reais dos funcionários na sua base de dados

INSERT INTO movements (id, product_id, type, quantity, notes, employee_id, created_at)
VALUES
  (gen_random_uuid(), 'product-id-1', 'entrada', 15, 'Recebimento com responsável', 'employee-id-1', NOW() - INTERVAL '1 hour'),
  (gen_random_uuid(), 'product-id-2', 'saida', 4.5, 'Saída com responsável', 'employee-id-2', NOW());

-- Nota: Execute primeiro o comando SELECT para verificar os IDs dos produtos
-- Exemplo:
--   SELECT id, name, code FROM products LIMIT 10;
--   SELECT id, name, code FROM employees LIMIT 10;
-- Substitua os IDs no script acima pelos IDs reais obtidos na consulta 