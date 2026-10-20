import { defaultAudioProvider } from '../services/audioProvider.js';
import { defaultBibleProvider } from '../services/bibleProvider.js';

async function main() {
  console.log('--- TESTANDO AUDIOPROVIDER ---');
  const genesis1 = await defaultAudioProvider.getChapterAudio('Gênesis', 1, 'acf');
  console.log('Gênesis 1:', genesis1);

  const salmos23 = await defaultAudioProvider.getChapterAudio('Salmos', 23, 'acf');
  console.log('Salmos 23:', salmos23);

  const salmos23Cached = await defaultAudioProvider.getChapterAudio('Salmos', 23, 'acf');
  console.log('Salmos 23 (Cache):', salmos23Cached);

  console.log('\n--- TESTANDO BIBLEPROVIDER ---');
  const acfSalmos23 = await defaultBibleProvider.getVerses('acf', 'Salmos', 23);
  console.log('ACF Salmos 23 verses count:', acfSalmos23.length, 'Verse 1:', acfSalmos23[0]?.text);

  const nviSalmos23 = await defaultBibleProvider.getVerses('nvi', 'Salmos', 23);
  console.log('NVI Salmos 23 verses count:', nviSalmos23.length, 'Verse 1:', nviSalmos23[0]?.text);

  const nviSalmos23Cached = await defaultBibleProvider.getVerses('nvi', 'Salmos', 23);
  console.log('NVI Salmos 23 Cached count:', nviSalmos23Cached.length);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
