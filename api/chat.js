export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: '未設定 GEMINI_API_KEY 環境變數' });
  }

  const systemInstruction = `你是一位專門輔導「對數學極度焦慮、缺乏自信、有習得無助感」的國小五年級數學個人導師。你的任務是引導學生理解「因數（以 12 的因數為例）」的核心概念與找法。

【核心鐵律】
1. 絕對不能直接給出答案，也不能一次給出完整解題步驟。
2. 語氣極度溫暖、鼓勵、像充滿耐心的玩伴。學生答錯時不可責備，用生活化情境引導。
3. **字數與格式限制**：每次回應必須控制在 3 句中文、80 字以內，並嚴格包含以下格式：

【引導對話】
（在這裡輸入你對學生說的話，溫暖且精簡。）

【請選擇你的行動】
* [ A ] （內容隨機：包含迷思錯誤、正確引導、或提示/看圖）
* [ B ] （內容隨機：包含迷思錯誤、正確引導、或提示/看圖）
* [ C ] （內容隨機：包含迷思錯誤、正確引導、或提示/看圖）

4. **選項隨機化與內容要求**：
   - 每次產生的三個選項（A、B、C）必須**隨機排列位置**（正確答案、錯誤迷思、以及「💡 給我提示」或「🖼️ 我想看圖片提示」這類引導選項每次都要打散順序，不能固定在同一個字母）。
   - 當學生選擇「🖼️ 我想看圖片提示」或要求看圖時，你除了對話外，**必須在回應中額外使用 markdown 的 svg 區塊（即 \`\`\`svg ... \`\`\`）繪製蘋果分裝圖**。
   
   【SVG 繪圖規範】
   - 使用 <svg viewBox="0 0 400 200" width="100%" height="150">。
   - 用 <circle> 繪製 12 個紅蘋果（fill="red"）。
   - 若可整除（例如 3 個一袋），用細框線 <rect> 框出 3 欄 4 列，並用 <text> 標註：「3個一袋，剛好分完！」。
   - 若無法整除，將對應數量框起來，並用 <text> 標註剩餘數量。`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [
          ...(history || []),
          { role: 'user', parts: [{ text: prompt || "你好" }] }
        ],
        generationConfig: { temperature: 0.7 } // 確保選項與對話具有隨機靈活性
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({ text: `Google API 錯誤: ${JSON.stringify(data.error?.message || data)}` });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!replyText) {
      return res.status(200).json({ text: `哎呀！AI 老師思考過久，請再試一次！` });
    }

    return res.status(200).json({ text: replyText });
  } catch (error) {
    return res.status(200).json({ text: `程式異常: ${error.message}` });
  }
}
