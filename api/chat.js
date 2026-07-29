export default async function handler(req, res) {
  // 1. 允許任何前端網頁（包含你的 GitHub Pages）連線 (CORS 設定)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 處理瀏覽器的預檢請求 (Preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: '未設定 GEMINI_API_KEY 環境變數' });
  }

  const systemInstruction = `你是一位親切、具啟發性的國小數學引導老師...（此處貼入你的 Prompt）`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [
          ...(history || []),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: { temperature: 0.3 }
      })
    });

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "AI 暫時無法回應，請檢查 API Key 是否正確。";
    
    return res.status(200).json({ text: replyText });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
