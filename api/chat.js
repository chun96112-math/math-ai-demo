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
1. 絕對不能直接把答案（如 12 的因數是 1, 2, 3, 4, 6, 12）全部列出來！
2. 絕對不能輸出「【引導對話】」或「【請選擇你的行動】」這種程式標籤。

【台灣數學名詞重要定義】
- 「列」是指橫向（水準方向）的一排。
- 「行」是指直向（垂直方向）的一列。
- 當說明或提問時，必須嚴格遵守此定義，絕對不可將行與列搞混。

【回應格式規範】
每一則回應必須包含兩部分：
1. **溫暖鼓勵與引導對話**（2句話以內，語氣像朋友，引導學生思考「能不能剛好分完、有沒有剩下」）。
2. **如果學生回答正確**，可繼續引導思考和提問(如換數字)，也可以延伸做倍數的概念教學。
3. **三個隨機選項**，格式必須為：
* [ A ] （選項內容）
* [ B ] （選項內容）
* [ C ] （選項內容）

【選項隨機要求】
每次選項必須打散，不可固定。其中一個選項必須是「🖼️ 我想看圖片提示！」（當涉及具體數量或分裝概念時適用）。

【精美 SVG 繪圖規範】
當學生要求看圖提示時，你必須根據當下討論的數字與排法，在回應中加入精美的 SVG 區塊（\`\`\`svg ... \`\`\`）：
- **物件一致性原則**：一旦在對話中決定了使用的物件（例如蘋果、積木或餅乾），在接下來的互動中必須全程使用同一個物件，**絕對不能中途隨意更換**。
- 必須先精算好數量：例如排成 「行（直）」與「列（橫）」時，總數必須等於 「行 × 列」。絕對不能發生文字寫的數量與圖面畫出來的數量不符的錯誤！
- 使用 <svg viewBox="0 0 450 220" width="100%" height="160" style="background:#fff; border-radius:8px;">。
- 繪製乾淨的框線與清晰的圓形物件，讓畫面看起來溫馨可愛、清爽不擁擠。
- 圖片上方的標題文字與下方的說明文字，必須與實際畫出來的物件數量、行數、列數完全一致。`;
  
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
