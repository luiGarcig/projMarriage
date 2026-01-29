require('dotenv').config();

const express = require('express');
const logger = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express(); 

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const checkoutRouter = require('./routes/checkout');
const mpWebhookRouter = require('./routes/mercadopago-webhook');
const healthRouter = require('./routes/health');
const visitsRouter = require('./routes/visits');
const paymentsRouter = require('./routes/payments');

app.use('/api/payments', paymentsRouter);
app.use('/api/visits', visitsRouter);
app.use('/health', healthRouter);
app.use('/api/checkout/create', checkoutRouter);
app.use('/api/webhooks/mercadopago', mpWebhookRouter);

module.exports = app;

