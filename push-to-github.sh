#!/bin/bash

echo "📦 準備推送更新到 GitHub..."

git add .
git commit -m "📦 自動推送：更新前端代碼與後端整合提示效果"
git push origin main

echo "✅ 已推送到 GitHub main 分支"
