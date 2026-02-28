filepath = 'c:/Project/anxi-app/anxi-app/functions/index.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old = '''4. **計算價差指令**'''

new = '''4. **檢索指令**：若詢問「陳先生買了哪一戶？」或「查詢某客戶」，請在 \\`allProjectUnits\\` 中搜尋「買方姓名」欄位進行模糊比對。車位資料也包含「買方姓名」和「對應戶別」可交叉查詢。若詢問某銷售人員的業績，請搜尋「銷售人員」欄位。戶別資料中的「持有車位」陣列列出了該戶已購買的所有車位及其價格。
5. **計算價差指令**'''

if old in content:
    content = content.replace(old, new, 1)  # only replace first occurrence
    
    # Also renumber the rules after insertion
    content = content.replace('5. **狀態判斷規則**', '6. **狀態判斷規則**', 1)
    content = content.replace('6. **全案檢索指令**', '7. **全案檢索指令**', 1)
    content = content.replace('6. **成交金額計算**', '8. **成交金額計算**', 1)
    content = content.replace('7. **回答語氣**', '9. **回答語氣**', 1)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully added search instructions to system prompt.")
else:
    print("Target string not found!")
