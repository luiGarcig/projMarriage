
const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/:id', async (req, res) => {
  const p = await db.get(
    'SELECT id, status, paid_at FROM payments WHERE id = ?',
    [req.params.id]
  );
  if (!p) return res.status(404).json({ error: 'not found' });
  res.json(p);
});

module.exports = router;
