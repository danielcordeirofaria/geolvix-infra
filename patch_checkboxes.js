/**
 * patch_checkboxes.js
 *
 * Lê o plano_testes_geolvix.docx, abre o word/document.xml interno,
 * substitui todas as células de status ("⬜ Pendente") por um
 * checkbox content control clicável nativo do Word, e salva o resultado.
 *
 * Uso:
 *   node patch_checkboxes.js
 *
 * Requer: adm-zip  →  npm install adm-zip
 */

const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");

const INPUT  = "plano_testes_geolvix.docx";
const OUTPUT = "plano_testes_geolvix.docx";

// XML de um checkbox content control nativo do Word (SDT).
// w14:checkbox é o tipo especial de content control de caixa de seleção.
// O texto interno (☐ U+2610) é apenas o estado visual inicial;
// quando o usuário clica, o Word troca pelo ✔ (U+2612).
function checkboxXml(id) {
  return `<w:sdt>` +
    `<w:sdtPr>` +
      `<w:id w:val="${id}"/>` +
      `<w14:checkbox xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">` +
        `<w14:checked w14:val="0"/>` +
        `<w14:checkedState w14:val="2612" w14:font="MS Gothic"/>` +
        `<w14:uncheckedState w14:val="2610" w14:font="MS Gothic"/>` +
      `</w14:checkbox>` +
    `</w:sdtPr>` +
    `<w:sdtContent>` +
      `<w:p>` +
        `<w:pPr><w:jc w:val="center"/></w:pPr>` +
        `<w:r>` +
          `<w:rPr>` +
            `<w:rFonts w:ascii="MS Gothic" w:hAnsi="MS Gothic" w:eastAsia="MS Gothic"/>` +
            `<w:sz w:val="20"/>` +
          `</w:rPr>` +
          `<w:t>&#x2610;</w:t>` +
        `</w:r>` +
      `</w:p>` +
    `</w:sdtContent>` +
  `</w:sdt>`;
}

// Marcador gerado pelo gerar_guia_teste.js para as células de status
const STATUS_MARKER = `⬜ Pendente`;  // ⬜ Pendente

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`Arquivo não encontrado: ${INPUT}`);
    console.error("Execute primeiro: node gerar_guia_teste.js");
    process.exit(1);
  }

  const zip = new AdmZip(INPUT);
  const docEntry = zip.getEntry("word/document.xml");
  if (!docEntry) {
    console.error("word/document.xml não encontrado no docx.");
    process.exit(1);
  }

  let xml = docEntry.getData().toString("utf8");

  // Cada célula de status contém um <w:t> com o texto "⬜ Pendente".
  // A estrutura gerada pelo docx-js é algo como:
  //   <w:tc>...<w:t>⬜ Pendente</w:t>...</w:tc>
  //
  // Estratégia: substituir o conteúdo completo da <w:p> que contém
  // esse marcador pelo checkbox SDT, dentro do <w:tc>.
  //
  // Usamos uma regex que captura o parágrafo inteiro dentro da célula de status.

  let counter = 1000; // IDs únicos para os SDTs
  let replacements = 0;

  // Regex: captura <w:p>...</w:p> que contenha o marcador de status
  // Flags: s (dotAll) para cruzar linhas
  xml = xml.replace(/<w:p\b[^>]*>(?:(?!<w:p\b).)*?⬜ Pendente(?:(?!<\/w:p>).)*?<\/w:p>/gs, (match) => {
    const id = counter++;
    replacements++;
    return checkboxXml(id);
  });

  if (replacements === 0) {
    // Tentar fallback com entidade HTML caso o docx tenha codificado o emoji
    xml = xml.replace(/<w:p\b[^>]*>(?:(?!<w:p\b).)*?Pendente(?:(?!<\/w:p>).)*?<\/w:p>/gs, (match) => {
      if (!match.includes("Pendente")) return match;
      const id = counter++;
      replacements++;
      return checkboxXml(id);
    });
  }

  zip.updateFile("word/document.xml", Buffer.from(xml, "utf8"));
  zip.writeZip(OUTPUT);

  console.log(`✅ ${replacements} checkboxes inseridos.`);
  console.log(`📄 Arquivo salvo: ${OUTPUT}`);
}

main();
