import 'dotenv/config';
import db from '../db/index.js';
import { generateCommentaryForVerse } from '../geminiService.js';

interface TrackItem {
  book: string;
  chapters: number[];
}

// Trilhas devocionais fundamentais com alta busca e relevância
const DEVOTIONAL_TRACKS: TrackItem[] = [
  { book: 'Salmos', chapters: [1, 91, 121, 139] },
  { book: 'Provérbios', chapters: [1, 2, 3] },
  { book: 'Mateus', chapters: [5, 6] },
];

interface VerseRecord {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ ERRO: GEMINI_API_KEY não configurada no ambiente (.env).');
    process.exit(1);
  }

  console.log('🚀 Iniciando processamento das Trilhas Devocionais Fundamentais...');
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const track of DEVOTIONAL_TRACKS) {
    console.log(`\n📚 [Trilha] Livro: ${track.book} — Capítulos: ${track.chapters.join(', ')}`);

    for (const chapter of track.chapters) {
      // Buscar todos os versículos do capítulo
      const verses = db.prepare(`
        SELECT v.book, v.chapter, v.verse, v.text
        FROM bible_verses v
        WHERE v.version_id = 'acf' AND LOWER(v.book) = LOWER(?) AND v.chapter = ?
        ORDER BY v.verse ASC
      `).all(track.book, chapter) as VerseRecord[];

      if (verses.length === 0) {
        console.log(`⚠️  Nenhum versículo encontrado no banco para ${track.book} ${chapter}.`);
        continue;
      }

      // Buscar versículos que já possuem comentário
      const existing = new Set<number>(
        (
          db.prepare(`
            SELECT verse FROM verse_commentaries
            WHERE LOWER(book) = LOWER(?) AND chapter = ?
          `).all(track.book, chapter) as { verse: number }[]
        ).map((r) => r.verse)
      );

      const pending = verses.filter((v) => !existing.has(v.verse));
      totalSkipped += verses.length - pending.length;

      if (pending.length === 0) {
        console.log(`✨ ${track.book} ${chapter}: Todos os ${verses.length} versículos já possuem comentário.`);
        continue;
      }

      console.log(`⏳ ${track.book} ${chapter}: ${pending.length} versículos pendentes de comentário...`);

      for (let i = 0; i < pending.length; i++) {
        const item = pending[i];
        const progress = `[${i + 1}/${pending.length}]`;

        try {
          await generateCommentaryForVerse(item.book, item.chapter, item.verse, item.text);
          totalProcessed++;
          console.log(`  ✅ ${progress} ${item.book} ${item.chapter}:${item.verse} gravado com sucesso.`);
        } catch (err) {
          totalErrors++;
          console.error(`  ⚠️ ${progress} Erro em ${item.book} ${item.chapter}:${item.verse}:`, err instanceof Error ? err.message : err);
        }

        // Blindagem contra Rate Limit (600ms)
        await sleep(600);
      }

      console.log(`🎉 [Trilha Devocional] ${track.book} Cap ${chapter}: concluído.`);
    }
  }

  console.log('\n==================================================');
  console.log(`🏁 Resumo Geral das Trilhas Devocionais:`);
  console.log(`   Novos comentários gerados: ${totalProcessed}`);
  console.log(`   Versículos já existentes (pulados): ${totalSkipped}`);
  console.log(`   Erros ou rate limit: ${totalErrors}`);
  console.log('==================================================\n');
}

main().catch((err) => {
  console.error('Falha geral no script de trilhas:', err);
  process.exit(1);
});
