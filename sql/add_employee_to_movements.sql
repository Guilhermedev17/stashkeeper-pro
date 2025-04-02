-- Adiciona a coluna employee_id na tabela movements
ALTER TABLE movements
ADD COLUMN employee_id UUID REFERENCES employees(id);

-- Cria índice para melhorar performance de consultas
CREATE INDEX idx_movements_employee_id ON movements(employee_id);

-- Atualiza as políticas de segurança RLS
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- Política para visualização de movimentações
CREATE POLICY "Users can view movements" ON movements
FOR SELECT
TO authenticated
USING (true);

-- Política para inserção de movimentações
CREATE POLICY "Users can insert movements" ON movements
FOR INSERT
TO authenticated
WITH CHECK (true);