
const db = require('../db');

(async () => {
  await db.run(
    'INSERT OR REPLACE INTO gifts (id, name, price, link) VALUES (?, ?, ?, ?)',
    ['gift_001', 'Jogo de Panelas', 19990, 'https://exemplo.com/panelas']
  );
  console.log('ok');
})();
