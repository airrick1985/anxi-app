#!/bin/bash

#############################################################################
#  Cloud Functions 批量内存升级脚本
#  用途: 将所有有内存超限问题的 Cloud Functions 从 256MB 升级到 512MB
#  日期: 2026-04-07
#############################################################################

# ===== 配置参数 =====
PROJECT_ID="apps-script-api-443402"
REGION="asia-east1"
NEW_MEMORY="512MB"
OLD_MEMORY="256MB"

# 所有需要升级的函数列表（基于日志分析）
FUNCTIONS_TO_UPGRADE=(
  "getinspectionrecords"           # 6 次错误
  "getprojecttextstyle"            # 5 次错误
  "updateprojectstatuscolors"      # 5 次错误
  "getinspectionoptionsforproject" # 5 次错误
  "handlelogin"                    # 4 次错误
  "getsystemfunctions"             # 3 次错误
  "updateprojecttextstyle"         # 3 次错误
  "getprojectstatuscolors"         # 3 次错误
  "getspotlayouts"                 # 3 次错误
  "updatesalesdata"                # 2 次错误
  "onsaleshouseholdwrite"          # 2 次错误
  "getprojectstructure"            # 2 次错误
  "getinspectionrecordsforprojectfb" # 2 次错误
  "addinspectionrecord"            # 2 次错误
  "getsalesparkingsbyfloor"        # 2 次错误
  "scheduledjobrunner"             # 1 次错误
  "senduploadreminders"            # 1 次错误
  "getfloorplans"                  # 1 次错误
)

# ===== 颜色输出 =====
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ===== 函数定义 =====

print_header() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# ===== 验证环境 =====
verify_environment() {
  print_header "验证环境"

  # 检查 gcloud CLI
  if ! command -v gcloud &> /dev/null; then
    print_error "未找到 gcloud CLI，请先安装"
    exit 1
  fi
  print_success "gcloud CLI 已安装"

  # 检查项目
  CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
  print_info "当前项目: $CURRENT_PROJECT"
  print_info "目标项目: $PROJECT_ID"
  print_info "目标地区: $REGION"
  print_info "新内存大小: $NEW_MEMORY (从 $OLD_MEMORY)"
  print_info "需要升级的函数数: ${#FUNCTIONS_TO_UPGRADE[@]}"

  echo ""
  read -p "确认要继续吗? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "已取消"
    exit 0
  fi
}

# ===== 检查函数是否存在 =====
check_function_exists() {
  local func_name=$1
  gcloud functions describe "$func_name" \
    --region="$REGION" \
    --project="$PROJECT_ID" &>/dev/null
  return $?
}

# ===== 获取函数当前内存 =====
get_function_memory() {
  local func_name=$1
  gcloud functions describe "$func_name" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(availableMemoryMb)" 2>/dev/null
}

# ===== 升级单个函数 =====
upgrade_function() {
  local func_name=$1
  local index=$2
  local total=$3

  echo -n "[$index/$total] 升级 $func_name ... "

  # 检查函数是否存在
  if ! check_function_exists "$func_name"; then
    print_error "函数不存在"
    return 1
  fi

  # 获取当前内存
  local current_memory=$(get_function_memory "$func_name")

  if [ "$current_memory" == "512" ]; then
    print_warning "已经是 512MB，跳过"
    return 0
  fi

  # 执行升级
  if gcloud functions update "$func_name" \
    --memory="$NEW_MEMORY" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --quiet &>/dev/null; then
    print_success "完成 ($current_memory MB → 512 MB)"
    return 0
  else
    print_error "升级失败"
    return 1
  fi
}

# ===== 验证升级结果 =====
verify_upgrades() {
  print_header "验证升级结果"

  local success_count=0
  local failed_count=0

  for func_name in "${FUNCTIONS_TO_UPGRADE[@]}"; do
    if check_function_exists "$func_name"; then
      local memory=$(get_function_memory "$func_name")
      if [ "$memory" == "512" ]; then
        print_success "$func_name: $memory MB"
        ((success_count++))
      else
        print_error "$func_name: $memory MB (期望 512 MB)"
        ((failed_count++))
      fi
    else
      print_warning "$func_name: 函数不存在"
    fi
  done

  echo ""
  print_info "成功: $success_count / ${#FUNCTIONS_TO_UPGRADE[@]}"
  if [ $failed_count -gt 0 ]; then
    print_warning "失败: $failed_count"
  fi
}

# ===== 生成升级报告 =====
generate_report() {
  print_header "生成升级报告"

  local report_file="upgrade-report-$(date +%Y%m%d-%H%M%S).txt"

  {
    echo "Cloud Functions 内存升级报告"
    echo "生成时间: $(date)"
    echo "项目: $PROJECT_ID"
    echo "地区: $REGION"
    echo ""
    echo "升级详情:"
    echo "原内存大小: $OLD_MEMORY"
    echo "新内存大小: $NEW_MEMORY"
    echo "升级函数数: ${#FUNCTIONS_TO_UPGRADE[@]}"
    echo ""
    echo "升级的函数列表:"
    printf "%s\n" "${FUNCTIONS_TO_UPGRADE[@]}" | nl
    echo ""
    echo "使用的命令:"
    echo "gcloud functions update <function-name> --memory=$NEW_MEMORY --region=$REGION --project=$PROJECT_ID --quiet"
  } > "$report_file"

  print_success "报告已保存: $report_file"
}

# ===== 主函数 =====
main() {
  print_header "Cloud Functions 批量内存升级脚本"

  # 验证环境
  verify_environment

  # 升级所有函数
  print_header "开始升级 ${#FUNCTIONS_TO_UPGRADE[@]} 个 Cloud Functions"

  local index=1
  local total=${#FUNCTIONS_TO_UPGRADE[@]}
  local success=0
  local failed=0

  for func_name in "${FUNCTIONS_TO_UPGRADE[@]}"; do
    if upgrade_function "$func_name" "$index" "$total"; then
      ((success++))
    else
      ((failed++))
    fi
    ((index++))
    sleep 1  # 每个函数之间等待 1 秒，避免 API 限流
  done

  # 验证结果
  echo ""
  verify_upgrades

  # 生成报告
  generate_report

  # 最终摘要
  print_header "升级完成"
  echo -e "${GREEN}成功: $success / $total${NC}"
  if [ $failed -gt 0 ]; then
    echo -e "${RED}失败: $failed${NC}"
  fi

  echo ""
  echo "后续建议:"
  echo "1. 查看 Cloud Logging 确认是否还有内存超限错误"
  echo "2. 监控函数执行时间和成本变化"
  echo "3. 如果还有问题，可以进一步升级到 1024MB"
  echo ""
}

# ===== 执行 =====
main
