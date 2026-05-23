-- Ativação das capacidades geoespaciais no PostgreSQL
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Empresas Clientes (Tradings/Cooperativas)
CREATE TABLE organizacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    limite_propriedades INT NOT NULL DEFAULT 3, -- Trava física do modelo de cobrança
    plano_status VARCHAR(50) DEFAULT 'ACTIVE',
    data_assinatura DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Usuários Vinculados às Organizações (RBAC)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(512) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'SUPERADMIN', 'ADMIN', 'OPERADOR', 'VISUALIZADOR'
    ativo BOOLEAN DEFAULT TRUE,
    termo_aceito_versao VARCHAR(50), -- LGPD: Versão da política de privacidade aceita
    termo_aceito_timestamp TIMESTAMP, -- LGPD: Data/hora do aceite eletrônico
    termo_aceito_ip VARCHAR(45), -- LGPD: IP de origem do aceite para auditoria
    termo_aceito_user_agent VARCHAR(512), -- LGPD: User agent para provar consentimento
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Propriedades Rurais (Dados Espaciais)
CREATE TABLE propriedades_rurais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome_propriedade VARCHAR(255) NOT NULL,
    codigo_car VARCHAR(100) UNIQUE,
    geometria GEOMETRY(Polygon, 4326) NOT NULL, -- Coordenadas Geográficas Padrão (WGS84)
    area_hectares NUMERIC(10, 2),
    -- LGPD (Minimização): Dados de pessoas físicas (Produtor Rural) são opcionais e armazenados criptografados
    produtor_nome_criptografado VARCHAR(512),
    produtor_cpf_criptografado VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice espacial GIST essencial para consultas geográficas de alta performance
CREATE INDEX idx_propriedades_geometria ON propriedades_rurais USING GIST (geometria);

-- 4. Histórico de Análises Satelitais (Laudos Emitidos)
CREATE TABLE analises_eudr (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    propriedade_id UUID REFERENCES propriedades_rurais(id) ON DELETE CASCADE,
    status_verificacao VARCHAR(50) NOT NULL, -- 'CONFORME', 'DESMATAMENTO_DETECTADO', 'ERRO_PROCESSO'
    url_laudo_pdf VARCHAR(512),
    indice_ndvi_medio NUMERIC(5,4),
    data_analise TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Logs de Auditoria de Acesso a Dados Pessoais (LGPD - Transparência/Responsabilização)
CREATE TABLE logs_auditoria_acesso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID REFERENCES organizacoes(id) ON DELETE CASCADE,
    usuario_id UUID, -- Sem ON DELETE CASCADE para não perder o log histórico de auditoria
    usuario_email_anonimizado VARCHAR(255) NOT NULL, -- E-mail mascarado ou hash para retenção após deleção do usuário
    acao VARCHAR(100) NOT NULL, -- 'LOGIN', 'VISUALIZOU_LAUDO', 'DOWNLOAD_PDF', 'CONSULTOU_PROPRIEDADE'
    detalhes TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Ativação de Row-Level Security (RLS) para isolamento Multi-Tenant
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios FORCE ROW LEVEL SECURITY;

ALTER TABLE propriedades_rurais ENABLE ROW LEVEL SECURITY;
ALTER TABLE propriedades_rurais FORCE ROW LEVEL SECURITY;

ALTER TABLE analises_eudr ENABLE ROW LEVEL SECURITY;
ALTER TABLE analises_eudr FORCE ROW LEVEL SECURITY;

ALTER TABLE logs_auditoria_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria_acesso FORCE ROW LEVEL SECURITY;

-- Políticas de acesso baseadas no ID da organização (injetado na sessão) com suporte a bypass seguro para Workers
-- Exemplo: SET LOCAL app.current_organization_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
-- Bypass: SET LOCAL app.bypass_rls = 'true';

CREATE POLICY tenant_usuarios_policy ON usuarios
    FOR ALL USING (
        (current_setting('app.bypass_rls', true) = 'true') OR 
        (organizacao_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
    );

CREATE POLICY tenant_propriedades_policy ON propriedades_rurais
    FOR ALL USING (
        (current_setting('app.bypass_rls', true) = 'true') OR 
        (organizacao_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
    );

CREATE POLICY tenant_logs_policy ON logs_auditoria_acesso
    FOR ALL USING (
        (current_setting('app.bypass_rls', true) = 'true') OR 
        (organizacao_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
    );

-- As análises herdam o acesso restrito da tabela de propriedades rurais
CREATE POLICY tenant_analises_policy ON analises_eudr
    FOR ALL USING (
        (current_setting('app.bypass_rls', true) = 'true') OR 
        (propriedade_id IN (SELECT id FROM propriedades_rurais))
    );

-- 7. Seeds iniciais para Desenvolvimento (UUIDs estáticos de desenvolvimento)
INSERT INTO organizacoes (id, razao_social, cnpj, limite_propriedades, plano_status)
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Geolvix Holding Ltda', '12345678000199', 10, 'ACTIVE')
ON CONFLICT (cnpj) DO NOTHING;

INSERT INTO usuarios (id, organizacao_id, nome, email, senha_hash, role, ativo)
VALUES ('f47170f1-e5d7-4632-a54f-a496fb428456', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Daniel Faria', 'daniel.faria@geolvix.com', 'admin123', 'SUPERADMIN', true)
ON CONFLICT (email) DO NOTHING;
