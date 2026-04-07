#!/bin/bash

# 快速升级所有 18 个函数从 256MB 到 512MB

for func in \
  getinspectionrecords \
  getprojecttextstyle \
  updateprojectstatuscolors \
  getinspectionoptionsforproject \
  handlelogin \
  getsystemfunctions \
  updateprojecttextstyle \
  getprojectstatuscolors \
  getspotlayouts \
  updatesalesdata \
  onsaleshouseholdwrite \
  getprojectstructure \
  getinspectionrecordsforprojectfb \
  addinspectionrecord \
  getsalesparkingsbyfloor \
  scheduledjobrunner \
  senduploadreminders \
  getfloorplans; do
  echo "升级: $func"
  gcloud functions update "$func" \
    --memory=512MB \
    --region=asia-east1 \
    --project=apps-script-api-443402 \
    --quiet
done

echo ""
echo "✓ 所有函数升级完成！"
