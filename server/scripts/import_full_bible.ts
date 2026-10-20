import db from '../db/index.js';
import { BIBLE_BOOKS } from '../booksData.js';

interface RemoteBook {
  abbrev: string;
  name: string;
  chapters: string[][];
}

const REMOTE_BIBLE_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_acf.json';

// Dicionário de normalização para os 66 nomes oficiais de server/booksData.ts
const NAME_MAP: Record<string, string> = {
  'lamentações de jeremias': 'Lamentações',
  'lamentacoes de jeremias': 'Lamentações',
  'lamentações': 'Lamentações',
  'oséias': 'Oseias',
  'oseias': 'Oseias',
  'miquéias': 'Miqueias',
  'miqueias': 'Miqueias',
};

function normalizeBookName(rawName: string, index: number): string {
  const clean = rawName.trim().toLowerCase();
  if (NAME_MAP[clean]) {
    return NAME_MAP[clean];
  }
  // Se coincidir por posição na lista canônica dos 66 livros
  if (BIBLE_BOOKS[index]) {
    return BIBLE_BOOKS[index].name;
  }
  return rawName.trim();
}

async function main() {
  console.log('⬇️  Baixando texto bíblico completo ACF (66 livros)...');
  const response = await fetch(REMOTE_BIBLE_URL);
  if (!response.ok) {
    throw new Error(`Falha no download da Bíblia: HTTP ${response.status} - ${response.statusText}`);
  }

  const rawBible = (await response.json()) as RemoteBook[];
  console.log(`📦 ${rawBible.length} livros recebidos. Iniciando inserção em lote no SQLite...`);

  const startTime = Date.now();

  // Garante a versão ACF
  db.prepare(`
    INSERT OR IGNORE INTO bible_versions (id, name, abbreviation)
    VALUES (?, ?, ?)
  `).run('acf', 'Almeida Corrigida Fiel', 'ACF');

  const insertVerseStmt = db.prepare(`
    INSERT OR IGNORE INTO bible_verses (version_id, book, chapter, verse, text)
    VALUES (?, ?, ?, ?, ?)
  `);

  let totalVerses = 0;

  // Transação em lote de alta performance
  const importTransaction = db.transaction(() => {
    for (let bookIndex = 0; bookIndex < rawBible.length; bookIndex++) {
      const bookData = rawBible[bookIndex];
      const officialBookName = normalizeBookName(bookData.name, bookIndex);

      for (let chIndex = 0; chIndex < bookData.chapters.length; chIndex++) {
        const chapterNum = chIndex + 1;
        const versesList = bookData.chapters[chIndex];

        for (let vIndex = 0; vIndex < versesList.length; vIndex++) {
          const verseNum = vIndex + 1;
          const verseText = versesList[vIndex].trim();

          insertVerseStmt.run('acf', officialBookName, chapterNum, verseNum, verseText);
          totalVerses++;
        }
      }
    }
  });

  importTransaction();

  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Sucesso! ${totalVerses} versículos processados e indexados em ${elapsedSeconds}s.`);

  // Verificação no banco
  const countResult = db.prepare(`SELECT COUNT(*) as count FROM bible_verses WHERE version_id = 'acf'`).get() as { count: number };
  console.log(`📊 Total de versículos ACF no banco SQLite: ${countResult.count}`);
}

main().catch((err) => {
  console.error('❌ Erro na importação:', err);
  process.exit(1);
});
