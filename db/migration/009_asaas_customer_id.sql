-- Migration 009: campo asaas_customer_id na tabela organizacoes
--
-- Armazena o ID de cliente no Asaas (ex: "cus_000005113026").
-- Preenchido automaticamente na primeira confirmação de pagamento via webhook.
-- Usado para associar eventos futuros de cobrança à organização correta (multi-tenant).

ALTER TABLE organizacoes
    ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizacoes_asaas_customer_id
    ON organizacoes (asaas_customer_id)
    WHERE asaas_customer_id IS NOT NULL;

COMMENT ON COLUMN organizacoes.asaas_customer_id
    IS 'ID do cliente no Asaas. Associado no primeiro PAYMENT_RECEIVED. Null enquanto aguarda pagamento.';
