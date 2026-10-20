import 'dotenv/config';
import db from '../db/index.js';
import { generateCommentaryForVerse } from '../geminiService.js';

interface VerseRecord {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface CliArgs {
  book: string;
  chapters: number[];
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let book = '';
  let chapter: number | null = null;
  let from: number | null = null;
  let to: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--book' && args[i + 1]) {
      book = args[i + 1];
      i++;
    } else if (args[i] === '--chapter' && args[i + 1]) {
      chapter = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--from' && args[i + 1]) {
      from = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--to' && args[i + 1]) {
      to = parseInt(args[i + 1], 10);
      i++;
    }
  }

  if (!book) {
    console.error('Uso: npx tsx server/scripts/generate_commentaries.ts --book <Livro> [--chapter <N> | --from <A> --to <B>]');
    process.exit(1);
  }

  let chapters: number[] = [];
  if (from !== null && to !== null) {
    const min = Math.min(from, to);
    const max = Math.max(from, to);
    for (let c = min; c <= max; c++) chapters.push(c);
  } else if (chapter !== null && !Number.isNaN(chapter)) {
    chapters = [chapter];
  } else {
    console.error('Informe --chapter <N> ou o intervalo com --from <X> --to <Y>.');
    process.exit(1);
  }

  return { book, chapters };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('ERRO: Variável GEMINI_API_KEY não encontrada no ambiente (.env).');
    process.exit(1);
  }

  const { book, chapters } = parseArgs();
  console.log(`🔍 Verificando versículos pendentes para ${book} (Capítulos: ${chapters.join(', ')})...`);

  const placeholders = chapters.map(() => '?').join(',');
  const pendingVerses = db.prepare(`
    SELECT v.id, v.book, v.chapter, v.verse, v.text
    FROM bible_verses v
    LEFT JOIN verse_commentaries c
      ON v.book = c.book AND v.chapter = c.chapter AND v.verse = c.verse
    WHERE v.book = ? AND v.chapter IN (${placeholders}) AND c.id IS NULL
    ORDER BY v.chapter ASC, v.verse ASC
  `).all(book, ...chapters) as VerseRecord[];

  const total = pendingVerses.length;
  if (total === 0) {
    console.log(`✨ Todos os comentários para os capítulos solicitados de ${book} já estão gerados.`);
    return;
  }

  console.log(`📌 ${total} versículo(s) pendente(s). Iniciando geração em lote via Gemini 2.5 Flash...`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < total; i++) {
    const item = pendingVerses[i];
    const progress = `[Versículo ${i + 1}/${total}]`;

    try {
      await generateCommentaryForVerse(item.book, item.chapter, item.verse, item.text);
      successCount++;
      console.log(`✅ ${progress} ${item.book} ${item.chapter}:${item.verse} gerado e salvo com sucesso.`);
    } catch (err) {
      failCount++;
      console.error(`⚠️ ${progress} Falha em ${item.book} ${item.chapter}:${item.verse}:`, err instanceof Error ? err.message : err);
    }

    // Intervalo de segurança anti-rate limit
    await sleep(500);
  }

  console.log(`\n🎉 Processamento finalizado!`);
  console.log(`📊 Concluídos com sucesso: ${successCount} | Falhas: ${failCount}`);
}

main().catch((err) => {
  console.error('Falha geral no script:', err);
  process.exit(1);
});
