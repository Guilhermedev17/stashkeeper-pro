-- Remove tabela existente se houver
DROP TABLE IF EXISTS movements;

-- Cria nova tabela com constraints
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('entrada', 'saida')) NOT NULL,
  quantity INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cria índice para melhor performance nas consultas
CREATE INDEX idx_movements_product_id ON movements(product_id);
CREATE INDEX idx_movements_created_at ON movements(created_at);