filepath = 'c:/Project/anxi-app/anxi-app/functions/index.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old = '5. **全案檢索指令**：若詢問「最便宜的戶別」，**只能從 allProjectUnits 查找**，根據「房屋總底價_萬」排序。若詢問「尚未售出的車位」，**只能從 allProjectParkingLots 查找**。狀態 (銷售狀態) 為空字串、null 或 undefined 代表「可售」或「未售出」。'

new = '''5. **狀態判斷規則**（非常重要）：
   - 狀態為「小訂」、「補足」、「簽約」→ 代表**已售**。
   - 狀態為「保留」、「封戶」、「銷控」→ 代表**特殊標記**，大部分情況下仍屬可售，但回覆時**必須標註該戶/車位目前狀態為「保留」等**，讓用戶知道。
   - 狀態為空字串、null 或 undefined → 代表**可售**。
6. **全案檢索指令**：若詢問「最便宜的戶別」，**只能從 allProjectUnits 查找**，根據「房屋總底價_萬」排序。若詢問「尚未售出的車位」，**只能從 allProjectParkingLots 查找**。請依照上述狀態判斷規則決定是否為已售或可售。'''

if old in content:
    content = content.replace(old, new)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully updated status rules in system prompt.")
else:
    print("Target string not found!")
