const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const id = crypto.randomUUID();
  const name = (req.body?.name || 'visitante').toString().slice(0, 80);
  const now = Date.now();

  await db.run(
    'INSERT INTO visits (id, name, created_at) VALUES (?, ?, ?)',
    [id, name, now]
  );

  res.json({ visit_id: id });
});

module.exports = router;

