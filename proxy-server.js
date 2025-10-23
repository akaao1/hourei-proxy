const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORSを許可（GitHub Pagesなどからのアクセスを可能にする）
app.use(cors());

// 法令APIへのプロキシルート
app.get('/api/laws', async (req, res) => {
  const { date } = req.query;

  // 日付が指定されていない場合はエラーを返す
  if (!date) {
    return res.status(400).send('date パラメータが必要です。例: /api/laws?date=20251023');
  }

  try {
    // e-Gov法令APIにリクエストを送信
    const response = await axios.get(`https://laws.e-gov.go.jp/api/1/updatelawlists/${date}`);

    // XML形式でレスポンスを返す
    res.set('Content-Type', 'application/xml');
    res.send(response.data);
  } catch (error) {
    console.error('API呼び出しエラー:', error.message);
    res.status(500).send('法令APIの呼び出しに失敗しました。');
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
``
