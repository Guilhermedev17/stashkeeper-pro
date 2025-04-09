-- Script para testar a função auth.uid()

-- Verificar se a função auth.uid() existe
SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'uid' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
) AS auth_uid_function_exists;

-- Verificar o valor atual da função auth.uid()
SELECT auth.uid() AS current_auth_uid;

-- Verificar o usuário atual
SELECT current_user AS current_database_user;

-- Verificar a configuração de jwt claims
SELECT current_setting('request.jwt.claims', TRUE) AS jwt_claims;

-- Verificar se o RLS está aplicando as políticas
-- Teste em uma tabela específica (products)
SELECT 
    p.policyname,
    p.cmd,
    p.qual,
    p.with_check,
    CASE 
        WHEN (p.qual IS NOT NULL AND (auth.uid() IS NULL AND p.qual::text LIKE '%(auth.uid() IS NOT NULL)%')) THEN 'Bloqueado'
        WHEN (p.with_check IS NOT NULL AND (auth.uid() IS NULL AND p.with_check::text LIKE '%(auth.uid() IS NOT NULL)%')) THEN 'Bloqueado'
        ELSE 'Permitido'
    END as expected_access
FROM 
    pg_policies p
WHERE 
    p.schemaname = 'public' 
    AND p.tablename = 'products'; 