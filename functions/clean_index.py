import os

filepath = 'c:/Project/anxi-app/anxi-app/functions/index.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\\`\\`\\`json', '```json')
content = content.replace('\\`\\`\\`', '```')
content = content.replace('\\`', '`')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("File cleaned.")
