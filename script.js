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
``
