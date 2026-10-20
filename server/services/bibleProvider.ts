import db from '../db/index.js';
import { BIBLE_BOOKS } from '../booksData.js';

export interface BibleVerseRow {
  id?: number;
  version_id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  has_commentary?: number;
}

export interface AvailableVersion {
  id: string;
  name: string;
  abbreviation: string;
  type: 'offline' | 'online';
}

export interface BibleProvider {
  getVerses(version: string, book: string, chapter: number): Promise<BibleVerseRow[]>;
}

// Catálogo fixo de versões suportadas pelo sistema Illumina
export const SUPPORTED_VERSIONS: AvailableVersion[] = [
  {
    id: 'acf',
    name: 'Almeida Corrigida Fiel',
    abbreviation: 'ACF',
    type: 'offline',
  },
  {
    id: 'nvi',
    name: 'Nova Versão Internacional',
    abbreviation: 'NVI',
    type: 'online',
  },
  {
    id: 'ara',
    name: 'Almeida Revista e Atualizada',
    abbreviation: 'ARA',
    type: 'online',
  },
];

// URLs para os repositórios abertos de dados bíblicos em português
const EXTERNAL_VERSION_REPOSITORIES: Record<string, string> = {
  nvi: 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_nvi.json',
  ara: 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_ara.json',
};

// Cache em memória durante o ciclo de vida do servidor para os datasets completos
const EXTERNAL_FULL_DATASET_CACHE = new Map<string, any[]>();

export class HybridBibleProvider implements BibleProvider {
  constructor() {
    this.ensureVersionsInDb();
  }

  /**
   * Garante que as versões suportadas estejam cadastradas na tabela bible_versions
   */
  private ensureVersionsInDb(): void {
    try {
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO bible_versions (id, name, abbreviation)
        VALUES (?, ?, ?)
      `);

      for (const ver of SUPPORTED_VERSIONS) {
        insertStmt.run(ver.id, ver.name, ver.abbreviation);
      }
    } catch (err) {
      console.error('[BibleProvider] Erro ao registrar versões padrão no SQLite:', err);
    }
  }

  /**
   * Retorna os versículos com leitura em cache/banco ou resolução remota
   */
  async getVerses(version: string, book: string, chapter: number): Promise<BibleVerseRow[]> {
    const cleanVersion = version.toLowerCase().trim();
    const cleanBook = book.trim();
    const chapterNum = Number(chapter);

    if (Number.isNaN(chapterNum) || chapterNum <= 0) {
      return [];
    }

    // 1. Sempre tenta ler do SQLite local de alta performance
    const localVerses = this.getVersesFromLocalDb(cleanVersion, cleanBook, chapterNum);
    if (localVerses.length > 0) {
      return localVerses;
    }

    // 2. Se a versão for acf e não encontrou no banco, não há fonte externa
    if (cleanVersion === 'acf') {
      return [];
    }

    // 3. Se for uma versão externa selecionada (ex: nvi ou ara), baixa da API externa e faz cache no SQLite
    if (cleanVersion in EXTERNAL_VERSION_REPOSITORIES) {
      const fetchedVerses = await this.fetchAndCacheExternalChapter(cleanVersion, cleanBook, chapterNum);
      if (fetchedVerses.length > 0) {
        // Retorna com flag has_commentary calculada a partir do SQLite
        return this.getVersesFromLocalDb(cleanVersion, cleanBook, chapterNum);
      }
    }

    return [];
  }

  /**
   * Consulta SQLite de alta performance com better-sqlite3 e flag has_commentary
   */
  private getVersesFromLocalDb(version: string, book: string, chapter: number): BibleVerseRow[] {
    try {
      return db.prepare(`
        SELECT 
          v.id, 
          v.version_id, 
          v.book, 
          v.chapter, 
          v.verse, 
          v.text,
          CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as has_commentary
        FROM bible_verses v
        LEFT JOIN verse_commentaries c
          ON LOWER(v.book) = LOWER(c.book) AND v.chapter = c.chapter AND v.verse = c.verse
        WHERE LOWER(v.version_id) = LOWER(?) AND LOWER(v.book) = LOWER(?) AND v.chapter = ?
        ORDER BY v.verse ASC
      `).all(version, book, chapter) as BibleVerseRow[];
    } catch (err) {
      console.error('[BibleProvider] Erro ao consultar SQLite local:', err);
      return [];
    }
  }

  /**
   * Baixa da API / repositório externo e salva no cache SQLite (tabela bible_verses)
   */
  private async fetchAndCacheExternalChapter(version: string, book: string, chapter: number): Promise<BibleVerseRow[]> {
    const datasetUrl = EXTERNAL_VERSION_REPOSITORIES[version];
    if (!datasetUrl) return [];

    try {
      let booksData = EXTERNAL_FULL_DATASET_CACHE.get(version);

      if (!booksData) {
        console.log(`[BibleProvider] Baixando catálogo externo da versão '${version}'...`);
        const res = await fetch(datasetUrl);
        if (!res.ok) {
          throw new Error(`Falha ao buscar versão externa: ${res.statusText}`);
        }
        booksData = (await res.json()) as any[];
        EXTERNAL_FULL_DATASET_CACHE.set(version, booksData);
      }

      // Localizar o livro correspondente
      const targetBookNorm = book.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

      const matchedBook = booksData.find((b: any) => {
        const bNameNorm = (b.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        return bNameNorm === targetBookNorm || (b.abbrev && b.abbrev.toLowerCase() === targetBookNorm);
      });

      if (!matchedBook || !matchedBook.chapters) {
        console.warn(`[BibleProvider] Livro '${book}' não encontrado no repositório externo da versão '${version}'.`);
        return [];
      }

      // O índice dos capítulos é 0-based no JSON
      const chapterIndex = chapter - 1;
      const chapterVerses = matchedBook.chapters[chapterIndex];

      if (!Array.isArray(chapterVerses) || chapterVerses.length === 0) {
        console.warn(`[BibleProvider] Capítulo ${chapter} de '${book}' não encontrado na versão '${version}'.`);
        return [];
      }

      // Salva no cache do SQLite em lote usando transação
      const insertVerseStmt = db.prepare(`
        INSERT INTO bible_verses (version_id, book, chapter, verse, text)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(version_id, book, chapter, verse) DO UPDATE SET text = excluded.text
      `);

      const canonicalBookName = matchedBook.name || book;

      const transaction = db.transaction((versesArr: string[]) => {
        versesArr.forEach((text: string, idx: number) => {
          insertVerseStmt.run(version, canonicalBookName, chapter, idx + 1, text.trim());
          // Se o nome do livro buscado tiver grafia ligeiramente diferente, garante o alias
          if (canonicalBookName.toLowerCase() !== book.toLowerCase()) {
            insertVerseStmt.run(version, book, chapter, idx + 1, text.trim());
          }
        });
      });

      transaction(chapterVerses);
      console.log(`[BibleProvider] Sucesso: ${chapterVerses.length} versículos cacheados no SQLite para ${version.toUpperCase()} - ${book} ${chapter}.`);

      return chapterVerses.map((text: string, idx: number) => ({
        version_id: version,
        book,
        chapter,
        verse: idx + 1,
        text: text.trim(),
        has_commentary: 0,
      }));
    } catch (err) {
      console.error(`[BibleProvider] Erro ao integrar versão externa ${version}:`, err);
      return [];
    }
  }
}

export const defaultBibleProvider: BibleProvider = new HybridBibleProvider();
