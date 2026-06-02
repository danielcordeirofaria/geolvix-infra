const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, PageBreak
} = require("docx");
const fs = require("fs");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: "1A5276" };
const headerBorders = { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, color: "1A5276", font: "Arial" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: "2E86C1", font: "Arial" })]
  });
}

function h3(text) {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text, bold: true, size: 22, color: "1A5276", font: "Arial" })]
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 20, font: "Arial", ...opts })]
  });
}

function code(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    shading: { fill: "F2F3F4", type: ShadingType.CLEAR },
    indent: { left: 360 },
    children: [new TextRun({ text, size: 18, font: "Courier New", color: "1A5276" })]
  });
}

function bullet(text, bold_prefix = "") {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [
      ...(bold_prefix ? [new TextRun({ text: bold_prefix, bold: true, size: 20, font: "Arial" })] : []),
      new TextRun({ text, size: 20, font: "Arial" })
    ]
  });
}

function numbered(text, bold_prefix = "") {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [
      ...(bold_prefix ? [new TextRun({ text: bold_prefix, bold: true, size: 20, font: "Arial" })] : []),
      new TextRun({ text, size: 20, font: "Arial" })
    ]
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun("")] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function tag(label, color = "1A8A1A") {
  return new TextRun({ text: ` [${label}] `, color, bold: true, size: 18, font: "Arial" });
}

function stepTable(steps) {
  // steps: array of { step, acao, esperado, status }
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: headerBorders,
        shading: { fill: "1A5276", type: ShadingType.CLEAR },
        width: { size: 600, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: "#", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })]
      }),
      new TableCell({
        borders: headerBorders,
        shading: { fill: "1A5276", type: ShadingType.CLEAR },
        width: { size: 3000, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: "Ação", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })]
      }),
      new TableCell({
        borders: headerBorders,
        shading: { fill: "1A5276", type: ShadingType.CLEAR },
        width: { size: 3500, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: "Resultado Esperado", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })]
      }),
      new TableCell({
        borders: headerBorders,
        shading: { fill: "1A5276", type: ShadingType.CLEAR },
        width: { size: 1260, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })]
      }),
    ]
  });

  const rows = steps.map((s, i) =>
    new TableRow({
      children: [
        new TableCell({
          borders,
          shading: { fill: i % 2 === 0 ? "FFFFFF" : "F8F9FA", type: ShadingType.CLEAR },
          width: { size: 600, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(s.step), size: 18, font: "Arial" })] })]
        }),
        new TableCell({
          borders,
          shading: { fill: i % 2 === 0 ? "FFFFFF" : "F8F9FA", type: ShadingType.CLEAR },
          width: { size: 3000, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: s.acao, size: 18, font: "Arial" })] })]
        }),
        new TableCell({
          borders,
          shading: { fill: i % 2 === 0 ? "FFFFFF" : "F8F9FA", type: ShadingType.CLEAR },
          width: { size: 3500, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: s.esperado, size: 18, font: "Arial" })] })]
        }),
        new TableCell({
          borders,
          shading: { fill: i % 2 === 0 ? "FFFFFF" : "F8F9FA", type: ShadingType.CLEAR },
          width: { size: 1260, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "⬜ Pendente", size: 16, font: "Arial", color: "888888" })] })]
        }),
      ]
    })
  );

  return new Table({
    width: { size: 8360, type: WidthType.DXA },
    columnWidths: [600, 3000, 3500, 1260],
    rows: [headerRow, ...rows]
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      },
      {
        reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "1A5276" },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "2E86C1" },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1A5276", space: 1 } },
            children: [
              new TextRun({ text: "Geolvix — Plano de Testes da Stack", bold: true, size: 18, font: "Arial", color: "1A5276" }),
              new TextRun({ text: "\t02/06/2026", size: 18, font: "Arial", color: "888888" }),
            ],
            tabStops: [{ type: "right", position: 9360 }]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: "1A5276", space: 1 } },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Página ", size: 16, font: "Arial", color: "888888" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "888888" }),
              new TextRun({ text: " de ", size: 16, font: "Arial", color: "888888" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: "Arial", color: "888888" }),
            ]
          })
        ]
      })
    },
    children: [
      // ─── CAPA ───────────────────────────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1440, after: 240 },
        children: [new TextRun({ text: "GEOLVIX", bold: true, size: 56, font: "Arial", color: "1A5276" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: "Plano de Testes da Stack", size: 32, font: "Arial", color: "2E86C1" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 720 },
        children: [new TextRun({ text: "Versão 1.0 — Ambiente de Desenvolvimento", size: 22, font: "Arial", color: "888888" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "1A5276" }, bottom: { style: BorderStyle.SINGLE, size: 4, color: "1A5276" } },
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: "Core :8080  |  GIS Ingestion :8001  |  Satellite Worker :8002  |  PostgreSQL :5432  |  Redis :6379  |  Frontend :5173", size: 18, font: "Courier New", color: "1A5276" })]
      }),
      spacer(),
      p("Este documento contém o roteiro completo para validar todas as funcionalidades da plataforma Geolvix em ambiente local Docker. Os testes devem ser executados na ordem apresentada, pois cada seção depende dos dados criados na anterior."),
      spacer(),
      pageBreak(),

      // ─── 0. PRÉ-REQUISITOS ──────────────────────────────────────────────────
      h1("0. Pré-requisitos"),
      p("Antes de iniciar os testes, confirme que os seguintes serviços estão rodando:"),
      spacer(),
      stepTable([
        { step: "0.1", acao: "Executar: docker ps", esperado: "5 containers healthy: geolvix-db, geolvix-redis, geolvix-core, geolvix-gis-ingestion, geolvix-satellite-worker" },
        { step: "0.2", acao: "Acessar http://localhost:8080/swagger-ui.html", esperado: "Swagger UI carrega com todas as rotas da API" },
        { step: "0.3", acao: "Acessar http://localhost:8080/actuator/health", esperado: 'JSON: {"status":"UP"}' },
        { step: "0.4", acao: "Acessar http://localhost:8001/docs", esperado: "Swagger do GIS Ingestion carrega" },
        { step: "0.5", acao: "Acessar http://localhost:8002/docs", esperado: "Swagger do Satellite Worker carrega" },
        { step: "0.6", acao: "Executar: cd geolvix-web && npm run dev", esperado: "Vite dev server em http://localhost:5173" },
      ]),
      spacer(),
      p("Ferramentas necessárias para os testes de API:"),
      bullet("Bruno, Postman ou Insomnia (para chamadas REST)"),
      bullet("curl (para testes rápidos no terminal)"),
      bullet("Um arquivo GIS de teste: .geojson, .kml ou .zip com shapefile"),
      spacer(),
      p("Arquivo GeoJSON mínimo para testes (salve como fazenda_teste.geojson):"),
      code('{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-47.0,-15.0],[-47.0,-15.01],[-46.99,-15.01],[-46.99,-15.0],[-47.0,-15.0]]]},"properties":{}}]}'),
      spacer(),
      pageBreak(),

      // ─── 1. AUTENTICAÇÃO ────────────────────────────────────────────────────
      h1("1. Autenticação"),
      p("Testa o cadastro de organização e login. O token JWT retornado será usado em todos os testes subsequentes."),
      spacer(),
      h2("1.1 Registro de Nova Organização"),
      code("POST http://localhost:8080/api/v1/auth/registro"),
      p("Body (JSON):"),
      code('{"nomeOrganizacao":"Fazendas Teste Ltda","nomeAdmin":"Daniel Faria","email":"daniel@teste.com","senha":"Senha@123!","plano":"STARTER"}'),
      spacer(),
      stepTable([
        { step: "1.1", acao: "Enviar POST /api/v1/auth/registro com o body acima", esperado: "HTTP 201 Created com token JWT, orgId e dados do usuário admin" },
        { step: "1.2", acao: "Copiar o campo 'token' da resposta", esperado: "Token JWT salvo para uso nos próximos testes" },
        { step: "1.3", acao: "Copiar o campo 'organizacaoId' da resposta", esperado: "UUID da organização salvo (X-Organization-Id header)" },
        { step: "1.4", acao: "Tentar registrar com o mesmo e-mail novamente", esperado: "HTTP 400 com mensagem de e-mail já cadastrado" },
      ]),
      spacer(),
      h2("1.2 Login"),
      code("POST http://localhost:8080/api/v1/auth/login"),
      p("Body (JSON):"),
      code('{"email":"daniel@teste.com","senha":"Senha@123!"}'),
      spacer(),
      stepTable([
        { step: "1.5", acao: "Enviar POST /api/v1/auth/login com credenciais corretas", esperado: "HTTP 200 com novo token JWT" },
        { step: "1.6", acao: "Tentar login com senha errada", esperado: "HTTP 401 Unauthorized" },
        { step: "1.7", acao: "Tentar login com e-mail inexistente", esperado: "HTTP 401 Unauthorized" },
        { step: "1.8", acao: "Executar 21+ logins seguidos com credenciais erradas", esperado: "HTTP 429 Too Many Requests com header Retry-After: 60" },
      ]),
      spacer(),
      p("Para todos os próximos testes, adicione os seguintes headers em cada requisição:"),
      code("Authorization: Bearer {TOKEN}"),
      code("X-Organization-Id: {orgId}"),
      spacer(),
      pageBreak(),

      // ─── 2. PROPRIEDADES ─────────────────────────────────────────────────────
      h1("2. Propriedades Rurais"),
      p("Testa o ciclo completo de uma propriedade: cadastro, listagem, detalhe, análise NDVI, commodities e remoção."),
      spacer(),
      h2("2.1 Cadastro de Propriedade"),
      code("POST http://localhost:8080/api/v1/propriedades  (multipart/form-data)"),
      p("Campos do form:"),
      bullet("file: fazenda_teste.geojson"),
      bullet("nome_propriedade: Fazenda Bela Vista"),
      bullet("codigo_car: MT-5107701-AABBCC112233 (opcional)"),
      bullet("commodity_type: SOJA"),
      spacer(),
      stepTable([
        { step: "2.1", acao: "POST /api/v1/propriedades com arquivo GeoJSON válido e nome", esperado: "HTTP 201 com ID da propriedade e status ANALISANDO" },
        { step: "2.2", acao: "Copiar o 'id' da propriedade retornada", esperado: "UUID salvo para os próximos testes" },
        { step: "2.3", acao: "POST sem arquivo (omitir o campo file)", esperado: "HTTP 400: 'Arquivo GIS é obrigatório'" },
        { step: "2.4", acao: "POST sem nome_propriedade", esperado: "HTTP 400: 'nome_propriedade é obrigatório'" },
        { step: "2.5", acao: "POST com arquivo .txt inválido", esperado: "HTTP 400 ou 422 com erro de formato" },
        { step: "2.6", acao: "POST sem o header X-Organization-Id", esperado: "HTTP 400: 'Cabeçalho X-Organization-Id é obrigatório'" },
      ]),
      spacer(),
      h2("2.2 Listagem e Filtros"),
      code("GET http://localhost:8080/api/v1/propriedades"),
      spacer(),
      stepTable([
        { step: "2.7", acao: "GET /api/v1/propriedades sem parâmetros", esperado: "HTTP 200 com lista paginada (page 0, size 20)" },
        { step: "2.8", acao: "GET /api/v1/propriedades?busca=Bela", esperado: "Retorna apenas propriedades com 'Bela' no nome" },
        { step: "2.9", acao: "GET /api/v1/propriedades?status=ANALISANDO", esperado: "Retorna apenas propriedades em análise" },
        { step: "2.10", acao: "GET /api/v1/propriedades?commodityType=SOJA", esperado: "Retorna apenas propriedades com SOJA" },
        { step: "2.11", acao: "GET /api/v1/propriedades?page=0&size=5&sortBy=nomePropriedade&sortDir=asc", esperado: "Lista com 5 itens, ordenada por nome" },
        { step: "2.12", acao: "GET /api/v1/propriedades?size=200", esperado: "Retorna no máximo 100 itens (limite forçado)" },
      ]),
      spacer(),
      h2("2.3 Detalhe da Propriedade"),
      code("GET http://localhost:8080/api/v1/propriedades/{id}"),
      spacer(),
      stepTable([
        { step: "2.13", acao: "GET /api/v1/propriedades/{id} com ID válido", esperado: "HTTP 200 com dados completos e histórico de análises" },
        { step: "2.14", acao: "GET /api/v1/propriedades/{id} com UUID inexistente", esperado: "HTTP 404 Not Found" },
      ]),
      spacer(),
      pageBreak(),

      // ─── 3. ANÁLISE NDVI ───────────────────────────────────────────────────
      h1("3. Análise NDVI e Commodities"),
      spacer(),
      h2("3.1 Reprocessamento Manual"),
      code("POST http://localhost:8080/api/v1/propriedades/{id}/analisar"),
      spacer(),
      stepTable([
        { step: "3.1", acao: "POST /api/v1/propriedades/{id}/analisar", esperado: "HTTP 202 Accepted com job_id retornado" },
        { step: "3.2", acao: "Aguardar ~5s e fazer GET /api/v1/propriedades/{id}", esperado: "Status atualizado para CONFORME ou DESMATAMENTO_DETECTADO (mock mode)" },
        { step: "3.3", acao: "Verificar logs: docker logs geolvix-satellite-worker", esperado: "Logs de processamento do job NDVI" },
      ]),
      spacer(),
      h2("3.2 Adicionar Commodity à Propriedade"),
      code("POST http://localhost:8080/api/v1/propriedades/{id}/analises"),
      p("Body (JSON):"),
      code('{"commodityType":"CAFE"}'),
      spacer(),
      stepTable([
        { step: "3.4", acao: "POST /api/v1/propriedades/{id}/analises com commodityType CAFE", esperado: "HTTP 201 com nova análise criada para CAFE" },
        { step: "3.5", acao: "Repetir com commodityType CAFE (mesmo tipo)", esperado: "HTTP 409 Conflict: commodity já existe" },
        { step: "3.6", acao: "Adicionar segunda commodity válida: BORRACHA", esperado: "HTTP 201 com nova análise para BORRACHA" },
        { step: "3.7", acao: "POST sem commodityType no body", esperado: "HTTP 400: 'commodityType é obrigatório'" },
      ]),
      spacer(),
      pageBreak(),

      // ─── 4. LAUDO E DDS ───────────────────────────────────────────────────
      h1("4. Laudo PDF e Pacote DDS"),
      p("O Mock mode está ativo — análises retornam resultados simulados. Para gerar laudo, a análise precisa estar CONFORME."),
      spacer(),
      h2("4.1 Geração do Laudo PDF"),
      code("POST http://localhost:8080/api/v1/propriedades/{id}/analises/{analiseId}/laudo"),
      spacer(),
      stepTable([
        { step: "4.1", acao: "GET /api/v1/propriedades/{id} e copiar o analiseId de uma análise CONFORME", esperado: "UUID da análise salvo" },
        { step: "4.2", acao: "POST /api/v1/propriedades/{id}/analises/{analiseId}/laudo", esperado: "HTTP 202 Accepted com job_id de geração do laudo" },
        { step: "4.3", acao: "Verificar logs do satellite-worker para o job de laudo", esperado: "Log de geração do PDF (mock)" },
      ]),
      spacer(),
      h2("4.2 Pacote DDS (Due Diligence Statement)"),
      code("GET http://localhost:8080/api/v1/propriedades/{id}/analises/{analiseId}/dds-package"),
      spacer(),
      stepTable([
        { step: "4.4", acao: "GET /dds-package para análise com status CONFORME", esperado: "HTTP 200 com download de arquivo .zip contendo geojson + metadata JSON" },
        { step: "4.5", acao: "Abrir o ZIP e verificar os arquivos internos", esperado: "polygon_eudr.geojson e dds_metadata.json presentes" },
        { step: "4.6", acao: "GET /dds-package para análise DESMATAMENTO_DETECTADO", esperado: "HTTP 422 Unprocessable Entity" },
        { step: "4.7", acao: "GET /dds-package com analiseId inexistente", esperado: "HTTP 404 Not Found" },
      ]),
      spacer(),
      pageBreak(),

      // ─── 5. USUÁRIOS ───────────────────────────────────────────────────────
      h1("5. Gestão de Usuários"),
      spacer(),
      h2("5.1 Criar e Listar Usuários"),
      code("POST http://localhost:8080/api/v1/usuarios"),
      p("Body (JSON):"),
      code('{"nome":"Maria Operadora","email":"maria@teste.com","senha":"Senha@456!","role":"ROLE_VIEWER"}'),
      spacer(),
      stepTable([
        { step: "5.1", acao: "POST /api/v1/usuarios com dados válidos", esperado: "HTTP 201 com dados do usuário criado" },
        { step: "5.2", acao: "Copiar o 'id' do usuário criado", esperado: "UUID do novo usuário salvo" },
        { step: "5.3", acao: "POST com e-mail já existente", esperado: "HTTP 400 com erro de duplicidade" },
        { step: "5.4", acao: "GET /api/v1/usuarios", esperado: "HTTP 200 com lista paginada de usuários da organização" },
        { step: "5.5", acao: "GET /api/v1/usuarios?busca=Maria", esperado: "Retorna apenas Maria" },
        { step: "5.6", acao: "GET /api/v1/usuarios?role=ROLE_VIEWER&ativo=true", esperado: "Filtra por role e status" },
      ]),
      spacer(),
      h2("5.2 Atualizar Nome e Senha"),
      spacer(),
      stepTable([
        { step: "5.7", acao: 'PATCH /api/v1/usuarios/{id}/nome com body {"nome":"Maria Silva"}', esperado: "HTTP 200 com nome atualizado" },
        { step: "5.8", acao: 'PATCH /api/v1/usuarios/{id}/senha com senhaAtual e senhaNova válidas', esperado: "HTTP 200: 'Senha atualizada com sucesso'" },
        { step: "5.9", acao: "PATCH /senha com senhaAtual incorreta", esperado: "HTTP 400 com erro de senha inválida" },
      ]),
      spacer(),
      h2("5.3 Desativar e Reativar"),
      spacer(),
      stepTable([
        { step: "5.10", acao: "DELETE /api/v1/usuarios/{id}", esperado: "HTTP 200: usuário desativado (soft delete — não apagado do banco)" },
        { step: "5.11", acao: "Tentar fazer login com o usuário desativado", esperado: "HTTP 403 Forbidden: conta inativa" },
        { step: "5.12", acao: "PATCH /api/v1/usuarios/{id}/reativar", esperado: "HTTP 200 com usuário reativado" },
        { step: "5.13", acao: "Fazer login com o usuário reativado", esperado: "HTTP 200 com token JWT" },
      ]),
      spacer(),
      pageBreak(),

      // ─── 6. LGPD ──────────────────────────────────────────────────────────
      h1("6. Conformidade LGPD"),
      spacer(),
      h2("6.1 Solicitação de Exclusão de Dados"),
      code("POST http://localhost:8080/api/v1/usuarios/{id}/solicitar-exclusao"),
      spacer(),
      stepTable([
        { step: "6.1", acao: "POST /api/v1/usuarios/{id}/solicitar-exclusao", esperado: "HTTP 200 com solicitacaoExclusaoAt e prazoLimiteExclusao (15 dias)" },
        { step: "6.2", acao: "Repetir a solicitação para o mesmo usuário", esperado: "HTTP 409 Conflict: solicitação já existe" },
        { step: "6.3", acao: "GET /api/v1/admin/usuarios/solicitacoes-exclusao", esperado: "HTTP 200 listando usuários com solicitação pendente" },
      ]),
      spacer(),
      h2("6.2 Execução da Exclusão (Admin)"),
      code("DELETE http://localhost:8080/api/v1/admin/usuarios/{id}/dados"),
      spacer(),
      stepTable([
        { step: "6.4", acao: "DELETE /api/v1/admin/usuarios/{id}/dados após solicitação prévia", esperado: "HTTP 200: dados anonimizados conforme LGPD" },
        { step: "6.5", acao: "DELETE sem solicitação prévia do usuário", esperado: "HTTP 400: solicitação não registrada" },
      ]),
      spacer(),
      pageBreak(),

      // ─── 7. ADMIN / SUPERADMIN ──────────────────────────────────────────────
      h1("7. Painel Administrativo (SuperAdmin)"),
      p("Estes endpoints exigem ROLE_SUPERADMIN. Use as credenciais do seed do banco de dados."),
      spacer(),
      h2("7.1 Health Check Agregado"),
      code("GET http://localhost:8080/api/v1/admin/health"),
      spacer(),
      stepTable([
        { step: "7.1", acao: "GET /api/v1/admin/health com token SUPERADMIN", esperado: "HTTP 200 com status de todos os microsserviços (ok/degraded/critical), fila Redis e erros 24h" },
        { step: "7.2", acao: "GET /api/v1/admin/health com token de usuário comum", esperado: "HTTP 403 Forbidden" },
      ]),
      spacer(),
      h2("7.2 Logs de Auditoria"),
      code("GET http://localhost:8080/api/v1/admin/audit-logs"),
      spacer(),
      stepTable([
        { step: "7.3", acao: "GET /api/v1/admin/audit-logs", esperado: "HTTP 200 com todos os logs de auditoria" },
        { step: "7.4", acao: "GET /api/v1/admin/audit-logs?acao=LOGIN", esperado: "Logs filtrados pelo tipo LOGIN" },
        { step: "7.5", acao: "GET /api/v1/admin/audit-logs?acao=CADASTRO_PROPRIEDADE", esperado: "Logs filtrados pelo tipo de cadastro" },
      ]),
      spacer(),
      pageBreak(),

      // ─── 8. BILLING / WEBHOOK ──────────────────────────────────────────────
      h1("8. Billing (Simulação de Pagamento)"),
      p("Em ambiente dev, use o endpoint de simulação para ativar planos sem o Asaas real."),
      spacer(),
      code("POST http://localhost:8080/api/v1/webhooks/asaas/simulate/{orgId}"),
      spacer(),
      stepTable([
        { step: "8.1", acao: "POST /api/v1/webhooks/asaas/simulate/{orgId}", esperado: "HTTP 200 com organização atualizada e plano ativado" },
        { step: "8.2", acao: "POST com orgId inexistente", esperado: "HTTP 400 com mensagem de erro" },
        { step: "8.3", acao: "Tentar cadastrar propriedade com cota esgotada (sem plano ativo)", esperado: "HTTP 402 Payment Required" },
      ]),
      spacer(),
      pageBreak(),

      // ─── 9. FRONTEND ───────────────────────────────────────────────────────
      h1("9. Frontend (geolvix-web)"),
      p("Com o Vite dev server rodando em http://localhost:5173, valide as telas da aplicação."),
      spacer(),
      h2("9.1 Autenticação"),
      stepTable([
        { step: "9.1", acao: "Acessar http://localhost:5173 sem estar logado", esperado: "Redirecionamento para tela de login" },
        { step: "9.2", acao: "Fazer login com as credenciais criadas no passo 1.1", esperado: "Redirecionamento para o dashboard principal" },
        { step: "9.3", acao: "Fazer logout", esperado: "Token removido, redirecionamento para login" },
      ]),
      spacer(),
      h2("9.2 Tela de Propriedades"),
      stepTable([
        { step: "9.4", acao: "Navegar para Propriedades", esperado: "Lista de propriedades carregada com paginação" },
        { step: "9.5", acao: "Usar campo de busca para filtrar por nome", esperado: "Lista atualiza dinamicamente" },
        { step: "9.6", acao: "Filtrar por status CONFORME", esperado: "Apenas propriedades conformes exibidas" },
        { step: "9.7", acao: "Clicar em uma propriedade", esperado: "Abre página de detalhe com histórico de análises" },
      ]),
      spacer(),
      h2("9.3 Cadastro de Propriedade"),
      stepTable([
        { step: "9.8", acao: "Clicar em 'Nova Propriedade'", esperado: "Formulário de cadastro abre" },
        { step: "9.9", acao: "Preencher nome, fazer upload do GeoJSON e submeter", esperado: "Propriedade criada, redirecionamento para detalhe com status ANALISANDO" },
        { step: "9.10", acao: "Submeter formulário sem arquivo", esperado: "Validação no frontend bloqueia o envio" },
      ]),
      spacer(),
      h2("9.4 Gestão de Usuários"),
      stepTable([
        { step: "9.11", acao: "Navegar para Usuários", esperado: "Lista de usuários da organização" },
        { step: "9.12", acao: "Criar novo usuário pelo formulário", esperado: "Usuário aparece na lista" },
        { step: "9.13", acao: "Desativar usuário pela interface", esperado: "Usuário marcado como inativo" },
      ]),
      spacer(),
      h2("9.5 Página de Conta"),
      stepTable([
        { step: "9.14", acao: "Navegar para Conta/Perfil", esperado: "Dados do usuário logado exibidos" },
        { step: "9.15", acao: "Atualizar nome pela interface", esperado: "Nome atualizado com feedback de sucesso" },
        { step: "9.16", acao: "Alterar senha pela interface", esperado: "Senha atualizada com feedback de sucesso" },
      ]),
      spacer(),
      pageBreak(),

      // ─── 10. TESTES DE RESILIÊNCIA ──────────────────────────────────────────
      h1("10. Resiliência e Circuit Breaker"),
      p("Testa o comportamento do sistema quando serviços dependentes ficam indisponíveis."),
      spacer(),
      stepTable([
        { step: "10.1", acao: "Parar o GIS Ingestion: docker stop geolvix-gis-ingestion", esperado: "Serviço parado" },
        { step: "10.2", acao: "Tentar cadastrar uma nova propriedade", esperado: "HTTP 500 com erro de circuit breaker (após 10 falhas em 50%)" },
        { step: "10.3", acao: "Subir novamente: docker start geolvix-gis-ingestion", esperado: "Serviço volta após 30s de cooldown" },
        { step: "10.4", acao: "Tentar cadastrar propriedade novamente", esperado: "HTTP 201 — circuit breaker fechado, fluxo normal" },
        { step: "10.5", acao: "Parar o Redis: docker stop geolvix-redis", esperado: "Satellite Worker para de processar" },
        { step: "10.6", acao: "Cadastrar propriedade (Core → GIS OK, Worker indisponível)", esperado: "Cadastro registrado com status ANALISANDO (jobs aguardam na fila)" },
        { step: "10.7", acao: "Subir Redis: docker start geolvix-redis e aguardar 10s", esperado: "Worker reconecta e processa jobs pendentes" },
      ]),
      spacer(),
      pageBreak(),

      // ─── RESUMO ─────────────────────────────────────────────────────────────
      h1("Resumo dos Testes"),
      spacer(),
      new Table({
        width: { size: 8360, type: WidthType.DXA },
        columnWidths: [4180, 1500, 1500, 1180],
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders: headerBorders,
                shading: { fill: "1A5276", type: ShadingType.CLEAR },
                width: { size: 4180, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "Módulo", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })]
              }),
              new TableCell({
                borders: headerBorders,
                shading: { fill: "1A5276", type: ShadingType.CLEAR },
                width: { size: 1500, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Casos", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })]
              }),
              new TableCell({
                borders: headerBorders,
                shading: { fill: "1A5276", type: ShadingType.CLEAR },
                width: { size: 1500, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Aprovados", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })]
              }),
              new TableCell({
                borders: headerBorders,
                shading: { fill: "1A5276", type: ShadingType.CLEAR },
                width: { size: 1180, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Falhas", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })]
              }),
            ]
          }),
          ...[
            ["0. Pré-requisitos", "6"],
            ["1. Autenticação", "8"],
            ["2. Propriedades Rurais", "13"],
            ["3. Análise NDVI e Commodities", "7"],
            ["4. Laudo PDF e Pacote DDS", "7"],
            ["5. Gestão de Usuários", "13"],
            ["6. Conformidade LGPD", "5"],
            ["7. Painel Administrativo", "5"],
            ["8. Billing", "3"],
            ["9. Frontend", "16"],
            ["10. Resiliência", "7"],
          ].map(([modulo, casos], i) => new TableRow({
            children: [
              new TableCell({
                borders,
                shading: { fill: i % 2 === 0 ? "FFFFFF" : "F8F9FA", type: ShadingType.CLEAR },
                width: { size: 4180, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: modulo, size: 18, font: "Arial" })] })]
              }),
              new TableCell({
                borders,
                shading: { fill: i % 2 === 0 ? "FFFFFF" : "F8F9FA", type: ShadingType.CLEAR },
                width: { size: 1500, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: casos, size: 18, font: "Arial" })] })]
              }),
              new TableCell({
                borders,
                shading: { fill: i % 2 === 0 ? "FFFFFF" : "F8F9FA", type: ShadingType.CLEAR },
                width: { size: 1500, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "___", size: 18, font: "Arial" })] })]
              }),
              new TableCell({
                borders,
                shading: { fill: i % 2 === 0 ? "FFFFFF" : "F8F9FA", type: ShadingType.CLEAR },
                width: { size: 1180, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "___", size: 18, font: "Arial" })] })]
              }),
            ]
          })),
          new TableRow({
            children: [
              new TableCell({
                borders: headerBorders,
                shading: { fill: "EAF2F8", type: ShadingType.CLEAR },
                width: { size: 4180, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true, size: 18, font: "Arial" })] })]
              }),
              new TableCell({
                borders: headerBorders,
                shading: { fill: "EAF2F8", type: ShadingType.CLEAR },
                width: { size: 1500, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "90", bold: true, size: 18, font: "Arial" })] })]
              }),
              new TableCell({
                borders: headerBorders,
                shading: { fill: "EAF2F8", type: ShadingType.CLEAR },
                width: { size: 1500, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "___", bold: true, size: 18, font: "Arial" })] })]
              }),
              new TableCell({
                borders: headerBorders,
                shading: { fill: "EAF2F8", type: ShadingType.CLEAR },
                width: { size: 1180, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "___", bold: true, size: 18, font: "Arial" })] })]
              }),
            ]
          })
        ]
      }),
      spacer(),
      spacer(),
      p("Responsável pelos testes: ___________________________   Data: ___/___/______", { color: "888888" }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("plano_testes_geolvix.docx", buffer);
  console.log("Arquivo gerado: plano_testes_geolvix.docx");
});
