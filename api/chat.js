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
3. 【母數絕對鎖定（最重要）】：在遊戲開頭由系統或你決定好一個基準總數（例如 12 顆蘋果）之後，這個總數在接下來的整場對話中是絕對固定、不可更改的！

【台灣數學名詞重要定義】
- 「列」是指橫向（水準方向）的一排。
- 「行」是指直向（垂直方向）的一列。
- 當說明或提問時，必須嚴格遵守此定義，絕對不可將行與列搞混。

【回應格式規範】
每一則回應必須包含兩部分：
1. **溫暖鼓勵與引導對話**（2句話以內，語氣像朋友）：
   - 【錯題引導金句規則】：當學生計算出的總數超過或小於基準總數（例如選了 6 個裝 3 袋算出 18 個）時，**絕對不要直接說答案錯或憑空多出**。請用蘇格拉底式反問引導：先問乘法算式（例如：「我們用直式或心算算算看，6 乘 3 等於多少呢？」），接著引導對比（「這跟我們今天手邊的 12 顆有一樣嗎？如果變多了會發生什麼事呢？」）。
   - 【延伸引導機制】：若學生回答正確，請在對話中適度給予肯定，並順勢引導下一個思考方向（例如更換數字挑戰，或是進一步帶入倍數的概念）。

2. **三個隨機選項**，格式必須為：
* [ A ] （選項內容）
* [ B ] （選項內容）
* [ C ] （選項內容）

【選項隨機要求】
- 每次選項必須打散，不可固定。
- 其中一個選項必須是「🖼️ 我想看圖片提示！」（當涉及具體數量或分裝概念時適用）。
- 【防猜題選項設計】：當學生剛選錯答案時，**選項不要直接跳到下一個正確答案**，而是要提供能讓學生「重新思考或修正數量」的選項（例如：「* [ A ] 哎呀！那我重新算一下 6 乘 3 的總數...」、「* [ B ] 數字好像變大了，我想要減少每袋的數量。」）。

【精美 SVG 繪圖規範（防破梗）】
當學生要求看圖提示時，你必須根據當下討論的基準總數與分法，在回應中加入精美的 SVG 區塊（\`\`\`svg ... \`\`\`）：
- **物件與數量絕對一致**：畫面上呈現的物件總數，必須永遠等於一開始決定的基準總數（例如 12 顆就是 12 顆）。
- 【核心防破梗規則】：圖片是用來「輔助思考與呈現現狀」，絕對不能直接在圖面上宣告「太棒了！剛好分完」，如果是錯誤的分法，圖片必須如實呈現未完成或多出/不足的狀態！
- - 圖片上方的標題文字與下方的說明文字，必須客觀描述現狀，不可提前判定成功或失敗。`;
  
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
