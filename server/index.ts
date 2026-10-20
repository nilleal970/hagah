import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import db from './db/index.js';
import { BIBLE_BOOKS } from './booksData.js';
import { generateCommentaryForVerse } from './geminiService.js';
import { defaultAudioProvider } from './services/audioProvider.js';
import { defaultBibleProvider, SUPPORTED_VERSIONS } from './services/bibleProvider.js';
import { generateToken, verifyToken, getActiveUserIdentifier } from './services/authService.js';

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// Middlewares de Segurança e Otimização
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        mediaSrc: ["'self'", 'https://archive.org', 'https://*.archive.org'],
        connectSrc: ["'self'", 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(compression());
app.use(
  cors({
    origin: IS_PROD ? false : true,
    credentials: true,
  })
);
app.use(express.json());

// Status da API
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Hagah' });
});

// ==========================================
// ROTAS DE AUTENTICAÇÃO E PERFIL DO USUÁRIO
// ==========================================

// POST /api/auth/register: Criar conta de usuário
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    return res.status(400).json({ error: 'Nome, e-mail válido e senha de no mínimo 6 caracteres são obrigatórios.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'Este e-mail já está em uso.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash)
      VALUES (?, ?, ?)
    `).run(name.trim(), cleanEmail, passwordHash);

    const userId = Number(result.lastInsertRowid);
    const token = generateToken({ id: userId, email: cleanEmail, name: name.trim() });

    res.status(201).json({
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        profile_preferences: null,
      },
    });
  } catch (error) {
    console.error('[Auth Register] Erro:', error);
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
});

// POST /api/auth/login: Entrar com e-mail e senha
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const user = db.prepare(`
      SELECT id, name, email, password_hash, profile_preferences
      FROM users
      WHERE LOWER(email) = ?
    `).get(cleanEmail) as { id: number; name: string; email: string; password_hash: string; profile_preferences: string | null } | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    let parsedPreferences = null;
    if (user.profile_preferences) {
      try {
        parsedPreferences = JSON.parse(user.profile_preferences);
      } catch {}
    }

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_preferences: parsedPreferences,
      },
    });
  } catch (error) {
    console.error('[Auth Login] Erro:', error);
    res.status(500).json({ error: 'Erro ao autenticar usuário.' });
  }
});

// GET /api/auth/me: Validação da sessão ativa
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
  }

  try {
    const user = db.prepare(`
      SELECT id, name, email, profile_preferences, created_at
      FROM users
      WHERE id = ?
    `).get(decoded.id) as { id: number; name: string; email: string; profile_preferences: string | null; created_at: string } | undefined;

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    let parsedPreferences = null;
    if (user.profile_preferences) {
      try {
        parsedPreferences = JSON.parse(user.profile_preferences);
      } catch {}
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_preferences: parsedPreferences,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter dados do usuário.' });
  }
});

// POST /api/user/profile-onboarding: Salvar respostas de perfil do usuário
app.post('/api/user/profile-onboarding', (req, res) => {
  const userIdentifier = getActiveUserIdentifier(req);
  const { purpose, dailyTime, studyApproach, habitTime } = req.body;

  const preferences = {
    purpose: purpose || 'Paz contra ansiedade',
    dailyTime: dailyTime || '3 min Microdevocional',
    studyApproach: studyApproach || 'Aplicação pastoral prática',
    habitTime: habitTime || 'Manhã',
    completedAt: new Date().toISOString(),
  };

  try {
    if (userIdentifier !== 'guest') {
      const userId = Number(userIdentifier);
      if (!Number.isNaN(userId)) {
        db.prepare(`
          UPDATE users
          SET profile_preferences = ?
          WHERE id = ?
        `).run(JSON.stringify(preferences), userId);
      }
    }

    res.json({ success: true, preferences });
  } catch (error) {
    console.error('[Profile Onboarding] Erro:', error);
    res.status(500).json({ error: 'Erro ao salvar perfil.' });
  }
});

// POST /api/user/update-profile: Atualizar nome ou senha
app.post('/api/user/update-profile', async (req, res) => {
  const userIdentifier = getActiveUserIdentifier(req);
  if (userIdentifier === 'guest') {
    return res.status(400).json({ error: 'Crie uma conta para salvar alterações de perfil permanente.' });
  }

  const userId = Number(userIdentifier);
  const { name, newPassword } = req.body;

  try {
    if (name?.trim()) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), userId);
    }

    if (newPassword && newPassword.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
    }

    const updated = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId);
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

// GET /api/versions: Retorna versões bíblicas disponíveis com indicação offline/online
app.get('/api/versions', (_req, res) => {
  try {
    res.json(SUPPORTED_VERSIONS);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar versões bíblicas.' });
  }
});

// GET /api/devotional/daily: Retorna microdevocional sequencial do dia
app.get('/api/devotional/daily', (_req, res) => {
  try {
    // Lista de passagens fundamentais para rotação diária diversificada
    const candidateTracks = [
      { book: 'Salmos', chapter: 23 },
      { book: 'Salmos', chapter: 1 },
      { book: 'Salmos', chapter: 91 },
      { book: 'Salmos', chapter: 121 },
      { book: 'Salmos', chapter: 139 },
      { book: 'Provérbios', chapter: 1 },
      { book: 'Provérbios', chapter: 2 },
      { book: 'Provérbios', chapter: 3 },
      { book: 'Mateus', chapter: 5 },
      { book: 'Mateus', chapter: 6 },
    ];

    // Seed determinístico diário baseado na data (YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = (hash << 5) - hash + todayStr.charCodeAt(i);
      hash |= 0;
    }
    const daySeed = Math.abs(hash);

    // Busca todos os versículos que já possuem comentário dentro das trilhas selecionadas
    const trackPlaceholders = candidateTracks.map(() => '(LOWER(c.book) = LOWER(?) AND c.chapter = ?)').join(' OR ');
    const queryParams: (string | number)[] = [];
    candidateTracks.forEach((t) => {
      queryParams.push(t.book, t.chapter);
    });

    const availableCommentaries = db.prepare(`
      SELECT c.*, v.text as verse_text
      FROM verse_commentaries c
      JOIN bible_verses v ON LOWER(c.book) = LOWER(v.book) AND c.chapter = v.chapter AND c.verse = v.verse
      WHERE v.version_id = 'acf' AND (${trackPlaceholders})
      ORDER BY c.book ASC, c.chapter ASC, c.verse ASC
    `).all(...queryParams) as {
      id: number;
      book: string;
      chapter: number;
      verse: number;
      historical_context: string;
      exegetical_meaning: string;
      practical_application: string;
      verse_text: string;
    }[];

    let commentary: typeof availableCommentaries[0] | undefined;

    if (availableCommentaries.length > 0) {
      // Rotação determinística e uniforme sobre todos os versículos comentados das trilhas
      commentary = availableCommentaries[daySeed % availableCommentaries.length];
    } else {
      // Fallback para qualquer comentário gravado no banco
      commentary = db.prepare(`
        SELECT c.*, v.text as verse_text
        FROM verse_commentaries c
        JOIN bible_verses v ON LOWER(c.book) = LOWER(v.book) AND c.chapter = v.chapter AND c.verse = v.verse
        WHERE v.version_id = 'acf'
        ORDER BY c.id ASC
        LIMIT 1
      `).get() as typeof commentary;
    }

    // Fallback caso não haja registros em verse_commentaries
    const book = commentary?.book || 'Salmos';
    const chapter = commentary?.chapter || 23;
    const verse = commentary?.verse || 1;
    const verseText = commentary?.verse_text || 'O Senhor é o meu pastor, nada me faltará.';
    const histContext = commentary?.historical_context || 'Salmo atribuído a Davi, refletindo a experiência pastoral de Israel sob a providência contínua de Yahweh.';
    const exegMeaning = commentary?.exegetical_meaning || 'No hebraico, "Yahweh Roi" expressa a tutela íntima de Deus que supre de forma suficiente todas as carências da alma.';
    const practApp = commentary?.practical_application || 'Confie que a providência divina basta para suas ansiedades e decisões nesta jornada diária.';

    const todayDate = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const devotional = {
      title: `Descanso no Bom Pastor`,
      date: todayDate,
      book,
      chapter,
      verse,
      steps: [
        {
          id: 'scripture',
          type: 'verse',
          badge: 'Palavra Viva',
          reference: `${book} ${chapter}:${verse}`,
          content: verseText,
          prompt: 'Respire fundo e leia em voz alta meditando em cada termo.',
        },
        {
          id: 'context',
          type: 'historical',
          badge: 'Origem & Contexto',
          reference: 'O Cenário Bíblico',
          content: histContext,
          prompt: 'Entender a história ilumina a intenção original do autor inspirado.',
        },
        {
          id: 'exegesis',
          type: 'meaning',
          badge: 'Significado Profundo',
          reference: 'Exegese do Texto',
          content: exegMeaning,
          prompt: 'A riqueza das palavras originais revela o cuidado presente de Deus.',
        },
        {
          id: 'reflection',
          type: 'application',
          badge: 'Reflexão & Diário',
          reference: 'Aplicação Pessoal',
          content: practApp,
          question: 'Em qual área da sua vida hoje você mais precisa descansar na suficiência de Deus?',
        },
        {
          id: 'prayer',
          type: 'prayer',
          badge: 'Oração de Entrega',
          reference: 'Momento com Deus',
          content: 'Senhor, Tu és meu Pastor. Renuncio à ansiedade e recebo Tua direção serena para o meu dia. Amém.',
          prompt: 'Faça desta oração o compromisso do seu coração para hoje.',
        },
      ],
    };

    res.json(devotional);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar o microdevocional do dia.' });
  }
});

// GET /api/bible/books: Retorna os 66 livros bíblicos divididos por testamento
app.get('/api/bible/books', (_req, res) => {
  try {
    const oldTestament = BIBLE_BOOKS.filter((b) => b.testament === 'Antigo Testamento');
    const newTestament = BIBLE_BOOKS.filter((b) => b.testament === 'Novo Testamento');

    res.json({
      total: BIBLE_BOOKS.length,
      oldTestament,
      newTestament,
      all: BIBLE_BOOKS,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar livros bíblicos.' });
  }
});

// GET /api/audio/:version/:book/:chapter: Retorna streaming de áudio MP3 do capítulo via AudioProvider desacoplado
app.get('/api/audio/:version/:book/:chapter', async (req, res) => {
  const { version, book, chapter } = req.params;
  const chapterNum = parseInt(chapter, 10);

  if (Number.isNaN(chapterNum)) {
    return res.status(400).json({ error: 'Capítulo inválido.' });
  }

  try {
    const audioResult = await defaultAudioProvider.getChapterAudio(book, chapterNum, version);

    if (!audioResult) {
      return res.status(404).json({
        available: false,
        error: 'Áudio não disponível para esta passagem.',
      });
    }

    res.json({
      available: true,
      audio_url: audioResult.audio_url,
      duration_seconds: audioResult.duration_seconds || 180,
      narrator: audioResult.narrator || 'Áudio Bíblia',
    });
  } catch (error) {
    console.error('[API Audio] Erro ao obter áudio:', error);
    res.status(500).json({ error: 'Erro ao processar áudio do capítulo.' });
  }
});

// GET /api/verses/:version/:book/:chapter: Retorna versículos via BibleProvider (SQLite local ou cache de API externa)
app.get('/api/verses/:version/:book/:chapter', async (req, res) => {
  const { version, book, chapter } = req.params;
  const chapterNum = parseInt(chapter, 10);

  if (Number.isNaN(chapterNum)) {
    return res.status(400).json({ error: 'Capítulo inválido.' });
  }

  try {
    const verses = await defaultBibleProvider.getVerses(version, book, chapterNum);
    res.json(verses);
  } catch (error) {
    console.error('[API Verses] Erro ao obter versículos:', error);
    res.status(500).json({ error: 'Erro ao buscar versículos.' });
  }
});

// GET /api/commentary/:book/:chapter/:verse: Retorna comentário salvo
app.get('/api/commentary/:book/:chapter/:verse', (req, res) => {
  const { book, chapter, verse } = req.params;
  const chapterNum = parseInt(chapter, 10);
  const verseNum = parseInt(verse, 10);

  if (Number.isNaN(chapterNum) || Number.isNaN(verseNum)) {
    return res.status(400).json({ error: 'Capítulo ou versículo inválido.' });
  }

  try {
    const commentary = db.prepare(`
      SELECT id, book, chapter, verse, historical_context, exegetical_meaning, practical_application, created_at
      FROM verse_commentaries
      WHERE LOWER(book) = LOWER(?) AND chapter = ? AND verse = ?
    `).get(book, chapterNum, verseNum);

    if (!commentary) {
      return res.status(404).json({ error: 'Comentário não encontrado para o versículo selecionado.' });
    }

    res.json(commentary);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar comentário.' });
  }
});

// PUT /api/commentary/:id: Permite atualizar textos de um comentário existente
app.put('/api/commentary/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { historical_context, exegetical_meaning, practical_application } = req.body;

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID de comentário inválido.' });
  }

  try {
    const result = db.prepare(`
      UPDATE verse_commentaries
      SET 
        historical_context = COALESCE(?, historical_context),
        exegetical_meaning = COALESCE(?, exegetical_meaning),
        practical_application = COALESCE(?, practical_application)
      WHERE id = ?
    `).run(historical_context, exegetical_meaning, practical_application, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Comentário não encontrado.' });
    }

    const updated = db.prepare('SELECT * FROM verse_commentaries WHERE id = ?').get(id);
    res.json({ success: true, commentary: updated });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar comentário.' });
  }
});

// POST /api/commentary/generate-single: Gera comentário sob demanda via Gemini
app.post('/api/commentary/generate-single', async (req, res) => {
  const { book, chapter, verse } = req.body;
  const chapterNum = parseInt(chapter, 10);
  const verseNum = parseInt(verse, 10);

  if (!book || Number.isNaN(chapterNum) || Number.isNaN(verseNum)) {
    return res.status(400).json({ error: 'Livro, capítulo ou versículo inválido.' });
  }

  try {
    // Buscar texto do versículo
    const verseRecord = db.prepare(`
      SELECT text FROM bible_verses
      WHERE LOWER(book) = LOWER(?) AND chapter = ? AND verse = ?
      LIMIT 1
    `).get(book, chapterNum, verseNum) as { text: string } | undefined;

    if (!verseRecord) {
      return res.status(404).json({ error: 'Versículo bíblico não encontrado no banco.' });
    }

    const commentary = await generateCommentaryForVerse(book, chapterNum, verseNum, verseRecord.text);
    const saved = db.prepare(`
      SELECT * FROM verse_commentaries
      WHERE LOWER(book) = LOWER(?) AND chapter = ? AND verse = ?
    `).get(book, chapterNum, verseNum);

    res.json({ success: true, commentary: saved });
  } catch (error) {
    console.error('Erro ao gerar comentário individual:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao gerar comentário com IA.' });
  }
});

// GET /api/admin/coverage: Estatísticas de cobertura bíblica vs. comentários
app.get('/api/admin/coverage', (_req, res) => {
  try {
    const totalVerses = (db.prepare(`SELECT COUNT(*) as count FROM bible_verses WHERE version_id = 'acf'`).get() as { count: number }).count;
    const totalCommentaries = (db.prepare(`SELECT COUNT(*) as count FROM verse_commentaries`).get() as { count: number }).count;
    const percentage = totalVerses > 0 ? ((totalCommentaries / totalVerses) * 100).toFixed(2) : '0.00';

    res.json({
      totalVerses,
      totalCommentaries,
      percentage: Number(percentage),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar métricas de cobertura.' });
  }
});

// GET /api/user/dashboard-stats: Métricas rápidas para os 4 cards da Home
app.get('/api/user/dashboard-stats', (req, res) => {
  const userIdentifier = getActiveUserIdentifier(req);

  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Streak
    const stats = db.prepare(`
      SELECT current_streak, last_completed_date
      FROM user_stats
      WHERE user_identifier = ?
    `).get(userIdentifier) as { current_streak: number; last_completed_date: string | null } | undefined;

    let streak = stats?.current_streak || 0;
    const completedToday = stats?.last_completed_date === today;

    if (stats?.last_completed_date && !completedToday) {
      const lastDate = new Date(stats.last_completed_date + 'T00:00:00');
      const nowDate = new Date(today + 'T00:00:00');
      const diffDays = Math.round((nowDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        streak = 0;
      }
    }

    // 2. Capítulos Lidos
    const chaptersRow = db.prepare(`
      SELECT COUNT(DISTINCT (book || '-' || chapter)) as total
      FROM reading_habits
      WHERE user_identifier = ?
    `).get(userIdentifier) as { total: number };

    // 3. Reflexões no Diário
    const notesRow = db.prepare(`
      SELECT COUNT(*) as total
      FROM user_notes
      WHERE user_identifier = ?
    `).get(userIdentifier) as { total: number };

    // 4. Áudios ouvidos (ou cacheados no sistema)
    const audioCountRow = db.prepare(`
      SELECT COUNT(*) as total
      FROM chapter_audio_cache
    `).get() as { total: number };

    // Último capítulo lido para "Continuar Leitura"
    const lastReading = db.prepare(`
      SELECT book, chapter, completed_at
      FROM reading_habits
      WHERE user_identifier = ?
      ORDER BY id DESC
      LIMIT 1
    `).get(userIdentifier) as { book: string; chapter: number; completed_at: string } | undefined;

    res.json({
      streak,
      completedToday,
      chaptersRead: chaptersRow?.total || 0,
      journalNotesCount: notesRow?.total || 0,
      audioListenedCount: Math.max(audioCountRow?.total || 0, 1),
      lastReading: lastReading || { book: 'Salmos', chapter: 23 },
    });
  } catch (error) {
    console.error('[Dashboard Stats] Erro:', error);
    res.status(500).json({ error: 'Erro ao obter métricas da dashboard.' });
  }
});

// GET /api/habits/streak: Retorna o streak atual
app.get('/api/habits/streak', (req, res) => {
  const userIdentifier = getActiveUserIdentifier(req);

  try {
    const today = new Date().toISOString().split('T')[0];
    const stats = db.prepare(`
      SELECT current_streak, last_completed_date
      FROM user_stats
      WHERE user_identifier = ?
    `).get(userIdentifier) as { current_streak: number; last_completed_date: string | null } | undefined;

    const streak = stats ? stats.current_streak : 0;
    const completedToday = stats?.last_completed_date === today;

    let effectiveStreak = streak;
    if (stats?.last_completed_date && !completedToday) {
      const lastDate = new Date(stats.last_completed_date + 'T00:00:00');
      const nowDate = new Date(today + 'T00:00:00');
      const diffDays = Math.round((nowDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        effectiveStreak = 0;
      }
    }

    res.json({
      streak: effectiveStreak,
      completedToday,
      lastCompletedDate: stats?.last_completed_date || null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar streak de leitura.' });
  }
});

// POST /api/habits/complete: Conclui a leitura do capítulo e atualiza streak
app.post('/api/habits/complete', (req, res) => {
  const userIdentifier = getActiveUserIdentifier(req);
  const { book, chapter } = req.body;
  const chapterNum = parseInt(chapter, 10);

  if (!book || Number.isNaN(chapterNum)) {
    return res.status(400).json({ error: 'Livro ou capítulo inválido.' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const stats = db.prepare(`
      SELECT current_streak, last_completed_date
      FROM user_stats
      WHERE user_identifier = ?
    `).get(userIdentifier) as { current_streak: number; last_completed_date: string | null } | undefined;

    let newStreak = 1;
    if (stats) {
      if (stats.last_completed_date === today) {
        newStreak = stats.current_streak;
      } else if (stats.last_completed_date === yesterday) {
        newStreak = stats.current_streak + 1;
      } else {
        newStreak = 1;
      }
    }

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT OR IGNORE INTO reading_habits (user_identifier, book, chapter, completed_at)
        VALUES (?, ?, ?, ?)
      `).run(userIdentifier, book, chapterNum, today);

      db.prepare(`
        INSERT INTO user_stats (user_identifier, current_streak, last_completed_date)
        VALUES (?, ?, ?)
        ON CONFLICT(user_identifier) DO UPDATE SET
          current_streak = ?,
          last_completed_date = ?
      `).run(userIdentifier, newStreak, today, newStreak, today);
    });

    tx();

    res.json({
      success: true,
      streak: newStreak,
      completedToday: true,
      message: `Capítulo ${book} ${chapterNum} concluído com sucesso!`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar hábito de leitura.' });
  }
});

// GET /api/notes/:book/:chapter: Retorna anotações do usuário para o capítulo
app.get('/api/notes/:book/:chapter', (req, res) => {
  const userIdentifier = getActiveUserIdentifier(req);
  const { book, chapter } = req.params;
  const chapterNum = parseInt(chapter, 10);

  if (Number.isNaN(chapterNum)) {
    return res.status(400).json({ error: 'Capítulo inválido.' });
  }

  try {
    const notes = db.prepare(`
      SELECT id, user_identifier, book, chapter, verse, note_text, created_at, updated_at
      FROM user_notes
      WHERE user_identifier = ? AND LOWER(book) = LOWER(?) AND chapter = ?
      ORDER BY verse ASC, updated_at DESC
    `).all(userIdentifier, book, chapterNum);

    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notas do capítulo.' });
  }
});

// POST /api/notes: Cria ou atualiza nota pessoal
app.post('/api/notes', (req, res) => {
  const userIdentifier = getActiveUserIdentifier(req);
  const { id, book, chapter, verse, note_text } = req.body;
  const chapterNum = parseInt(chapter, 10);
  const verseNum = verse !== undefined && verse !== null ? parseInt(verse, 10) : null;

  if (!book || Number.isNaN(chapterNum) || !note_text?.trim()) {
    return res.status(400).json({ error: 'Dados da nota incompletos.' });
  }

  try {
    const now = new Date().toISOString();
    let savedNote;

    if (id) {
      db.prepare(`
        UPDATE user_notes
        SET note_text = ?, updated_at = ?
        WHERE id = ? AND user_identifier = ?
      `).run(note_text.trim(), now, id, userIdentifier);

      savedNote = db.prepare('SELECT * FROM user_notes WHERE id = ?').get(id);
    } else {
      const result = db.prepare(`
        INSERT INTO user_notes (user_identifier, book, chapter, verse, note_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userIdentifier, book, chapterNum, verseNum, note_text.trim(), now, now);

      savedNote = db.prepare('SELECT * FROM user_notes WHERE id = ?').get(result.lastInsertRowid);
    }

    res.json({ success: true, note: savedNote });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar nota pessoal.' });
  }
});

// DELETE /api/notes/:id: Exclui uma anotação existente
app.delete('/api/notes/:id', (req, res) => {
  const userIdentifier = getActiveUserIdentifier(req);
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const result = db.prepare(`
      DELETE FROM user_notes
      WHERE id = ? AND user_identifier = ?
    `).run(id, userIdentifier);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Nota não encontrada.' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir nota.' });
  }
});

// GET /api/notes/my-journal: Retorna as últimas anotações para o Diário Bíblico
app.get('/api/notes/my-journal', (req, res) => {
  const userIdentifier = getActiveUserIdentifier(req);

  try {
    const notes = db.prepare(`
      SELECT id, user_identifier, book, chapter, verse, note_text, created_at, updated_at
      FROM user_notes
      WHERE user_identifier = ?
      ORDER BY updated_at DESC
      LIMIT 100
    `).all(userIdentifier);

    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar diário espiritual.' });
  }
});

// GET /api/notes/export: Exporta todas as notas do usuário atual
app.get('/api/notes/export', (req, res) => {
  const userIdentifier = getActiveUserIdentifier(req);

  try {
    const notes = db.prepare(`
      SELECT id, book, chapter, verse, note_text, created_at, updated_at
      FROM user_notes
      WHERE user_identifier = ?
      ORDER BY book ASC, chapter ASC, verse ASC
    `).all(userIdentifier);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="hagah-caderno-espiritual.json"`);
    res.json({
      app: 'Hagah - Diário Bíblico & Estudo',
      user: userIdentifier,
      exportedAt: new Date().toISOString(),
      totalNotes: notes.length,
      notes,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar notas.' });
  }
});

// Em Produção: Servir frontend compilado em /client/dist com fallback SPA
const clientDistPath = path.resolve(process.cwd(), 'client', 'dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Hagah server running on http://localhost:${PORT}`);
});



