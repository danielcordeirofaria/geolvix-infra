-- Migration 007: Dados de contato e identificação do usuário
-- Adiciona função/cargo, telefone e CPF (criptografado, LGPD) à tabela de usuários.

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS funcao     VARCHAR(100),
    ADD COLUMN IF NOT EXISTS telefone   VARCHAR(20),
    ADD COLUMN IF NOT EXISTS cpf_criptografado VARCHAR(512); -- CPF armazenado criptografado (LGPD — minimização de dados)
