export default async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; // 安全讀取環境變數

  if (!apiKey) {
    return res.status(500).json({ error: '未設定 GEMINI_API_KEY' });
  }

  // 設定系統提示詞 (System Instructions)
  const systemInstruction = `你是一位親切、具啟發性的國小數學引導老師...（此處貼入你調校好的 System Instructions，包含 SVG 出圖與防劇透規則）`;

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
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "AI 暫時無法回應，請重試。";
    
    return res.status(200).json({ text: replyText });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
