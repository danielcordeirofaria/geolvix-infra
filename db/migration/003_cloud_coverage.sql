-- Migration 003: Armazenar coberturas de nuvem por análise
-- Necessário para gerar o laudo PDF sob demanda com dados fidedignos de qualidade de imagem.

ALTER TABLE analises_eudr
    ADD COLUMN IF NOT EXISTS cloud_pct_baseline NUMERIC(5, 2),  -- % nuvens na imagem baseline dez/2020
    ADD COLUMN IF NOT EXISTS cloud_pct_atual    NUMERIC(5, 2),  -- % nuvens na imagem da análise atual
    ADD COLUMN IF NOT EXISTS alerta_nuvens      BOOLEAN NOT NULL DEFAULT FALSE;
