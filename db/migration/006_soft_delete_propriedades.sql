-- Migration 006: Soft delete em propriedades_rurais
-- Motivação: Impede abuso de limite de plano via delete+recadastro.
-- A cota agora é calculada como: propriedades ativas + propriedades deletadas no mês corrente.

ALTER TABLE propriedades_rurais
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Índice para acelerar a query de cota mensal (organizacao_id + created_at + deleted_at)
CREATE INDEX IF NOT EXISTS idx_propriedades_quota_mensal
    ON propriedades_rurais (organizacao_id, created_at, deleted_at);

-- Atualizar a política RLS para excluir soft-deleted das queries normais de tenant
-- (o bypass_rls já cobre o worker/admin que precisam ver tudo)
DROP POLICY IF EXISTS tenant_propriedades_policy ON propriedades_rurais;

CREATE POLICY tenant_propriedades_policy ON propriedades_rurais
    FOR ALL USING (
        (current_setting('app.bypass_rls', true) = 'true') OR
        (
            organizacao_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid
            AND deleted_at IS NULL
        )
    );
