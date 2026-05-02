-- Script SQL para atualizar a tabela produtos no Supabase
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna video_url se não existir
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Adicionar coluna created_at se não existir
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- HABILITAR RLS (Row Level Security)
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- REMOVER políticas existentes se houver
DROP POLICY IF EXISTS "Permitir tudo para usuários anônimos" ON produtos;

-- CRIAR política para permitir SELECT, INSERT, UPDATE, DELETE para todos (temporário para teste)
CREATE POLICY "Permitir tudo para usuários anônimos" ON produtos
FOR ALL USING (true) WITH CHECK (true);

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'produtos'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'produtos';