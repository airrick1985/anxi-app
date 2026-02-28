import os

filepath = 'c:/Project/anxi-app/anxi-app/functions/index.js'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if 22026 <= i <= 22033:
        # these lines should have backticks, they were replaced as plain quotes/nothing by mistake?
        # Actually my mistake was ` replaced by nothing. Let's just hardcode the block!
        pass
    new_lines.append(line)

# Wait, let's just do a string replacement on the exact block.
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

bad_block = """    const systemInstruction = 您是建案的專業 AI 銷售助理。請根據以下「目前的系統庫存與狀態資料」來回答銷售人員的問題。

【資料格式與搜尋規則說明】
1. 「戶別」：請在 `allProjectUnits` 中尋找對應的「戶別」(例如 A-1, B-2)。請忽略大小寫。
2. 「當前戶別底價」：請讀取 `currentUnitInfo` 或 `allProjectUnits` 中對應的 `price_floor_house_total`。
3. 「車位底價/表價」：請在 `allProjectParkingLots` 中尋找對應的「車位編號」，讀取其 `車位底價_萬` 或 `車位表價_萬` (單位：萬)。【注意：尋找車位編號時必須忽略大小寫，甚至忽略多餘的空白。例如 B3-103a 與 B3-103A 視為相同。】
4. **計算價差指令**：若詢問「出價 XXX 與底價差多少？」，請直接從 `currentUnitInfo` 尋找「當前戶別底價」，加上詢問中提到的所有「車位底價」(亦即去 `allProjectParkingLots` 找對應的 `車位底價_萬`，請**務必忽略大小寫**比對車位編號)，算出『總底價』後與出價相減。請直接給出試算結果與算式，【絕對不要反問】客戶出價包含什麼。如果某些車位沒找到，請試著忽略大小寫再找一次。
5. **全案檢索指令**：若詢問「目前還有哪些兩房可以選？」或「列出目前尚未售出的車位」，請善用 `allProjectUnits` 和 `allProjectParkingLots` 中的資料。狀態 (salesStatus_backend 或是 狀態) 為空字串、null 或 undefined 代表「可售」或「未售出」。
6. **回答語氣**：請保持專業、簡潔，使用繁體中文。若資料中找不到對應的資訊，請直接回答「目前系統中查無此資料」，不要編造數字。

【目前的系統庫存與狀態資料 (Context Data)】
```json
${JSON.stringify(contextData, null, 2)}
```
;"""

good_block = """    const systemInstruction = `您是建案的專業 AI 銷售助理。請根據以下「目前的系統庫存與狀態資料」來回答銷售人員的問題。

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
`;"""

if bad_block in content:
    content = content.replace(bad_block, good_block)
    # also handle the case where it might be slightly different
elif "const systemInstruction = 您是" in content:
    print("Found variant")
    pass
    
# Actually let's just use regex to replace everything between `const systemInstruction = ` and `    const formattedMessages`
import re
content = re.sub(
    r'const systemInstruction = .*?    const formattedMessages = messages',
    good_block + '\n\n    const formattedMessages = messages',
    content,
    flags=re.DOTALL
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Regex replace run.")
