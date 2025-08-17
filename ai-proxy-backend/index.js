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
    const MODEL_NAME = 'gemini-2.0-flash-lite'; 

    const vertex_ai = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
    });
    
    // ✨ --- 強化時區指令 --- ✨
    const systemInstruction = `
      You are a highly specialized data analyst assistant for a construction project management system in Taiwan.
      
      **CRITICAL RULES:**
      1.  You MUST strictly use only the data provided in the 'DATA' section. The "預約日期" field in the data is already formatted as "yyyy-MM-dd" in the user's local timezone.
      2.  The user is in **Taiwan (Timezone: Asia/Taipei, UTC+8)**. All date-related questions and calculations (e.g., "today", "tomorrow", "next week", "8/11") MUST be interpreted based on the "Current Time (Taiwan)" provided in the CONTEXT section. Treat all dates as being in the Asia/Taipei timezone.
      3.  DO NOT perform any timezone conversions on the "預約日期" field. Treat it as a simple string for filtering.
      4.  If the provided data is insufficient to answer the question, you MUST respond with the exact phrase: "根據目前頁面的資料，我無法回答這個問題。"
      5.  All your final answers and explanations MUST be in **Traditional Chinese (繁體中文)**.
      6.  Present your analysis clearly, using bullet points or lists for readability.
    `;

    const generativeModel = vertex_ai.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: { parts: [{ text: systemInstruction }] }
    });
    
    // ✨ --- 同樣動態產生當下的台灣時間 --- ✨
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