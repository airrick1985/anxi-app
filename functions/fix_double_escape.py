filepath = 'c:/Project/anxi-app/anxi-app/functions/index.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace \\` with \` (double escaped backticks to single escaped)
content = content.replace('\\\\`', '\\`')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed double-escaped backticks.")
