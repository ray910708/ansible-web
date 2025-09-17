#!/bin/bash
# CentOS/RHEL 系統更新腳本
# 適用於 CentOS 7, 8, 9 和 RHEL 7, 8, 9

set -e

# 顏色輸出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] $1${NC}"
}

log "開始 CentOS/RHEL 系統更新..."

# 檢查系統版本
if [ -f /etc/redhat-release ]; then
    RELEASE=$(cat /etc/redhat-release)
    log "檢測到系統: $RELEASE"
else
    error "無法檢測系統版本"
    exit 1
fi

# 檢查主要版本號
MAJOR_VERSION=$(rpm -q --queryformat '%{VERSION}' centos-release 2>/dev/null || rpm -q --queryformat '%{VERSION}' redhat-release 2>/dev/null || echo "unknown")

# 根據版本選擇包管理器
if [[ "$MAJOR_VERSION" == "7" ]]; then
    PKG_MGR="yum"
    log "使用 YUM 包管理器 (CentOS/RHEL 7)"
elif [[ "$MAJOR_VERSION" == "8" ]] || [[ "$MAJOR_VERSION" == "9" ]]; then
    PKG_MGR="dnf"
    log "使用 DNF 包管理器 (CentOS/RHEL $MAJOR_VERSION)"
else
    # 自動檢測可用的包管理器
    if command -v dnf >/dev/null 2>&1; then
        PKG_MGR="dnf"
        log "使用 DNF 包管理器"
    elif command -v yum >/dev/null 2>&1; then
        PKG_MGR="yum"
        log "使用 YUM 包管理器"
    else
        error "無法找到可用的包管理器"
        exit 1
    fi
fi

# 清理包管理器緩存
log "清理包管理器緩存..."
$PKG_MGR clean all

# 更新套件清單和已安裝的套件
log "更新系統套件..."
$PKG_MGR update -y

# 檢查是否有可用的安全更新
log "檢查安全更新..."
if command -v yum-security >/dev/null 2>&1; then
    yum-security check-update || true
fi

# 清理不需要的套件
log "清理孤立的套件..."
if [[ "$PKG_MGR" == "dnf" ]]; then
    dnf autoremove -y
else
    yum autoremove -y || package-cleanup --leaves --all || true
fi

# 檢查是否需要重啟
if [ -f /var/run/reboot-required ] || needs-restarting -r >/dev/null 2>&1; then
    warn "系統更新完成，建議重新啟動系統"
    
    # 檢查需要重啟的服務
    if command -v needs-restarting >/dev/null 2>&1; then
        log "需要重啟的服務:"
        needs-restarting -s 2>/dev/null || true
    fi
else
    log "系統更新完成，無需重啟"
fi

# 顯示升級統計
log "更新完成統計:"
if [[ "$PKG_MGR" == "dnf" ]]; then
    AVAILABLE=$(dnf check-update 2>/dev/null | grep -c "^[a-zA-Z]" || echo "0")
else
    AVAILABLE=$(yum check-update 2>/dev/null | grep -c "^[a-zA-Z]" || echo "0")
fi

log "  可用更新: $AVAILABLE"
log "  系統版本: $RELEASE"
log "  核心版本: $(uname -r)"

log "CentOS/RHEL 系統更新完成！"