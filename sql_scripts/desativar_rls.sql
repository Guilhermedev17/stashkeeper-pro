-- Script para desativar o RLS temporariamente (SOMENTE PARA DEBUGGING)
-- ATENÇÃO: Isso remove todas as proteções de segurança das tabelas
-- Use apenas em ambiente de desenvolvimento e volte a ativar imediatamente após os testes

-- Desativar o RLS em todas as tabelas
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Verificar o status atual do RLS
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