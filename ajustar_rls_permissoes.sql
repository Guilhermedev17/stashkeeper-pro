-- Script para ajustar as políticas RLS com abordagem alternativa
-- Usando auth.role() em vez de auth.uid()

-- 1. Remover políticas existentes
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;

DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
DROP POLICY IF EXISTS "categories_update_policy" ON categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON categories;

DROP POLICY IF EXISTS "movements_select_policy" ON movements;
DROP POLICY IF EXISTS "movements_insert_policy" ON movements;
DROP POLICY IF EXISTS "movements_update_policy" ON movements;
DROP POLICY IF EXISTS "movements_delete_policy" ON movements;

DROP POLICY IF EXISTS "employees_select_policy" ON employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON employees;
DROP POLICY IF EXISTS "employees_update_policy" ON employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON employees;

-- 2. Verificar que o RLS está habilitado em todas as tabelas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas usando auth.role() = 'authenticated'
-- Tabela products
CREATE POLICY "products_select_policy" ON products FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "products_insert_policy" ON products FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "products_update_policy" ON products FOR UPDATE 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "products_delete_policy" ON products FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Tabela categories
CREATE POLICY "categories_select_policy" ON categories FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "categories_insert_policy" ON categories FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "categories_update_policy" ON categories FOR UPDATE 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "categories_delete_policy" ON categories FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Tabela movements
CREATE POLICY "movements_select_policy" ON movements FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "movements_insert_policy" ON movements FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "movements_update_policy" ON movements FOR UPDATE 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "movements_delete_policy" ON movements FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Tabela employees
CREATE POLICY "employees_select_policy" ON employees FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "employees_insert_policy" ON employees FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "employees_update_policy" ON employees FOR UPDATE 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "employees_delete_policy" ON employees FOR DELETE 
  USING (auth.role() = 'authenticated');

-- 4. Verificar a configuração resultante
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM 
    pg_policies 
WHERE 
    schemaname = 'public'; 