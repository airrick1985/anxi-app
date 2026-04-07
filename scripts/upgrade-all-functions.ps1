# PowerShell 版本：快速升级所有 18 个函数从 256MB 到 512MB

$functions = @(
    "getinspectionrecords",
    "getprojecttextstyle",
    "updateprojectstatuscolors",
    "getinspectionoptionsforproject",
    "handlelogin",
    "getsystemfunctions",
    "updateprojecttextstyle",
    "getprojectstatuscolors",
    "getspotlayouts",
    "updatesalesdata",
    "onsaleshouseholdwrite",
    "getprojectstructure",
    "getinspectionrecordsforprojectfb",
    "addinspectionrecord",
    "getsalesparkingsbyfloor",
    "scheduledjobrunner",
    "senduploadreminders",
    "getfloorplans"
)

$count = 0
foreach ($func in $functions) {
    $count++
    Write-Host "[$count/18] 升級: $func" -ForegroundColor Cyan

    gcloud functions update "$func" `
        --memory=512MB `
        --region=asia-east1 `
        --project=apps-script-api-443402 `
        --quiet

    if ($?) {
        Write-Host "✓ $func 升級成功" -ForegroundColor Green
    } else {
        Write-Host "✗ $func 升級失敗" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "✓ 所有函數升級完成！" -ForegroundColor Green
