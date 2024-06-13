const express = require('express');
const https = require('https');
const app = express();
const port = 5501;
const host = '127.0.0.1';

const keywordsToUrls = {
  'ship' : ['https://www.youtube.com/watch?v=vagLoF1MZac', 'https://www.svgrepo.com/show/411319/transport.svg'],
  'truck': ['https://www.svgrepo.com/show/269570/transportation-truck.svg', 'https://www.svgrepo.com/show/269537/delivery-truck-watch.svg'],
  'car' : ['https://www.svgrepo.com/show/8322/taxi.svg', 'https://www.svgrepo.com/show/19990/car.svg']
};

app.use(express.static('public'));

app.get('/search/:keyword', (req, res) => {
  const keyword = req.params.keyword;
  const urls = keywordsToUrls[keyword];
  if (urls) {
    res.json(urls);
  } else {
    res.status(404).send('Ключевое слово не найдено');
  }
});

app.get('/download/:url', (req, res) => {
  const url = decodeURIComponent(req.params.url);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  https.get(url, (response) => {
    if (response.statusCode !== 200) {
      res.status(response.statusCode).send(response.statusMessage);
      return;
    }

    const contentLength = parseInt(response.headers['content-length'], 10);
    let bytesReceived = 0;
    let content = [];

    response.on('data', (chunk) => {
      bytesReceived += chunk.length;
      content.push(chunk);
      const progress = ((bytesReceived / contentLength) * 100).toFixed(2);
      res.write(`data: ${JSON.stringify({ progress })}\n\n`);
    });

    response.on('end', () => {
      const contentBuffer = Buffer.concat(content);
      res.write(`data: ${JSON.stringify({ progress: 100, content: contentBuffer.toString('base64') })}\n\n`);
      res.end();
    });

    response.on('error', (error) => {
      res.status(500).send(error.message);
    });
  }).on('error', (error) => {
    res.status(500).send(error.message);
  });
});

app.listen(port, host, () => {
  console.log(`Сервер запущен по адресу: http://${host}:${port}`);
});