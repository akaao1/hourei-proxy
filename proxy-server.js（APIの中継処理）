const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/api/laws', async (req, res) => {
  const { date } = req.query;
  try {
    const response = await axios.get(`https://laws.e-gov.go.jp/api/1/updatelawlists/${date}`);
    res.set('Content-Type', 'application/xml');
    res.send(response.data);
  } catch (error) {
    res.status(500).send('API呼び出しに失敗しました');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
