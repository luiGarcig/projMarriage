const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const mp = require('../mp');
const { Preference } = require('mercadopago');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { visit_id, gift_id } = req.body || {};
    if (!visit_id || !gift_id) {
      return res.status(400).json({ error: 'visit_id e gift_id são obrigatórios' });
    }

    const visit = await db.get('SELECT id FROM visits WHERE id = $1', [visit_id]);
    if (!visit) return res.status(404).json({ error: 'visit não encontrado' });

    const gift = await db.get('SELECT id, name, price, link FROM gifts WHERE id = $1', [gift_id]);
    if (!gift) return res.status(404).json({ error: 'gift não encontrado' });

    const paymentId = crypto.randomUUID();
    const now = Date.now();

    await db.run(
      'INSERT INTO payments (id, visit_id, gift_id, status, created_at) VALUES ($1, $2, $3, $4, $5)',
      [paymentId, visit_id, gift_id, 'pending', now]
    );

    // ✅ normaliza (remove barra final)
    const siteUrl = (process.env.SITE_URL || '').replace(/\/+$/, '');
    const publicBase = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');

    if (!siteUrl) return res.status(500).json({ error: 'SITE_URL não definido no .env' });
    if (!publicBase) return res.status(500).json({ error: 'PUBLIC_BASE_URL não definido no .env' });

    const successUrl = `${siteUrl}/checkout/sucess?pid=${paymentId}`;
    const failureUrl = `${siteUrl}/checkout/failure?pid=${paymentId}`;
    const pendingUrl = `${siteUrl}/checkout/pending?pid=${paymentId}`;
    const notifyUrl = `${publicBase}/api/webhooks/mercadopago`;

    // ✅ log pra confirmar que success existe e está certo
    console.log({
      siteUrl,
      publicBase,
      successUrl,
      failureUrl,
      pendingUrl,
      notifyUrl,
    });

    const preferenceClient = new Preference(mp);

    const preferenceResp = await preferenceClient.create({
      body: {
        items: [{
          title: gift.name,
          quantity: 1,
          unit_price: gift.price / 100,
          currency_id: 'BRL',
        }],
        external_reference: paymentId,

        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl,
        },

        notification_url: notifyUrl,

        // ✅ se ainda der erro, comente auto_return pra testar
        //auto_return: 'approved',

        payment_methods: {
          installments: 6,
        },
      }
    });

    // ✅ o init_point normalmente vem em preferenceResp.body.init_point
    const initPoint = preferenceResp?.body?.init_point || preferenceResp?.init_point;

    if (!initPoint) {
      console.error('Resposta MP sem init_point:', preferenceResp);
      return res.status(500).json({ error: 'Mercado Pago não retornou init_point' });
    }

    return res.json({ init_point: initPoint, payment_id: paymentId });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'erro ao criar checkout' });
  }
});

module.exports = router;
