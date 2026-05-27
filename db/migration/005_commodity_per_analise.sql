-- Migration 005: Commodity por análise (suporte multi-commodity por propriedade)
-- Ref: SDD — múltiplos relatórios EUDR por fazenda (um por commodity exportada)
--
-- Antes: commodity_type ficava na tabela propriedades_rurais (uma por fazenda)
-- Depois: commodity_type também fica em analises_eudr, permitindo que uma mesma
-- fazenda tenha análises independentes para SOJA + CAFÉ + CACAU etc.
-- O campo em propriedades_rurais é mantido como legado / commodity principal.

ALTER TABLE analises_eudr
    ADD COLUMN IF NOT EXISTS commodity_type VARCHAR(50);

-- Copia o commodity da propriedade para as análises existentes (backfill de legado)
UPDATE analises_eudr ae
SET commodity_type = pr.commodity_type
FROM propriedades_rurais pr
WHERE ae.propriedade_id = pr.id
  AND pr.commodity_type IS NOT NULL
  AND ae.commodity_type IS NULL;

COMMENT ON COLUMN analises_eudr.commodity_type IS
    'Commodity associada a esta análise (ex: SOJA, CAFE). '
    'Permite múltiplas análises por propriedade, uma por commodity exportada. '
    'Código HS/CN derivado do enum CommodityType em runtime.';
