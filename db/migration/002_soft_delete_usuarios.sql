-- =============================================================================
-- Migration V2: Soft Delete e Solicitação de Exclusão de Dados (LGPD)
-- =============================================================================
-- Contexto: substitui a exclusão física imediata de usuários por um modelo
-- de soft delete (ativo=false + deleted_at) combinado com solicitação formal
-- de exclusão de dados conforme LGPD Art. 18, VI.
--
-- Executar manualmente antes de subir a aplicação com esta versão.
-- =============================================================================

-- 1. Garante que a coluna `ativo` existe com default true.
--    (Pode já existir no schema inicial — ALTER é idempotente com IF NOT EXISTS)
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Soft delete: data/hora em que o usuário foi desativado pelo admin.
--    NULL = usuário ativo.
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 3. LGPD: data/hora da solicitação formal de exclusão definitiva de dados.
--    NULL = nenhuma solicitação pendente.
--    Após preenchimento, o admin tem 15 dias para executar a exclusão física
--    dos dados cadastrais (nome, email, senha_hash, campos de termo LGPD).
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS solicitacao_exclusao_at TIMESTAMP;

-- 4. Índice para consulta eficiente de solicitações pendentes
--    (usado pelo endpoint GET /api/v1/admin/usuarios/solicitacoes-exclusao).
CREATE INDEX IF NOT EXISTS idx_usuarios_solicitacao_exclusao
    ON usuarios (organizacao_id, solicitacao_exclusao_at)
    WHERE solicitacao_exclusao_at IS NOT NULL;

-- 5. Índice para filtrar somente usuários ativos de uma organização
--    (usado pelo endpoint GET /api/v1/usuarios, query findByOrganizacaoIdAndAtivoTrue).
CREATE INDEX IF NOT EXISTS idx_usuarios_org_ativo
    ON usuarios (organizacao_id, ativo)
    WHERE ativo = TRUE;
