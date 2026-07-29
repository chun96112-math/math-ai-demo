export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt || "你好" }] }]
      })
    });

    const data = await response.json();

    // 💡 關鍵：如果 Google API 回傳不是 200，或者抓不到文字，我們直接把 Google 的完整錯誤訊息顯示在畫面上！
    if (!response.ok) {
      return res.status(200).json({ text: `Google API 錯誤: ${JSON.stringify(data.error || data)}` });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!replyText) {
      return res.status(200).json({ text: `結構解析失敗，原始資料: ${JSON.stringify(data)}` });
    }

    return res.status(200).json({ text: replyText });
  } catch (error) {
    return res.status(200).json({ text: `程式異常: ${error.message}` });
  }
}
