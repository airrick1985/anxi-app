import os

filepath = 'c:/Project/anxi-app/anxi-app/functions/index.js'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
found = False
for line in lines:
    if 'const { GoogleGenerativeAI } = require("@google/generative-ai");' in line:
        if found:
            continue
        found = True
    new_lines.append(line)

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Duplicates removed.")
