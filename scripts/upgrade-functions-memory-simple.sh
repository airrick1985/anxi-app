#!/bin/bash

#############################################################################
#  简化版：Cloud Functions 批量内存升级脚本
#  用途: 快速升级所有有内存问题的函数
#############################################################################

PROJECT_ID="apps-script-api-443402"
REGION="asia-east1"
NEW_MEMORY="512MB"

# 所有需要升级的函数
FUNCTIONS=(
  getinspectionrecords
  getprojecttextstyle
  updateprojectstatuscolors
  getinspectionoptionsforproject
  handlelogin
  getsystemfunctions
  updateprojecttextstyle
  getprojectstatuscolors
  getspotlayouts
  updatesalesdata
  onsaleshouseholdwrite
  getprojectstructure
  getinspectionrecordsforprojectfb
  addinspectionrecord
  getsalesparkingsbyfloor
  scheduledjobrunner
  senduploadreminders
  getfloorplans
)

echo "开始升级 ${#FUNCTIONS[@]} 个函数..."
echo "从 256MB 升级到 512MB"
echo ""

SUCCESS=0
FAILED=0
INDEX=1

for func in "${FUNCTIONS[@]}"; do
  echo -n "[$INDEX/${#FUNCTIONS[@]}] $func ... "

  if gcloud functions update "$func" \
    --memory="$NEW_MEMORY" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --quiet 2>/dev/null; then
    echo "✓"
    ((SUCCESS++))
  else
    echo "✗ 失败"
    ((FAILED++))
  fi

  ((INDEX++))
  sleep 0.5
done

echo ""
echo "════════════════════════════════════"
echo "完成！成功: $SUCCESS / ${#FUNCTIONS[@]}"
if [ $FAILED -gt 0 ]; then
  echo "失败: $FAILED"
fi
echo "════════════════════════════════════"
