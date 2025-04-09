-- Script para configurar bypass do RLS para usuários específicos
-- Este script permite que roles específicas ignorem as restrições de RLS

-- 1. Verificar primeiro se o RLS está ativado
SELECT 
    n.nspname as schema,
    c.relname as table,
    CASE WHEN c.relrowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status
FROM 
    pg_class c
JOIN 
    pg_namespace n ON n.oid = c.relnamespace
WHERE 
    c.relkind = 'r' 
    AND n.nspname = 'public' 
    AND c.relname IN ('products', 'categories', 'movements', 'employees')
ORDER BY 
    n.nspname, c.relname;

-- 2. Habilitar o RLS em todas as tabelas caso não esteja
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 3. Configurar a tabela para permitir que o role 'authenticated' ignore o RLS
ALTER TABLE products FORCE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ALTER COLUMN id SET STATISTICS 0;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;
GRANT USAGE ON SEQUENCE products_id_seq TO authenticated;

ALTER TABLE categories FORCE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ALTER COLUMN id SET STATISTICS 0;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO authenticated;
GRANT USAGE ON SEQUENCE categories_id_seq TO authenticated;

ALTER TABLE movements FORCE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ALTER COLUMN id SET STATISTICS 0;
GRANT SELECT, INSERT, UPDATE, DELETE ON movements TO authenticated;
GRANT USAGE ON SEQUENCE movements_id_seq TO authenticated;

ALTER TABLE employees FORCE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ALTER COLUMN id SET STATISTICS 0;
GRANT SELECT, INSERT, UPDATE, DELETE ON employees TO authenticated;
GRANT USAGE ON SEQUENCE employees_id_seq TO authenticated; 