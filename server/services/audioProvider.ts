import db from '../db/index.js';
import { BIBLE_BOOKS } from '../booksData.js';

export interface AudioResolution {
  audio_url: string;
  duration_seconds?: number;
  narrator?: string;
}

export interface AudioProvider {
  getChapterAudio(book: string, chapter: number, version: string): Promise<AudioResolution | null>;
}

// Mapeamento canônico do livro para o índice sequencial da Bíblia (1 a 66)
const BOOK_ORDER_MAP = new Map<string, number>();
BIBLE_BOOKS.forEach((b, index) => {
  const normalized = b.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  BOOK_ORDER_MAP.set(normalized, index + 1);
  BOOK_ORDER_MAP.set(b.name.toLowerCase().trim(), index + 1);
});

export class CascadeAudioProvider implements AudioProvider {
  /**
   * Resolução de áudio em cascata com cache SQLite
   */
  async getChapterAudio(book: string, chapter: number, version: string): Promise<AudioResolution | null> {
    const cleanBook = book.trim();
    const cleanVersion = version.toLowerCase().trim();
    const chapterNum = Number(chapter);

    if (!cleanBook || Number.isNaN(chapterNum) || chapterNum <= 0) {
      return null;
    }

    // 1. Verificar cache local SQLite
    const cached = this.getFromCache(cleanBook, chapterNum, cleanVersion);
    if (cached) {
      return cached;
    }

    // 2. Se não estiver em cache, resolver a partir de fontes públicas estruturadas
    const resolved = await this.resolvePublicAudio(cleanBook, chapterNum, cleanVersion);
    if (resolved) {
      // 3. Salva no cache local para requisições subsequentes serem instantâneas
      this.saveToCache(cleanBook, chapterNum, cleanVersion, resolved);
      return resolved;
    }

    return null;
  }

  private getFromCache(book: string, chapter: number, version: string): AudioResolution | null {
    try {
      const row = db.prepare(`
        SELECT audio_url, duration_seconds, narrator
        FROM chapter_audio_cache
        WHERE LOWER(book) = LOWER(?) AND chapter = ? AND LOWER(version) = LOWER(?)
      `).get(book, chapter, version) as { audio_url: string; duration_seconds?: number; narrator?: string } | undefined;

      if (row) {
        return {
          audio_url: row.audio_url,
          duration_seconds: row.duration_seconds || 180,
          narrator: row.narrator || 'Áudio Bíblia Local Cache',
        };
      }
    } catch (err) {
      console.error('[AudioProvider] Erro ao consultar cache SQLite:', err);
    }
    return null;
  }

  private saveToCache(book: string, chapter: number, version: string, data: AudioResolution): void {
    try {
      db.prepare(`
        INSERT INTO chapter_audio_cache (book, chapter, version, audio_url, duration_seconds, narrator, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(book, chapter, version) DO UPDATE SET
          audio_url = excluded.audio_url,
          duration_seconds = excluded.duration_seconds,
          narrator = excluded.narrator
      `).run(
        book,
        chapter,
        version,
        data.audio_url,
        data.duration_seconds || 180,
        data.narrator || 'Áudio Bíblia'
      );
    } catch (err) {
      console.error('[AudioProvider] Erro ao salvar no cache SQLite:', err);
    }
  }

  private async resolvePublicAudio(book: string, chapter: number, _version: string): Promise<AudioResolution | null> {
    const normalizedBook = book
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    // Fonte Prioritária 1: Gênesis 1 a 10 LibriVox Domínio Público
    if (normalizedBook === 'genesis' && chapter >= 1 && chapter <= 10) {
      const padChapter = chapter.toString().padStart(2, '0');
      return {
        audio_url: `https://archive.org/download/biblia_alm_genesis_librivox/genesis_${padChapter}_almeida.mp3`,
        duration_seconds: 240,
        narrator: 'Almeida (LibriVox Domínio Público)',
      };
    }

    // Fonte Estruturada 2: Bíblia em Áudio Português JFA (66 livros catalogados pelo Internet Archive)
    const bookNumber = BOOK_ORDER_MAP.get(normalizedBook);
    if (bookNumber) {
      return {
        audio_url: `https://archive.org/download/biblia-audio-jfa-pt-br_202604/audiojfa/${bookNumber}/${chapter}.mp3`,
        duration_seconds: 180,
        narrator: 'Almeida Revista e Corrigida (Áudio Bíblia)',
      };
    }

    // Fallback genérico caso o livro não esteja no catálogo padrão
    return {
      audio_url: `https://archive.org/download/biblia-audio-jfa-pt-br_202604/audiojfa/19/${chapter}.mp3`,
      duration_seconds: 150,
      narrator: 'Almeida Áudio Bíblia (Fallback)',
    };
  }
}

export const defaultAudioProvider: AudioProvider = new CascadeAudioProvider();
