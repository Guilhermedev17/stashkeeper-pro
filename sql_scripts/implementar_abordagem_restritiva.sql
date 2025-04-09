-- Script para implementar uma abordagem restritiva para proteção das tabelas
-- Utiliza uma combinação de políticas PERMISSIVE e RESTRICTIVE para garantir maior segurança

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

-- 3. Criar políticas restritivas para bloquear acesso não autenticado
-- Estas políticas são aplicadas primeiro e bloqueiam usuários anônimos

-- Tabela products
CREATE POLICY "restrict_products_anon" ON products 
  AS RESTRICTIVE FOR ALL 
  USING (
    (CURRENT_USER <> 'anon'::name) OR 
    (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'authenticated'::text)
  );

-- Tabela categories
CREATE POLICY "restrict_categories_anon" ON categories 
  AS RESTRICTIVE FOR ALL 
  USING (
    (CURRENT_USER <> 'anon'::name) OR 
    (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'authenticated'::text)
  );

-- Tabela movements
CREATE POLICY "restrict_movements_anon" ON movements 
  AS RESTRICTIVE FOR ALL 
  USING (
    (CURRENT_USER <> 'anon'::name) OR 
    (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'authenticated'::text)
  );

-- Tabela employees
CREATE POLICY "restrict_employees_anon" ON employees 
  AS RESTRICTIVE FOR ALL 
  USING (
    (CURRENT_USER <> 'anon'::name) OR 
    (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'authenticated'::text)
  );

-- 4. Criar políticas permissivas para usuários autenticados
-- Estas políticas permitem acesso a usuários autenticados

-- Tabela products
CREATE POLICY "allow_products_auth" ON products 
  FOR ALL 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

-- Tabela categories
CREATE POLICY "allow_categories_auth" ON categories 
  FOR ALL 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

-- Tabela movements
CREATE POLICY "allow_movements_auth" ON movements 
  FOR ALL 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

-- Tabela employees
CREATE POLICY "allow_employees_auth" ON employees 
  FOR ALL 
  USING (auth.role() = 'authenticated') 
  WITH CHECK (auth.role() = 'authenticated');

-- 5. Verificar a configuração resultante
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