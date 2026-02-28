import os

filepath = 'c:/Project/anxi-app/anxi-app/functions/index.js'
with open(filepath, 'a', encoding='utf-8') as f:
    f.write('''

// =================================================================
// / ✓ 【新增】AI 銷售助理 (askSalesBot) 
// =================================================================

const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.askSalesBot = onCall({ region: "asia-east1" }, async (request) => {
  // 1. 驗證使用者身份
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "您必須先登入才能使用 AI 助理。");
  }

  // 接收前端傳遞的參數
  const { messages, contextData } = request.data;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new HttpsError("invalid-argument", "對話訊息格式不正確。");
  }

  try {
    const apiKey = process.env.SALES_BOT_GEMINI_KEY || "";
    if (!apiKey) {
      console.error("[askSalesBot] SALES_BOT_GEMINI_KEY 未設置");
      throw new HttpsError("internal", "後端未設置 AI 金鑰。");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // 使用 gemini-2.5-flash-lite
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // 加入 Debug log 可以看到實際傳入的資料長相
    console.log('[DEBUG askSalesBot] Received count:', 
      'Units:', contextData.allProjectUnits?.length, 
      'Parkings:', contextData.allProjectParkingLots?.length);
      
    if (contextData.allProjectParkingLots && contextData.allProjectParkingLots.length > 0) {
        const b3103a = contextData.allProjectParkingLots.find(p => p['車位編號'] === 'B3-103a' || p.spotId === 'B3-103A' || p.spotId === 'B3-103a' || p['車位編號'] === 'B3-103A');
        console.log('[DEBUG askSalesBot] Found target parking spot in context:', JSON.stringify(b3103a));
    }

    // 設定 System Prompt
    const systemInstruction = `您是建案的專業 AI 銷售助理。請根據以下「目前的系統庫存與狀態資料」來回答銷售人員的問題。

【資料格式與搜尋規則說明】
1. 「戶別」：請在 \\`allProjectUnits\\` 中尋找對應的「戶別」(例如 A-1, B-2)。請忽略大小寫。
2. 「當前戶別底價」：請讀取 \\`currentUnitInfo\\` 或 \\`allProjectUnits\\` 中對應的 \\`price_floor_house_total\\`。
3. 「車位底價/表價」：請在 \\`allProjectParkingLots\\` 中尋找對應的「車位編號」，讀取其 \\`車位底價_萬\\` 或 \\`車位表價_萬\\` (單位：萬)。【注意：尋找車位編號時必須忽略大小寫，甚至忽略多餘的空白。例如 B3-103a 與 B3-103A 視為相同。】
4. **計算價差指令**：若詢問「出價 XXX 與底價差多少？」，請直接從 \\`currentUnitInfo\\` 尋找「當前戶別底價」，加上詢問中提到的所有「車位底價」(亦即去 \\`allProjectParkingLots\\` 找對應的 \\`車位底價_萬\\`，請**務必忽略大小寫**比對車位編號)，算出『總底價』後與出價相減。請直接給出試算結果與算式，【絕對不要反問】客戶出價包含什麼。如果某些車位沒找到，請試著忽略大小寫再找一次。
5. **全案檢索指令**：若詢問「目前還有哪些兩房可以選？」或「列出目前尚未售出的車位」，請善用 \\`allProjectUnits\\` 和 \\`allProjectParkingLots\\` 中的資料。狀態 (salesStatus_backend 或是 狀態) 為空字串、null 或 undefined 代表「可售」或「未售出」。
6. **回答語氣**：請保持專業、簡潔，使用繁體中文。若資料中找不到對應的資訊，請直接回答「目前系統中查無此資料」，不要編造數字。

【目前的系統庫存與狀態資料 (Context Data)】
\`\`\`json
${JSON.stringify(contextData, null, 2)}
\`\`\`
`;

    // 格式化對話歷史紀錄符合 Gemini API 的要求
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // 初始化 Chat Session，並將 System Instruction 放在一開始
    const chat = model.startChat({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      history: formattedMessages.slice(0, -1), // 排除最後一則新訊息
    });

    const userMessage = messages[messages.length - 1].content;

    // 將 System Instruction 與最後一則訊息一起發送
    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();

    return {
      status: 'success',
      reply: responseText
    };

  } catch (error) {
    console.error(`[askSalesBot] 處理錯誤:`, error);
    // 檢查是否為 503 Service Unavailable 錯誤
    if (error.message && error.message.includes('503')) {
      throw new HttpsError("unavailable", "AI 助理服務暫時忙碌中，請稍後再試。");
    }
    throw new HttpsError("internal", `AI 助理發生錯誤: ${error.message}`);
  }
});
''')
    print("Code successfully appended.")
