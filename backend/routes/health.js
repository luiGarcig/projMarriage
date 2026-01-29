
const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  // força inicialização do banco
  await db.get('SELECT 1');
  res.json({ ok: true });
});

module.exports = router;
