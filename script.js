async function getLawArticle() {
  // 駐車場法の法令ID（例：415AC0000000108）※事前に取得済みであること
  const lawId = "415AC0000000108";
  const article = "第1条"; // 取得したい条
  const url = `https://laws.e-gov.go.jp/api/1/articles;lawId=${lawId};article=${encodeURIComponent(article)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      document.getElementById("result").textContent = `❌ APIリクエスト失敗: ステータスコード ${response.status}`;
      return;
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const lawContents = xmlDoc.getElementsByTagName("LawContents")[0]?.textContent;
    if (lawContents) {
      document.getElementById("result").textContent = `📘 駐車場法 第1条:\n\n${lawContents}`;
    } else {
      document.getElementById("result").textContent = "❌ 条文が取得できませんでした。";
    }
  } catch (error) {
    document.getElementById("result").textContent = `❌ エラー: ${error.message}`;
  }
}
