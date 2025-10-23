async function getFullLawIfNoUpdate() {
  document.getElementById("result").textContent = "🔄 更新情報を確認中...";

  const lawId = "415AC0000000108"; // 駐車場法の法令ID
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const updateUrl = `https://laws.e-gov.go.jp/api/1/updatelawlists/${today}`;
  const fullTextUrl = `https://laws.e-gov.go.jp/api/1/lawdata/${lawId}`;

  try {
    // 更新情報の取得
    const updateRes = await fetch(updateUrl);
    const updateText = await updateRes.text();
    const updateDoc = new DOMParser().parseFromString(updateText, "application/xml");
    const updates = updateDoc.getElementsByTagName("LawNameListInfo");

    let isUpdated = false;
    for (let i = 0; i < updates.length; i++) {
      const id = updates[i].getElementsByTagName("LawId")[0]?.textContent;
      if (id === lawId) {
        isUpdated = true;
        const amendName = updates[i].getElementsByTagName("AmendName")[0]?.textContent || "不明";
        const amendDate = updates[i].getElementsByTagName("AmendPromulgationDate")[0]?.textContent || "不明";
        document.getElementById("result").textContent =
          `📌 駐車場法は本日更新されています。\n改正法令名: ${amendName}\n公布日: ${amendDate}`;
        break;
      }
    }

    // 更新がなければ全文取得
    if (!isUpdated) {
      document.getElementById("result").textContent = "🔄 更新はありません。全文を取得中...";

      const fullRes = await fetch(fullTextUrl);
      if (!fullRes.ok) {
        document.getElementById("result").textContent = `❌ 法令全文取得失敗: ステータスコード ${fullRes.status}`;
        return;
      }

      const fullText = await fullRes.text();
      const fullDoc = new DOMParser().parseFromString(fullText, "application/xml");
      const lawText = fullDoc.getElementsByTagName("LawFullText")[0]?.textContent;

      if (lawText) {
        document.getElementById("result").textContent = `📘 駐車場法の全文:\n\n${lawText}`;
      } else {
        document.getElementById("result").textContent = "❌ 法令本文が取得できませんでした。";
      }
    }
  } catch (error) {
    document.getElementById("result").textContent = `❌ エラー: ${error.message}`;
  }
}
