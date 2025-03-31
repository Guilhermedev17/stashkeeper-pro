-- Este script corrige possíveis problemas na tabela de movimentos

-- 1. Primeiro, vamos verificar se a tabela existe e recriá-la se necessário
DROP TABLE IF EXISTS movements;

-- 2. Criar a tabela com as constraints corretas
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('entrada', 'saida')) NOT NULL,
  quantity INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Criar índices para melhorar a performance
CREATE INDEX idx_movements_product_id ON movements(product_id);
CREATE INDEX idx_movements_user_id ON movements(user_id);
CREATE INDEX idx_movements_created_at ON movements(created_at);

-- 4. Verificar se as relações estão configuradas corretamente
-- Nota: O Supabase gerencia automaticamente as relações com base nas constraints,
-- mas você pode precisar atualizar as configurações na interface do Supabase
-- para garantir que as relações sejam reconhecidas corretamente.