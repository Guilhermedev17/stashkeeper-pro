-- Adiciona a coluna deleted na tabela movements para implementar soft delete
ALTER TABLE movements
ADD COLUMN deleted BOOLEAN DEFAULT FALSE;

-- Adiciona um índice para melhorar consultas filtradas por deleted
CREATE INDEX idx_movements_deleted ON movements(deleted);

-- Atualiza registros que possam estar marcados como excluídos no frontend
-- Isto converte as exclusões no localStorage do frontend para exclusões no banco
-- Esta parte é opcional e deve ser executada apenas se você quiser marcar imediatamente os registros

-- Comentário: Para marcar registros como excluídos com base em uma lista de IDs, use:
-- UPDATE movements SET deleted = TRUE WHERE id IN ('id1', 'id2', 'id3');

-- Atualiza as políticas RLS se existirem para filtrar registros excluídos
DO $$
BEGIN
  -- Verifica se a política já existe
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'movements' AND policyname = 'Users can view movements') THEN
    -- Atualiza a política existente para filtrar registros excluídos
    DROP POLICY "Users can view movements" ON movements;
    
    CREATE POLICY "Users can view movements" ON movements
    FOR SELECT
    TO authenticated
    USING (deleted = FALSE);
  END IF;
END
$$; 