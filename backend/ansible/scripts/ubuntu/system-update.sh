#!/bin/bash
# Ubuntu 系統更新腳本
# 適用於 Ubuntu 20.04, 22.04, 24.04

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

# 設定非交互式環境
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

log "開始 Ubuntu 系統更新..."

# 檢查 Ubuntu 版本
UBUNTU_VERSION=$(lsb_release -rs)
log "檢測到 Ubuntu 版本: $UBUNTU_VERSION"

# 等待其他 apt 進程完成
wait_for_apt() {
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if ! fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; then
            break
        fi
        warn "等待其他軟件包管理進程完成... (嘗試 $attempt/$max_attempts)"
        sleep 10
        attempt=$((attempt + 1))
    done
}

# 清理舊的鎖定文件
cleanup_locks() {
    log "清理可能的鎖定文件..."
    rm -f /var/lib/apt/lists/lock
    rm -f /var/cache/apt/archives/lock
    rm -f /var/lib/dpkg/lock*
}

# 等待 apt 可用
wait_for_apt

# 更新套件清單
log "更新套件清單..."
apt-get update -y || {
    warn "套件清單更新失敗，嘗試清理鎖定文件..."
    cleanup_locks
    apt-get update -y
}

# 升級已安裝的套件
log "升級已安裝的套件..."
apt-get upgrade -y

# 升級系統套件（包括內核）
log "執行系統完整升級..."
apt-get dist-upgrade -y

# 清理不需要的套件
log "清理不需要的套件..."
apt-get autoremove -y
apt-get autoclean

# 檢查是否需要重啟
if [ -f /var/run/reboot-required ]; then
    warn "系統更新完成，建議重新啟動系統"
    warn "重啟原因文件內容:"
    cat /var/run/reboot-required.pkgs 2>/dev/null || echo "  無詳細資訊"
else
    log "系統更新完成，無需重啟"
fi

# 顯示升級統計
log "更新完成統計:"
log "  可用升級: $(apt list --upgradable 2>/dev/null | wc -l)"
log "  系統版本: $(lsb_release -ds)"
log "  核心版本: $(uname -r)"

log "Ubuntu 系統更新完成！"