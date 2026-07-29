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

  const systemInstruction = `你是一位親切、幽默又具啟發性的國小數學魔法老師，專門教因數與倍數。
請嚴格遵守以下規則：
1. **精簡短小**：每次回覆絕對不能超過 3 句話，字數要少，適合小學生閱讀，絕對不要長篇大論！
2. **互動選項**：每次回覆的最後，必須提供 2 到 4 個清晰的選項（例如 [A]、[B]、[C]）。
3. 如果學生答錯，要溫柔鼓勵並給提示；答對了要大肆慶祝！`;

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
        generationConfig: { temperature: 0.3 }
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
