// 駐車場法の法令IDを取得
async function getLawId() {
  const url = "https://laws.e-gov.go.jp/api/1/lawlists/2"; // 憲法・法律

  try {
    const response = await fetch(url);
    if (!response.ok) {
      document.getElementById("result").textContent = `❌ APIリクエスト失敗: ステータスコード ${response.status}`;
      return;
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const lawInfos = xmlDoc.getElementsByTagName("LawNameListInfo");
    let found = false;

    for (let i = 0; i < lawInfos.length; i++) {
      const lawName = lawInfos[i].getElementsByTagName("LawName")[0]?.textContent;
      const lawId = lawInfos[i].getElementsByTagName("LawId")[0]?.textContent;
      const lawNo = lawInfos[i].getElementsByTagName("LawNo")[0]?.textContent;

      if (lawName && lawName.includes("駐車場法")) {
        document.getElementById("result").textContent =
          `✅ 駐車場法が見つかりました！\n法令名: ${lawName}\n法令ID: ${lawId}\n法令番号: ${lawNo}`;
        found = true;
        break;
      }
    }

    if (!found) {
      document.getElementById("result").textContent = "❌ 駐車場法は見つかりませんでした。";
    }
  } catch (error) {
    document.getElementById("result").textContent = `❌ エラー: ${error.message}`;
  }
}

// 駐車場法の全文を取得
async function getLawFullText() {
  const lawId = "415AC0000000108"; // 駐車場法の法令ID（事前取得済み）
  const url = `https://laws.e-gov.go.jp/api/1/lawdata/${lawId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      document.getElementById("result").textContent = `❌ APIリクエスト失敗: ステータスコード ${response.status}`;
      return;
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const lawText = xmlDoc.getElementsByTagName("LawFullText")[0]?.textContent;
    if (lawText) {
      document.getElementById("result").textContent = `📘 駐車場法の全文:\n\n${lawText}`;
    } else {
      document.getElementById("result").textContent = "❌ 法令本文が取得できませんでした。";
    }
  } catch (error) {
    document.getElementById("result").textContent = `❌ エラー: ${error.message}`;
  }
}

// 駐車場法の第1条を取得
async function getLawArticle() {
  const lawId = "415AC0000000108";
  const article = "第1条";
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

// 第1条と更新情報を取得
async function getLawArticleWithUpdateCheck() {
  const lawId = "415AC0000000108";
  const article = "第1条";
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const updateUrl = `https://laws.e-gov.go.jp/api/1/updatelawlists/${today}`;
  const articleUrl = `https://laws.e-gov.go.jp/api/1/articles;lawId=${lawId};article=${encodeURIComponent(article)}`;

  try {
    const articleRes = await fetch(articleUrl);
    const articleText = await articleRes.text();
    const articleDoc = new DOMParser().parseFromString(articleText, "application/xml");
    const lawContents = articleDoc.getElementsByTagName("LawContents")[0]?.textContent || "❌ 条文が取得できませんでした。";

    const updateRes = await fetch(updateUrl);
    const updateText = await updateRes.text();
    const updateDoc = new DOMParser().parseFromString(updateText, "application/xml");
    const updates = updateDoc.getElementsByTagName("LawNameListInfo");

    let updateInfo = "📅 本日付の更新はありません。";
    for (let i = 0; i < updates.length; i++) {
      const id = updates[i].getElementsByTagName("LawId")[0]?.textContent;
      if (id === lawId) {
        const amendName = updates[i].getElementsByTagName("AmendName")[0]?.textContent || "不明";
        const amendDate = updates[i].getElementsByTagName("AmendPromulgationDate")[0]?.textContent || "不明";
        updateInfo = `📌 更新あり：\n改正法令名: ${amendName}\n公布日: ${amendDate}`;
        break;
      }
    }

    document.getElementById("result").textContent = `📘 駐車場法 第1条:\n\n${lawContents}\n\n${updateInfo}`;
  } catch (error) {
    document.getElementById("result").textContent = `❌ エラー: ${error.message}`;
  }
}
