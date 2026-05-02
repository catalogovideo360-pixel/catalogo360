-- Script SQL para atualizar a tabela produtos no Supabase
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna video_url se não existir
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Adicionar coluna created_at se não existir
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'produtos'
ORDER BY ordinal_position;