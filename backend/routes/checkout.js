
const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const mp = require('../mp');
const { Preference } = require('mercadopago');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { visit_id, gift_id } = req.body || {};
    if (!visit_id || !gift_id) return res.status(400).json({ error: 'visit_id e gift_id são obrigatórios' });

    // valida visita
    const visit = await db.get('SELECT id FROM visits WHERE id = ?', [visit_id]);
    if (!visit) return res.status(404).json({ error: 'visit não encontrado' });

    // carrega presente
    const gift = await db.get('SELECT id, name, price, link FROM gifts WHERE id = ?', [gift_id]);
    if (!gift) return res.status(404).json({ error: 'gift não encontrado' });

    // cria payment local
    const paymentId = crypto.randomUUID();
    const now = Date.now();

    await db.run(
      'INSERT INTO payments (id, visit_id, gift_id, status, created_at) VALUES (?, ?, ?, ?, ?)',
      [paymentId, visit_id, gift_id, 'pending', now]
    );

    // cria preference MP (Checkout Pro) 
    const siteUrl = process.env.SITE_URL;
    const publicBase = process.env.PUBLIC_BASE_URL;
   
    if (!siteUrl) {
      return res.status(500).json({ error: 'SITE_URL não definido no .env' });
    }
    if (!publicBase) {
      return res.status(500).json({ error: 'PUBLIC_BASE_URL não definido no .env' });
    }

    console.log({ siteUrl, publicBase });

    const preferenceClient = new Preference(mp);
    const preference = await preferenceClient.create({
      body: {
        items: [{
          title: gift.name,
          quantity: 1,
          unit_price: gift.price / 100,
          currency_id: 'BRL',
        }],
        external_reference: paymentId,
        back_urls: {
          success: `${siteUrl}/sucesso?pid=${paymentId}`,
          failure: `${siteUrl}/erro?pid=${paymentId}`,
          pending: `${siteUrl}/pendente?pid=${paymentId}`,
        },
        notification_url: `${publicBase}/api/webhooks/mercadopago`,
        auto_return: 'approved',
        payment_methods: {
          installments: 6
        },
      }
    });

    res.json({ init_point: preference.init_point, payment_id: paymentId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'erro ao criar checkout' });
  }
});

module.exports = router;

