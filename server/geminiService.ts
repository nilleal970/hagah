import { GoogleGenAI, Type } from '@google/genai';
import db from './db/index.js';

export interface CommentaryData {
  historical_context: string;
  exegetical_meaning: string;
  practical_application: string;
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    historical_context: {
      type: Type.STRING,
      description: 'Contexto histórico da passagem em no máximo 2 frases.',
    },
    exegetical_meaning: {
      type: Type.STRING,
      description: 'Significado exegético estrito em no máximo 3 frases com termos originais se aplicável.',
    },
    practical_application: {
      type: Type.STRING,
      description: 'Aplicação prática pastoral e pessoal em no máximo 2 frases.',
    },
  },
  required: ['historical_context', 'exegetical_meaning', 'practical_application'],
};

export async function generateCommentaryForVerse(
  book: string,
  chapter: number,
  verse: number,
  text: string
): Promise<CommentaryData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente (.env).');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: `Analise exegética e expositiva deste versículo:\nReferência: ${book} ${chapter}:${verse}\nTexto: "${text}"`,
    config: {
      systemInstruction:
        'Comentarista bíblico exegético estrito. Responda apenas com o JSON solicitado, sem introdução ou conclusões adicionais.',
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    },
  });

  const responseText = response.text?.trim() || '{}';
  const parsed = JSON.parse(responseText) as CommentaryData;

  // Persistir no banco de dados SQLite
  const stmt = db.prepare(`
    INSERT INTO verse_commentaries (
      book, chapter, verse, historical_context, exegetical_meaning, practical_application
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(book, chapter, verse) DO UPDATE SET
      historical_context = excluded.historical_context,
      exegetical_meaning = excluded.exegetical_meaning,
      practical_application = excluded.practical_application
  `);

  stmt.run(
    book,
    chapter,
    verse,
    parsed.historical_context,
    parsed.exegetical_meaning,
    parsed.practical_application
  );

  return parsed;
}
