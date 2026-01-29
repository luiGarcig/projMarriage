
const express = require('express');
const db = require('../db');
const mp = require('../mp');
const { Payment } = require('mercadopago');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // MP pode reenviar, então responda 200 rápido
    const paymentIdFromMp = req.body?.data?.id;
    if (!paymentIdFromMp) return res.status(200).send('ok');

    // consulta pagamento no MP (server-side) 
    const paymentClient = new Payment(mp);
    const payment = await paymentClient.get({ id: paymentIdFromMp });

    if (payment.status !== 'approved') return res.status(200).send('ignored');

    const externalRef = payment.external_reference; // nosso paymentId local
    if (!externalRef) return res.status(200).send('ignored');

    // idempotência: se já está paid, não refaz
    const localPayment = await db.get('SELECT status FROM payments WHERE id = ?', [externalRef]);
    if (!localPayment) return res.status(200).send('ok');
    if (localPayment.status === 'paid') return res.status(200).send('ok');

    await db.run(
      'UPDATE payments SET status = ?, mp_payment_id = ?, paid_at = ? WHERE id = ?',
      ['paid', String(payment.id), Date.now(), externalRef]
    );

    return res.status(200).send('ok');
  } catch (e) {
    console.error(e);
    return res.status(200).send('ok');
  }
});

module.exports = router;

