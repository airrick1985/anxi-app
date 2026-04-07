# Cloud Functions 批量内存升级脚本 (PowerShell 版本)
# 用途: 将所有有内存超限问题的 Cloud Functions 从 256MB 升级到 512MB

param(
  [string]$ProjectId = "apps-script-api-443402",
  [string]$Region = "asia-east1",
  [string]$NewMemory = "512MB",
  [switch]$VerifyOnly,
  [switch]$DryRun
)

# 颜色定义
$Colors = @{
  Success = 'Green'
  Error   = 'Red'
  Warning = 'Yellow'
  Info    = 'Cyan'
}

# 所有需要升级的函数
$Functions = @(
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

function Write-ColorOutput {
  param(
    [string]$Message,
    [string]$Color = 'White'
  )
  Write-Host $Message -ForegroundColor $Color
}

function Print-Header {
  param([string]$Title)
  Write-Host ""
  Write-Host "═════════════════════════════════════════════════════════" -ForegroundColor Cyan
  Write-Host $Title -ForegroundColor Cyan
  Write-Host "═════════════════════════════════════════════════════════" -ForegroundColor Cyan
  Write-Host ""
}

function Verify-Environment {
  Print-Header "验证环境"

  # 检查 gcloud CLI
  try {
    $gcloudVersion = gcloud --version 2>$null | Select-Object -First 1
    Write-ColorOutput "✓ gcloud CLI 已安装" -Color Green
  }
  catch {
    Write-ColorOutput "✗ 未找到 gcloud CLI" -Color Red
    exit 1
  }

  Write-ColorOutput "  项目 ID: $ProjectId" -Color Cyan
  Write-ColorOutput "  地区: $Region" -Color Cyan
  Write-ColorOutput "  新内存: $NewMemory" -Color Cyan
  Write-ColorOutput "  函数数: $($Functions.Count)" -Color Cyan

  if ($DryRun) {
    Write-ColorOutput "  ⚠ 模式: 试运行 (DRY RUN)" -Color Yellow
  }
  if ($VerifyOnly) {
    Write-ColorOutput "  ℹ 模式: 仅验证 (VERIFY ONLY)" -Color Cyan
  }
}

function Get-FunctionMemory {
  param([string]$FunctionName)

  try {
    $result = gcloud functions describe $FunctionName `
      --region=$Region `
      --project=$ProjectId `
      --format="value(availableMemoryMb)" `
      --quiet 2>$null

    if ($result) {
      return [int]$result
    }
    return $null
  }
  catch {
    return $null
  }
}

function Upgrade-Function {
  param(
    [string]$FunctionName,
    [int]$Index,
    [int]$Total
  )

  Write-Host -NoNewline "[$Index/$Total] $FunctionName ... "

  # 获取当前内存
  $currentMemory = Get-FunctionMemory $FunctionName

  if ($null -eq $currentMemory) {
    Write-ColorOutput "✗ 不存在" -Color Red
    return $false
  }

  if ($currentMemory -eq 512) {
    Write-ColorOutput "⊘ 已是 512MB" -Color Yellow
    return $true
  }

  if ($DryRun) {
    Write-ColorOutput "✓ (试运行)" -Color Green
    return $true
  }

  try {
    gcloud functions update $FunctionName `
      --memory=$NewMemory `
      --region=$Region `
      --project=$ProjectId `
      --quiet 2>$null

    Write-ColorOutput "✓ ($currentMemory MB → 512 MB)" -Color Green
    return $true
  }
  catch {
    Write-ColorOutput "✗ 升级失败" -Color Red
    return $false
  }
}

function Verify-Upgrades {
  Print-Header "验证升级结果"

  $success = 0
  $failed = 0

  foreach ($func in $Functions) {
    $memory = Get-FunctionMemory $func

    if ($null -ne $memory) {
      if ($memory -eq 512) {
        Write-ColorOutput "  ✓ $func : $memory MB" -Color Green
        $success++
      }
      else {
        Write-ColorOutput "  ✗ $func : $memory MB (期望 512 MB)" -Color Red
        $failed++
      }
    }
    else {
      Write-ColorOutput "  ⚠ $func : 不存在" -Color Yellow
    }
  }

  Write-Host ""
  Write-ColorOutput "成功: $success / $($Functions.Count)" -Color Green
  if ($failed -gt 0) {
    Write-ColorOutput "失败: $failed" -Color Red
  }
}

function Main {
  Print-Header "Cloud Functions 批量内存升级"

  Verify-Environment

  if ($VerifyOnly) {
    Verify-Upgrades
    return
  }

  Print-Header "开始升级 $($Functions.Count) 个函数"

  $success = 0
  $failed = 0

  for ($i = 0; $i -lt $Functions.Count; $i++) {
    if (Upgrade-Function $Functions[$i] ($i + 1) $Functions.Count) {
      $success++
    }
    else {
      $failed++
    }
    Start-Sleep -Milliseconds 500
  }

  Verify-Upgrades

  Print-Header "升级完成"
  Write-ColorOutput "成功: $success / $($Functions.Count)" -Color Green
  if ($failed -gt 0) {
    Write-ColorOutput "失败: $failed" -Color Red
  }

  Write-Host ""
  Write-Host "后续步骤:"
  Write-Host "1. 监控 Cloud Logging，确认是否还有内存超限错误"
  Write-Host "2. 检查函数执行时间和成本"
  Write-Host "3. 如果仍有问题，可升级到 1024MB"
}

# 执行主程序
Main
