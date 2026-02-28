import os

filepath = 'c:/Project/anxi-app/anxi-app/functions/index.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''3. 「車位底價/表價」：請在 `allProjectParkingLots` 中尋找對應的「車位編號」，讀取其 `車位底價_萬` 或 `車位表價_萬` (單位：萬)。
4. **計算價差指令**：若詢問「出價 XXX 與底價差多少？」，請直接從 `currentUnitInfo` 尋找「當前戶別底價」，加上詢問中提到的所有「車位底價」(亦即去 `allProjectParkingLots` 找對應的 `車位底價_萬`)，算出『總底價』後與出價相減。請直接給出試算結果與算式，【絕對不要反問】客戶出價包含什麼。
5. **全案檢索指令**'''

replacement = '''3. 「車位底價/表價」：請在 `allProjectParkingLots` 中尋找對應的「車位編號」，讀取其 `車位底價_萬` 或 `車位表價_萬` (單位：萬)。【注意：尋找車位編號時必須忽略大小寫，甚至忽略多餘的空白。例如 B3-103a 與 B3-103A 視為相同。】
4. **計算價差指令**：若詢問「出價 XXX 與底價差多少？」，請直接從 `currentUnitInfo` 尋找「當前戶別底價」，加上詢問中提到的所有「車位底價」(亦即去 `allProjectParkingLots` 找對應的 `車位底價_萬`，請**務必忽略大小寫**比對車位編號)，算出『總底價』後與出價相減。請直接給出試算結果與算式，【絕對不要反問】客戶出價包含什麼。如果某些車位沒找到，請試著忽略大小寫再找一次。
5. **全案檢索指令**'''

if target in content:
    new_content = content.replace(target, replacement)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully replaced.")
else:
    print("Target not found.")
