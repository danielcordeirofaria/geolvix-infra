-- Migration 004: Campos necessários para o Pacote DDS (Due Diligence Statement)
-- Ref: Regulation (EU) 2023/1115, Annex II
-- Ref: SDD Seção 6.2 — Exportação do Pacote DDS

-- EORI (Economic Operators Registration and Identification) do operador exportador.
-- Obrigatório na DDS submetida ao EUDR IS da União Europeia.
-- Formato: prefixo de 2 letras do país + até 15 dígitos (ex: BR123456789)
ALTER TABLE organizacoes
    ADD COLUMN IF NOT EXISTS eori_number VARCHAR(20);

-- Tipo de commodity produzida na propriedade (ex: 'SOJA', 'CAFE', 'CACAU').
-- Armazenado como nome do enum CommodityType — código HS/CN derivado em runtime.
-- Obrigatório para o campo "commodity" do Anexo II da Reg. UE 2023/1115.
ALTER TABLE propriedades_rurais
    ADD COLUMN IF NOT EXISTS commodity_type VARCHAR(50);
