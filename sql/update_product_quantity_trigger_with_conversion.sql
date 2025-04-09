-- Script para criar um trigger de atualização de estoque com suporte a conversão de unidades
-- Este script deve ser executado no SQL Editor do Supabase

-- Primeiro, criar função auxiliar para converter entre unidades
CREATE OR REPLACE FUNCTION convert_units(
    value NUMERIC,
    from_unit TEXT,
    to_unit TEXT
) RETURNS NUMERIC AS $$
DECLARE
    normalized_from TEXT;
    normalized_to TEXT;
    result NUMERIC;
BEGIN
    -- Normalizar as unidades
    normalized_from := LOWER(TRIM(from_unit));
    normalized_to := LOWER(TRIM(to_unit));
    
    -- Se as unidades são iguais, não precisa converter
    IF normalized_from = normalized_to THEN
        RETURN value;
    END IF;
    
    -- Normalizar unidades de volume (litros e mililitros)
    IF normalized_from IN ('l', 'litro', 'litros', 'lt', 'lts') THEN
        normalized_from := 'l';
    ELSIF normalized_from IN ('ml', 'mililitro', 'mililitros') THEN
        normalized_from := 'ml';
    END IF;
    
    IF normalized_to IN ('l', 'litro', 'litros', 'lt', 'lts') THEN
        normalized_to := 'l';
    ELSIF normalized_to IN ('ml', 'mililitro', 'mililitros') THEN
        normalized_to := 'ml';
    END IF;
    
    -- Normalizar unidades de peso (quilos e gramas)
    IF normalized_from IN ('kg', 'quilo', 'quilos', 'quilograma', 'quilogramas', 'kilo', 'kilos') THEN
        normalized_from := 'kg';
    ELSIF normalized_from IN ('g', 'grama', 'gramas') THEN
        normalized_from := 'g';
    END IF;
    
    IF normalized_to IN ('kg', 'quilo', 'quilos', 'quilograma', 'quilogramas', 'kilo', 'kilos') THEN
        normalized_to := 'kg';
    ELSIF normalized_to IN ('g', 'grama', 'gramas') THEN
        normalized_to := 'g';
    END IF;
    
    -- Normalizar unidades de comprimento (metros e centímetros)
    IF normalized_from IN ('m', 'metro', 'metros') THEN
        normalized_from := 'm';
    ELSIF normalized_from IN ('cm', 'centímetro', 'centímetros') THEN
        normalized_from := 'cm';
    END IF;
    
    IF normalized_to IN ('m', 'metro', 'metros') THEN
        normalized_to := 'm';
    ELSIF normalized_to IN ('cm', 'centímetro', 'centímetros') THEN
        normalized_to := 'cm';
    END IF;
    
    -- Realizar conversões
    -- Conversões de volume
    IF normalized_from = 'ml' AND normalized_to = 'l' THEN
        result := value * 0.001; -- 1ml = 0.001l
    ELSIF normalized_from = 'l' AND normalized_to = 'ml' THEN
        result := value * 1000; -- 1l = 1000ml
    
    -- Conversões de peso
    ELSIF normalized_from = 'g' AND normalized_to = 'kg' THEN
        result := value * 0.001; -- 1g = 0.001kg
    ELSIF normalized_from = 'kg' AND normalized_to = 'g' THEN
        result := value * 1000; -- 1kg = 1000g
    
    -- Conversões de comprimento
    ELSIF normalized_from = 'cm' AND normalized_to = 'm' THEN
        result := value * 0.01; -- 1cm = 0.01m
    ELSIF normalized_from = 'm' AND normalized_to = 'cm' THEN
        result := value * 100; -- 1m = 100cm
    
    -- Se não tem conversão definida, retorna o valor original
    ELSE
        result := value;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Verificar se a coluna 'unit' existe na tabela 'movements'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'movements' AND column_name = 'unit'
    ) THEN
        ALTER TABLE movements ADD COLUMN unit TEXT;
        COMMENT ON COLUMN movements.unit IS 'Unidade de medida da movimentação, pode ser diferente da unidade do produto';
    END IF;
END $$;

-- Criar ou substituir a função do trigger com suporte a conversão de unidades
CREATE OR REPLACE FUNCTION update_product_quantity()
RETURNS TRIGGER AS $$
DECLARE
    product_unit TEXT;
    converted_quantity NUMERIC;
BEGIN
    -- Para movimentações novas (INSERT)
    IF TG_OP = 'INSERT' THEN
        -- Obter a unidade do produto
        SELECT unit INTO product_unit FROM products WHERE id = NEW.product_id;
        
        -- Se for uma entrada, aumenta a quantidade do produto
        IF NEW.type = 'entrada' AND (NEW.deleted IS NULL OR NEW.deleted = FALSE) THEN
            -- Converter a quantidade se necessário (movimento.unit -> produto.unit)
            IF NEW.unit IS NOT NULL AND NEW.unit != product_unit THEN
                converted_quantity := convert_units(NEW.quantity, NEW.unit, product_unit);
            ELSE
                converted_quantity := NEW.quantity;
            END IF;
            
            UPDATE products
            SET quantity = quantity + converted_quantity
            WHERE id = NEW.product_id;
            
        -- Se for uma saída, diminui a quantidade do produto
        ELSIF NEW.type = 'saida' AND (NEW.deleted IS NULL OR NEW.deleted = FALSE) THEN
            -- Converter a quantidade se necessário (movimento.unit -> produto.unit)
            IF NEW.unit IS NOT NULL AND NEW.unit != product_unit THEN
                converted_quantity := convert_units(NEW.quantity, NEW.unit, product_unit);
            ELSE
                converted_quantity := NEW.quantity;
            END IF;
            
            UPDATE products
            SET quantity = quantity - converted_quantity
            WHERE id = NEW.product_id;
        END IF;
    
    -- Para movimentações que estão sendo atualizadas (UPDATE)
    ELSIF TG_OP = 'UPDATE' THEN
        -- Obter a unidade do produto
        SELECT unit INTO product_unit FROM products WHERE id = NEW.product_id;
        
        -- Se a movimentação estiver sendo marcada como excluída (deleted = TRUE)
        IF NEW.deleted = TRUE AND (OLD.deleted IS NULL OR OLD.deleted = FALSE) THEN
            -- Converter a quantidade se necessário (movimento.unit -> produto.unit)
            IF OLD.unit IS NOT NULL AND OLD.unit != product_unit THEN
                converted_quantity := convert_units(OLD.quantity, OLD.unit, product_unit);
            ELSE
                converted_quantity := OLD.quantity;
            END IF;
            
            -- Se era uma entrada, reverter subtraindo
            IF OLD.type = 'entrada' THEN
                UPDATE products
                SET quantity = quantity - converted_quantity
                WHERE id = OLD.product_id;
            -- Se era uma saída, reverter adicionando
            ELSIF OLD.type = 'saida' THEN
                UPDATE products
                SET quantity = quantity + converted_quantity
                WHERE id = OLD.product_id;
            END IF;
        -- Se estiver sendo alterada a quantidade ou tipo da movimentação
        ELSIF (NEW.quantity <> OLD.quantity OR NEW.type <> OLD.type OR NEW.unit <> OLD.unit) AND 
              (NEW.deleted IS NULL OR NEW.deleted = FALSE) THEN
            -- Primeiro, reverter o efeito da movimentação antiga
            IF OLD.unit IS NOT NULL AND OLD.unit != product_unit THEN
                converted_quantity := convert_units(OLD.quantity, OLD.unit, product_unit);
            ELSE
                converted_quantity := OLD.quantity;
            END IF;
            
            IF OLD.type = 'entrada' THEN
                UPDATE products
                SET quantity = quantity - converted_quantity
                WHERE id = OLD.product_id;
            ELSIF OLD.type = 'saida' THEN
                UPDATE products
                SET quantity = quantity + converted_quantity
                WHERE id = OLD.product_id;
            END IF;
            
            -- Depois, aplicar o efeito da nova movimentação
            IF NEW.unit IS NOT NULL AND NEW.unit != product_unit THEN
                converted_quantity := convert_units(NEW.quantity, NEW.unit, product_unit);
            ELSE
                converted_quantity := NEW.quantity;
            END IF;
            
            IF NEW.type = 'entrada' THEN
                UPDATE products
                SET quantity = quantity + converted_quantity
                WHERE id = NEW.product_id;
            ELSIF NEW.type = 'saida' THEN
                UPDATE products
                SET quantity = quantity - converted_quantity
                WHERE id = NEW.product_id;
            END IF;
        END IF;
    
    -- Para movimentações que estão sendo excluídas (DELETE)
    ELSIF TG_OP = 'DELETE' THEN
        -- Obter a unidade do produto
        SELECT unit INTO product_unit FROM products WHERE id = OLD.product_id;
        
        -- Converter a quantidade se necessário (movimento.unit -> produto.unit)
        IF OLD.unit IS NOT NULL AND OLD.unit != product_unit THEN
            converted_quantity := convert_units(OLD.quantity, OLD.unit, product_unit);
        ELSE
            converted_quantity := OLD.quantity;
        END IF;
        
        -- Se era uma entrada, diminui a quantidade
        IF OLD.type = 'entrada' AND (OLD.deleted IS NULL OR OLD.deleted = FALSE) THEN
            UPDATE products
            SET quantity = quantity - converted_quantity
            WHERE id = OLD.product_id;
        -- Se era uma saída, aumenta a quantidade
        ELSIF OLD.type = 'saida' AND (OLD.deleted IS NULL OR OLD.deleted = FALSE) THEN
            UPDATE products
            SET quantity = quantity + converted_quantity
            WHERE id = OLD.product_id;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Remover o trigger se já existir
DROP TRIGGER IF EXISTS movements_update_product_quantity ON movements;

-- Criar o trigger para executar a função após inserções, atualizações ou exclusões na tabela movements
CREATE TRIGGER movements_update_product_quantity
AFTER INSERT OR UPDATE OR DELETE ON movements
FOR EACH ROW
EXECUTE FUNCTION update_product_quantity();

-- Comentário para documentar o trigger
COMMENT ON TRIGGER movements_update_product_quantity ON movements IS 'Atualiza automaticamente a quantidade em estoque do produto quando uma movimentação é registrada, atualizada ou excluída, com suporte a conversão de unidades';

-- Verificar se o trigger foi criado
DO $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.triggers
        WHERE trigger_name = 'movements_update_product_quantity'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        RAISE NOTICE 'O trigger de atualização de estoque com conversão está corretamente instalado.';
    ELSE
        RAISE EXCEPTION 'ERRO: O trigger de atualização de estoque não foi instalado corretamente!';
    END IF;
END $$; 