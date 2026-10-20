import db from '../db/index.js';

try {
  db.prepare(`UPDATE reading_habits SET user_identifier = 'guest' WHERE user_identifier = 'default_user'`).run();
  db.prepare(`UPDATE user_stats SET user_identifier = 'guest' WHERE user_identifier = 'default_user'`).run();
  db.prepare(`UPDATE user_notes SET user_identifier = 'guest' WHERE user_identifier = 'default_user'`).run();
  console.log('Migrated default_user to guest successfully.');
} catch (e) {
  console.error(e);
}
