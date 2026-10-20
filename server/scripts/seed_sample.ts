import db from '../db/index.js';

export function seedSample() {
  const insertVersion = db.prepare(`
    INSERT OR IGNORE INTO bible_versions (id, name, abbreviation)
    VALUES (?, ?, ?)
  `);

  insertVersion.run('acf', 'Almeida Corrigida Fiel', 'ACF');

  const verses = [
    { verse: 1, text: 'O Senhor é o meu pastor, nada me faltará.' },
    { verse: 2, text: 'Deitar-me faz em verdes pastos, guia-me mansamente a águas tranqüilas.' },
    { verse: 3, text: 'Refrigera a minha alma; guia-me pelas veredas da justiça, por amor do seu nome.' },
    { verse: 4, text: 'Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.' },
    { verse: 5, text: 'Preparas uma mesa perante mim na presença dos meus inimigos, unges a minha cabeça com óleo, o meu cálice transborda.' },
    { verse: 6, text: 'Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na casa do Senhor por longos dias.' },
  ];

  const insertVerse = db.prepare(`
    INSERT OR REPLACE INTO bible_verses (version_id, book, chapter, verse, text)
    VALUES (?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const v of verses) {
      insertVerse.run('acf', 'Salmos', 23, v.verse, v.text);
    }
  });

  tx();
  console.log('✅ Seed executado com sucesso: Versão ACF e Salmos 23 (1-6) inseridos.');
}

if (process.argv[1] && process.argv[1].endsWith('seed_sample.ts')) {
  seedSample();
}
