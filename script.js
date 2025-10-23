async function getLawArticleWithUpdateCheck() {
  const lawId = "415AC0000000108"; // 駐車場法の法令ID
  const article = "第1条";
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // yyyyMMdd形式
  const updateUrl = `https://laws.e-gov.go.jp/api/1/updatelawlists/${today}`;
  const articleUrl = `https://laws.e-gov.go.jp/api/1/articles;lawId=${lawId};article=${encodeURIComponent(article)}`;

  try {
    // ① 条文取得
    const articleRes = await fetch(articleUrl);
    const articleText = await articleRes.text();
    const articleDoc = new DOMParser().parseFromString(articleText, "application/xml");
    const lawContents = articleDoc.getElementsByTagName("LawContents")[0]?.textContent || "❌ 条文が取得できませんでした。";

    // ② 更新情報取得
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

    // 結果表示
    document.getElementById("result").textContent = `📘 駐車場法 第1条:\n\n${lawContents}\n\n${updateInfo}`;
  } catch (error) {
    document.getElementById("result").textContent = `❌ エラー: ${error.message}`;
  }
}
