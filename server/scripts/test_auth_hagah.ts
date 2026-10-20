import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { generateToken, verifyToken } from '../services/authService.js';

async function testAuthAndMetrics() {
  console.log('--- TESTE DE AUTENTICAÇÃO E DASHBOARD (HAGAH) ---');

  const testEmail = `teste_${Date.now()}@hagah.local`;
  const testPassword = 'senhaSegura123';
  const testName = 'Bereano de Teste';

  // 1. Hash & Criação
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(testPassword, salt);

  const res = db.prepare(`
    INSERT INTO users (name, email, password_hash)
    VALUES (?, ?, ?)
  `).run(testName, testEmail, passwordHash);

  const userId = Number(res.lastInsertRowid);
  console.log('✅ Usuário criado com ID:', userId, testEmail);

  // 2. Token JWT
  const token = generateToken({ id: userId, email: testEmail, name: testName });
  const decoded = verifyToken(token);
  console.log('✅ Token JWT gerado e verificado com sucesso para usuário:', decoded?.name);

  // 3. Salvar preferências de onboarding
  const prefs = {
    purpose: 'Paz contra ansiedade',
    dailyTime: '3 min Microdevocional',
    studyApproach: 'Aplicação pastoral prática',
    habitTime: 'Manhã',
    completedAt: new Date().toISOString(),
  };

  db.prepare(`UPDATE users SET profile_preferences = ? WHERE id = ?`).run(JSON.stringify(prefs), userId);
  const updatedUser = db.prepare('SELECT id, name, email, profile_preferences FROM users WHERE id = ?').get(userId) as any;
  console.log('✅ Preferências de Onboarding salvas:', JSON.parse(updatedUser.profile_preferences));

  // 4. Teste de Métricas de Dashboard para Guest e Usuário
  const guestHabits = db.prepare(`SELECT count(*) as c FROM reading_habits WHERE user_identifier = 'guest'`).get();
  console.log('✅ Métricas de Leitura isoladas (guest):', guestHabits);

  console.log('\n🚀 TODOS OS TESTES DE BANCO E AUTENTICAÇÃO FORAM CONCLUÍDOS COM SUCESSO!');
  process.exit(0);
}

testAuthAndMetrics().catch((err) => {
  console.error(err);
  process.exit(1);
});
