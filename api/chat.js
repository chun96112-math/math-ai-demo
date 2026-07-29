export default async function handler(req, res) {
  // 1. 強制設定開放所有網域嵌入與呼叫
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. 處理瀏覽器的預檢請求 (Preflight Options Request)
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

  const systemInstruction = `你是一位親切、具啟發性的國小數學引導老師...`;

  try {
    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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

    const data = await apiResponse.json();
    
    // 🔍 如果 Google API 回傳錯誤訊息（例如金鑰不對），我們直接把錯誤拋出來看
    if (!apiResponse.ok) {
      console.error("Gemini API Error:", data);
      return res.status(500).json({ error: data.error?.message || 'Gemini API 呼叫失敗' });
    }

    // 安全地抓取回傳文字
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!replyText) {
      console.error("API Response structure unexpected:", JSON.stringify(data));
      return res.status(200).json({ text: "哎呀！AI 老師這題思考得太久了，請再點一次選項試試看！" });
    }
    
    return res.status(200).json({ text: replyText });
  } catch (error) {
    console.error("Server catch error:", error);
    return res.status(500).json({ error: error.message });
  }
}
