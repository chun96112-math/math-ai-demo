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

  // 國小數學引導老師設定
  const systemInstruction = `你是一位親切、具啟發性的國小數學引導老師，擅長用生活化的方式帶領學生思考因數與倍數。`;

  try {
    // 採用 Google AI Studio 支援的 gemini-3.5-flash-lite 模型
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
      return res.status(200).json({ text: `哎呀！AI 老師這題思考得太久了，請再點一次選項試試看！` });
    }

    return res.status(200).json({ text: replyText });
  } catch (error) {
    return res.status(200).json({ text: `程式異常: ${error.message}` });
  }
}
