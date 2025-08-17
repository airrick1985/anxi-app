const express = require('express');
const cors = require('cors');
const { VertexAI } = require('@google-cloud/vertexai');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const authenticateRequest = (req, res, next) => {
  console.log('Bypassing authentication for now.');
  next();
};

app.post('/chat', authenticateRequest, async (req, res) => {
  console.log('Received request body:', JSON.stringify(req.body));

  try {
    const { prompt, history, projectData } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const PROJECT_ID = 'thematic-runner-447203-n2';
    const LOCATION = 'us-central1';
    const MODEL_NAME = 'gemini-2.5-flash-lite'; 

    const vertex_ai = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
    });
    
const systemInstruction = `
      你是一個極度嚴謹且精確的資料分析機器人。你的唯一任務是根據提供的 JSON 'DATA' 回答問題。你必須嚴格遵循以下步驟：

1.  分析請求: 查看 'USER QUESTION' 和 'CONTEXT' 中的 'Current Date (Taiwan)'。識別所有關鍵字，特別是像「戶別」這樣的明確識別碼。

2.  過濾資料: 遍歷 'DATA' 中的每個 JSON 物件。你必須對所有過濾條件執行「絕對精確、區分大小寫」的字串完全匹配。

3.  綜合答案: 收集所有完全匹配的物件，並且只能使用這些物件來組織你的答案。

4.  使用繁體中文: 你的最終答案只能使用繁體中文。

極重要規則 (CRITICAL RULES):

 精確匹配原則: 這是最重要的規則。當使用者詢問特定識別碼（如戶別 'A1-02'）時，你必須找到 [戶別] 欄位的值完全等於 'A1-02' 的資料。任何相似但不完全相同的項目（如 'A1-03', 'B1-02'）都必須被徹底忽略。絕對不允許混合或包含不完全匹配的資料。
 範例:
     假設 DATA 是: [{"戶別": "A1-02", "預約項目": "初驗"}, {"戶別": "B1-02", "預約項目": "複驗"}]
     使用者問題是: "戶別A1-02的所有資訊"
     你的正確思考過程: 使用者的目標是 'A1-02'。我找到一個 '戶別' 完全等於 'A1-02' 的物件。我將只使用這個物件的資訊。
     你的正確回答: "戶別A1-02的預約項目為初驗。"
     你的錯誤回答: "戶別A1-02的預約項目是複驗，而B1-02是初驗。" (這違反了精確匹配原則)

 日期基準: 永遠使用 'CONTEXT' 中的 'Current Date (Taiwan)' 作為今天的參考日期。

 空資料處理: 如果 'DATA' 為空或沒有任何資料符合使用者的問題，你必須回覆完全相同的句子：「根據目前頁面的資料，我無法回答這個問題。」

 禁止外部知識: 不要使用任何來自 'DATA' 區塊以外的知識。
    `;

    const generativeModel = vertex_ai.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: { parts: [{ text: systemInstruction }] }
    });
    
    const nowInTaiwan = new Date().toLocaleString("en-CA", { timeZone: "Asia/Taipei", year: 'numeric', month: '2-digit', day: '2-digit' });
    const formattedTaiwanDate = nowInTaiwan.split(', ')[0];

    const fullPrompt = `
      # CONTEXT
      - User: ${projectData.currentUser || 'Unknown'}
      - Project: ${projectData.currentProject || 'Not specified'}
      - Current Page: ${projectData.currentPage || 'Unknown'}
      - Current Date (Taiwan, UTC+8): ${formattedTaiwanDate}

      # DATA
      \`\`\`json
      ${JSON.stringify(projectData.pageData, null, 2)}
      \`\`\`

      # USER QUESTION
      "${prompt}"

      # INSTRUCTION
      Based strictly on the DATA and CONTEXT provided above, answer the USER QUESTION. Your date interpretation must follow the critical rules.
    `;
    
    console.log('Sending final prompt to Gemini...');

    const chat = generativeModel.startChat({ history: history || [] });
    const result = await chat.sendMessage(fullPrompt);
    const response = result.response;
    const responseText = response.candidates[0].content.parts[0].text;
    
    console.log('Successfully received response from Gemini.');
    
    res.status(200).json({ 
      message: 'Success',
      response: responseText
    });

  } catch (error) {
    console.error('CRITICAL ERROR:', error);
    res.status(500).json({ error: 'An error occurred while processing the AI request.' });
  }
});

exports.aiProxy = app;