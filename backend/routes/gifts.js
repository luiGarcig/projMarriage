const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try{
    const page = Math.max(parseInt(req.query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? '20', 10), 1), 100);
    const offset =(page - 1) * limit;

    const row = await db.get(`SELECT COUNT(*) AS total FROM gifts`);
    const total = row?.total ?? 0;

    const data = await db.all(`
      SELECT
        id,
        name,
        price,
        image
      FROM gifts
      ORDER BY name ASC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    res.json({
      data,
      pagination:{
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar gifts" })
  }
});

module.exports = router;


