const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();

async function getGeminiApiKey() {
    try {
        const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || 'anxi-app';
        const name = `projects/${projectId}/secrets/Admin_Gemini_API_Key/versions/latest`;
        const [version] = await client.accessSecretVersion({ name });
        return version.payload.data.toString('utf8');
    } catch (error) {
        console.error("Error accessing Secret Manager API Key:", error);
        throw new HttpsError('internal', '無法取得 Gemini API 密鑰。');
    }
}

exports.generateLeadParsingRegex = onCall({ region: "asia-east1" }, async (request) => {
    const { sampleText } = request.data;
    if (!sampleText) {
        throw new HttpsError('invalid-argument', '缺少 sampleText 參數');
    }

    try {
        const apiKey = await getGeminiApiKey();
        const genAI = new GoogleGenerativeAI(apiKey);

        // 使用 gemini-3-flash-preview 模型
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const prompt = `
你是一個專業的 JavaScript 開發者與正則表示式 (Regular Expression) 專家。
我會提供一段包含房地產客戶名單的純文字，你的任務是為這段文字產生一組能夠準確擷取指定欄位的 JavaScript RegExp 字串。

需要擷取的欄位如下 (如果該特徵在文字中不存在，對應的規則可以留空字串)：
1. name: 擷取客戶姓名 (例如：林先生, 陳小姐, 王大明)
2. phone: 擷取聯絡電話 (例如：0912-345-678, 0912345678, 0972154773)
3. source: 擷取平台來源或途徑 (例如：臉書, 591, 樂居, IG)。如果沒有明確指定，留空即可。
4. budget: 擷取購屋預算 (例如：1000萬, 2000-3000萬)。如果沒有寫預算，留空即可。
5. date: 擷取日期時間 (例如：2026-03-01, 2026/03/01, 115年3月1日)。
6. note: 擷取備註或其他額外資訊 (例如：email, 方便聯絡時間等欄位以外的資訊合輯)。

產生規則的要求：
- 必須是有效的 JavaScript RegExp 模式字串 (不包含首尾的斜線 / 以及修飾符，例如 ^姓名：(.*)$ 即可，前端會用 new RegExp(字串, 'm') 來建立物件)。
- 需要擷取的目標資料應該放在第一個捕獲組 (Capture Group 1) 中。
- 對於 note 這種可能涵蓋多行的資訊，可以考慮使用 [\s\S]* 或是其他方式捕捉。如果很難寫正則或沒有備註可以留空字串。

=== 輸入文字範例 ===
${sampleText}
=== 結束 ===

請以 JSON 格式回應你的結果，架構必須剛好如下：
{
  "nameRegex": "^姓名：\\\\s*(.*?)(?:\\\\s|$)",
  "phoneRegex": "^電話：\\\\s*(.*?)(?:\\\\s|$)",
  "sourceRegex": "",
  "budgetRegex": "",
  "dateRegex": "^日期[：:]\\\\s*(.*?)(?:\\\\s|$)",
  "noteRegex": "^備註[：:]\\\\s*([\\\\s\\\\S]*)"
}
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Ensure valid JSON
        let parsedResult;
        try {
            parsedResult = JSON.parse(text);
        } catch (e) {
            console.log("Failed to parse JSON directly. Attempting extraction.");
            const match = text.match(/```json\n([\s\S]*?)\n```/);
            if (match) {
                parsedResult = JSON.parse(match[1]);
            } else {
                throw new Error("Invalid output format from Gemini");
            }
        }

        return { status: 'success', data: parsedResult };

    } catch (error) {
        console.error("產生 Regex 時發生錯誤:", error);
        throw new HttpsError('internal', 'AI 生成解析規則失敗: ' + error.message);
    }
});
