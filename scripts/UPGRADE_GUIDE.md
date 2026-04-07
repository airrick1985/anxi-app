# Cloud Functions 内存升级指南

## 📋 背景

根据日志分析，**18 个 Cloud Functions** 存在内存超限问题：
- **当前内存**: 256 MB
- **使用情况**: 256-264 MB（几乎全部用满）
- **升级方案**: 升级到 512 MB

### 影响的函数列表

| 函数名 | 错误次数 | 严重程度 |
|--------|--------|--------|
| getinspectionrecords | 6 | 🔴 严重 |
| getprojecttextstyle | 5 | 🔴 严重 |
| updateprojectstatuscolors | 5 | 🔴 严重 |
| getinspectionoptionsforproject | 5 | 🔴 严重 |
| handlelogin | 4 | 🔴 严重 |
| getsystemfunctions | 3 | 🟡 中等 |
| updateprojecttextstyle | 3 | 🟡 中等 |
| getprojectstatuscolors | 3 | 🟡 中等 |
| getspotlayouts | 3 | 🟡 中等 |
| 其他 (9 个) | 1-2 | 🟢 轻微 |

---

## 🚀 快速开始

### 选项 1：使用 PowerShell（Windows 推荐）

```powershell
# 基本执行
.\upgrade-functions-memory.ps1

# 试运行（不实际修改）
.\upgrade-functions-memory.ps1 -DryRun

# 仅验证当前状态
.\upgrade-functions-memory.ps1 -VerifyOnly
```

### 选项 2：使用 Bash（Linux/Mac）

```bash
# 完整版（带验证和报告）
chmod +x upgrade-functions-memory.sh
./upgrade-functions-memory.sh

# 简化版（快速执行）
chmod +x upgrade-functions-memory-simple.sh
./upgrade-functions-memory-simple.sh
```

### 选项 3：手动执行（单函数）

```bash
gcloud functions update getinspectionrecords \
  --memory=512MB \
  --region=asia-east1 \
  --project=apps-script-api-443402 \
  --quiet
```

---

## 📊 脚本对比

| 脚本 | 功能 | 复杂度 | 验证 | 报告 |
|------|------|--------|------|------|
| **upgrade-functions-memory.sh** | 完整 + 交互 | ⭐⭐⭐ | ✓ | ✓ |
| **upgrade-functions-memory-simple.sh** | 快速执行 | ⭐ | ✗ | ✗ |
| **upgrade-functions-memory.ps1** | 完整 + 试运行 | ⭐⭐⭐ | ✓ | ✗ |

---

## ⚙️ 详细说明

### 完整版脚本 (`upgrade-functions-memory.sh`)

**功能**:
- ✓ 环境验证（检查 gcloud CLI）
- ✓ 交互式确认
- ✓ 进度显示
- ✓ 错误处理
- ✓ 升级后验证
- ✓ 生成升级报告

**使用方法**:
```bash
chmod +x upgrade-functions-memory.sh
./upgrade-functions-memory.sh
```

**输出示例**:
```
[1/18] getinspectionrecords ... ✓ 完成 (256 MB → 512 MB)
[2/18] getprojecttextstyle ... ✓ 完成 (256 MB → 512 MB)
...
成功: 18 / 18
```

---

### 简化版脚本 (`upgrade-functions-memory-simple.sh`)

**功能**:
- ✓ 快速执行
- ✓ 基本进度显示
- ✓ 最少依赖

**使用方法**:
```bash
chmod +x upgrade-functions-memory-simple.sh
./upgrade-functions-memory-simple.sh
```

---

### PowerShell 脚本 (`upgrade-functions-memory.ps1`)

**功能**:
- ✓ 完整验证
- ✓ 试运行模式（-DryRun）
- ✓ 仅验证模式（-VerifyOnly）
- ✓ 彩色输出
- ✓ 参数化

**使用方法**:
```powershell
# 完整执行
.\upgrade-functions-memory.ps1

# 试运行（安全，不修改）
.\upgrade-functions-memory.ps1 -DryRun

# 仅验证当前状态
.\upgrade-functions-memory.ps1 -VerifyOnly

# 自定义参数
.\upgrade-functions-memory.ps1 -NewMemory "1024MB" -DryRun
```

---

## ✅ 升级前检查清单

- [ ] 已备份或记录当前配置
- [ ] 已确认项目 ID: `apps-script-api-443402`
- [ ] 已确认地区: `asia-east1`
- [ ] 已安装 gcloud CLI
- [ ] 已验证 gcloud CLI 权限

---

## 🔄 升级步骤

### 步骤 1：试运行（推荐）

```powershell
# PowerShell 用户
.\upgrade-functions-memory.ps1 -DryRun

# 或 Bash 用户
# 编辑脚本，注释掉 gcloud functions update 命令
```

### 步骤 2：执行升级

```powershell
# PowerShell
.\upgrade-functions-memory.ps1

# 或 Bash
./upgrade-functions-memory-simple.sh
```

**预期耗时**: ~3-5 分钟（18 个函数）

### 步骤 3：验证升级

```bash
# 查看升级报告
cat upgrade-report-*.txt

# 或使用 PowerShell 验证
.\upgrade-functions-memory.ps1 -VerifyOnly

# 或手动检查单个函数
gcloud functions describe getinspectionrecords \
  --region=asia-east1 \
  --project=apps-script-api-443402 \
  --format="value(availableMemoryMb)"
```

---

## 📈 升级后验证

### 1. 检查 Cloud Logging

前往 [Google Cloud Console](https://console.cloud.google.com) → Logs Explorer

```
(resource.type="cloud_function" OR resource.type="cloud_run_revision")
severity="ERROR"
```

应该看到**内存超限错误减少或消失**。

### 2. 监控函数性能

```bash
# 查看函数执行情况
gcloud functions describe getinspectionrecords \
  --region=asia-east1 \
  --project=apps-script-api-443402 \
  --format=json | jq '.availableMemoryMb, .runtime'
```

### 3. 成本估算

- **256 MB**: 每百万请求 $0.40
- **512 MB**: 每百万请求 $0.80
- **预期成本增加**: ~2 倍内存费用

---

## 🆘 故障排除

### 问题 1：`gcloud: command not found`

**解决方案**:
```bash
# 安装 Google Cloud SDK
# Windows: https://cloud.google.com/sdk/docs/install-sdk
# Mac: brew install --cask google-cloud-sdk
# Linux: curl https://sdk.cloud.google.com | bash
```

### 问题 2：权限被拒绝

**解决方案**:
```bash
# 验证认证
gcloud auth login

# 设置正确的项目
gcloud config set project apps-script-api-443402

# 检查权限
gcloud projects get-iam-policy apps-script-api-443402
```

### 问题 3：函数不存在

**解决方案**:
```bash
# 列出所有函数
gcloud functions list --project=apps-script-api-443402

# 检查函数是否在其他地区
gcloud functions list --project=apps-script-api-443402 --format="value(name, region)"
```

### 问题 4：升级失败

**解决方案**:
```bash
# 查看详细错误
gcloud functions update getinspectionrecords \
  --memory=512MB \
  --region=asia-east1 \
  --project=apps-script-api-443402

# 检查函数配置
gcloud functions describe getinspectionrecords \
  --region=asia-east1 \
  --project=apps-script-api-443402
```

---

## 📝 单个函数升级命令模板

```bash
gcloud functions update [FUNCTION_NAME] \
  --memory=512MB \
  --region=asia-east1 \
  --project=apps-script-api-443402 \
  --quiet
```

替换 `[FUNCTION_NAME]`，例如：
- getinspectionrecords
- getprojecttextstyle
- updateprojectstatuscolors
- 等等...

---

## 🔗 参考资源

- [GCP Cloud Functions 文档](https://cloud.google.com/functions/docs)
- [gcloud functions update 命令](https://cloud.google.com/sdk/gcloud/reference/functions/update)
- [Cloud Functions 定价](https://cloud.google.com/functions/pricing)
- [Cloud Logging](https://cloud.google.com/logging/docs)

---

## 📞 支持

有问题？
1. 检查错误日志: `cat upgrade-report-*.txt`
2. 运行试运行模式: `./upgrade-functions-memory.ps1 -DryRun`
3. 逐个手动升级（更安全）

---

**最后更新**: 2026-04-07  
**版本**: 1.0
