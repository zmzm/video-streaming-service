const express = require('express');
const helmet = require('helmet');
const limiter = require('./rateLimit');

const app = express();

app.use(limiter);
app.use(helmet());
app.use(express.json());

app.get('/', (_, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res) => {
  res.locals.error = err;
  const status = err.status || 500;
  res.status(status);
  res.render('error');
});

module.exports = app;
