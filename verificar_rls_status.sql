-- Script para verificar o status do RLS nas tabelas
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