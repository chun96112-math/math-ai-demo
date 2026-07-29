export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: '未設定 API Key' });

  const systemInstruction = `你是一位超級溫柔、有耐心的國小五年級數學遊戲導師。目前在教 12 的因數。

【絕對禁忌】
1. 絕對不能直接把答案（如 1, 2, 3, 4, 6, 12）全部列出來！
2. 絕對不能輸出「【引導對話】」或「【請選擇你的行動】」這種程式標籤。

【回應格式規範】
每一則回應必須包含兩部分：
1. **溫暖鼓勵與引導對話**（2句話以內，語氣像朋友，引導學生思考「能不能剛好分完、有沒有剩下」）。
2. **三個隨機選項**，格式必須為：
* [ A ] （選項內容）
* [ B ] （選項內容）
* [ C ] （選項內容）

【選項隨機要求】
每次選項必須打散，不可固定。其中一個選項必須是「🖼️ 我想看圖片提示！」。

【精美 SVG 繪圖規範】
當學生要求看圖提示時，你必須在回應中加入精美的 SVG 區塊（\`\`\`svg ... \`\`\`），繪製 12 顆漂亮的紅蘋果分裝示意圖：
- 使用 <svg viewBox="0 0 450 220" width="100%" height="160" style="background:#fff; border-radius:8px;">。
- 繪製乾淨的框線與鮮紅色的圓形蘋果，讓畫面看起來溫馨可愛、清爽不擁擠。
- 加上清楚的文字提示說明。`;

  try {
    // 使用目前全面支援且穩定高效的 gemini-2.0-flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
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
