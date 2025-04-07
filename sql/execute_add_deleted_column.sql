-- Script para adicionar a coluna deleted na tabela movements
-- Executar este script diretamente no SQL Editor do Supabase

-- 1. Adicionar a coluna deleted com valor padrão FALSE
ALTER TABLE movements
ADD COLUMN deleted BOOLEAN DEFAULT FALSE;

-- 2. Criar um índice para consultas filtradas por deleted
CREATE INDEX idx_movements_deleted ON movements(deleted);

-- 3. Atualizar os registros que já foram "excluídos" no frontend
-- Opcional: Se quiser marcar como excluídos os registros já excluídos no frontend,
-- descomente e atualize esta linha com os IDs:
-- UPDATE movements SET deleted = TRUE WHERE id IN ('id1', 'id2', 'id3');

-- 4. Atualizar a política RLS para filtrar registros excluídos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'movements' 
    AND policyname = 'Users can view movements'
  ) THEN
    DROP POLICY "Users can view movements" ON movements;
    
    CREATE POLICY "Users can view movements" ON movements
    FOR SELECT
    TO authenticated
    USING (deleted = FALSE);
  END IF;
END
$$; 