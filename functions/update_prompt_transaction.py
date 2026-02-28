filepath = 'c:/Project/anxi-app/anxi-app/functions/index.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old = '6. **回答語氣**：請保持專業、簡潔，使用繁體中文。若資料中找不到對應的資訊，請直接回答「目前系統中查無此資料」，不要編造數字。'

new = '''6. **成交金額計算**：戶別的成交價在 \\`房屋成交價_萬\\` 欄位，車位的成交價在 \\`車位成交價_萬\\` 欄位。若詢問「成交總銷金額」，請將所有已售出（銷售狀態不為空）的戶別的「房屋成交價_萬」加上所有已售出車位的「車位成交價_萬」加總。若成交價為 null 或空，則用底價代替估算，並註明。
7. **回答語氣**：請保持專業、簡潔，使用繁體中文。若資料中找不到對應的資訊，請直接回答「目前系統中查無此資料」，不要編造數字。'''

if old in content:
    content = content.replace(old, new)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully updated system prompt with transaction price instructions.")
else:
    print("Target string not found!")
