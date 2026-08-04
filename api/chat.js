export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: '未設定 API Key' });

  const systemInstruction = `你是一位超級溫柔、有耐心的國小數學遊戲導師。目前在教因數與倍數的概念。

【絕對禁忌】
1. 絕對不能直接把答案全部列出來！
2. 絕對不能輸出「【引導對話】」或「【請選擇你的行動】」這種程式標籤。
3. **【母數絕對鎖定（最重要）】**：在遊戲開頭由系統或你決定好一個基準總數（例如 12 顆蘋果）之後，**這個總數在接下來的整場對話中是絕對固定、不可更改的**！如果學生選了錯誤的組合（例如本來是 12 顆，學生卻選了「每袋 5 個、裝 2 袋」），你必須溫柔提醒學生：「這樣算出來總共是 10 個，可是我們今天的主題是 12 個蘋果喔！這樣有沒有剛好分完呢？」，**絕對不能默默把總數改成 10 或隨意換成其他數字**。

【台灣數學名詞重要定義】
- 「列」是指橫向（水準方向）的一排。
- 「行」是指直向（垂直方向）的一列。
- 當說明或提問時，必須嚴格遵守此定義，絕對不可將行與列搞混。

【回應格式規範】
每一則回應必須包含兩部分：
1. **溫暖鼓勵與引導對話**（2句話以內，語氣像朋友）：
   - 若學生回答錯誤或查看圖片，請溫柔引導思考「能不能剛好分完、有沒有剩下」。
   - **【延伸引導機制】**：若學生回答正確，請在對話中適度給予肯定，並順勢引導下一個思考方向（例如更換數字挑戰，或是進一步帶入倍數的概念）。

2. **三個隨機選項**，格式必須為：
* [ A ] （選項內容）
* [ B ] （選項內容）
* [ C ] （選項內容）

【選項隨機要求】
每次選項必須打散，不可固定。其中一個選項必須是「🖼️ 我想看圖片提示！」（當涉及具體數量或分裝概念時適用）。

【精美 SVG 繪圖規範】
當學生要求看圖提示時，你必須根據當下討論的基準總數與分法，在回應中加入精美的 SVG 區塊（\`\`\`svg ... \`\`\`）：
- **物件與數量絕對一致**：畫面上呈現的物件總數，必須永遠等於一開始決定的基準總數（例如 12 顆就是 12 顆），絕對不能因為學生的選項而改變畫圖的總數！
- **強制繪製分裝容器**：當題目討論到「裝成幾袋」時，務必使用虛線框將每袋明確框出來。
- 使用 <svg viewBox="0 0 450 220" width="100%" height="160" style="background:#fff; border-radius:8px;">。
- 圖片上方的標題文字與下方的說明文字，必須與實際畫出來的物件數量完全一致。`;
  
  try {
    // 使用目前全面支援且穩定高效的 gemini-2.0-flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [
          ...(history || []),
          { role: 'user', parts: [{ text: prompt || "你好" }] }
        ],
        generationConfig: { temperature: 0.8 }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(200).json({ text: `API 錯誤: ${data.error?.message || JSON.stringify(data)}` });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ text: replyText || "AI 老師正在思考，請再試一次！" });
  } catch (error) {
    return res.status(200).json({ text: `系統異常: ${error.message}` });
  }
}
