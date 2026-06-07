-- =============================================================================
-- Geolvix — Schema Completo (v1 consolidada)
-- Incorpora todas as migrations 001–011 para facilitar recriação do container.
-- Para subir: docker compose down -v && docker compose up -d
-- =============================================================================

-- Capacidades geoespaciais
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- 1. Organizações (Tradings / Cooperativas)
-- =============================================================================
CREATE TABLE organizacoes (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj                VARCHAR(14)  UNIQUE NOT NULL,
    razao_social        VARCHAR(255) NOT NULL,
    plano_status        VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
    limite_propriedades INT          NOT NULL DEFAULT 3,
    data_assinatura     DATE,
    plano_nome          VARCHAR(100),
    mensalidade         NUMERIC(10, 2) DEFAULT 0,
    bonus_propriedades  INT          NOT NULL DEFAULT 0,
    -- EUDR: número de identificação do operador exportador junto à UE
    eori_number         VARCHAR(20),
    -- Asaas: preenchido no primeiro PAYMENT_RECEIVED (webhook)
    asaas_customer_id   VARCHAR(50),
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_organizacoes_asaas_customer_id
    ON organizacoes (asaas_customer_id)
    WHERE asaas_customer_id IS NOT NULL;

COMMENT ON COLUMN organizacoes.eori_number IS
    'Economic Operators Registration and Identification. '
    'Obrigatório na DDS submetida ao EUDR IS da UE. Formato: 2 letras do país + até 15 dígitos.';

COMMENT ON COLUMN organizacoes.asaas_customer_id IS
    'ID do cliente no Asaas. Associado no primeiro PAYMENT_RECEIVED. Null enquanto aguarda pagamento.';

-- =============================================================================
-- 2. Usuários (RBAC multi-tenant)
-- =============================================================================
CREATE TABLE usuarios (
    id                          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id              UUID         REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome                        VARCHAR(255) NOT NULL,
    email                       VARCHAR(255) UNIQUE NOT NULL,
    senha_hash                  VARCHAR(512) NOT NULL,
    role                        VARCHAR(50)  NOT NULL, -- ROLE_SUPERADMIN | ROLE_ADMIN | ROLE_OPERADOR | ROLE_VISUALIZADOR
    ativo                       BOOLEAN      NOT NULL DEFAULT TRUE,
    -- Soft delete (admin desativa; NULL = ativo)
    deleted_at                  TIMESTAMP,
    -- LGPD Art. 18 VI: data da solicitação formal de exclusão de dados
    solicitacao_exclusao_at     TIMESTAMP,
    -- LGPD: registro de consentimento eletrônico
    termo_aceito_versao         VARCHAR(50),
    termo_aceito_timestamp      TIMESTAMP,
    termo_aceito_ip             VARCHAR(45),
    termo_aceito_user_agent     VARCHAR(512),
    -- Dados de contato (opcionais)
    funcao                      VARCHAR(100),
    telefone                    VARCHAR(20),
    cpf_criptografado           VARCHAR(512), -- LGPD: minimização de dados
    -- Senha temporária gerada pelo admin no primeiro acesso
    senha_temporaria            BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_solicitacao_exclusao
    ON usuarios (organizacao_id, solicitacao_exclusao_at)
    WHERE solicitacao_exclusao_at IS NOT NULL;

CREATE INDEX idx_usuarios_org_ativo
    ON usuarios (organizacao_id, ativo)
    WHERE ativo = TRUE;

COMMENT ON COLUMN usuarios.senha_temporaria IS
    'TRUE enquanto o usuário não trocar a senha temporária gerada pelo admin no primeiro acesso.';

-- =============================================================================
-- 3. Propriedades Rurais (dados espaciais)
-- =============================================================================
CREATE TABLE propriedades_rurais (
    id                          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id              UUID            REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome_propriedade            VARCHAR(255)    NOT NULL,
    codigo_car                  VARCHAR(100)    UNIQUE,
    municipio                   VARCHAR(100),
    estado                      CHAR(2),        -- UF brasileira (ex: MT, SP)

    -- Geometria da fazenda completa (WGS84) — usada na análise NDVI
    -- Gerenciada exclusivamente pelo GIS Ingestion Service.
    geometria                   GEOMETRY(Polygon, 4326) NOT NULL,
    area_hectares               NUMERIC(10, 2),

    -- Talhão de produção (subconjunto da fazenda) — usado no DDS
    -- Ref: EUDR FAQ 1.15 — a DDS referencia o talhão produtivo, não o perímetro total.
    -- Opção A: polígono (qualquer área)
    geometria_producao          GEOMETRY(Polygon, 4326),
    area_producao_hectares      NUMERIC(10, 2),
    -- Opção B: ponto único (para talhões < 4 ha — EUDR FAQ 1.7)
    -- Prioridade no DDS: geometria_producao > ponto_producao
    ponto_producao              GEOMETRY(Point, 4326),
    ponto_producao_lat          NUMERIC(9,  6), -- duplicado para leitura pelo Core/Hibernate
    ponto_producao_lon          NUMERIC(11, 6),

    -- LGPD: dados do produtor — opcionais e criptografados
    produtor_nome_criptografado VARCHAR(512),
    produtor_cpf_criptografado  VARCHAR(512),

    -- Baseline EUDR (referência 31/12/2020 — nunca alterado após a primeira análise)
    ndvi_baseline               NUMERIC(5, 4),
    data_imagem_baseline        DATE,
    chave_imagem_baseline       VARCHAR(512),

    -- Commodity principal da propriedade (legado; análises têm commodity própria)
    commodity_type              VARCHAR(50),

    -- Soft delete (para evitar abuso de limite de plano por delete+recadastro)
    deleted_at                  TIMESTAMP DEFAULT NULL,

    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices espaciais
CREATE INDEX idx_propriedades_geometria
    ON propriedades_rurais USING GIST (geometria);

CREATE INDEX idx_propriedades_geometria_producao
    ON propriedades_rurais USING GIST (geometria_producao)
    WHERE geometria_producao IS NOT NULL;

CREATE INDEX idx_propriedades_ponto_producao
    ON propriedades_rurais USING GIST (ponto_producao)
    WHERE ponto_producao IS NOT NULL;

-- Índice para cálculo de cota mensal (ativas + deletadas no mês)
CREATE INDEX idx_propriedades_quota_mensal
    ON propriedades_rurais (organizacao_id, created_at, deleted_at);

COMMENT ON COLUMN propriedades_rurais.geometria_producao IS
    'Polígono do talhão de produção. Usado como polygon_eudr.geojson na DDS. '
    'NULL até o operador fazer upload via POST /{id}/producao/poligono.';

COMMENT ON COLUMN propriedades_rurais.area_producao_hectares IS
    'Área do talhão de produção em hectares. Calculada via ST_Area(geometria_producao::geography)/10000.';

COMMENT ON COLUMN propriedades_rurais.ponto_producao IS
    'Ponto de geolocalização para talhões < 4 ha (EUDR FAQ 1.7). '
    'Alternativa ao polígono. GeoJSON Point exportado no polygon_eudr.geojson da DDS.';

COMMENT ON COLUMN propriedades_rurais.ponto_producao_lat IS
    'Latitude do ponto de produção (WGS84). Duplicada de ponto_producao para Hibernate (sem tipo PostGIS).';

COMMENT ON COLUMN propriedades_rurais.ponto_producao_lon IS
    'Longitude do ponto de produção (WGS84). Par de ponto_producao_lat.';

-- =============================================================================
-- 4. Análises Satelitais (laudos emitidos)
-- =============================================================================
CREATE TABLE analises_eudr (
    id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    propriedade_id       UUID          REFERENCES propriedades_rurais(id) ON DELETE CASCADE,
    status_verificacao   VARCHAR(50)   NOT NULL, -- CONFORME | DESMATAMENTO_DETECTADO | ERRO_PROCESSO | ANALISANDO
    url_laudo_pdf        VARCHAR(512),
    indice_ndvi_medio    NUMERIC(5, 4),
    -- Cobertura de nuvens — persistida para geração do laudo PDF sob demanda
    cloud_pct_baseline   NUMERIC(5, 2),
    cloud_pct_atual      NUMERIC(5, 2),
    alerta_nuvens        BOOLEAN       DEFAULT FALSE,
    -- Chave OCI da imagem NDVI colorida desta análise
    chave_imagem_atual   VARCHAR(512),
    -- % da área com perda de vegetação (análise pixel a pixel)
    pct_area_desmatada   NUMERIC(5, 2),
    -- Commodity associada — permite múltiplas análises por propriedade
    commodity_type       VARCHAR(50),
    data_analise         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN analises_eudr.commodity_type IS
    'Commodity desta análise (ex: SOJA, CAFE). '
    'Permite múltiplas análises por propriedade, uma por commodity exportada. '
    'Código HS/CN derivado do enum CommodityType em runtime.';

COMMENT ON COLUMN analises_eudr.pct_area_desmatada IS
    'Percentual da área do polígono com perda significativa de vegetação (análise pixel a pixel). '
    '0.0 quando a análise pixel a pixel não foi possível.';

-- =============================================================================
-- 5. Logs de Auditoria de Acesso (LGPD — Transparência/Responsabilização)
-- =============================================================================
CREATE TABLE logs_auditoria_acesso (
    id                          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id              UUID         REFERENCES organizacoes(id) ON DELETE CASCADE,
    usuario_id                  UUID,        -- sem FK para preservar log após exclusão do usuário
    usuario_email_anonimizado   VARCHAR(255) NOT NULL,
    acao                        VARCHAR(100) NOT NULL, -- LOGIN | VISUALIZOU_LAUDO | DOWNLOAD_PDF | ...
    detalhes                    TEXT,
    ip_address                  VARCHAR(45),
    created_at                  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 6. Row-Level Security (isolamento multi-tenant)
-- =============================================================================
ALTER TABLE usuarios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios              FORCE  ROW LEVEL SECURITY;
ALTER TABLE propriedades_rurais   ENABLE ROW LEVEL SECURITY;
ALTER TABLE propriedades_rurais   FORCE  ROW LEVEL SECURITY;
ALTER TABLE analises_eudr         ENABLE ROW LEVEL SECURITY;
ALTER TABLE analises_eudr         FORCE  ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria_acesso FORCE  ROW LEVEL SECURITY;

-- Injeção de contexto: SET LOCAL app.current_organization_id = '<uuid>';
-- Bypass para workers internos: SET LOCAL app.bypass_rls = 'true';

CREATE POLICY tenant_usuarios_policy ON usuarios
    FOR ALL USING (
        (current_setting('app.bypass_rls', true) = 'true') OR
        (organizacao_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
    );

CREATE POLICY tenant_propriedades_policy ON propriedades_rurais
    FOR ALL USING (
        (current_setting('app.bypass_rls', true) = 'true') OR
        (
            organizacao_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid
            AND deleted_at IS NULL
        )
    );

CREATE POLICY tenant_analises_policy ON analises_eudr
    FOR ALL USING (
        (current_setting('app.bypass_rls', true) = 'true') OR
        (propriedade_id IN (SELECT id FROM propriedades_rurais))
    );

CREATE POLICY tenant_logs_policy ON logs_auditoria_acesso
    FOR ALL USING (
        (current_setting('app.bypass_rls', true) = 'true') OR
        (organizacao_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
    );

-- =============================================================================
-- 7. Seed de Desenvolvimento (UUIDs estáticos)
-- =============================================================================
INSERT INTO organizacoes (id, razao_social, cnpj, limite_propriedades, plano_status, plano_nome, mensalidade)
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Geolvix Holding Ltda', '12345678000199', 10, 'ACTIVE', 'Enterprise', 0)
ON CONFLICT (cnpj) DO NOTHING;

-- Senha: Admin@123! (BCrypt hash)
INSERT INTO usuarios (id, organizacao_id, nome, email, senha_hash, role, ativo)
VALUES (
    'f47170f1-e5d7-4632-a54f-a496fb428456',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Daniel Faria',
    'daniel.faria@geolvix.com',
    '$2b$10$7l4qImT7KD.QVJgFyVsFHu9E.7SCBxqnWUqUWTzoF3I.D3ABHvYH2',
    'ROLE_SUPERADMIN',
    true
)
ON CONFLICT (email) DO NOTHING;
