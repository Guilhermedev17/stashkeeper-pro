-- =====================================================
-- Script para corrigir permissões RLS no Supabase
-- =====================================================
-- Este script configura as políticas de Row Level Security (RLS)
-- para permitir que usuários autenticados possam inserir produtos
-- e registrar movimentações de estoque.
-- =====================================================

-- =========== CONFIGURAÇÃO DA TABELA PRODUCTS ===========

-- Habilitar RLS para a tabela products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Allow authenticated select on products" ON products;
DROP POLICY IF EXISTS "Allow authenticated insert on products" ON products;
DROP POLICY IF EXISTS "Allow authenticated update on products" ON products;
DROP POLICY IF EXISTS "Allow authenticated delete on products" ON products;

-- Criar novas políticas
-- Política para SELECT: Permite que usuários autenticados leiam produtos
CREATE POLICY "Allow authenticated select on products" 
ON products FOR SELECT 
USING (auth.role() = 'authenticated');

-- Política para INSERT: Permite que usuários autenticados criem produtos
CREATE POLICY "Allow authenticated insert on products" 
ON products FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE: Permite que usuários autenticados atualizem produtos
CREATE POLICY "Allow authenticated update on products" 
ON products FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Política para DELETE: Permite que usuários autenticados removam produtos
CREATE POLICY "Allow authenticated delete on products" 
ON products FOR DELETE 
USING (auth.role() = 'authenticated');

-- =========== CONFIGURAÇÃO DA TABELA MOVEMENTS ===========

-- Habilitar RLS para a tabela movements
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Allow authenticated select on movements" ON movements;
DROP POLICY IF EXISTS "Allow authenticated insert on movements" ON movements;
DROP POLICY IF EXISTS "Allow authenticated update on movements" ON movements;
DROP POLICY IF EXISTS "Allow authenticated delete on movements" ON movements;

-- Criar novas políticas
-- Política para SELECT: Permite que usuários autenticados leiam movimentações
CREATE POLICY "Allow authenticated select on movements" 
ON movements FOR SELECT 
USING (auth.role() = 'authenticated');

-- Política para INSERT: Permite que usuários autenticados registrem movimentações
CREATE POLICY "Allow authenticated insert on movements" 
ON movements FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE: Permite que usuários autenticados atualizem movimentações
CREATE POLICY "Allow authenticated update on movements" 
ON movements FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Política para DELETE: Permite que usuários autenticados removam movimentações
CREATE POLICY "Allow authenticated delete on movements" 
ON movements FOR DELETE 
USING (auth.role() = 'authenticated');

-- =========== MENSAGEM DE CONFIRMAÇÃO ===========
DO $$
BEGIN
    RAISE NOTICE 'Políticas RLS configuradas com sucesso!';
END $$; 