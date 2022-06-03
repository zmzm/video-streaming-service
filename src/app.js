const express = require('express');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

const limiter = require('./rateLimit');

const app = express();

app.use(limiter);
app.use(helmet());
app.use(express.json());

app.get('/', (_, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

app.get('/video', (req, res) => {
  const { range } = req.headers;

  if (!range) {
    res.status(400).send('Requires Range header');
  }

  const videoPath = path.join(__dirname, 'your-video.mp4');
  const videoSize = fs.statSync(videoPath).size;
  const CHUNK_SIZE = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ''));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  const contentLength = end - start + 1;
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': 'video/mp4',
  };

  // HTTP Status 206 for Partial Content
  res.writeHead(206, headers);

  // create video read stream for this particular chunk
  const videoStream = fs.createReadStream(videoPath, { start, end });

  // Stream the video chunk to the client
  videoStream.pipe(res);
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
